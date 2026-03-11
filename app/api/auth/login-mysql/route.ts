import { NextRequest, NextResponse } from 'next/server'
import { authenticateUser } from '@/lib/mysql-db'
import jwt from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET || 'manu-restaurant-secret-key-2025-secure'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, password } = body

    console.log('🔐 Intentando login para:', email)

    if (!email || !password) {
      return NextResponse.json(
        { success: false, error: 'Email y contraseña son requeridos' },
        { status: 400 }
      )
    }

    // Autenticar usuario
    const result = await authenticateUser(email, password)

    if (!result.success || !result.user) {
      console.log('❌ Autenticación fallida:', result.message)
      return NextResponse.json(
        { success: false, error: result.message || 'Error de autenticación' },
        { status: 401 }
      )
    }

    const user = result.user

    // Crear token JWT
    const token = jwt.sign(
      {
        id: user.id,
        email: user.email,
        username: user.username,
        is_admin: user.is_admin,
        is_driver: user.is_driver,
        is_waiter: user.is_waiter
      },
      JWT_SECRET,
      { expiresIn: '7d' }
    )

    console.log('✅ Login exitoso para:', email)
    console.log('🍪 Configurando cookie con token...')

    // Crear respuesta con cookie
    const response = NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        is_admin: user.is_admin,
        is_driver: user.is_driver,
        is_waiter: user.is_waiter
      }
    })

    // Configurar cookie del token
    response.cookies.set('auth-token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 7 días
      path: '/'
    })

    console.log('✅ Cookie auth-token configurada')
    console.log('🔑 Token generado correctamente')

    return response
  } catch (error) {
    console.error('❌ Error en login:', error)
    return NextResponse.json(
      { success: false, error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
