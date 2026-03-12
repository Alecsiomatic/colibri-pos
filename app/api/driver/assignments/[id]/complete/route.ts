import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth-simple'
import { executeQuery } from '@/lib/db'

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUser(request)

    if (!user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const assignmentId = parseInt(params.id)

    // Buscar repartidor en delivery_drivers por user_id
    const drivers = await executeQuery(
      'SELECT id FROM delivery_drivers WHERE user_id = ? AND is_active = 1',
      [user.id]
    ) as any[]

    if (!drivers || drivers.length === 0) {
      return NextResponse.json({ error: 'Repartidor no encontrado' }, { status: 404 })
    }

    const driverId = drivers[0].id

    // Verificar que la asignación pertenece a este repartidor y está aceptada
    const assignments = await executeQuery(
      `SELECT * FROM delivery_assignments
       WHERE id = ? AND driver_id = ? AND status = 'accepted'`,
      [assignmentId, driverId]
    ) as any[]

    if (!assignments || assignments.length === 0) {
      return NextResponse.json({ error: 'Asignación no encontrada o no está en estado aceptado' }, { status: 404 })
    }

    const assignment = assignments[0]

    // Calcular duración real en minutos
    const acceptedAt = new Date(assignment.accepted_at)
    const now = new Date()
    const actualDuration = Math.floor((now.getTime() - acceptedAt.getTime()) / 60000)

    // Completar la asignación
    await executeQuery(
      `UPDATE delivery_assignments 
       SET status = 'completed', 
           completed_at = NOW(),
           actual_duration = ?
       WHERE id = ?`,
      [actualDuration, assignmentId]
    )

    // Actualizar estado de la orden a "entregado"
    await executeQuery(
      `UPDATE orders 
       SET status = 'entregado'
       WHERE id = ?`,
      [assignment.order_id]
    )

    // Liberar repartidor y sumar entrega completada
    await executeQuery(
      `UPDATE delivery_drivers 
       SET is_available = 1,
           total_deliveries = total_deliveries + 1
       WHERE id = ?`,
      [driverId]
    )

    return NextResponse.json({ success: true, message: 'Entrega completada', actualDuration })
  } catch (error) {
    console.error('Error completing assignment:', error)
    return NextResponse.json({ error: 'Error al completar entrega' }, { status: 500 })
  }
}
