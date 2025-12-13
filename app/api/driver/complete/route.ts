import { NextRequest, NextResponse } from "next/server"
import { executeQuery } from "@/lib/db"
import { getCurrentUser } from "@/lib/auth-simple"

// POST - Completar entrega
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser(request)
    
    if (!user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    const body = await request.json()
    const { assignmentId, notes } = body

    if (!assignmentId) {
      return NextResponse.json({ error: "assignmentId requerido" }, { status: 400 })
    }

    // Verificar que el usuario sea repartidor
    const [driver] = await executeQuery<any>(
      'SELECT id FROM delivery_drivers WHERE user_id = ?',
      [user.id]
    )

    if (!driver) {
      return NextResponse.json({ error: "Repartidor no encontrado" }, { status: 404 })
    }

    // Verificar que la asignación existe y está aceptada
    const [assignment] = await executeQuery<any>(
      `SELECT * FROM delivery_assignments 
       WHERE id = ? AND driver_id = ? AND status = 'accepted'`,
      [assignmentId, driver.id]
    )

    if (!assignment) {
      return NextResponse.json({ 
        error: "Asignación no encontrada o no está en estado aceptado" 
      }, { status: 404 })
    }

    // Calcular duración real
    const acceptedAt = new Date(assignment.accepted_at)
    const now = new Date()
    const actualDuration = Math.floor((now.getTime() - acceptedAt.getTime()) / 60000) // minutos

    // Actualizar asignación a completada
    await executeQuery(
      `UPDATE delivery_assignments 
       SET status = 'completed', 
           completed_at = NOW(),
           actual_duration = ?,
           driver_notes = ?
       WHERE id = ?`,
      [actualDuration, notes || null, assignmentId]
    )

    // Actualizar orden a entregada
    await executeQuery(
      `UPDATE orders 
       SET status = 'entregado'
       WHERE id = ?`,
      [assignment.order_id]
    )

    // Marcar repartidor como disponible
    await executeQuery(
      `UPDATE delivery_drivers 
       SET is_available = 1,
           total_deliveries = total_deliveries + 1
       WHERE id = ?`,
      [driver.id]
    )

    return NextResponse.json({
      success: true,
      message: "Entrega completada exitosamente",
      actualDuration
    })

  } catch (error: any) {
    console.error("Error en POST /api/driver/complete:", error)
    return NextResponse.json({ 
      error: "Error al completar entrega",
      details: error.message 
    }, { status: 500 })
  }
}
