import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    console.log('🚪 Cerrando sesión...')

    // Crear respuesta
    const response = NextResponse.json({
      success: true,
      message: 'Sesión cerrada exitosamente'
    })

    // Eliminar cookie del token
    response.cookies.delete('auth-token')
    
    console.log('✅ Sesión cerrada')

    return response
  } catch (error) {
    console.error('❌ Error en logout:', error)
    return NextResponse.json(
      { success: false, error: 'Error al cerrar sesión' },
      { status: 500 }
    )
  }
}
