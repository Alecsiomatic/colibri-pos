import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth-simple'
import { executeQuery } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser(request)

    if (!user || !user.is_driver) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    // Buscar perfil completo del repartidor en delivery_drivers
    const drivers = await executeQuery(
      `SELECT id, name, phone, email, vehicle_type, license_plate, 
              is_active, is_available, current_location, rating, total_deliveries
       FROM delivery_drivers WHERE user_id = ?`,
      [user.id]
    ) as any[]

    const driverRecord = drivers[0]

    // Si tiene registro en delivery_drivers, devolver datos reales
    if (driverRecord) {
      let location = null
      if (driverRecord.current_location) {
        try { location = JSON.parse(driverRecord.current_location) } catch {}
      }

      return NextResponse.json({
        driver: {
          id: driverRecord.id,
          name: driverRecord.name || user.username,
          email: driverRecord.email || user.email,
          phone: driverRecord.phone,
          vehicle_type: driverRecord.vehicle_type,
          license_plate: driverRecord.license_plate,
          is_active: Boolean(driverRecord.is_active),
          is_available: Boolean(driverRecord.is_available),
          current_location: location,
          rating: driverRecord.rating,
          total_deliveries: driverRecord.total_deliveries,
        },
        user: {
          id: user.id,
          email: user.email,
          name: user.username,
          username: user.username
        }
      })
    }

    // Fallback: usuario marcado como repartidor pero sin registro en delivery_drivers
    return NextResponse.json({
      driver: {
        id: user.id,
        name: user.username,
        email: user.email,
        is_active: true,
        is_available: true,
        total_deliveries: 0,
      },
      user: {
        id: user.id,
        email: user.email,
        name: user.username,
        username: user.username
      }
    })
  } catch (error) {
    console.error('Error getting driver info:', error)
    return NextResponse.json({ error: 'Error al obtener información del repartidor' }, { status: 500 })
  }
}
