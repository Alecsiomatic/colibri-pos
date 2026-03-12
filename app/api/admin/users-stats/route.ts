import { NextRequest, NextResponse } from 'next/server'
import { executeQuery } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const result = await executeQuery<any>(
      'SELECT COUNT(*) as total FROM users'
    )

    const total = result[0]?.total || 0

    return NextResponse.json({
      success: true,
      total: total
    })

  } catch (error) {
    console.error('Error al obtener estadísticas de usuarios:', error)
    return NextResponse.json(
      { error: 'Error al cargar estadísticas' },
      { status: 500 }
    )
  }
}
