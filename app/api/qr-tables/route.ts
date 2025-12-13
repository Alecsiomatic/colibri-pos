import { NextRequest, NextResponse } from 'next/server'
import { executeQuery } from '@/lib/mysql-db'

// GET /api/qr-tables - Obtener todas las mesas con QR
export async function GET(request: NextRequest) {
  try {
    const tables = await executeQuery(
      `SELECT * FROM table_qr_codes 
       WHERE is_active = 1 
       ORDER BY table_number`,
      []
    )

    return NextResponse.json({
      success: true,
      tables
    })

  } catch (error: any) {
    console.error('Error fetching QR tables:', error)
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}

// POST /api/qr-tables - Crear nueva mesa con QR
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { table_number, table_name, max_capacity, location } = body

    // Generar token único
    const token = `qr_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

    const result = await executeQuery(
      `INSERT INTO table_qr_codes 
       (table_number, table_name, qr_token, max_capacity, location) 
       VALUES (?, ?, ?, ?, ?)`,
      [table_number, table_name, token, max_capacity || 4, location || 'Principal']
    ) as any

    return NextResponse.json({
      success: true,
      table_id: result.insertId,
      qr_token: token,
      message: 'Mesa creada exitosamente'
    })

  } catch (error: any) {
    console.error('Error creating QR table:', error)
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}
