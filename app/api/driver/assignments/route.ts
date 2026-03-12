import { NextRequest, NextResponse } from "next/server"
import { executeQuery } from "@/lib/db"
import { getCurrentUser } from "@/lib/auth-simple"

// GET - Obtener asignaciones del repartidor (desde delivery_assignments + delivery_drivers)
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser(request)
    
    if (!user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    // Buscar el registro del repartidor en delivery_drivers por user_id
    const drivers = await executeQuery<any>(
      'SELECT id FROM delivery_drivers WHERE user_id = ? AND is_active = 1',
      [user.id]
    )
    const driver = drivers[0]

    if (!driver) {
      // Fallback: verificar flag is_driver en users
      const [userDetails] = await executeQuery<any>(
        'SELECT is_driver FROM users WHERE id = ?',
        [user.id]
      )
      if (!userDetails?.is_driver) {
        return NextResponse.json({ error: "Usuario no es repartidor" }, { status: 403 })
      }
      // Repartidor sin registro en delivery_drivers — retornar vacío
      return NextResponse.json({
        success: true,
        driver: { id: user.id, name: user.username },
        assignments: []
      })
    }

    // Obtener asignaciones pendientes y aceptadas desde delivery_assignments
    const assignments = await executeQuery<any>(
      `SELECT 
        da.id,
        da.order_id,
        da.driver_id,
        da.status,
        da.assigned_at,
        da.accepted_at,
        da.completed_at,
        da.start_location,
        da.delivery_location,
        da.estimated_distance,
        da.estimated_duration,
        da.actual_duration,
        da.driver_notes,
        o.total,
        o.delivery_address,
        o.notes,
        o.items,
        o.customer_info,
        o.status as order_status,
        o.created_at as order_created_at
      FROM delivery_assignments da
      INNER JOIN orders o ON da.order_id = o.id
      WHERE da.driver_id = ? 
        AND da.status IN ('pending', 'accepted')
      ORDER BY 
        CASE da.status 
          WHEN 'accepted' THEN 1 
          WHEN 'pending' THEN 2 
        END,
        da.assigned_at DESC`,
      [driver.id]
    )
    
    // Parsear campos JSON y construir estructura limpia para el dashboard
    const parsedAssignments = assignments.map((a: any) => {
      // Parsear items
      if (a.items && typeof a.items === 'string') {
        try { a.items = JSON.parse(a.items) } catch { a.items = [] }
      }

      // Extraer info del cliente desde customer_info
      let customerName = 'Cliente'
      let customerPhone = ''
      if (a.customer_info) {
        try {
          const info = typeof a.customer_info === 'string' ? JSON.parse(a.customer_info) : a.customer_info
          customerName = info.name || info.nombre || 'Cliente'
          customerPhone = info.phone || info.telefono || info.tel || ''
        } catch {}
      }

      // Parsear delivery_address: puede ser JSON o string
      let deliveryAddressDisplay = 'Dirección no disponible'
      if (a.delivery_address) {
        try {
          const addr = typeof a.delivery_address === 'string' ? JSON.parse(a.delivery_address) : a.delivery_address
          deliveryAddressDisplay = addr.street || addr.address || addr.direccion || JSON.stringify(addr)
        } catch {
          deliveryAddressDisplay = a.delivery_address
        }
      }

      // Extraer info del cliente de las notas como fallback
      if (a.notes && customerName === 'Cliente') {
        const match = a.notes.match(/Cliente: ([^|]+)\|Tel: ([^|]+)/)
        if (match) {
          customerName = match[1].trim()
          customerPhone = customerPhone || match[2].trim()
        }
      }

      return {
        id: a.id,
        order_id: a.order_id,
        status: a.status,
        assigned_at: a.assigned_at,
        accepted_at: a.accepted_at,
        customer_name: customerName,
        customer_phone: customerPhone,
        delivery_address: deliveryAddressDisplay,
        // Mantener delivery_address original en order para el mapa (JSON con lat/lng)
        order: {
          id: a.order_id,
          customer_name: customerName,
          customer_phone: customerPhone,
          delivery_address: a.delivery_address, // raw para parsing de coordenadas en el mapa
          items: a.items || [],
          total: a.total,
          created_at: a.order_created_at,
        },
        total: a.total,
      }
    })

    return NextResponse.json({
      success: true,
      driver: { id: driver.id, name: user.username },
      assignments: parsedAssignments
    })

  } catch (error: any) {
    console.error("Error en GET /api/driver/assignments:", error)
    return NextResponse.json({ 
      error: "Error al obtener asignaciones"
    }, { status: 500 })
  }
}
