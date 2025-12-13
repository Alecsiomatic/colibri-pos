import { NextRequest, NextResponse } from 'next/server'
import { getPool } from '@/lib/mysql-db'
import { format, startOfDay, endOfDay } from 'date-fns'

export async function GET(request: NextRequest) {
  let conn
  try {
    const { searchParams } = new URL(request.url)
    const startDateParam = searchParams.get('startDate')
    const endDateParam = searchParams.get('endDate')
    
    if (!startDateParam || !endDateParam) {
      return NextResponse.json({ error: 'Fechas de inicio y fin requeridas' }, { status: 400 })
    }

    const startDate = startOfDay(new Date(startDateParam))
    const endDate = endOfDay(new Date(endDateParam))
    
    const pool = getPool()
    conn = await pool.getConnection()

    // Total de ventas y pedidos - SIN FILTROS RESTRICTIVOS
    const [salesResult] = await conn.execute(
      'SELECT COUNT(*) as total_orders, SUM(total) as total_sales FROM orders WHERE created_at >= ? AND created_at <= ?',
      [startDate.toISOString().slice(0, 19).replace('T', ' '), endDate.toISOString().slice(0, 19).replace('T', ' ')]
    ) as any[]

    // Ventas por día - INCLUIR TODAS LAS ÓRDENES
    const [dailyResult] = await conn.execute(`
      SELECT 
        DATE(created_at) as date,
        COUNT(*) as orders,
        SUM(total) as total_sales
      FROM orders 
      WHERE created_at >= ? AND created_at <= ?
      GROUP BY DATE(created_at)
      ORDER BY date ASC
    `, [startDate.toISOString().slice(0, 19).replace('T', ' '), endDate.toISOString().slice(0, 19).replace('T', ' ')])

    // Ventas por mesa
    const [tableResult] = await conn.execute(`
      SELECT 
        COALESCE(\`table\`, 'Mesa Sin Número') as table_name,
        COUNT(*) as orders_count,
        SUM(total) as table_sales,
        AVG(total) as avg_ticket
      FROM orders 
      WHERE created_at >= ? AND created_at <= ? AND waiter_order = 1 AND \`table\` IS NOT NULL
      GROUP BY \`table\`
      ORDER BY table_sales DESC
    `, [startDate.toISOString().slice(0, 19).replace('T', ' '), endDate.toISOString().slice(0, 19).replace('T', ' ')])

    // Ventas por mesero
    const [waiterResult] = await conn.execute(`
      SELECT 
        u.username as waiter_name,
        COUNT(o.id) as orders_served,
        SUM(o.total) as waiter_sales,
        AVG(o.total) as avg_ticket
      FROM orders o
      JOIN users u ON o.user_id = u.id
      WHERE o.created_at >= ? AND o.created_at <= ? AND o.waiter_order = 1
      GROUP BY o.user_id, u.username
      ORDER BY waiter_sales DESC
    `, [startDate.toISOString().slice(0, 19).replace('T', ' '), endDate.toISOString().slice(0, 19).replace('T', ' ')])

    // Productos más vendidos - INCLUIR TODAS LAS ÓRDENES
    const [ordersWithItems] = await conn.execute(`
      SELECT items FROM orders 
      WHERE created_at >= ? AND created_at <= ? AND items IS NOT NULL AND items != ''
    `, [startDate.toISOString().slice(0, 19).replace('T', ' '), endDate.toISOString().slice(0, 19).replace('T', ' ')])

    const productStats = new Map()
    for (const order of ordersWithItems as any[]) {
      try {
        const items = JSON.parse(order.items)
        for (const item of items) {
          const key = item.name
          if (productStats.has(key)) {
            const existing = productStats.get(key)
            productStats.set(key, {
              name: item.name,
              quantity: existing.quantity + item.quantity,
              sales: existing.sales + (item.quantity * parseFloat(item.price))
            })
          } else {
            productStats.set(key, {
              name: item.name,
              quantity: item.quantity,
              sales: item.quantity * parseFloat(item.price)
            })
          }
        }
      } catch (e) {
        console.log('Error parsing items JSON:', e)
      }
    }

    const productsResult = Array.from(productStats.values())
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 10)

    // Métodos de pago
    const [paymentResult] = await conn.execute(`
      SELECT 
        payment_method as method,
        COUNT(*) as count,
        SUM(total) as sales
      FROM orders 
      WHERE created_at >= ? AND created_at <= ? AND status IN ("completed", "delivered", "pendiente")
      GROUP BY payment_method
      ORDER BY sales DESC
    `, [startDate.toISOString().slice(0, 19).replace('T', ' '), endDate.toISOString().slice(0, 19).replace('T', ' ')])

    const totalOrders = salesResult[0]?.total_orders || 0
    const totalSales = salesResult[0]?.total_sales || 0
    const averageTicket = totalOrders > 0 ? totalSales / totalOrders : 0

    const reportData = {
      totalSales: parseFloat(totalSales?.toString() || '0'),
      totalOrders: parseInt(totalOrders?.toString() || '0'),
      averageTicket: parseFloat(averageTicket.toFixed(2)),
      topProducts: productsResult,
      dailySales: dailyResult,
      salesByTable: tableResult,
      salesByWaiter: waiterResult,
      paymentMethods: paymentResult,
      dateRange: {
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString()
      }
    }

    return NextResponse.json(reportData)
    
  } catch (error) {
    console.error('Error generating reports by date:', error)
    return NextResponse.json(
      { 
        error: 'Error al generar reportes por fecha',
        message: error instanceof Error ? error.message : 'Error desconocido'
      },
      { status: 500 }
    )
  } finally {
    if (conn) {
      conn.release()
    }
  }
}