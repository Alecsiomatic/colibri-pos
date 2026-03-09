import { NextRequest, NextResponse } from 'next/server'
import { executeQuery } from '@/lib/mysql-db'

export const dynamic = 'force-dynamic'

// GET /api/reports/staff-performance - Métricas por mesero/cajero
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const startDate = searchParams.get('start_date')
    const endDate = searchParams.get('end_date')

    let dateFilter = ''
    const params: any[] = []

    if (startDate) {
      dateFilter += ` AND DATE(o.created_at) >= ?`
      params.push(startDate)
    }
    if (endDate) {
      dateFilter += ` AND DATE(o.created_at) <= ?`
      params.push(endDate)
    }

    // Sales per staff member (from orders with waiter info)
    const staffSales = await executeQuery(`
      SELECT 
        COALESCE(o.customer_name, 'Sin asignar') as staff_name,
        COUNT(DISTINCT o.id) as total_orders,
        COALESCE(SUM(o.total), 0) as total_sales,
        COALESCE(AVG(o.total), 0) as avg_ticket,
        MAX(o.total) as max_ticket,
        COUNT(DISTINCT o.\`table\`) as tables_served,
        COUNT(DISTINCT DATE(o.created_at)) as days_worked
      FROM orders o
      WHERE o.status IN ('confirmed', 'completed', 'paid')
        AND o.waiter_order = 1
        ${dateFilter}
      GROUP BY o.customer_name
      ORDER BY total_sales DESC
    `, params) as any[]

    // Tips per staff from payments
    let staffTips: any[] = []
    try {
      const tipsParams: any[] = []
      let tipsDateFilter = ''
      if (startDate) {
        tipsDateFilter += ` AND DATE(p.payment_date) >= ?`
        tipsParams.push(startDate)
      }
      if (endDate) {
        tipsDateFilter += ` AND DATE(p.payment_date) <= ?`
        tipsParams.push(endDate)
      }

      staffTips = await executeQuery(`
        SELECT 
          COALESCE(p.waiter_name, 'Sin asignar') as staff_name,
          COALESCE(SUM(p.tip), 0) as total_tips,
          COUNT(CASE WHEN p.tip > 0 THEN 1 END) as tips_count
        FROM payments p
        WHERE 1=1 ${tipsDateFilter}
        GROUP BY p.waiter_name
        HAVING total_tips > 0
      `, tipsParams) as any[]
    } catch (e) {
      // tip/waiter_name columns may not exist yet
    }

    // Shift performance per user
    const shiftParams: any[] = []
    let shiftDateFilter = ''
    if (startDate) {
      shiftDateFilter += ` AND DATE(cs.opened_at) >= ?`
      shiftParams.push(startDate)
    }
    if (endDate) {
      shiftDateFilter += ` AND DATE(cs.closed_at) <= ?`
      shiftParams.push(endDate)
    }

    const shiftPerformance = await executeQuery(`
      SELECT 
        cs.user_name as staff_name,
        COUNT(*) as total_shifts,
        COALESCE(SUM(cs.total_sales), 0) as total_sales,
        COALESCE(AVG(cs.total_sales), 0) as avg_shift_sales,
        COALESCE(SUM(cs.total_orders), 0) as total_orders,
        COALESCE(SUM(cs.total_tips), 0) as total_tips,
        COALESCE(SUM(cs.cash_difference), 0) as total_difference,
        COUNT(CASE WHEN cs.cash_difference < -10 THEN 1 END) as shortage_count
      FROM cash_shifts cs
      WHERE cs.status = 'closed' ${shiftDateFilter}
      GROUP BY cs.user_name
      ORDER BY total_sales DESC
    `, shiftParams) as any[]

    return NextResponse.json({
      success: true,
      staffSales,
      staffTips,
      shiftPerformance
    })

  } catch (error: any) {
    console.error('Error fetching staff performance:', error)
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}
