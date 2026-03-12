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

    // Verificar que la asignación pertenece a este repartidor en delivery_assignments
    const assignments = await executeQuery(
      `SELECT * FROM delivery_assignments
       WHERE id = ? AND driver_id = ?`,
      [assignmentId, driverId]
    ) as any[]

    if (!assignments || assignments.length === 0) {
      return NextResponse.json({ error: 'Asignación no encontrada' }, { status: 404 })
    }

    const assignment = assignments[0]

    if (assignment.status !== 'pending') {
      return NextResponse.json({ error: 'Esta asignación ya fue procesada' }, { status: 400 })
    }

    // Actualizar asignación a aceptada
    await executeQuery(
      `UPDATE delivery_assignments 
       SET status = 'accepted', accepted_at = NOW()
       WHERE id = ?`,
      [assignmentId]
    )

    // Actualizar estado de la orden a "en_camino"
    await executeQuery(
      `UPDATE orders 
       SET status = 'en_camino'
       WHERE id = ?`,
      [assignment.order_id]
    )

    // Marcar repartidor como no disponible
    await executeQuery(
      `UPDATE delivery_drivers 
       SET is_available = 0
       WHERE id = ?`,
      [driverId]
    )

    return NextResponse.json({ success: true, message: 'Pedido aceptado exitosamente' })
  } catch (error) {
    console.error('Error accepting assignment:', error)
    return NextResponse.json({ error: 'Error al aceptar asignación' }, { status: 500 })
  }
}
