import { NextRequest, NextResponse } from "next/server";
import { executeQuery } from "@/lib/mysql-db";
import { verifyAccessToken, getSessionByToken } from "@/lib/auth-mysql";

// GET - Get a single mesero order (for ticket)
export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const authToken = request.cookies.get("auth-token")?.value;
    if (!authToken) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }
    const user = verifyAccessToken(authToken) || await getSessionByToken(authToken);
    if (!user || !user.is_waiter) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }
    const orderId = Number(params.id);
    const orders = await executeQuery(
      `SELECT id, table, status, created_at, items, total, notes FROM orders WHERE id = ? AND waiter_order = 1 AND user_id = ?`,
      [orderId, user.id]
    );
    if (!orders || orders.length === 0) {
      return NextResponse.json({ error: "Pedido no encontrado" }, { status: 404 });
    }
    const order = orders[0];
    order.items = order.items ? JSON.parse(order.items) : [];
    return NextResponse.json({ success: true, order });
  } catch (error) {
    return NextResponse.json({ error: "Error al obtener pedido" }, { status: 500 });
  }
}
