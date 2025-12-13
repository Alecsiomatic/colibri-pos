import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { executeQuery } from "@/lib/mysql-db"
import { verifyAccessToken } from "@/lib/auth-mysql"

// GET - Obtener producto específico
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const products = await executeQuery(
      `SELECT p.*, c.name as category_name, i.quantity as stock_quantity
       FROM products p 
       LEFT JOIN categories c ON p.category_id = c.id
       LEFT JOIN inventory i ON p.id = i.product_id
       WHERE p.id = ?`,
      [params.id]
    ) as any[]

    if (products.length === 0) {
      return NextResponse.json(
        { error: "Producto no encontrado" },
        { status: 404 }
      )
    }

    const product = products[0]
    if (product.nutritional_info) {
      try {
        product.nutritional_info = JSON.parse(product.nutritional_info)
      } catch (e) {
        product.nutritional_info = null
      }
    }

    return NextResponse.json({
      success: true,
      product
    })
  } catch (error: any) {
    console.error("Error al obtener producto:", error)
    return NextResponse.json(
      { error: "Error al obtener producto" },
      { status: 500 }
    )
  }
}

// PUT - Actualizar producto (solo admin)
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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
      category_id,
      image_url,
      is_available,
      is_featured,
      stock,
      ingredients,
      allergens,
      nutritional_info,
      preparation_time
    } = await request.json()

    const result = await executeQuery(
      `UPDATE products SET 
       name = ?, description = ?, price = ?, category_id = ?, image_url = ?, 
       is_available = ?, is_featured = ?, stock = ?, ingredients = ?, allergens = ?, 
       nutritional_info = ?, preparation_time = ?, updated_at = NOW()
       WHERE id = ?`,
      [
        name,
        description,
        price,
        category_id,
        image_url,
        is_available,
        is_featured,
        stock,
        ingredients,
        allergens,
        nutritional_info ? JSON.stringify(nutritional_info) : null,
        preparation_time,
        params.id
      ]
    ) as any

    if (result.affectedRows === 0) {
      return NextResponse.json(
        { error: "Producto no encontrado" },
        { status: 404 }
      )
    }

    // Actualizar inventario
    if (stock !== undefined) {
      await executeQuery(
        'UPDATE inventory SET quantity = ?, updated_at = NOW() WHERE product_id = ?',
        [stock, params.id]
      )
    }

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
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authToken = request.cookies.get('auth-token')?.value
    if (!authToken) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    const user = verifyAccessToken(authToken)
    if (!user?.is_admin) {
      return NextResponse.json({ error: "Permisos insuficientes" }, { status: 403 })
    }

    // Verificar si el producto está en pedidos activos
    const activeOrders = await executeQuery(
      `SELECT COUNT(*) as count FROM orders 
       WHERE JSON_CONTAINS(items, JSON_OBJECT('id', ?)) 
       AND status NOT IN ('entregado', 'cancelado')`,
      [params.id]
    ) as any[]

    if (activeOrders[0].count > 0) {
      return NextResponse.json(
        { error: "No se puede eliminar un producto con pedidos activos" },
        { status: 400 }
      )
    }

    // Eliminar de inventario primero
    await executeQuery('DELETE FROM inventory WHERE product_id = ?', [params.id])

    // Eliminar producto
    const result = await executeQuery(
      'DELETE FROM products WHERE id = ?',
      [params.id]
    ) as any

    if (result.affectedRows === 0) {
      return NextResponse.json(
        { error: "Producto no encontrado" },
        { status: 404 }
      )
    }

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