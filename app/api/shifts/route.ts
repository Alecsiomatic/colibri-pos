import { NextRequest, NextResponse } from 'next/server'
import { executeQuery } from '@/lib/mysql-db'

// GET /api/shifts - Obtener turnos
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const status = searchParams.get('status')
    const userId = searchParams.get('user_id')

    let sql = `
      SELECT 
        cs.*,
        u.username,
        u.email
      FROM cash_shifts cs
      LEFT JOIN users u ON cs.user_id = u.id
      WHERE 1=1
    `
    const params: any[] = []

    if (status) {
      sql += ` AND cs.status = ?`
      params.push(status)
    }

    if (userId) {
      sql += ` AND cs.user_id = ?`
      params.push(userId)
    }

    sql += ` ORDER BY cs.opened_at DESC LIMIT 100`

    const shifts = await executeQuery(sql, params)

    return NextResponse.json({
      success: true,
      shifts
    })

  } catch (error: any) {
    console.error('Error fetching shifts:', error)
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}

// POST /api/shifts - Abrir nuevo turno (solo admin)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { user_id, user_name, shift_type, opening_cash } = body

    if (!user_id || !user_name) {
      return NextResponse.json({
        success: false,
        error: 'Datos de usuario requeridos'
      }, { status: 400 })
    }

    // Verificar que el usuario existe
    const users = await executeQuery(
      `SELECT id, username, is_admin FROM users WHERE id = ?`,
      [user_id]
    ) as any[]

    if (!users || users.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'Usuario no encontrado'
      }, { status: 404 })
    }

    // Verificar si ya hay un turno abierto para este usuario
    const existingShift = await executeQuery(
      `SELECT id FROM cash_shifts WHERE user_id = ? AND status = 'open'`,
      [user_id]
    ) as any[]

    if (existingShift.length > 0) {
      return NextResponse.json({
        success: false,
        error: 'Ya tienes un turno abierto. Ciérralo antes de abrir uno nuevo.'
      }, { status: 400 })
    }

    // Verificar si hay otro turno abierto (solo un turno activo a la vez)
    const anyOpenShift = await executeQuery(
      `SELECT id, user_name FROM cash_shifts WHERE status = 'open' LIMIT 1`,
      []
    ) as any[]

    if (anyOpenShift.length > 0) {
      return NextResponse.json({
        success: false,
        error: `Ya hay un turno abierto por ${anyOpenShift[0].user_name}. Debe cerrarse primero.`
      }, { status: 400 })
    }

    const result = await executeQuery(
      `INSERT INTO cash_shifts 
       (user_id, user_name, shift_type, opening_cash, status) 
       VALUES (?, ?, ?, ?, 'open')`,
      [user_id, user_name, shift_type || 'morning', opening_cash || 0]
    ) as any

    return NextResponse.json({
      success: true,
      shift_id: result.insertId,
      message: 'Turno abierto exitosamente'
    })

  } catch (error: any) {
    console.error('Error opening shift:', error)
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}
