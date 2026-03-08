import { NextRequest, NextResponse } from "next/server"
import { executeQuery } from "@/lib/db-retry"

// PATCH - Actualizar estado de un pedido desde cocina
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ orderId: string }> }
) {
  try {
    const { orderId } = await params
    const body = await request.json()
    const { status } = body

    const validStatuses = ['confirmed', 'preparing', 'ready']
    if (!validStatuses.includes(status)) {
      return NextResponse.json(
        { success: false, error: `Estado inválido. Válidos: ${validStatuses.join(', ')}` },
        { status: 400 }
      )
    }

    await executeQuery(
      'UPDATE orders SET status = ?, updated_at = NOW() WHERE id = ?',
      [status, orderId]
    )

    return NextResponse.json({ success: true, orderId: Number(orderId), status })
  } catch (error: any) {
    console.error("Error actualizando pedido cocina:", error)
    return NextResponse.json(
      { success: false, error: "Error al actualizar pedido" },
      { status: 500 }
    )
  }
}
