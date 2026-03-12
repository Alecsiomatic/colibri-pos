import { NextRequest, NextResponse } from 'next/server'
import { executeQuery } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth-simple'

// POST - Actualizar ubicación del repartidor en delivery_drivers
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser(request)
    if (!user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const body = await request.json()
    // Aceptar ambos formatos: {lat, lng} o {latitude, longitude}
    const lat = body.lat ?? body.latitude
    const lng = body.lng ?? body.longitude

    if (typeof lat !== 'number' || typeof lng !== 'number') {
      return NextResponse.json({ error: 'Coordenadas inválidas' }, { status: 400 })
    }

    if (lat < -90 || lat > 90 || lng < -180 || lng > 180) {
      return NextResponse.json({ error: 'Coordenadas fuera de rango' }, { status: 400 })
    }

    // Buscar repartidor en delivery_drivers por user_id
    const drivers = await executeQuery(
      'SELECT id FROM delivery_drivers WHERE user_id = ?',
      [user.id]
    ) as any[]

    if (!drivers || drivers.length === 0) {
      return NextResponse.json({ error: 'Repartidor no encontrado' }, { status: 404 })
    }

    // Actualizar ubicación en delivery_drivers (fuente única de verdad)
    const location = JSON.stringify({ lat, lng })
    await executeQuery(
      `UPDATE delivery_drivers 
       SET current_location = ?, updated_at = NOW()
       WHERE id = ?`,
      [location, drivers[0].id]
    )

    return NextResponse.json({ success: true, location: { lat, lng } })
  } catch (error: any) {
    console.error('Error updating driver location:', error)
    return NextResponse.json({ error: 'Error al actualizar ubicación' }, { status: 500 })
  }
}

// GET - Obtener ubicación actual del repartidor
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser(request)
    if (!user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const drivers = await executeQuery(
      'SELECT current_location, updated_at FROM delivery_drivers WHERE user_id = ?',
      [user.id]
    ) as any[]

    if (!drivers || drivers.length === 0 || !drivers[0].current_location) {
      return NextResponse.json({ success: false, message: 'No hay datos de ubicación' })
    }

    const location = JSON.parse(drivers[0].current_location)
    return NextResponse.json({
      success: true,
      location: { ...location, updated_at: drivers[0].updated_at }
    })
  } catch (error) {
    console.error('Error getting driver location:', error)
    return NextResponse.json({ error: 'Error al obtener ubicación' }, { status: 500 })
  }
}
