import { type NextRequest, NextResponse } from "next/server"
import { getOrder } from "@/lib/db"
import { requireAuth } from "@/lib/auth"

// Obtener un pedido específico
export const GET = requireAuth(async (request: NextRequest, user: any) => {
  const url = new URL(request.url)
  const id = url.pathname.split("/").pop()

  if (!id) {
    return NextResponse.json({ success: false, message: "ID de pedido no proporcionado" }, { status: 400 })
  }

  const order = await getOrder(Number.parseInt(id))

  if (!order) {
    return NextResponse.json({ success: false, message: "Pedido no encontrado" }, { status: 404 })
  }

  // Verificar que el usuario sea el propietario del pedido o un administrador
  if (order.userId !== user.id && !user.isAdmin) {
    return NextResponse.json({ success: false, message: "No autorizado" }, { status: 403 })
  }

  return NextResponse.json({ success: true, order })
})
