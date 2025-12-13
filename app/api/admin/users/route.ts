import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { executeQuery } from '@/lib/db-retry'
import { requireAdmin } from '@/lib/auth-simple'

export const GET = requireAdmin(async (_request: NextRequest) => {
  try {
    console.log('[Users API] Starting fetch...')
    
    // Get all users first
    const users = await executeQuery(
      `SELECT 
        id,
        username,
        email,
        full_name,
        phone,
        is_admin,
        is_driver,
        is_waiter,
        active,
        created_at,
        last_login
      FROM users
      ORDER BY created_at DESC`
    ) as any[]

    console.log('[Users API] Fetched users:', users.length)

    // Get order counts separately to avoid GROUP BY issues
    const orderCounts = await executeQuery(
      `SELECT user_id, COUNT(*) as count
       FROM orders
       GROUP BY user_id`
    ) as any[]

    console.log('[Users API] Fetched order counts:', orderCounts.length)

    const orderCountMap = new Map(orderCounts.map(oc => [oc.user_id, Number(oc.count)]))

    const normalized = users.map((user) => ({
      ...user,
      is_admin: Boolean(user.is_admin),
      is_driver: Boolean(user.is_driver),
      is_waiter: Boolean(user.is_waiter),
      active: Boolean(user.active),
      orders_count: orderCountMap.get(user.id) || 0
    }))

    console.log('[Users API] Returning users:', normalized.length)
    return NextResponse.json({ success: true, users: normalized })
  } catch (error: any) {
    console.error('[Users API] ERROR:', error)
    console.error('[Users API] Error message:', error.message)
    console.error('[Users API] Error stack:', error.stack)
    return NextResponse.json(
      { success: false, error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
})

export const POST = requireAdmin(async (request: NextRequest) => {
  try {
    const body = await request.json()
    const { username, email, password, full_name, phone, is_admin, is_driver } = body

    if (!username || !email || !password) {
      return NextResponse.json({ success: false, error: 'Faltan campos requeridos' }, { status: 400 })
    }

    const existing = await executeQuery(
      'SELECT id FROM users WHERE username = ? OR email = ? LIMIT 1',
      [username, email]
    ) as any[]

    if (existing.length > 0) {
      return NextResponse.json({ success: false, error: 'El usuario o email ya existe' }, { status: 400 })
    }

    const hashedPassword = await bcrypt.hash(password, 12)

    const result = await executeQuery(
      `INSERT INTO users (username, email, password, full_name, phone, is_admin, is_driver, active, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, 1, NOW())`,
      [username, email, hashedPassword, full_name || null, phone || null, Boolean(is_admin), Boolean(is_driver)]
    ) as any

    return NextResponse.json({ 
      success: true,
      message: 'Usuario creado exitosamente',
      userId: result.insertId 
    })
  } catch (error: any) {
    console.error('Error al crear usuario:', error)
    return NextResponse.json(
      { success: false, error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
})