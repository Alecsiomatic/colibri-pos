import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { executeQuery } from "@/lib/mysql-db"
import { verifyAccessToken } from "@/lib/auth-mysql"

// GET - Obtener categoría específica
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const categories = await executeQuery(
      'SELECT * FROM categories WHERE id = ?',
      [params.id]
    ) as any[]

    if (categories.length === 0) {
      return NextResponse.json(
        { error: "Categoría no encontrada" },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      category: categories[0]
    })
  } catch (error: any) {
    console.error("Error al obtener categoría:", error)
    return NextResponse.json(
      { error: "Error al obtener categoría" },
      { status: 500 }
    )
  }
}

// PUT - Actualizar categoría (solo admin)
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

    const { name, description, image_url, sort_order, is_active } = await request.json()

    const result = await executeQuery(
      `UPDATE categories SET 
       name = ?, description = ?, image_url = ?, sort_order = ?, is_active = ?, updated_at = NOW()
       WHERE id = ?`,
      [name, description, image_url, sort_order, is_active, params.id]
    ) as any

    if (result.affectedRows === 0) {
      return NextResponse.json(
        { error: "Categoría no encontrada" },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      message: "Categoría actualizada exitosamente"
    })
  } catch (error: any) {
    console.error("Error al actualizar categoría:", error)
    return NextResponse.json(
      { error: "Error al actualizar categoría" },
      { status: 500 }
    )
  }
}

// DELETE - Eliminar categoría (solo admin)
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

    // Verificar si hay productos en esta categoría
    const products = await executeQuery(
      'SELECT COUNT(*) as count FROM products WHERE category_id = ?',
      [params.id]
    ) as any[]

    if (products[0].count > 0) {
      return NextResponse.json(
        { error: "No se puede eliminar una categoría con productos" },
        { status: 400 }
      )
    }

    const result = await executeQuery(
      'DELETE FROM categories WHERE id = ?',
      [params.id]
    ) as any

    if (result.affectedRows === 0) {
      return NextResponse.json(
        { error: "Categoría no encontrada" },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      message: "Categoría eliminada exitosamente"
    })
  } catch (error: any) {
    console.error("Error al eliminar categoría:", error)
    return NextResponse.json(
      { error: "Error al eliminar categoría" },
      { status: 500 }
    )
  }
}