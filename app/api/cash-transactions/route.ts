import { NextRequest, NextResponse } from 'next/server'
import { executeQuery } from '@/lib/mysql-db'

// GET /api/cash-transactions - Obtener transacciones
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const shiftId = searchParams.get('shift_id')
    const type = searchParams.get('type')

    let sql = `
      SELECT 
        ct.*,
        o.customer_name,
        o.table
      FROM cash_transactions ct
      LEFT JOIN orders o ON ct.order_id = o.id
      WHERE 1=1
    `
    const params: any[] = []

    if (shiftId) {
      sql += ` AND ct.shift_id = ?`
      params.push(shiftId)
    }

    if (type) {
      sql += ` AND ct.transaction_type = ?`
      params.push(type)
    }

    sql += ` ORDER BY ct.created_at DESC LIMIT 500`

    const transactions = await executeQuery(sql, params)

    return NextResponse.json({
      success: true,
      transactions
    })

  } catch (error: any) {
    console.error('Error fetching transactions:', error)
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}

// POST /api/cash-transactions - Registrar transacción (entrada/salida de efectivo)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { 
      shift_id, 
      transaction_type, // 'cash_in' o 'cash_out'
      amount, 
      payment_method = 'efectivo',
      notes 
    } = body

    if (!shift_id || !transaction_type || !amount) {
      return NextResponse.json(
        { success: false, error: 'Faltan datos requeridos' },
        { status: 400 }
      )
    }

    // Validar que el turno existe y está abierto
    const shifts = await executeQuery(
      `SELECT id FROM cash_shifts WHERE id = ? AND status = 'open'`,
      [shift_id]
    ) as any[]

    if (shifts.length === 0) {
      return NextResponse.json(
        { success: false, error: 'El turno no existe o ya está cerrado' },
        { status: 400 }
      )
    }

    // Insertar transacción
    const result = await executeQuery(
      `INSERT INTO cash_transactions 
       (shift_id, transaction_type, amount, payment_method, notes) 
       VALUES (?, ?, ?, ?, ?)`,
      [shift_id, transaction_type, parseFloat(amount), payment_method, notes || null]
    ) as any

    return NextResponse.json({
      success: true,
      transaction_id: result.insertId,
      message: 'Transacción registrada exitosamente'
    })

  } catch (error: any) {
    console.error('Error creating transaction:', error)
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}
