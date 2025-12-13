import { NextResponse } from "next/server"
import bcrypt from "bcryptjs"
import { executeQuery } from "@/lib/mysql-db"
import { requireAdmin } from "@/lib/auth-simple"

export const POST = requireAdmin(async (request) => {
  try {
    const body = await request.json()
    const { type, data } = body ?? {}

    switch (type) {
      case "user":
        return await createUser(data)
      case "product":
        return await createProduct(data)
      case "category":
        return await createCategory(data)
      default:
        return NextResponse.json({ success: false, message: "Tipo de creación no soportado" }, { status: 400 })
    }
  } catch (error: any) {
    console.error("Error in admin create:", error)
    return NextResponse.json({ success: false, message: "Error interno del servidor" }, { status: 500 })
  }
})

async function createUser(data: any) {
  try {
    const { username, email, password, full_name, phone, is_admin, is_driver } = data ?? {}

    if (!username || !email || !password) {
      return NextResponse.json({ success: false, message: "Faltan campos requeridos" }, { status: 400 })
    }

    const existing = (await executeQuery("SELECT id FROM users WHERE username = ? OR email = ?", [username, email])) as any[]

    if (existing.length > 0) {
      return NextResponse.json({ success: false, message: "El usuario o email ya existe" }, { status: 400 })
    }

    const hashedPassword = await bcrypt.hash(password, 10)

    const result = (await executeQuery(
      `INSERT INTO users (username, email, password, full_name, phone, is_admin, is_driver, active, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, 1, NOW())`,
      [username, email, hashedPassword, full_name || null, phone || null, is_admin || false, is_driver || false]
    )) as any

    return NextResponse.json({ success: true, message: "Usuario creado exitosamente", userId: result.insertId })
  } catch (error: any) {
    console.error("Error creating user:", error)
    return NextResponse.json({ success: false, message: "Error al crear usuario" }, { status: 500 })
  }
}

async function createProduct(data: any) {
  try {
    const { name, description, price, image_url, category_id, stock } = data ?? {}

    if (!name || !description || price <= 0) {
      return NextResponse.json({ success: false, message: "Faltan campos requeridos" }, { status: 400 })
    }

    const result = (await executeQuery(
      `INSERT INTO products (name, description, price, image_url, category_id, stock, available, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, 1, NOW(), NOW())`,
      [name, description, price, image_url || null, category_id || null, stock || 0]
    )) as any

    return NextResponse.json({ success: true, message: "Producto creado exitosamente", productId: result.insertId })
  } catch (error: any) {
    console.error("Error creating product:", error)
    return NextResponse.json({ success: false, message: "Error al crear producto" }, { status: 500 })
  }
}

async function createCategory(data: any) {
  try {
    const { name, description } = data ?? {}

    if (!name) {
      return NextResponse.json({ success: false, message: "El nombre de la categoría es requerido" }, { status: 400 })
    }

    const result = (await executeQuery(
      `INSERT INTO categories (name, description, created_at, updated_at)
       VALUES (?, ?, NOW(), NOW())`,
      [name, description || null]
    )) as any

    return NextResponse.json({ success: true, message: "Categoría creada exitosamente", categoryId: result.insertId })
  } catch (error: any) {
    console.error("Error creating category:", error)
    return NextResponse.json({ success: false, message: "Error al crear categoría" }, { status: 500 })
  }
}