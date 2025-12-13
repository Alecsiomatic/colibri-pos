import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { executeQuery } from "@/lib/db-retry"
import { verifyAccessToken } from "@/lib/auth-mysql"

// GET - Obtener todos los productos
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const category = searchParams.get('category')
    const featured = searchParams.get('featured')
    const available = searchParams.get('available') !== 'false'
    const includeModifiers = searchParams.get('include_modifiers') === 'true'

    let query = `
      SELECT p.*, c.name as category_name 
      FROM products p 
      LEFT JOIN categories c ON p.category_id = c.id 
      WHERE 1=1
    `
    const params: any[] = []

    if (available) {
      query += ' AND p.is_available = 1'
    }

    if (category) {
      query += ' AND p.category_id = ?'
      params.push(category)
    }

    if (featured === 'true') {
      query += ' AND p.is_featured = 1'
    }

    query += ' ORDER BY p.created_at DESC'

    const products = await executeQuery(query, params) as any[]

    // SIEMPRE verificar si los productos tienen modificadores (usando la tabla correcta product_modifier_groups)
    for (const product of products) {
      const [modCheck] = await executeQuery(
        `SELECT COUNT(*) as count 
         FROM product_modifier_groups pmg
         JOIN modifier_groups mg ON pmg.modifier_group_id = mg.id
         WHERE pmg.product_id = ? AND mg.is_active = 1`,
        [product.id]
      ) as any[]
      product.has_modifiers = (modCheck?.count || 0) > 0
    }

    // Si se solicitan modificadores, cargarlos para cada producto
    if (includeModifiers) {
      for (const product of products) {
        // Cargar grupos de modificadores y sus opciones
        const modifiersData = await executeQuery(
          `SELECT 
            m.id as modifier_id,
            m.name as modifier_name,
            m.modifier_type,
            mo.id as option_id,
            mo.name as option_name,
            mo.price_adjustment
           FROM product_modifiers m
           LEFT JOIN modifier_options mo ON mo.group_id = m.id AND mo.is_active = 1
           WHERE m.product_id = ? AND m.is_active = 1
           ORDER BY m.display_order, mo.display_order`,
          [product.id]
        ) as any[]

        // Agrupar opciones por modificador
        const modifiersMap = new Map()
        modifiersData.forEach((row: any) => {
          if (!modifiersMap.has(row.modifier_id)) {
            modifiersMap.set(row.modifier_id, {
              id: row.modifier_id,
              name: row.modifier_name,
              type: row.modifier_type,
              required: false, // Podrías agregar un campo en la tabla si lo necesitas
              options: []
            })
          }
          // Solo agregar la opción si existe
          if (row.option_id) {
            modifiersMap.get(row.modifier_id).options.push({
              id: row.option_id,
              name: row.option_name,
              price: parseFloat(row.price_adjustment || 0)
            })
          }
        })

        product.modifiers = Array.from(modifiersMap.values())
        product.has_modifiers = product.modifiers.length > 0
      }
    }

    // Mapear is_available a available para compatibilidad con frontend
    const mappedProducts = products.map(p => ({
      ...p,
      available: p.is_available === 1 || p.is_available === true
    }))

    return NextResponse.json({
      success: true,
      products: mappedProducts
    })
  } catch (error: any) {
    console.error("Error al obtener productos:", error)
    return NextResponse.json(
      { error: "Error al obtener productos" },
      { status: 500 }
    )
  }
}

// POST - Crear nuevo producto (solo admin)
export async function POST(request: NextRequest) {
  try {
    const authToken = request.cookies.get('auth-token')?.value
    if (!authToken) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    const user = verifyAccessToken(authToken)
    if (!user?.is_admin) {
      return NextResponse.json({ error: "Permisos insuficientes" }, { status: 403 })
    }

    const {
      name,
      description,
      price,
      cost_price,
      category_id,
      image_url,
      is_featured,
      stock,
      ingredients,
      allergens,
      nutritional_info,
      preparation_time
    } = await request.json()

    if (!name || !price) {
      return NextResponse.json(
        { error: "Nombre y precio son requeridos" },
        { status: 400 }
      )
    }

    const result = await executeQuery(
      `INSERT INTO products 
       (name, description, price, cost_price, category_id, image_url, is_featured, stock, 
        ingredients, allergens, nutritional_info, preparation_time) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        name,
        description || null,
        price,
        cost_price || 0,
        category_id || null,
        image_url || null,
        is_featured || false,
        stock || 0,
        ingredients || null,
        allergens || null,
        nutritional_info ? JSON.stringify(nutritional_info) : null,
        preparation_time || 15
      ]
    ) as any

    // Crear entrada en inventario
    await executeQuery(
      'INSERT INTO inventory (product_id, quantity) VALUES (?, ?)',
      [result.insertId, stock || 0]
    )

    return NextResponse.json({
      success: true,
      productId: result.insertId,
      message: "Producto creado exitosamente"
    })
  } catch (error: any) {
    console.error("Error al crear producto:", error)
    return NextResponse.json(
      { error: "Error al crear producto" },
      { status: 500 }
    )
  }
}

// PUT - Actualizar producto (solo admin)
export async function PUT(request: NextRequest) {
  try {
    const authToken = request.cookies.get('auth-token')?.value
    if (!authToken) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    const user = verifyAccessToken(authToken)
    if (!user?.is_admin) {
      return NextResponse.json({ error: "Permisos insuficientes" }, { status: 403 })
    }

    const {
      id,
      name,
      description,
      price,
      cost_price,
      category_id,
      image_url,
      is_available,
      available, // Compatibilidad con frontend
      is_featured,
      stock,
      ingredients,
      allergens,
      nutritional_info,
      preparation_time
    } = await request.json()

    if (!id) {
      return NextResponse.json({ error: "ID de producto requerido" }, { status: 400 })
    }

    const updates: string[] = []
    const values: any[] = []

    if (name !== undefined) {
      updates.push('name = ?')
      values.push(name)
    }
    if (description !== undefined) {
      updates.push('description = ?')
      values.push(description)
    }
    if (price !== undefined) {
      updates.push('price = ?')
      values.push(price)
    }
    if (cost_price !== undefined) {
      updates.push('cost_price = ?')
      values.push(cost_price)
    }
    if (category_id !== undefined) {
      updates.push('category_id = ?')
      values.push(category_id)
    }
    if (image_url !== undefined) {
      updates.push('image_url = ?')
      values.push(image_url)
    }
    // Aceptar tanto is_available como available
    if (is_available !== undefined || available !== undefined) {
      updates.push('is_available = ?')
      values.push(is_available !== undefined ? is_available : available)
    }
    if (is_featured !== undefined) {
      updates.push('is_featured = ?')
      values.push(is_featured)
    }
    if (stock !== undefined) {
      updates.push('stock = ?')
      values.push(stock)
    }
    if (ingredients !== undefined) {
      updates.push('ingredients = ?')
      values.push(ingredients)
    }
    if (allergens !== undefined) {
      updates.push('allergens = ?')
      values.push(allergens)
    }
    if (nutritional_info !== undefined) {
      updates.push('nutritional_info = ?')
      values.push(JSON.stringify(nutritional_info))
    }
    if (preparation_time !== undefined) {
      updates.push('preparation_time = ?')
      values.push(preparation_time)
    }

    if (updates.length === 0) {
      return NextResponse.json({ error: "No hay datos para actualizar" }, { status: 400 })
    }

    updates.push('updated_at = NOW()')
    values.push(id)

    await executeQuery(
      `UPDATE products SET ${updates.join(', ')} WHERE id = ?`,
      values
    )

    return NextResponse.json({
      success: true,
      message: "Producto actualizado exitosamente"
    })
  } catch (error: any) {
    console.error("Error al actualizar producto:", error)
    return NextResponse.json(
      { error: "Error al actualizar producto" },
      { status: 500 }
    )
  }
}

// DELETE - Eliminar producto (solo admin)
export async function DELETE(request: NextRequest) {
  try {
    const authToken = request.cookies.get('auth-token')?.value
    if (!authToken) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    const user = verifyAccessToken(authToken)
    if (!user?.is_admin) {
      return NextResponse.json({ error: "Permisos insuficientes" }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: "ID de producto requerido" }, { status: 400 })
    }

    await executeQuery('DELETE FROM products WHERE id = ?', [id])

    return NextResponse.json({
      success: true,
      message: "Producto eliminado exitosamente"
    })
  } catch (error: any) {
    console.error("Error al eliminar producto:", error)
    return NextResponse.json(
      { error: "Error al eliminar producto" },
      { status: 500 }
    )
  }
}