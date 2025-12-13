import { NextRequest, NextResponse } from 'next/server'
import { executeQuery } from '@/lib/db-retry'
import { requireAdmin } from '@/lib/auth-simple'

export const POST = requireAdmin(async (request: NextRequest, _adminUser: any) => {
  try {
    const { userId, name, phone, email } = await request.json()

    if (!userId) {
      return NextResponse.json({ success: false, error: 'ID de usuario requerido' }, { status: 400 })
    }

    const users = await executeQuery('SELECT id, username FROM users WHERE id = ?', [userId]) as any[]
    if (users.length === 0) {
      return NextResponse.json({ success: false, error: 'Usuario no encontrado' }, { status: 404 })
    }

    await executeQuery('UPDATE users SET is_driver = 1 WHERE id = ?', [userId])

    try {
      await executeQuery(
        `INSERT INTO delivery_drivers (user_id, name, phone, email, is_available, created_at)
         VALUES (?, ?, ?, ?, 1, NOW())
         ON DUPLICATE KEY UPDATE name = VALUES(name), phone = VALUES(phone), email = VALUES(email), updated_at = NOW()` ,
        [userId, name || users[0].username, phone || null, email || null]
      )
    } catch (driverError: any) {
      if (driverError?.code !== 'ER_NO_SUCH_TABLE') {
        console.warn('No se pudo registrar información adicional del repartidor:', driverError)
      }
    }

    return NextResponse.json({ 
      success: true,
      message: 'Usuario convertido a driver exitosamente',
      user: users[0]
    })
  } catch (error: any) {
    console.error('Error creating driver:', error)
    return NextResponse.json(
      { success: false, error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
})