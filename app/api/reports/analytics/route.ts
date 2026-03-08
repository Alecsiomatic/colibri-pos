import { NextRequest, NextResponse } from 'next/server'
import { executeQuery } from '@/lib/db-retry'

export const dynamic = 'force-dynamic'

// GET /api/reports/analytics — Dashboard analytics completo
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const days = parseInt(searchParams.get('days') || '30')

    // Ejecutar todas las queries en paralelo
    const [
      salesByDay,
      salesByHour,
      salesByDayOfWeek,
      salesByChannel,
      salesByPayment,
      topProducts,
      summary,
      recentOrders
    ] = await Promise.all([
      // 1. Ventas por día
      executeQuery(
        `SELECT 
          DATE(created_at) as date,
          COUNT(*) as orders,
          COALESCE(SUM(total), 0) as revenue,
          COALESCE(AVG(total), 0) as avg_ticket
        FROM orders 
        WHERE status IN ('confirmed','completed','paid','ready')
          AND created_at >= DATE_SUB(CURDATE(), INTERVAL ? DAY)
        GROUP BY DATE(created_at)
        ORDER BY date ASC`,
        [days]
      ),

      // 2. Ventas por hora del día
      executeQuery(
        `SELECT 
          HOUR(created_at) as hour,
          COUNT(*) as orders,
          COALESCE(SUM(total), 0) as revenue
        FROM orders 
        WHERE status IN ('confirmed','completed','paid','ready')
          AND created_at >= DATE_SUB(CURDATE(), INTERVAL ? DAY)
        GROUP BY HOUR(created_at)
        ORDER BY hour ASC`,
        [days]
      ),

      // 3. Ventas por día de la semana
      executeQuery(
        `SELECT 
          DAYOFWEEK(created_at) as day_num,
          DAYNAME(created_at) as day_name,
          COUNT(*) as orders,
          COALESCE(SUM(total), 0) as revenue,
          COALESCE(AVG(total), 0) as avg_ticket
        FROM orders 
        WHERE status IN ('confirmed','completed','paid','ready')
          AND created_at >= DATE_SUB(CURDATE(), INTERVAL ? DAY)
        GROUP BY DAYOFWEEK(created_at), DAYNAME(created_at)
        ORDER BY day_num ASC`,
        [days]
      ),

      // 4. Ventas por canal
      executeQuery(
        `SELECT 
          CASE 
            WHEN waiter_order = 1 THEN 'Mesa'
            WHEN order_source = 'kiosk' OR order_source = 'kiosko' THEN 'Kiosko'
            WHEN delivery_type = 'delivery' THEN 'Delivery'
            ELSE 'Online/Caja'
          END as channel,
          COUNT(*) as orders,
          COALESCE(SUM(total), 0) as revenue
        FROM orders 
        WHERE status IN ('confirmed','completed','paid','ready')
          AND created_at >= DATE_SUB(CURDATE(), INTERVAL ? DAY)
        GROUP BY channel
        ORDER BY revenue DESC`,
        [days]
      ),

      // 5. Ventas por método de pago
      executeQuery(
        `SELECT 
          CASE 
            WHEN payment_method IN ('cash','efectivo') THEN 'Efectivo'
            WHEN payment_method IN ('card','tarjeta') THEN 'Tarjeta'
            WHEN payment_method = 'mercadopago' THEN 'MercadoPago'
            ELSE COALESCE(payment_method, 'Otro')
          END as method,
          COUNT(*) as orders,
          COALESCE(SUM(total), 0) as revenue
        FROM orders 
        WHERE status IN ('confirmed','completed','paid','ready')
          AND created_at >= DATE_SUB(CURDATE(), INTERVAL ? DAY)
        GROUP BY method
        ORDER BY revenue DESC`,
        [days]
      ),

      // 6. Top 15 productos
      executeQuery(
        `SELECT 
          JSON_UNQUOTE(JSON_EXTRACT(o.items, CONCAT('$[', idx.idx, '].name'))) as product_name,
          SUM(CAST(JSON_EXTRACT(o.items, CONCAT('$[', idx.idx, '].quantity')) AS UNSIGNED)) as quantity,
          SUM(
            CAST(JSON_EXTRACT(o.items, CONCAT('$[', idx.idx, '].price')) AS DECIMAL(10,2)) * 
            CAST(JSON_EXTRACT(o.items, CONCAT('$[', idx.idx, '].quantity')) AS UNSIGNED)
          ) as revenue
        FROM orders o
        CROSS JOIN (
          SELECT 0 as idx UNION SELECT 1 UNION SELECT 2 UNION SELECT 3 UNION SELECT 4 
          UNION SELECT 5 UNION SELECT 6 UNION SELECT 7 UNION SELECT 8 UNION SELECT 9
        ) idx
        WHERE o.status IN ('confirmed','completed','paid','ready')
          AND o.created_at >= DATE_SUB(CURDATE(), INTERVAL ? DAY)
          AND JSON_EXTRACT(o.items, CONCAT('$[', idx.idx, '].name')) IS NOT NULL
        GROUP BY product_name
        ORDER BY revenue DESC
        LIMIT 15`,
        [days]
      ),

      // 7. Summary totals
      executeQuery(
        `SELECT 
          COUNT(*) as total_orders,
          COALESCE(SUM(total), 0) as total_revenue,
          COALESCE(AVG(total), 0) as avg_ticket,
          MAX(total) as max_ticket,
          COUNT(DISTINCT DATE(created_at)) as active_days
        FROM orders 
        WHERE status IN ('confirmed','completed','paid','ready')
          AND created_at >= DATE_SUB(CURDATE(), INTERVAL ? DAY)`,
        [days]
      ),

      // 8. Últimos 10 pedidos
      executeQuery(
        `SELECT id, total, status, order_source, payment_method, created_at
        FROM orders 
        WHERE status IN ('confirmed','completed','paid','ready')
        ORDER BY created_at DESC
        LIMIT 10`,
        []
      ),
    ])

    // Calcular periodo anterior para comparación
    const [prevSummary] = await Promise.all([
      executeQuery(
        `SELECT 
          COUNT(*) as total_orders,
          COALESCE(SUM(total), 0) as total_revenue,
          COALESCE(AVG(total), 0) as avg_ticket
        FROM orders 
        WHERE status IN ('confirmed','completed','paid','ready')
          AND created_at >= DATE_SUB(CURDATE(), INTERVAL ? DAY)
          AND created_at < DATE_SUB(CURDATE(), INTERVAL ? DAY)`,
        [days * 2, days]
      ),
    ])

    return NextResponse.json({
      success: true,
      period: { days },
      summary: (summary as any[])[0],
      prev_summary: (prevSummary as any[])[0],
      sales_by_day: salesByDay,
      sales_by_hour: salesByHour,
      sales_by_day_of_week: salesByDayOfWeek,
      sales_by_channel: salesByChannel,
      sales_by_payment: salesByPayment,
      top_products: topProducts,
      recent_orders: recentOrders,
    })
  } catch (error: any) {
    console.error('Error en analytics:', error)
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}
