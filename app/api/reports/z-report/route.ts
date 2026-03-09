import { NextRequest, NextResponse } from 'next/server'
import { executeQuery } from '@/lib/mysql-db'

export const dynamic = 'force-dynamic'

// GET /api/reports/z-report - Reporte Z (consolidado diario)
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const date = searchParams.get('date') || new Date().toISOString().split('T')[0]

    // Get all shifts for the day
    const shifts = await executeQuery(`
      SELECT 
        cs.*,
        u.username
      FROM cash_shifts cs
      LEFT JOIN users u ON cs.user_id = u.id
      WHERE DATE(cs.opened_at) = ? OR DATE(cs.closed_at) = ?
      ORDER BY cs.opened_at ASC
    `, [date, date]) as any[]

    // Get all orders for the day
    const orderStats = await executeQuery(`
      SELECT 
        COUNT(DISTINCT o.id) as total_orders,
        COALESCE(SUM(o.total), 0) as total_revenue,
        COALESCE(AVG(o.total), 0) as avg_ticket,
        COALESCE(SUM(CASE WHEN o.payment_method IN ('cash', 'efectivo') THEN o.total ELSE 0 END), 0) as cash_revenue,
        COALESCE(SUM(CASE WHEN o.payment_method IN ('card', 'tarjeta') THEN o.total ELSE 0 END), 0) as card_revenue,
        COUNT(DISTINCT CASE WHEN o.payment_method IN ('cash', 'efectivo') THEN o.id END) as cash_orders,
        COUNT(DISTINCT CASE WHEN o.payment_method IN ('card', 'tarjeta') THEN o.id END) as card_orders,
        COALESCE(SUM(CASE WHEN o.order_source IN ('kiosk', 'kiosko') AND o.waiter_order != 1 THEN o.total ELSE 0 END), 0) as kiosk_revenue,
        COALESCE(SUM(CASE WHEN o.waiter_order = 1 OR o.order_source IN ('mesa', 'mesas', 'mesero') THEN o.total ELSE 0 END), 0) as dine_in_revenue,
        COALESCE(SUM(CASE WHEN o.order_source IN ('online', 'menu', 'web') AND o.waiter_order != 1 THEN o.total ELSE 0 END), 0) as online_revenue,
        COUNT(DISTINCT CASE WHEN o.order_source IN ('kiosk', 'kiosko') AND o.waiter_order != 1 THEN o.id END) as kiosk_orders,
        COUNT(DISTINCT CASE WHEN o.waiter_order = 1 OR o.order_source IN ('mesa', 'mesas', 'mesero') THEN o.id END) as dine_in_orders,
        COUNT(DISTINCT CASE WHEN o.order_source IN ('online', 'menu', 'web') AND o.waiter_order != 1 THEN o.id END) as online_orders
      FROM orders o
      WHERE DATE(o.created_at) = ?
        AND o.status IN ('confirmed', 'completed', 'paid')
    `, [date]) as any[]

    // Get top products for the day
    const topProducts = await executeQuery(`
      SELECT 
        oi.product_name as name,
        SUM(oi.quantity) as quantity,
        SUM(oi.quantity * oi.unit_price) as revenue
      FROM order_items oi
      JOIN orders o ON oi.order_id = o.id
      WHERE DATE(o.created_at) = ?
        AND o.status IN ('confirmed', 'completed', 'paid')
      GROUP BY oi.product_name
      ORDER BY quantity DESC
      LIMIT 10
    `, [date]) as any[]

    // Get cash movements for the day
    const cashMovements = await executeQuery(`
      SELECT 
        ct.transaction_type,
        COALESCE(SUM(ct.amount), 0) as total_amount,
        COUNT(*) as count
      FROM cash_transactions ct
      WHERE DATE(ct.created_at) = ?
        AND ct.transaction_type IN ('cash_in', 'cash_out')
      GROUP BY ct.transaction_type
    `, [date]) as any[]

    let cashIn = 0, cashOut = 0
    cashMovements.forEach((m: any) => {
      if (m.transaction_type === 'cash_in') cashIn = parseFloat(m.total_amount)
      if (m.transaction_type === 'cash_out') cashOut = parseFloat(m.total_amount)
    })

    // Get tips for the day
    let totalTips = 0
    try {
      const tipsResult = await executeQuery(`
        SELECT COALESCE(SUM(p.tip), 0) as total_tips
        FROM payments p
        WHERE DATE(p.payment_date) = ?
      `, [date]) as any[]
      totalTips = parseFloat(tipsResult[0]?.total_tips || 0)
    } catch (e) { /* tip column may not exist */ }

    // Aggregate shift data
    const shiftSummary = {
      total_shifts: shifts.length,
      closed_shifts: shifts.filter((s: any) => s.status === 'closed').length,
      open_shifts: shifts.filter((s: any) => s.status === 'open').length,
      total_opening_cash: shifts.reduce((sum: number, s: any) => sum + parseFloat(s.opening_cash || 0), 0),
      total_closing_cash: shifts.filter((s: any) => s.status === 'closed').reduce((sum: number, s: any) => sum + parseFloat(s.closing_cash || 0), 0),
      total_expected_cash: shifts.filter((s: any) => s.status === 'closed').reduce((sum: number, s: any) => sum + parseFloat(s.expected_cash || 0), 0),
      total_difference: shifts.filter((s: any) => s.status === 'closed').reduce((sum: number, s: any) => sum + parseFloat(s.cash_difference || 0), 0),
      shifts: shifts.map((s: any) => ({
        id: s.id,
        user_name: s.user_name,
        shift_type: s.shift_type,
        status: s.status,
        opening_cash: parseFloat(s.opening_cash || 0),
        closing_cash: parseFloat(s.closing_cash || 0),
        expected_cash: parseFloat(s.expected_cash || 0),
        cash_difference: parseFloat(s.cash_difference || 0),
        total_sales: parseFloat(s.total_sales || 0),
        total_orders: parseInt(s.total_orders || 0),
        opened_at: s.opened_at,
        closed_at: s.closed_at
      }))
    }

    const stats = orderStats[0] || {}

    return NextResponse.json({
      success: true,
      date,
      summary: {
        total_orders: parseInt(stats.total_orders || 0),
        total_revenue: parseFloat(stats.total_revenue || 0),
        avg_ticket: parseFloat(stats.avg_ticket || 0),
        cash_revenue: parseFloat(stats.cash_revenue || 0),
        card_revenue: parseFloat(stats.card_revenue || 0),
        cash_orders: parseInt(stats.cash_orders || 0),
        card_orders: parseInt(stats.card_orders || 0),
        kiosk_revenue: parseFloat(stats.kiosk_revenue || 0),
        dine_in_revenue: parseFloat(stats.dine_in_revenue || 0),
        online_revenue: parseFloat(stats.online_revenue || 0),
        kiosk_orders: parseInt(stats.kiosk_orders || 0),
        dine_in_orders: parseInt(stats.dine_in_orders || 0),
        online_orders: parseInt(stats.online_orders || 0),
        cash_in: cashIn,
        cash_out: cashOut,
        total_tips: totalTips
      },
      shiftSummary,
      topProducts
    })

  } catch (error: any) {
    console.error('Error generating Z-report:', error)
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}
