import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth-simple'
import { executeQuery } from '@/lib/db'

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUser(request)

    if (!user || !user.is_driver) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const assignmentId = parseInt(params.id)

    // Verificar que la asignación pertenece a este driver
    const assignments = await executeQuery(
      `SELECT * FROM driver_assignments
       WHERE id = ? AND driver_id = ?`,
      [assignmentId, user.id]
    ) as any[]

    if (!assignments || assignments.length === 0) {
      return NextResponse.json({ error: 'Assignment not found' }, { status: 404 })
    }

    const assignment = assignments[0]

    // Verificar que está aceptada
    if (assignment.status !== 'accepted') {
      return NextResponse.json({ error: 'Assignment not accepted yet' }, { status: 400 })
    }

    // Completar la asignación
    await executeQuery(
      `UPDATE driver_assignments 
       SET status = 'delivered', 
           delivered_at = NOW()
       WHERE id = ?`,
      [assignmentId]
    )

    // Actualizar estado de la orden a "entregado"
    await executeQuery(
      `UPDATE orders 
       SET status = 'entregado'
       WHERE id = ?`,
      [assignment.order_id]
    )

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error completing assignment:', error)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
