import { NextRequest, NextResponse } from "next/server"
import { executeQuery } from "@/lib/db"

// POST - Notificar al cliente que el repartidor aceptó el pedido
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { orderId, driverName, driverPhone, estimatedTime } = body

    if (!orderId) {
      return NextResponse.json({ error: "orderId requerido" }, { status: 400 })
    }

    // Obtener información del pedido para notificar al cliente
    const orders = await executeQuery(
      `SELECT o.*, 
        JSON_EXTRACT(o.customer_info, '$.phone') as customer_phone,
        JSON_EXTRACT(o.customer_info, '$.name') as customer_name
      FROM orders o 
      WHERE o.id = ?`,
      [orderId]
    ) as any[]

    if (orders.length === 0) {
      return NextResponse.json({ error: "Pedido no encontrado" }, { status: 404 })
    }

    const order = orders[0]
    const customerPhone = order.customer_phone?.replace(/"/g, '') // Limpiar comillas de JSON
    const customerName = order.customer_name?.replace(/"/g, '')

    // Actualizar status del pedido a "asignado_repartidor"
    await executeQuery(
      'UPDATE orders SET status = ? WHERE id = ?',
      ['asignado_repartidor', orderId]
    )

    // Crear mensaje para WhatsApp (si está configurado)
    const message = `¡Hola ${customerName}! 👋

🚗 Tu repartidor ya está en camino:
👤 ${driverName || 'Repartidor'}
📱 Teléfono: ${driverPhone || 'Disponible en la app'}
⏱️ Tiempo estimado: ${estimatedTime || '30-45 minutos'}

📍 Puedes seguir tu pedido en tiempo real aquí:
${process.env.NEXT_PUBLIC_BASE_URL || 'https://tu-restaurante.com'}/orders/${orderId}/tracking

¡Prepárate para recibir tu deliciosa comida! 🍕✨`

    // Aquí podrías integrar con WhatsApp API o sistema de notificaciones

    return NextResponse.json({
      success: true,
      message: "Notificación enviada",
      trackingUrl: `/orders/${orderId}/tracking`
    })

  } catch (error: any) {
    console.error("Error en POST /api/driver/notify-customer:", error)
    return NextResponse.json({ 
      error: "Error al enviar notificación"
    }, { status: 500 })
  }
}