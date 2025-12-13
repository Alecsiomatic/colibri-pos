import { NextRequest, NextResponse } from 'next/server'
import { getPool } from '@/lib/mysql-db'
import jwt from 'jsonwebtoken'

export async function POST(request: NextRequest) {
  try {
    // Verificar token
    const token = request.cookies.get('token')?.value
    if (!token) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }
    
    const user = jwt.verify(token, process.env.JWT_SECRET!) as any
    
    if (!user.is_driver) {
      return NextResponse.json(
        { error: 'Only drivers can update location' },
        { status: 403 }
      )
    }
    
    const { lat, lng } = await request.json()
    
    if (typeof lat !== 'number' || typeof lng !== 'number') {
      return NextResponse.json(
        { error: 'Invalid coordinates' },
        { status: 400 }
      )
    }
    
    const pool = getPool()
    
    // Actualizar ubicación del driver en la tabla users
    await pool.execute(
      `UPDATE users 
       SET driver_lat = ?, driver_lng = ?, driver_location_updated_at = NOW()
       WHERE id = ?`,
      [lat, lng, user.id]
    )
    
    console.log(`📍 Driver ${user.id} ubicación actualizada: ${lat}, ${lng}`)
    
    return NextResponse.json({
      success: true,
      location: { lat, lng }
    })
    
  } catch (error: any) {
    console.error('❌ Error updating driver location:', error)
    
    return NextResponse.json(
      { error: 'Failed to update location' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    // Verificar token
    const token = request.cookies.get('token')?.value
    if (!token) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }
    
    const user = jwt.verify(token, process.env.JWT_SECRET!) as any
    
    const pool = getPool()
    const [rows] = await pool.execute<any[]>(
      `SELECT driver_lat as lat, driver_lng as lng, driver_location_updated_at as updated_at
       FROM users
       WHERE id = ?`,
      [user.id]
    )
    
    if (rows.length === 0 || !rows[0].lat) {
      return NextResponse.json({
        success: false,
        message: 'No location data'
      })
    }
    
    return NextResponse.json({
      success: true,
      location: {
        lat: rows[0].lat,
        lng: rows[0].lng,
        updated_at: rows[0].updated_at
      }
    })
    
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to get location' },
      { status: 500 }
    )
  }
}
