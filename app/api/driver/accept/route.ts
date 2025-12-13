import { NextRequest, NextResponse } from "next/server"
import { executeQuery } from "@/lib/db"
import { getCurrentUser } from "@/lib/auth-simple"

// POST - Aceptar asignación
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser(request)
    
    if (!user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    const body = await request.json()
    const { assignmentId } = body

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

    // Verificar que la asignación existe y es para este repartidor
    const [assignment] = await executeQuery<any>(
      'SELECT * FROM delivery_assignments WHERE id = ? AND driver_id = ?',
      [assignmentId, driver.id]
    )

    if (!assignment) {
      return NextResponse.json({ error: "Asignación no encontrada" }, { status: 404 })
    }

    if (assignment.status !== 'pending') {
      return NextResponse.json({ 
        error: "Esta asignación ya fue procesada",
        status: assignment.status 
      }, { status: 400 })
    }

    // Actualizar asignación a aceptada
    await executeQuery(
      `UPDATE delivery_assignments 
       SET status = 'accepted', accepted_at = NOW()
       WHERE id = ?`,
      [assignmentId]
    )

    // Actualizar orden a "en camino"
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
      [driver.id]
    )

    return NextResponse.json({
      success: true,
      message: "Pedido aceptado exitosamente"
    })

  } catch (error: any) {
    console.error("Error en POST /api/driver/accept:", error)
    return NextResponse.json({ 
      error: "Error al aceptar asignación",
      details: error.message 
    }, { status: 500 })
  }
}
