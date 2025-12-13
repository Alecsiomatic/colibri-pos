import { NextResponse } from "next/server"
import { executeQuery } from "@/lib/mysql-db"
import { requireAdmin } from "@/lib/auth-simple"

export const GET = requireAdmin(async (request) => {
  try {
    const { searchParams } = new URL(request.url)
    const available = searchParams.get("available")

    let query = `
      SELECT dd.*, u.email, u.username 
      FROM delivery_drivers dd
      LEFT JOIN users u ON dd.user_id = u.id
      WHERE dd.is_active = 1`

    if (available === "true") {
      query += " AND dd.is_available = 1"
    }

    query += " ORDER BY dd.name"

    const drivers = (await executeQuery(query)) as any[]

    drivers.forEach((driver) => {
      if (driver.current_location) {
        try {
          driver.current_location = JSON.parse(driver.current_location)
        } catch (_error) {
          driver.current_location = null
        }
      }
    })

    return NextResponse.json({ success: true, drivers })
  } catch (error: any) {
    console.error("Error al obtener repartidores:", error)
    return NextResponse.json({ success: false, message: "Error al obtener repartidores" }, { status: 500 })
  }
})

export const POST = requireAdmin(async (request) => {
  try {
    const { name, phone, email, vehicle_type, license_plate, user_id } = await request.json()

    if (!name || !phone) {
      return NextResponse.json({ success: false, message: "Nombre y teléfono son requeridos" }, { status: 400 })
    }

    // SIMPLIFICADO: Solo crear en delivery_drivers, sin vincular a users por ahora
    // El driver NO podrá loguearse pero SÍ aparecerá en estadísticas y podrá ser asignado
    
    const result = (await executeQuery(
      `INSERT INTO delivery_drivers 
       (name, phone, email, vehicle_type, license_plate, is_available, is_active, created_at) 
       VALUES (?, ?, ?, ?, ?, 1, 1, NOW())`,
      [name, phone, email || null, vehicle_type || null, license_plate || null],
    )) as any

    console.log(`✅ Driver creado: ${name} (ID: ${result.insertId})`)

    return NextResponse.json({ 
      success: true, 
      driverId: result.insertId,
      message: "Repartidor creado exitosamente",
      note: "Driver creado sin usuario de login. Para que pueda acceder al panel, créale un usuario desde /admin/users y luego vincúlalo."
    })
  } catch (error: any) {
    console.error("❌ Error al crear repartidor:", error)
    return NextResponse.json({ 
      success: false, 
      message: "Error al crear repartidor: " + error.message 
    }, { status: 500 })
  }
})

export const PATCH = requireAdmin(async (request) => {
  try {
    const { driverId, isActive, isAvailable, currentOrderId } = await request.json()

    if (!driverId) {
      return NextResponse.json({ success: false, message: "ID de repartidor requerido" }, { status: 400 })
    }

    const updates: string[] = []
    const params: any[] = []

    if (typeof isActive === "boolean") {
      updates.push("is_active = ?")
      params.push(isActive ? 1 : 0)
    }

    if (typeof isAvailable === "boolean") {
      updates.push("is_available = ?")
      params.push(isAvailable ? 1 : 0)
    }

    if (currentOrderId !== undefined) {
      updates.push("current_order_id = ?")
      params.push(currentOrderId)
    }

    if (updates.length === 0) {
      return NextResponse.json({ success: false, message: "No hay cambios para aplicar" }, { status: 400 })
    }

    updates.push("updated_at = NOW()")

    params.push(driverId)
    await executeQuery(`UPDATE delivery_drivers SET ${updates.join(", ")} WHERE id = ?`, params)

    return NextResponse.json({ success: true, message: "Repartidor actualizado" })
  } catch (error: any) {
    console.error("Error al actualizar repartidor:", error)
    return NextResponse.json({ success: false, message: "Error al actualizar repartidor" }, { status: 500 })
  }
})