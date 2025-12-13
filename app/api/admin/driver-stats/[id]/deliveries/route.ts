import { NextRequest, NextResponse } from 'next/server'
import { executeQuery } from '@/lib/mysql-db'
import { getCurrentUser } from '@/lib/auth-simple'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Verificar autenticación
    const user = await getCurrentUser(request)
    if (!user || !user.isAdmin) {
      return NextResponse.json({ success: false, message: "Acceso denegado" }, { status: 403 })
    }

    const driverId = params.id

    // Obtener las últimas 20 entregas del repartidor
    const deliveries = await executeQuery(`
      SELECT 
        o.id as order_id,
        o.customer_info,
        o.delivery_address,
        o.total,
        o.status,
        da.assigned_at,
        da.completed_at,
        TIMESTAMPDIFF(MINUTE, da.assigned_at, da.completed_at) as delivery_time_minutes
      FROM delivery_assignments da
      JOIN orders o ON da.order_id = o.id
      WHERE da.driver_id = ?
      AND o.status = 'delivered'
      ORDER BY da.completed_at DESC
      LIMIT 20
    `, [driverId]) as any[]

    // Parse customer_info JSON
    const formattedDeliveries = deliveries.map(delivery => {
      let customerInfo
      try {
        customerInfo = typeof delivery.customer_info === 'string' 
          ? JSON.parse(delivery.customer_info)
          : delivery.customer_info
      } catch {
        customerInfo = { name: 'Cliente' }
      }

      return {
        order_id: delivery.order_id,
        customer_name: customerInfo.name || 'Cliente',
        delivery_address: delivery.delivery_address,
        total: delivery.total,
        status: delivery.status,
        assigned_at: delivery.assigned_at,
        completed_at: delivery.completed_at,
        delivery_time_minutes: delivery.delivery_time_minutes || 0
      }
    })

    return NextResponse.json({
      success: true,
      deliveries: formattedDeliveries
    })

  } catch (error) {
    console.error('Error al obtener entregas del repartidor:', error)
    return NextResponse.json(
      { error: 'Error al cargar entregas' },
      { status: 500 }
    )
  }
}
