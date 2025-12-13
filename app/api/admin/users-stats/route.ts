import { NextRequest, NextResponse } from 'next/server'
import mysql from 'mysql2/promise'

const dbConfig = {
  host: 'srv440.hstgr.io',
  user: 'u191251575_manu',
  password: 'Cerounocero.com20182417',
  database: 'u191251575_manu'
}

export async function GET(request: NextRequest) {
  try {
    const connection = await mysql.createConnection(dbConfig)

    // Contar total de usuarios
    const [result] = await connection.execute(
      'SELECT COUNT(*) as total FROM users'
    )

    await connection.end()

    const total = (result as any[])[0]?.total || 0

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
