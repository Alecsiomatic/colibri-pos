import { NextRequest, NextResponse } from 'next/server'
import { executeQuery } from '@/lib/mysql-db'

// GET /api/reports/shifts - Obtener reportes de turnos
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const startDate = searchParams.get('start_date')
    const endDate = searchParams.get('end_date')
    const status = searchParams.get('status') || 'closed'
    const userId = searchParams.get('user_id')

    let sql = `
      SELECT 
        cs.*,
        u.username,
        u.email,
        (SELECT COUNT(*) FROM orders WHERE shift_id = cs.id AND status IN ('confirmed', 'completed', 'paid')) as order_count
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

    if (startDate) {
      sql += ` AND DATE(cs.opened_at) >= ?`
      params.push(startDate)
    }

    if (endDate) {
      sql += ` AND DATE(cs.closed_at) <= ?`
      params.push(endDate)
    }

    sql += ` ORDER BY cs.opened_at DESC`

    const shifts = await executeQuery(sql, params) as any[]

    // Calcular totales
    const totals = {
      total_shifts: shifts.length,
      total_sales: shifts.reduce((sum, s) => sum + parseFloat(s.total_sales || 0), 0),
      total_cash_sales: shifts.reduce((sum, s) => sum + parseFloat(s.cash_sales || 0), 0),
      total_card_sales: shifts.reduce((sum, s) => sum + parseFloat(s.card_sales || 0), 0),
      total_orders: shifts.reduce((sum, s) => sum + parseInt(s.order_count || 0), 0),
      total_differences: shifts.reduce((sum, s) => sum + parseFloat(s.cash_difference || 0), 0)
    }

    return NextResponse.json({
      success: true,
      shifts,
      totals
    })

  } catch (error: any) {
    console.error('Error fetching shift reports:', error)
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}
