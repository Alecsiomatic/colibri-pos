import { NextRequest, NextResponse } from 'next/server'
import { executeQuery } from '@/lib/mysql-db'

// GET /api/reports/sales - Obtener reporte de ventas
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const startDate = searchParams.get('start_date')
    const endDate = searchParams.get('end_date')
    const groupBy = searchParams.get('group_by') || 'day' // day, week, month

    let dateFormat = '%Y-%m-%d'
    if (groupBy === 'week') dateFormat = '%Y-%u'
    if (groupBy === 'month') dateFormat = '%Y-%m'

    let sql = `
      SELECT 
        DATE_FORMAT(o.created_at, ?) as period,
        COUNT(DISTINCT o.id) as total_orders,
        SUM(o.total) as total_sales,
        SUM(CASE WHEN o.payment_method IN ('cash', 'efectivo') THEN o.total ELSE 0 END) as cash_sales,
        SUM(CASE WHEN o.payment_method IN ('card', 'tarjeta') THEN o.total ELSE 0 END) as card_sales,
        SUM(CASE WHEN o.order_source = 'kiosk' OR o.order_source = 'kiosko' THEN o.total ELSE 0 END) as kiosk_sales,
        SUM(CASE WHEN o.order_source IN ('online', 'menu', 'web') THEN o.total ELSE 0 END) as online_sales,
        SUM(CASE WHEN o.waiter_order = 1 THEN o.total ELSE 0 END) as dine_in_sales,
        AVG(o.total) as average_ticket
      FROM orders o
      WHERE o.status IN ('confirmed', 'completed', 'paid')
    `
    const params: any[] = [dateFormat]

    if (startDate) {
      sql += ` AND DATE(o.created_at) >= ?`
      params.push(startDate)
    }

    if (endDate) {
      sql += ` AND DATE(o.created_at) <= ?`
      params.push(endDate)
    }

    sql += ` GROUP BY period ORDER BY period DESC`

    const salesData = await executeQuery(sql, params)

    // Productos más vendidos
    const topProductsSql = `
      SELECT 
        p.id,
        p.name,
        p.category_id,
        c.name as category_name,
        COUNT(*) as times_sold,
        SUM(JSON_EXTRACT(o.items, CONCAT('$[', idx.idx, '].quantity'))) as total_quantity,
        SUM(JSON_EXTRACT(o.items, CONCAT('$[', idx.idx, '].price')) * 
            JSON_EXTRACT(o.items, CONCAT('$[', idx.idx, '].quantity'))) as total_revenue
      FROM orders o
      CROSS JOIN (
        SELECT 0 as idx UNION SELECT 1 UNION SELECT 2 UNION SELECT 3 UNION SELECT 4 
        UNION SELECT 5 UNION SELECT 6 UNION SELECT 7 UNION SELECT 8 UNION SELECT 9
      ) idx
      JOIN products p ON p.id = JSON_EXTRACT(o.items, CONCAT('$[', idx.idx, '].id'))
      LEFT JOIN categories c ON p.category_id = c.id
      WHERE o.status IN ('confirmed', 'completed', 'paid')
        ${startDate ? 'AND DATE(o.created_at) >= ?' : ''}
        ${endDate ? 'AND DATE(o.created_at) <= ?' : ''}
      GROUP BY p.id, p.name, p.category_id, c.name
      ORDER BY total_revenue DESC
      LIMIT 10
    `
    
    const topProductsParams: any[] = []
    if (startDate) topProductsParams.push(startDate)
    if (endDate) topProductsParams.push(endDate)

    const topProducts = await executeQuery(topProductsSql, topProductsParams)

    return NextResponse.json({
      success: true,
      sales_by_period: salesData,
      top_products: topProducts
    })

  } catch (error: any) {
    console.error('Error fetching sales report:', error)
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}
