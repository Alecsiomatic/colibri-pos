import { NextResponse } from "next/server"
import { executeQuery } from "@/lib/db-retry"

// GET - Pedidos activos para la cocina (pending, confirmed, preparing)
export async function GET() {
  try {
    const rows = await executeQuery(
      `SELECT 
        o.id,
        o.status,
        o.items,
        o.notes,
        o.order_source,
        o.waiter_order,
        o.created_at,
        o.updated_at,
        COALESCE(o.table_name, JSON_UNQUOTE(JSON_EXTRACT(o.customer_info, '$.table'))) as table_name,
        COALESCE(
          JSON_UNQUOTE(JSON_EXTRACT(o.customer_info, '$.name')),
          JSON_UNQUOTE(JSON_EXTRACT(o.customer_info, '$.customerName')),
          o.customer_name,
          'Cliente'
        ) as customer_name,
        o.delivery_type
      FROM orders o
      WHERE o.status IN ('pending', 'confirmed', 'preparing', 'pendiente', 'confirmado', 'preparando')
      ORDER BY 
        CASE o.status 
          WHEN 'pending' THEN 1
          WHEN 'pendiente' THEN 1
          WHEN 'confirmed' THEN 2
          WHEN 'confirmado' THEN 2
          WHEN 'preparing' THEN 3
          WHEN 'preparando' THEN 3
        END,
        o.created_at ASC`
    )

    const orders = (rows as any[]).map(order => ({
      ...order,
      items: typeof order.items === 'string' ? JSON.parse(order.items) : order.items
    }))

    return NextResponse.json({ success: true, orders })
  } catch (error: any) {
    console.error("Error en kitchen orders:", error)
    return NextResponse.json(
      { success: false, error: "Error al obtener pedidos" },
      { status: 500 }
    )
  }
}
