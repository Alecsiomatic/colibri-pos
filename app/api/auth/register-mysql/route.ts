import { NextRequest, NextResponse } from 'next/server'
import { createUser } from '@/lib/mysql-db'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, email, password } = body

    console.log('📝 Intentando registrar usuario:', email)

    if (!email || !password) {
      return NextResponse.json(
        { success: false, error: 'Email y contraseña son requeridos' },
        { status: 400 }
      )
    }

    if (password.length < 6) {
      return NextResponse.json(
        { success: false, error: 'La contraseña debe tener al menos 6 caracteres' },
        { status: 400 }
      )
    }

    // Validar formato de email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { success: false, error: 'Email inválido' },
        { status: 400 }
      )
    }

    // Crear usuario
    const result = await createUser(email, password, name)

    if (!result.success) {
      console.log('❌ Registro fallido:', result.message)
      return NextResponse.json(
        { success: false, error: result.message },
        { status: 400 }
      )
    }

    console.log('✅ Usuario registrado exitosamente:', email)

    return NextResponse.json({
      success: true,
      message: 'Usuario registrado exitosamente'
    })
  } catch (error) {
    console.error('❌ Error en registro:', error)
    return NextResponse.json(
      { success: false, error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
