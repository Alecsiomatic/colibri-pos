import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { executeQuery } from "@/lib/mysql-db"
import { verifyAccessToken, getSessionByToken } from "@/lib/auth-mysql"

export async function GET(request: NextRequest) {
  try {
    const authToken = request.cookies.get("auth-token")?.value
    if (!authToken) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    const user = verifyAccessToken(authToken) || (await getSessionByToken(authToken))
    if (!user) {
      return NextResponse.json({ error: "Sesión inválida" }, { status: 401 })
    }

    const orders = (await executeQuery(
      `SELECT o.*, u.username, u.email as user_email
       FROM orders o
       LEFT JOIN users u ON o.user_id = u.id
       WHERE o.user_id = ?
       ORDER BY o.created_at DESC`,
      [user.id],
    )) as any[]

    orders.forEach((order) => {
      // Parsear total a número
      if (order.total && typeof order.total === 'string') {
        order.total = parseFloat(order.total)
      }
      
      if (order.items) {
        try {
          order.items = JSON.parse(order.items)
        } catch {
          order.items = []
        }
      }

      if (order.customer_info) {
        try {
          order.customer_info = JSON.parse(order.customer_info)
        } catch {
          order.customer_info = null
        }
      }

      if (order.delivery_address) {
        try {
          order.delivery_address = JSON.parse(order.delivery_address)
        } catch {
          order.delivery_address = null
        }
      }
    })

    return NextResponse.json({ success: true, orders })
  } catch (error) {
    console.error("Error al obtener pedidos del usuario:", error)
    return NextResponse.json({ error: "Error al obtener pedidos" }, { status: 500 })
  }
}
