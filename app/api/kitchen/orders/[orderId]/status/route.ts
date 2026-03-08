import { NextRequest, NextResponse } from "next/server"
import { executeQuery } from "@/lib/db-retry"

// PATCH - Actualizar estado de un pedido desde cocina
export async function PATCH(
  request: NextRequest,
  context: { params: { orderId: string } }
) {
  try {
    const { orderId } = context.params
    const body = await request.json()
    const { status } = body

    const validStatuses = ['confirmed', 'preparing', 'ready']
    if (!validStatuses.includes(status)) {
      return NextResponse.json(
        { success: false, error: `Estado inválido. Válidos: ${validStatuses.join(', ')}` },
        { status: 400 }
      )
    }

    const result = await executeQuery(
      'UPDATE orders SET status = ?, updated_at = NOW() WHERE id = ?',
      [status, parseInt(orderId)]
    ) as any

    if (!result?.affectedRows) {
      return NextResponse.json(
        { success: false, error: 'Pedido no encontrado' },
        { status: 404 }
      )
    }

    return NextResponse.json({ success: true, orderId: Number(orderId), status })
  } catch (error: any) {
    console.error("Error actualizando pedido cocina:", error)
    return NextResponse.json(
      { success: false, error: "Error al actualizar pedido" },
      { status: 500 }
    )
  }
}
