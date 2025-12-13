import { NextRequest, NextResponse } from "next/server";
import { executeQuery } from "@/lib/mysql-db";
import { verifyAccessToken, getSessionByToken } from "@/lib/auth-mysql";

// PATCH - Close (pay) a table (mesero order)
export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
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
    // Only allow closing own orders
    const result = await executeQuery(
      `UPDATE orders SET status = 'paid', paid_at = NOW() WHERE id = ? AND user_id = ? AND waiter_order = 1 AND status = 'open_table'`,
      [orderId, user.id]
    );
    if ((result as any).affectedRows === 0) {
      return NextResponse.json({ error: "No se pudo cerrar la mesa" }, { status: 400 });
    }
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: "Error al cerrar la mesa" }, { status: 500 });
  }
}
