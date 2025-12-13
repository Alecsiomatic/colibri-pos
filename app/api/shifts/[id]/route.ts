import { NextRequest, NextResponse } from 'next/server'
import { executeQuery } from '@/lib/mysql-db'

// GET /api/shifts/[id] - Obtener detalles de un turno
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const shiftId = parseInt(id)

    if (isNaN(shiftId)) {
      return NextResponse.json(
        { success: false, error: 'ID de turno inválido' },
        { status: 400 }
      )
    }

    // Obtener información del turno
    const shifts = await executeQuery(
      `SELECT cs.*, u.username, u.email 
       FROM cash_shifts cs
       LEFT JOIN users u ON cs.user_id = u.id
       WHERE cs.id = ?`,
      [shiftId]
    ) as any[]

    if (!shifts || shifts.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Turno no encontrado' },
        { status: 404 }
      )
    }

    const shift = shifts[0]

    // Obtener estadísticas de ventas
    const statsQuery = `
      SELECT 
        COUNT(DISTINCT o.id) as total_orders,
        COALESCE(SUM(o.total), 0) as total_sales,
        COALESCE(SUM(CASE WHEN o.payment_method = 'cash' OR o.payment_method = 'efectivo' THEN o.total ELSE 0 END), 0) as cash_sales,
        COALESCE(SUM(CASE WHEN o.payment_method = 'card' OR o.payment_method = 'tarjeta' THEN o.total ELSE 0 END), 0) as card_sales,
        COUNT(DISTINCT CASE WHEN o.payment_method = 'cash' OR o.payment_method = 'efectivo' THEN o.id END) as cash_orders,
        COUNT(DISTINCT CASE WHEN o.payment_method = 'card' OR o.payment_method = 'tarjeta' THEN o.id END) as card_orders
      FROM orders o
      WHERE o.shift_id = ? 
        AND o.status IN ('confirmed', 'completed', 'paid')
    `

    const stats = await executeQuery(statsQuery, [shiftId]) as any[]
    const statsData = stats && stats.length > 0 ? stats[0] : {
      total_orders: 0,
      total_sales: 0,
      cash_sales: 0,
      card_sales: 0,
      cash_orders: 0,
      card_orders: 0
    }

    // Obtener transacciones de entrada/salida
    const transactions = await executeQuery(
      `SELECT * FROM cash_transactions 
       WHERE shift_id = ? AND transaction_type IN ('cash_in', 'cash_out')
       ORDER BY created_at DESC`,
      [shiftId]
    ) as any[]

    const cashIn = transactions
      .filter((t: any) => t.transaction_type === 'cash_in')
      .reduce((sum, t) => sum + parseFloat(t.amount || 0), 0)

    const cashOut = transactions
      .filter((t: any) => t.transaction_type === 'cash_out')
      .reduce((sum, t) => sum + parseFloat(t.amount || 0), 0)

    return NextResponse.json({
      success: true,
      shift: {
        ...shift,
        ...statsData,
        cash_in: cashIn,
        cash_out: cashOut,
        transactions: transactions
      }
    })

  } catch (error: any) {
    console.error('Error fetching shift details:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Error al obtener detalles del turno' },
      { status: 500 }
    )
  }
}

// PATCH /api/shifts/[id] - Cerrar turno
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const shiftId = parseInt(id)
    const body = await request.json()
    const { closing_cash, notes } = body

    if (isNaN(shiftId)) {
      return NextResponse.json(
        { success: false, error: 'ID de turno inválido' },
        { status: 400 }
      )
    }

    // Verificar que el turno existe y está abierto
    const shifts = await executeQuery(
      `SELECT * FROM cash_shifts WHERE id = ? AND status = 'open'`,
      [shiftId]
    ) as any[]

    if (!shifts || shifts.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Turno no encontrado o ya cerrado' },
        { status: 404 }
      )
    }

    const shift = shifts[0]

    // Obtener estadísticas finales
    const statsQuery = `
      SELECT 
        COALESCE(SUM(CASE WHEN o.payment_method = 'cash' OR o.payment_method = 'efectivo' THEN o.total ELSE 0 END), 0) as cash_sales,
        COALESCE(SUM(CASE WHEN o.payment_method = 'card' OR o.payment_method = 'tarjeta' THEN o.total ELSE 0 END), 0) as card_sales,
        COALESCE(SUM(o.total), 0) as total_sales,
        COUNT(DISTINCT o.id) as total_orders
      FROM orders o
      WHERE o.shift_id = ? AND o.status IN ('confirmed', 'completed', 'paid')
    `

    const stats = await executeQuery(statsQuery, [shiftId]) as any[]
    const { cash_sales = 0, card_sales = 0, total_sales = 0, total_orders = 0 } = stats[0] || {}

    // Obtener entradas y salidas
    const transactions = await executeQuery(
      `SELECT * FROM cash_transactions 
       WHERE shift_id = ? AND transaction_type IN ('cash_in', 'cash_out')`,
      [shiftId]
    ) as any[]

    const cashIn = transactions
      .filter((t: any) => t.transaction_type === 'cash_in')
      .reduce((sum, t) => sum + parseFloat(t.amount || 0), 0)

    const cashOut = transactions
      .filter((t: any) => t.transaction_type === 'cash_out')
      .reduce((sum, t) => sum + parseFloat(t.amount || 0), 0)

    const expectedCash = parseFloat(shift.opening_cash || 0) + parseFloat(cash_sales || 0) + cashIn - cashOut
    const actualCash = parseFloat(closing_cash || 0)
    const difference = actualCash - expectedCash

    // Cerrar turno
    await executeQuery(
      `UPDATE cash_shifts 
       SET status = 'closed',
           closing_cash = ?,
           expected_cash = ?,
           cash_difference = ?,
           total_sales = ?,
           cash_sales = ?,
           card_sales = ?,
           mercadopago_sales = 0,
           total_orders = ?,
           closed_at = NOW(),
           notes = ?
       WHERE id = ?`,
      [actualCash, expectedCash, difference, total_sales, cash_sales, card_sales, total_orders, notes || null, shiftId]
    )

    return NextResponse.json({
      success: true,
      message: 'Turno cerrado exitosamente',
      closure: {
        expected_cash: expectedCash,
        actual_cash: actualCash,
        difference: difference,
        cash_in: cashIn,
        cash_out: cashOut,
        total_sales: parseFloat(total_sales || 0),
        total_orders: parseInt(total_orders || 0)
      }
    })

  } catch (error: any) {
    console.error('Error closing shift:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Error al cerrar turno' },
      { status: 500 }
    )
  }
}
