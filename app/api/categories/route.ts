import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { executeQuery } from "@/lib/db-retry"
import { verifyAccessToken } from "@/lib/auth-mysql"

// GET - Obtener todas las categorías
export async function GET() {
  try {
    const categories = await executeQuery(
      'SELECT id, name, description, image_url, icon, is_active, sort_order, created_at, updated_at FROM categories WHERE is_active = 1 ORDER BY sort_order, name'
    ) as any[]

    return NextResponse.json({
      success: true,
      categories
    })
  } catch (error: any) {
    console.error("Error al obtener categorías:", error)
    return NextResponse.json(
      { error: "Error al obtener categorías" },
      { status: 500 }
    )
  }
}

// POST - Crear nueva categoría (solo admin)
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

    const { name, description, image_url, sort_order } = await request.json()

    if (!name) {
      return NextResponse.json(
        { error: "El nombre es requerido" },
        { status: 400 }
      )
    }

    const result = await executeQuery(
      'INSERT INTO categories (name, description, image_url, sort_order) VALUES (?, ?, ?, ?)',
      [name, description || null, image_url || null, sort_order || 0]
    ) as any

    return NextResponse.json({
      success: true,
      categoryId: result.insertId,
      message: "Categoría creada exitosamente"
    })
  } catch (error: any) {
    console.error("Error al crear categoría:", error)
    return NextResponse.json(
      { error: "Error al crear categoría" },
      { status: 500 }
    )
  }
}