import { NextResponse } from "next/server"
import { executeQuery } from "@/lib/mysql-db"
import { requireAdmin } from "@/lib/auth-simple"

export const GET = requireAdmin(async () => {
  try {
    const categories = (await executeQuery(
      `SELECT 
        c.id,
        c.name,
        c.description,
        c.icon,
        c.created_at,
        c.updated_at,
        COUNT(p.id) AS products_count
      FROM categories c
      LEFT JOIN products p ON c.id = p.category_id
      GROUP BY c.id, c.name, c.description, c.icon, c.created_at, c.updated_at
      ORDER BY c.name`
    )) as any[]

    return NextResponse.json({ success: true, categories })
  } catch (error: any) {
    console.error("Error al obtener categorías:", error)
    return NextResponse.json({ success: false, message: "Error interno del servidor" }, { status: 500 })
  }
})

export const POST = requireAdmin(async (request) => {
  try {
    const body = await request.json()
    const { name, description, icon } = body ?? {}

    if (!name || !name.trim()) {
      return NextResponse.json({ success: false, message: "El nombre de la categoría es requerido" }, { status: 400 })
    }

    const existing = (await executeQuery("SELECT id FROM categories WHERE name = ?", [name.trim()])) as any[]

    if (existing.length > 0) {
      return NextResponse.json({ success: false, message: "Ya existe una categoría con ese nombre" }, { status: 400 })
    }

    const result = (await executeQuery(
      `INSERT INTO categories (name, description, icon, created_at, updated_at)
       VALUES (?, ?, ?, NOW(), NOW())`,
      [name.trim(), description?.trim() || null, icon || 'package']
    )) as any

    return NextResponse.json({ success: true, categoryId: result.insertId, message: "Categoría creada exitosamente" })
  } catch (error: any) {
    console.error("Error al crear categoría:", error)
    return NextResponse.json({ success: false, message: "Error interno del servidor" }, { status: 500 })
  }
})