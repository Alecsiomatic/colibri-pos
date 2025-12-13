import { NextResponse } from "next/server"
import { executeQuery } from "@/lib/mysql-db"
import { requireAdmin } from "@/lib/auth-simple"

export const GET = requireAdmin(async (request) => {
  try {
    const { searchParams } = new URL(request.url)
    const productId = searchParams.get("product_id")
    const limit = Number.parseInt(searchParams.get("limit") || "50", 10)

    let query = `
      SELECT 
        sm.id,
        sm.product_id,
        sm.previous_stock,
        sm.new_stock,
        sm.change_amount,
        sm.change_type,
        sm.reference_id,
        sm.notes,
        sm.created_at,
        p.name AS product_name
      FROM stock_movements sm
      LEFT JOIN products p ON sm.product_id = p.id`

    const params: any[] = []

    if (productId) {
      query += " WHERE sm.product_id = ?"
      params.push(Number(productId))
    }

    query += " ORDER BY sm.created_at DESC LIMIT ?"
    params.push(Number.isFinite(limit) ? limit : 50)

    const movements = (await executeQuery(query, params)) as any[]

    const formatted = movements.map((movement: any) => ({
      ...movement,
      product: movement.product_name ? { name: movement.product_name } : null,
    }))

    return NextResponse.json({ success: true, movements: formatted })
  } catch (error: any) {
    console.error("Error al obtener movimientos de stock:", error)
    return NextResponse.json({ success: false, message: "Error interno del servidor" }, { status: 500 })
  }
})

export const POST = requireAdmin(async (request, user) => {
  try {
    const body = await request.json()
    const {
      product_id,
      previous_stock,
      new_stock,
      change_amount,
      change_type,
      reference_id,
      notes,
    } = body ?? {}

    if (!product_id || previous_stock == null || new_stock == null || !change_amount || !change_type) {
      return NextResponse.json({ success: false, message: "Faltan campos requeridos" }, { status: 400 })
    }

    const productExists = (await executeQuery("SELECT id FROM products WHERE id = ?", [product_id])) as any[]
    if (productExists.length === 0) {
      return NextResponse.json({ success: false, message: "Producto no encontrado" }, { status: 404 })
    }

    const result = (await executeQuery(
      `INSERT INTO stock_movements 
       (product_id, previous_stock, new_stock, change_amount, change_type, reference_id, notes, created_by, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
      [
        product_id,
        previous_stock,
        new_stock,
        change_amount,
        change_type,
        reference_id || null,
        notes || null,
        user?.id ?? null,
      ],
    )) as any

    return NextResponse.json({ success: true, movementId: result.insertId, message: "Movimiento registrado" })
  } catch (error: any) {
    console.error("Error al registrar movimiento de stock:", error)
    return NextResponse.json({ success: false, message: "Error interno del servidor" }, { status: 500 })
  }
})