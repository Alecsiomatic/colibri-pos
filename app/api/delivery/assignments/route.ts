import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { executeQuery } from "@/lib/mysql-db"
import { requireAdmin } from "@/lib/auth-simple"

export const POST = requireAdmin(async (request: NextRequest) => {
  try {
    const { order_id, driver_id, delivery_location } = await request.json()

    if (!order_id || !driver_id) {
      return NextResponse.json({ success: false, message: "ID de pedido y repartidor son requeridos" }, { status: 400 })
    }

    const orders = (await executeQuery("SELECT id, status FROM orders WHERE id = ?", [order_id])) as Array<{
      id: number
      status: string
    }>

    if (orders.length === 0) {
      return NextResponse.json({ success: false, message: "Pedido no encontrado" }, { status: 404 })
    }

    if (!["preparando", "listo_para_recoger"].includes(orders[0].status)) {
      return NextResponse.json({ success: false, message: "El pedido no está listo para asignar" }, { status: 400 })
    }

    const drivers = (await executeQuery(
      "SELECT id, is_available, current_location FROM delivery_drivers WHERE id = ? AND is_active = 1",
      [driver_id],
    )) as Array<{ id: number; is_available: number; current_location: string | null }>

    if (drivers.length === 0) {
      return NextResponse.json({ success: false, message: "Repartidor no encontrado o inactivo" }, { status: 404 })
    }

    if (!drivers[0].is_available) {
      return NextResponse.json({ success: false, message: "Repartidor no disponible" }, { status: 400 })
    }

    const existingAssignments = (await executeQuery(
      'SELECT id FROM delivery_assignments WHERE order_id = ? AND status NOT IN ("cancelled", "completed")',
      [order_id],
    )) as any[]

    if (existingAssignments.length > 0) {
      return NextResponse.json({ success: false, message: "El pedido ya tiene una asignación activa" }, { status: 400 })
    }

    const startLocation = drivers[0].current_location ? JSON.parse(drivers[0].current_location) : null

    const result = (await executeQuery(
      `INSERT INTO delivery_assignments 
       (order_id, driver_id, start_location, delivery_location) 
       VALUES (?, ?, ?, ?)`,
      [
        order_id,
        driver_id,
        startLocation ? JSON.stringify(startLocation) : null,
        delivery_location ? JSON.stringify(delivery_location) : null,
      ],
    )) as any

    await executeQuery("UPDATE orders SET status = ? WHERE id = ?", ["asignado_repartidor", order_id])
    await executeQuery("UPDATE delivery_drivers SET is_available = 0 WHERE id = ?", [driver_id])

    return NextResponse.json({ success: true, assignmentId: result.insertId, message: "Pedido asignado exitosamente" })
  } catch (error: any) {
    console.error("Error al asignar pedido:", error)
    return NextResponse.json({ success: false, message: "Error al asignar pedido" }, { status: 500 })
  }
})

export const GET = requireAdmin(async (request: NextRequest) => {
  try {
    const { searchParams } = new URL(request.url)
  const status = searchParams.get("status")
  const driverId = searchParams.get("driver_id")
  const orderId = searchParams.get("order_id")

    let query = `
      SELECT da.*, 
        o.total, o.customer_info, o.delivery_address, o.status AS order_status,
             dd.name AS driver_name, dd.phone AS driver_phone,
             u.username, u.email AS customer_email
      FROM delivery_assignments da
      JOIN orders o ON da.order_id = o.id
      JOIN delivery_drivers dd ON da.driver_id = dd.id
      LEFT JOIN users u ON o.user_id = u.id
      WHERE 1=1`

    const params: any[] = []

    if (status) {
      query += " AND da.status = ?"
      params.push(status)
    }

    if (orderId) {
      query += " AND da.order_id = ?"
      params.push(Number(orderId))
    }

    if (driverId) {
      query += " AND da.driver_id = ?"
      params.push(driverId)
    }

    query += " ORDER BY da.assigned_at DESC"

    const assignments = (await executeQuery(query, params)) as any[]

    assignments.forEach((assignment) => {
      ["start_location", "delivery_location", "customer_info", "delivery_address"].forEach((field) => {
        if (assignment[field]) {
          try {
            assignment[field] = JSON.parse(assignment[field])
          } catch (_error) {
            assignment[field] = null
          }
        }
      })
    })

    return NextResponse.json({ success: true, assignments })
  } catch (error: any) {
    console.error("Error al obtener asignaciones:", error)
    return NextResponse.json({ success: false, message: "Error al obtener asignaciones" }, { status: 500 })
  }
})

export const PATCH = requireAdmin(async (request: NextRequest) => {
  try {
    const { assignmentId, action } = await request.json()

    if (!assignmentId || !action) {
      return NextResponse.json({ success: false, message: "Datos insuficientes" }, { status: 400 })
    }

    const assignments = (await executeQuery(
      "SELECT id, order_id, driver_id FROM delivery_assignments WHERE id = ?",
      [assignmentId],
    )) as Array<{ id: number; order_id: number; driver_id: number }>

    if (assignments.length === 0) {
      return NextResponse.json({ success: false, message: "Asignación no encontrada" }, { status: 404 })
    }

    const assignment = assignments[0]

    if (action === "cancel") {
      await executeQuery(
        `UPDATE delivery_assignments
         SET status = 'cancelled', cancelled_at = NOW()
         WHERE id = ?`,
        [assignmentId],
      )

      await executeQuery("UPDATE orders SET status = ? WHERE id = ?", ["listo_para_recoger", assignment.order_id])
      await executeQuery(
        "UPDATE delivery_drivers SET is_available = 1, current_order_id = NULL, updated_at = NOW() WHERE id = ?",
        [assignment.driver_id],
      )

      return NextResponse.json({ success: true, message: "Asignación cancelada" })
    }

    if (action === "complete") {
      await executeQuery(
        `UPDATE delivery_assignments
         SET status = 'completed', completed_at = NOW()
         WHERE id = ?`,
        [assignmentId],
      )

      await executeQuery("UPDATE orders SET status = ? WHERE id = ?", ["entregado", assignment.order_id])
      await executeQuery(
        "UPDATE delivery_drivers SET is_available = 1, current_order_id = NULL, updated_at = NOW() WHERE id = ?",
        [assignment.driver_id],
      )

      return NextResponse.json({ success: true, message: "Asignación completada" })
    }

    return NextResponse.json({ success: false, message: "Acción no soportada" }, { status: 400 })
  } catch (error: any) {
    console.error("Error al actualizar asignación:", error)
    return NextResponse.json({ success: false, message: "Error al actualizar asignación" }, { status: 500 })
  }
})
