import { NextResponse } from "next/server"
import { executeQuery } from "@/lib/mysql-db"
import { requireAdmin } from "@/lib/auth-simple"

export const PATCH = requireAdmin(async (request, _user, { params }: { params: { id: string } }) => {
  try {
    const categoryId = Number(params?.id)
    if (!Number.isInteger(categoryId)) {
      return NextResponse.json({ success: false, message: "ID de categoría inválido" }, { status: 400 })
    }

    const body = await request.json()
    const { name, description, icon } = body ?? {}

    if (!name || !name.trim()) {
      return NextResponse.json({ success: false, message: "El nombre de la categoría es requerido" }, { status: 400 })
    }

    const exists = (await executeQuery("SELECT id FROM categories WHERE id = ?", [categoryId])) as any[]
    if (exists.length === 0) {
      return NextResponse.json({ success: false, message: "Categoría no encontrada" }, { status: 404 })
    }

    const duplicate = (await executeQuery(
      "SELECT id FROM categories WHERE name = ? AND id != ?",
      [name.trim(), categoryId]
    )) as any[]

    if (duplicate.length > 0) {
      return NextResponse.json({ success: false, message: "Ya existe una categoría con ese nombre" }, { status: 400 })
    }

    await executeQuery(
      "UPDATE categories SET name = ?, description = ?, icon = ?, updated_at = NOW() WHERE id = ?",
      [name.trim(), description?.trim() || null, icon || 'package', categoryId]
    )

    return NextResponse.json({ success: true, message: "Categoría actualizada exitosamente" })
  } catch (error: any) {
    console.error("Error al actualizar categoría:", error)
    return NextResponse.json({ success: false, message: "Error interno del servidor" }, { status: 500 })
  }
})

export const DELETE = requireAdmin(async (_request, _user, { params }: { params: { id: string } }) => {
  try {
    const categoryId = Number(params?.id)
    if (!Number.isInteger(categoryId)) {
      return NextResponse.json({ success: false, message: "ID de categoría inválido" }, { status: 400 })
    }

    const existing = (await executeQuery("SELECT id FROM categories WHERE id = ?", [categoryId])) as any[]
    if (existing.length === 0) {
      return NextResponse.json({ success: false, message: "Categoría no encontrada" }, { status: 404 })
    }

    const relatedProducts = (await executeQuery(
      "SELECT COUNT(*) AS count FROM products WHERE category_id = ?",
      [categoryId]
    )) as Array<{ count: number }>

    if (relatedProducts[0]?.count > 0) {
      return NextResponse.json(
        {
          success: false,
          message: `No se puede eliminar la categoría porque tiene ${relatedProducts[0].count} productos asociados`,
        },
        { status: 400 },
      )
    }

    await executeQuery("DELETE FROM categories WHERE id = ?", [categoryId])

    return NextResponse.json({ success: true, message: "Categoría eliminada exitosamente" })
  } catch (error: any) {
    console.error("Error al eliminar categoría:", error)
    return NextResponse.json({ success: false, message: "Error interno del servidor" }, { status: 500 })
  }
})