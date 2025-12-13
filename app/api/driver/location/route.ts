import { NextRequest, NextResponse } from "next/server"
import { executeQuery } from "@/lib/db"
import { getCurrentUser } from "@/lib/auth-simple"

// POST - Actualizar ubicación del repartidor
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser(request)
    
    if (!user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    const body = await request.json()
    const { latitude, longitude } = body

    if (!latitude || !longitude) {
      return NextResponse.json({ 
        error: "latitude y longitude requeridos" 
      }, { status: 400 })
    }

    // Validar coordenadas
    if (typeof latitude !== 'number' || typeof longitude !== 'number') {
      return NextResponse.json({ error: "Coordenadas inválidas" }, { status: 400 })
    }

    if (latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) {
      return NextResponse.json({ error: "Coordenadas fuera de rango" }, { status: 400 })
    }

    // Obtener repartidor
    const drivers = await executeQuery(
      'SELECT id FROM delivery_drivers WHERE user_id = ?',
      [user.id]
    ) as any[]
    const driver = drivers[0]

    if (!driver) {
      return NextResponse.json({ error: "Repartidor no encontrado" }, { status: 404 })
    }

    // Actualizar ubicación
    const location = JSON.stringify({ lat: latitude, lng: longitude })
    
    await executeQuery(
      `UPDATE delivery_drivers 
       SET current_location = ?,
           updated_at = NOW()
       WHERE id = ?`,
      [location, driver.id]
    )

    return NextResponse.json({
      success: true,
      message: "Ubicación actualizada"
    })

  } catch (error: any) {
    console.error("Error en POST /api/driver/location:", error)
    return NextResponse.json({ 
      error: "Error al actualizar ubicación",
      details: error.message 
    }, { status: 500 })
  }
}

// GET - Obtener ubicación actual del repartidor de una orden
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const orderId = searchParams.get('orderId')

    if (!orderId) {
      return NextResponse.json({ error: "orderId requerido" }, { status: 400 })
    }

    // Obtener asignación activa y ubicación del repartidor
    const results = await executeQuery(
      `SELECT 
        dd.current_location,
        dd.name as driver_name,
        dd.phone as driver_phone,
        dd.updated_at,
        da.status,
        da.estimated_duration
      FROM delivery_assignments da
      INNER JOIN delivery_drivers dd ON da.driver_id = dd.id
      WHERE da.order_id = ? 
        AND da.status IN ('accepted', 'completed')
      ORDER BY da.assigned_at DESC
      LIMIT 1`,
      [orderId]
    ) as any[]
    const data = results[0]

    if (!data) {
      return NextResponse.json({ 
        success: false,
        message: "No hay repartidor asignado a este pedido" 
      })
    }

    let location = null
    if (data.current_location) {
      try {
        location = typeof data.current_location === 'string' 
          ? JSON.parse(data.current_location)
          : data.current_location
      } catch (e) {
        console.error("Error parsing location:", e)
      }
    }

    return NextResponse.json({
      success: true,
      location,
      driverName: data.driver_name,
      driverPhone: data.driver_phone,
      lastUpdate: data.updated_at,
      status: data.status,
      estimatedDuration: data.estimated_duration
    })

  } catch (error: any) {
    console.error("Error en GET /api/driver/location:", error)
    return NextResponse.json({ 
      error: "Error al obtener ubicación",
      details: error.message 
    }, { status: 500 })
  }
}
