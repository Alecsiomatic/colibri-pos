import { NextRequest, NextResponse } from 'next/server'
import { getRestaurantConfig } from '@/lib/maps-free'
import { getPool } from '@/lib/mysql-db'
import jwt from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET || 'supernova-restaurante-jwt-secret-2024'

export async function GET() {
  try {
    const config = await getRestaurantConfig()
    
    if (!config) {
      return NextResponse.json(
        { error: 'Restaurant configuration not found' },
        { status: 404 }
      )
    }
    
    return NextResponse.json({
      success: true,
      config
    })
    
  } catch (error: any) {
    console.error('❌ Error fetching restaurant config:', error)
    
    return NextResponse.json(
      { error: 'Failed to fetch restaurant configuration' },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    const token = request.cookies.get('auth-token')?.value
    
    if (!token) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }
    
    let decoded: any
    try {
      decoded = jwt.verify(token, JWT_SECRET)
    } catch (error) {
      return NextResponse.json(
        { error: 'Invalid token' },
        { status: 401 }
      )
    }
    
    if (!decoded.isAdmin) {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      )
    }
    
    const body = await request.json()
    const {
      name, address, latitude, longitude, phone, email,
      delivery_base_fee, delivery_per_km_fee, delivery_time_fee,
      delivery_free_threshold, delivery_radius_km
    } = body
    
    if (!name || !address) {
      return NextResponse.json(
        { error: 'Name and address are required' },
        { status: 400 }
      )
    }
    
    if (typeof latitude !== 'number' || typeof longitude !== 'number') {
      return NextResponse.json(
        { error: 'Valid latitude and longitude are required' },
        { status: 400 }
      )
    }
    
    const pool = getPool()
    
    const [existing] = await pool.execute<any[]>(
      'SELECT id FROM restaurant_config LIMIT 1'
    )
    
    if (existing.length === 0) {
      await pool.execute(
        `INSERT INTO restaurant_config (
          name, address, latitude, longitude, phone, email,
          delivery_base_fee, delivery_per_km_fee, delivery_time_fee,
          delivery_free_threshold, delivery_radius_km
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [name, address, latitude, longitude, phone, email,
         delivery_base_fee, delivery_per_km_fee, delivery_time_fee,
         delivery_free_threshold, delivery_radius_km]
      )
    } else {
      await pool.execute(
        `UPDATE restaurant_config SET
          name = ?, address = ?, latitude = ?, longitude = ?,
          phone = ?, email = ?,
          delivery_base_fee = ?, delivery_per_km_fee = ?, delivery_time_fee = ?,
          delivery_free_threshold = ?, delivery_radius_km = ?
        WHERE id = ?`,
        [name, address, latitude, longitude, phone, email,
         delivery_base_fee, delivery_per_km_fee, delivery_time_fee,
         delivery_free_threshold, delivery_radius_km,
         existing[0].id]
      )
    }
    
    const updatedConfig = await getRestaurantConfig()
    
    return NextResponse.json({
      success: true,
      message: 'Configuration updated successfully',
      config: updatedConfig
    })
    
  } catch (error: any) {
    console.error('❌ Error updating restaurant config:', error)
    
    return NextResponse.json(
      { error: 'Failed to update restaurant configuration' },
      { status: 500 }
    )
  }
}
