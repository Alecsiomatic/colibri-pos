import { NextRequest, NextResponse } from "next/server"
import { executeQuery } from "@/lib/db"
import { getCurrentUser } from "@/lib/auth-simple"

// GET - Obtener asignaciones del repartidor
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser(request)
    
    if (!user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    // Verificar que el usuario sea repartidor
    const [userDetails] = await executeQuery<any>(
      'SELECT is_driver FROM users WHERE id = ?',
      [user.id]
    )

    if (!userDetails?.is_driver) {
      return NextResponse.json({ error: "Usuario no es repartidor" }, { status: 403 })
    }

    // Obtener asignaciones pendientes y aceptadas
    const assignments = await executeQuery<any>(
      `SELECT 
        da.*,
        o.id as order_id,
        o.total,
        o.delivery_address,
        o.notes,
        o.items,
        o.status as order_status,
        o.created_at as order_created_at
      FROM driver_assignments da
      INNER JOIN orders o ON da.order_id = o.id
      WHERE da.driver_id = ? 
        AND da.status IN ('pending', 'accepted')
      ORDER BY 
        CASE da.status 
          WHEN 'accepted' THEN 1 
          WHEN 'pending' THEN 2 
        END,
        da.assigned_at DESC`,
      [user.id]
    )
    
    // Parsear items JSON y delivery_address
    const parsedAssignments = assignments.map((a: any) => {
      try {
        if (a.items) {
          a.items = typeof a.items === 'string' ? JSON.parse(a.items) : a.items;
        }
        if (a.delivery_address) {
          const addr = typeof a.delivery_address === 'string' ? JSON.parse(a.delivery_address) : a.delivery_address;
          a.delivery_address = addr.street || addr;
        }
        // Extraer info del cliente de las notas
        if (a.notes) {
          const match = a.notes.match(/Cliente: ([^|]+)\|Tel: ([^|]+)/);
          if (match) {
            a.customer_name = match[1].trim();
            a.customer_phone = match[2].trim();
          }
        }
      } catch (e) {
        console.error('Error parsing assignment data:', e);
      }
      return a;
    });

    return NextResponse.json({
      success: true,
      driver: { id: user.id, name: user.username },
      assignments: parsedAssignments || []
    })

  } catch (error: any) {
    console.error("Error en GET /api/driver/assignments:", error)
    return NextResponse.json({ 
      error: "Error al obtener asignaciones",
      details: error.message 
    }, { status: 500 })
  }
}
