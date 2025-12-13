import { type NextRequest, NextResponse } from "next/server"
import { getUserOrders, getAllOrders, updateOrderStatus, saveOrder } from "@/lib/mysql-db"
import { getCurrentUser, requireAuth, requireAdmin } from "@/lib/auth-simple"
import { updateStockFromOrder } from "@/lib/db-functions"

// Crear un nuevo pedido
export async function POST(request: NextRequest) {
  try {
    // Verificar autenticación manualmente
  const user = await getCurrentUser(request)

    if (!user) {
      console.log("Usuario no autenticado al intentar crear pedido")
      return NextResponse.json({ success: false, message: "No autorizado" }, { status: 401 })
    }

    console.log("Usuario autenticado creando pedido:", user.username)

    const body = await request.json()
    const { items, total, customerInfo } = body

    if (!items || !total) {
      return NextResponse.json({ success: false, message: "Datos incompletos" }, { status: 400 })
    }

    console.log("Datos del pedido recibidos:", JSON.stringify({ items, total }))

    // Normalizar los items para asegurar que los IDs y cantidades sean números
    const normalizedItems = items.map((item: any) => ({
      ...item,
      id: typeof item.id === "string" ? item.id : item.id?.toString(),
      quantity: typeof item.quantity === "string" ? Number.parseInt(item.quantity) : item.quantity,
    }))

    // Guardar el pedido
    const result = await saveOrder(
      user.id,
      JSON.stringify(normalizedItems),
      total,
      customerInfo ? JSON.stringify(customerInfo) : "{}",
    )

    console.log("Pedido guardado correctamente:", result)

    // Actualizar el stock después de crear el pedido
    if (result.success && result.orderId) {
      try {
        console.log("Actualizando stock para el pedido:", result.orderId)
        const stockUpdateResult = await updateStockFromOrder(result.orderId)
        console.log("Resultado de actualización de stock:", stockUpdateResult)
      } catch (stockError) {
        console.error("Error al actualizar stock:", stockError)
        // No fallamos el pedido por un error en la actualización de stock
      }
    }

    return NextResponse.json(result)
  } catch (error) {
    console.error("Error al procesar pedido:", error)
    return NextResponse.json({ success: false, message: "Error interno del servidor" }, { status: 500 })
  }
}

// Obtener pedidos del usuario o todos los pedidos si es admin
export const GET = requireAuth(async (request: NextRequest, user: any) => {
  const { searchParams } = new URL(request.url)
  const status = searchParams.get('status')
  const after = searchParams.get('after')
  
  let orders

  if (user.isAdmin) {
    orders = await getAllOrders(status, after)
  } else {
    orders = await getUserOrders(user.id)
  }

  return NextResponse.json({ success: true, orders })
})

// Actualizar estado de un pedido (solo admin)
export const PUT = requireAdmin(async (request: NextRequest) => {
  const body = await request.json()
  const { orderId, status } = body

  if (!orderId || !status) {
    return NextResponse.json({ success: false, message: "Datos incompletos" }, { status: 400 })
  }

  const result = await updateOrderStatus(orderId, status)

  return NextResponse.json(result)
})
