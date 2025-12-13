import { NextRequest, NextResponse } from 'next/server'
import mysql from 'mysql2/promise'
import { startOfDay, endOfDay } from 'date-fns'

// Crear pool de conexiones en lugar de conexión individual
const pool = mysql.createPool({
  host: process.env.MYSQL_HOST || process.env.DB_HOST || 'srv440.hstgr.io',
  user: process.env.MYSQL_USER || process.env.DB_USER || 'u191251575_manu',
  password: process.env.MYSQL_PASSWORD || process.env.DB_PASSWORD || 'Cerounocero.com20182417',
  database: process.env.MYSQL_DATABASE || process.env.DB_NAME || 'u191251575_manu',
  port: parseInt(process.env.MYSQL_PORT || process.env.DB_PORT || '3306'),
  charset: 'utf8mb4',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
})

export async function GET(request: NextRequest) {
  let conn
  try {
    const { searchParams } = new URL(request.url)
    const period = parseInt(searchParams.get('period') || '7')
    
    // Obtener conexión del pool
    conn = await pool.getConnection()
    
    // Calcular fecha de inicio
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - period)
    
    // Total de ventas y pedidos REAL de toda la BD - SIN FILTROS DE STATUS RESTRICTIVOS
    const [revenueResult] = await conn.execute(
      'SELECT COUNT(*) as total_orders, COALESCE(SUM(CAST(total AS DECIMAL(10,2))), 0) as total_sales FROM orders WHERE created_at >= ?',
      [startDate.toISOString().slice(0, 19).replace('T', ' ')]
    ) as any[]
    
    // Ventas por día (formato completo)
    const [dailyDetailResult] = await conn.execute(`
      SELECT 
        DATE(created_at) as date,
        COUNT(*) as orders_count,
        SUM(total) as daily_sales,
        AVG(total) as avg_ticket,
        MIN(total) as min_ticket,
        MAX(total) as max_ticket,
        SUM(CASE WHEN delivery_type = 'delivery' THEN 1 ELSE 0 END) as delivery_orders,
        SUM(CASE WHEN delivery_type = 'pickup' THEN 1 ELSE 0 END) as pickup_orders
      FROM orders 
      WHERE created_at >= ? 
      GROUP BY DATE(created_at)
      ORDER BY date DESC
    `, [startDate.toISOString().slice(0, 19).replace('T', ' ')])
    
    // Ventas por mesa (para órdenes waiter_order = 1)
    const [tableResult] = await conn.execute(`
      SELECT 
        COALESCE(\`table\`, 'Mesa Sin Número') as table_name,
        COUNT(*) as orders_count,
        SUM(total) as table_sales,
        AVG(total) as avg_ticket
      FROM orders 
      WHERE created_at >= ? AND waiter_order = 1 AND \`table\` IS NOT NULL
      GROUP BY \`table\`
      ORDER BY table_sales DESC
    `, [startDate.toISOString().slice(0, 19).replace('T', ' ')])
    
    // Ventas por mesero (usando user_id para identificar meseros)
    const [waiterResult] = await conn.execute(`
      SELECT 
        u.username as waiter_name,
        COUNT(o.id) as orders_served,
        SUM(o.total) as waiter_sales,
        AVG(o.total) as avg_ticket
      FROM orders o
      JOIN users u ON o.user_id = u.id
      WHERE o.created_at >= ? AND o.waiter_order = 1
      GROUP BY o.user_id, u.username
      ORDER BY waiter_sales DESC
    `, [startDate.toISOString().slice(0, 19).replace('T', ' ')])
    
    // Corte diario unificado (órdenes online + pagos de mesa)
    const today = new Date()
    const todayStart = startOfDay(today).toISOString().slice(0, 19).replace('T', ' ')
    const todayEnd = endOfDay(today).toISOString().slice(0, 19).replace('T', ' ')
    
    // Pagos de órdenes online (tabla orders)
    const [onlinePayments] = await conn.execute(`
      SELECT 
        COUNT(*) as online_orders,
        COALESCE(SUM(CAST(total AS DECIMAL(10,2))), 0) as online_sales,
        COALESCE(SUM(CASE WHEN payment_method = 'efectivo' THEN CAST(total AS DECIMAL(10,2)) ELSE 0 END), 0) as online_cash,
        COALESCE(SUM(CASE WHEN payment_method = 'tarjeta' THEN CAST(total AS DECIMAL(10,2)) ELSE 0 END), 0) as online_card,
        COALESCE(SUM(CASE WHEN payment_method = 'mercadopago' THEN CAST(total AS DECIMAL(10,2)) ELSE 0 END), 0) as online_mp
      FROM orders 
      WHERE created_at >= ? AND created_at <= ? AND waiter_order != 1
    `, [todayStart, todayEnd]) as any[]
    
    // Pagos de mesas (tabla payments)
    const [tablePayments] = await conn.execute(`
      SELECT 
        COUNT(*) as table_transactions,
        COALESCE(SUM(CAST(total_amount AS DECIMAL(10,2))), 0) as table_sales,
        COALESCE(SUM(CASE WHEN payment_method = 'efectivo' THEN CAST(total_amount AS DECIMAL(10,2)) ELSE 0 END), 0) as table_cash,
        COALESCE(SUM(CASE WHEN payment_method = 'tarjeta' THEN CAST(total_amount AS DECIMAL(10,2)) ELSE 0 END), 0) as table_card
      FROM payments 
      WHERE payment_date >= ? AND payment_date <= ?
    `, [todayStart, todayEnd]) as any[]
    
    // Combinar ambos tipos de pago
    const onlineData = onlinePayments[0] || {};
    const tableData = tablePayments[0] || {};
    
    const dailyCutResult = [{
      today_orders: (onlineData.online_orders || 0) + (tableData.table_transactions || 0),
      today_sales: (onlineData.online_sales || 0) + (tableData.table_sales || 0),
      today_avg_ticket: 0, // Se calculará después
      cash_sales: (onlineData.online_cash || 0) + (tableData.table_cash || 0),
      card_sales: (onlineData.online_card || 0) + (tableData.table_card || 0),
      mp_sales: onlineData.online_mp || 0,
      // Desglose adicional
      online_cash: onlineData.online_cash || 0,
      online_card: onlineData.online_card || 0,
      online_mp: onlineData.online_mp || 0,
      table_cash: tableData.table_cash || 0,
      table_card: tableData.table_card || 0
    }];
    
    // Calcular promedio del ticket
    if (dailyCutResult[0].today_orders > 0) {
      dailyCutResult[0].today_avg_ticket = parseFloat((dailyCutResult[0].today_sales / dailyCutResult[0].today_orders).toFixed(2));
    }
    
    const totalOrders = revenueResult[0]?.total_orders || 0
    const totalSales = parseFloat(revenueResult[0]?.total_sales || '0')
    const averageTicket = totalOrders > 0 ? totalSales / totalOrders : 0
    
    // Productos más vendidos con información de costos - INCLUIR TODAS LAS ÓRDENES
    const [ordersWithItems] = await conn.execute(`
      SELECT items FROM orders 
      WHERE created_at >= ? AND items IS NOT NULL AND items != ''
    `, [startDate.toISOString().slice(0, 19).replace('T', ' ')])
    
    // Obtener información de productos con costos
    const [productsInfo] = await conn.execute(`
      SELECT id, name, price, cost_price FROM products
    `) as any[]
    
    const productInfoMap = new Map()
    productsInfo.forEach((product: any) => {
      productInfoMap.set(product.name, {
        price: parseFloat(product.price || 0),
        cost_price: parseFloat(product.cost_price || 0)
      })
    })
    
    // Procesar productos del JSON con cálculo de ganancias
    const productStats = new Map()
    for (const order of ordersWithItems as any[]) {
      try {
        const items = JSON.parse(order.items)
        for (const item of items) {
          const key = item.name
          const productInfo = productInfoMap.get(item.name)
          const itemPrice = parseFloat(item.price) || 0
          const itemCost = productInfo?.cost_price || 0
          const itemQuantity = parseInt(item.quantity) || 0
          
          const itemSales = itemQuantity * itemPrice
          const itemCostTotal = itemQuantity * itemCost
          const itemProfit = itemSales - itemCostTotal
          
          if (productStats.has(key)) {
            const existing = productStats.get(key)
            productStats.set(key, {
              name: item.name,
              quantity: existing.quantity + itemQuantity,
              sales: existing.sales + itemSales,
              cost: existing.cost + itemCostTotal,
              profit: existing.profit + itemProfit,
              profitMargin: 0 // Se calculará después
            })
          } else {
            productStats.set(key, {
              name: item.name,
              quantity: itemQuantity,
              sales: itemSales,
              cost: itemCostTotal,
              profit: itemProfit,
              profitMargin: 0 // Se calculará después
            })
          }
        }
      } catch (e) {
        console.log('Error parsing items JSON:', e)
      }
    }
    
    // Calcular márgenes de ganancia y ganancia total
    const productsArray = Array.from(productStats.values()).map((product: any) => ({
      ...product,
      profitMargin: product.sales > 0 ? (product.profit / product.sales) * 100 : 0
    }))
    
    // Calcular ganancia total del período
    const totalProfit = productsArray.reduce((sum, product) => sum + product.profit, 0)
    const totalCost = productsArray.reduce((sum, product) => sum + product.cost, 0)
    const totalProfitMargin = totalSales > 0 ? (totalProfit / totalSales) * 100 : 0
    
    const productsResult = productsArray
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 10)
    
    // Ventas diarias - INCLUIR TODAS LAS ÓRDENES
    const [dailyResult] = await conn.execute(`
      SELECT 
        DATE(created_at) as date,
        COUNT(*) as orders,
        SUM(total) as total_sales
      FROM orders 
      WHERE created_at >= ?
      GROUP BY DATE(created_at)
      ORDER BY date ASC
    `, [startDate.toISOString().slice(0, 19).replace('T', ' ')])
    
    // Patrones horarios - INCLUIR TODAS LAS ÓRDENES
    const [hourlyResult] = await conn.execute(`
      SELECT 
        HOUR(created_at) as hour,
        COUNT(*) as orders
      FROM orders 
      WHERE created_at >= ?
      GROUP BY HOUR(created_at)
      ORDER BY hour
    `, [startDate.toISOString().slice(0, 19).replace('T', ' ')])
    
    // Métodos de pago unificados (órdenes online + pagos de mesa)
    const [onlinePaymentMethods] = await conn.execute(`
      SELECT 
        COALESCE(payment_method, 'No especificado') as method,
        COUNT(*) as count,
        SUM(total) as sales,
        'online' as source
      FROM orders 
      WHERE created_at >= ? AND waiter_order != 1
      GROUP BY payment_method
    `, [startDate.toISOString().slice(0, 19).replace('T', ' ')]) as any[]
    
    const [tablePaymentMethods] = await conn.execute(`
      SELECT 
        payment_method as method,
        COUNT(*) as count,
        SUM(total_amount) as sales,
        'table' as source
      FROM payments 
      WHERE payment_date >= ?
      GROUP BY payment_method
    `, [startDate.toISOString().slice(0, 19).replace('T', ' ')]) as any[]
    
    // Combinar métodos de pago
    const paymentMethodsMap = new Map()
    
    // Procesar pagos online
    for (const payment of onlinePaymentMethods as any[]) {
      const method = payment.method
      if (paymentMethodsMap.has(method)) {
        const existing = paymentMethodsMap.get(method)
        paymentMethodsMap.set(method, {
          method,
          count: existing.count + payment.count,
          sales: existing.sales + parseFloat(payment.sales || 0),
          online_count: existing.online_count + payment.count,
          online_sales: existing.online_sales + parseFloat(payment.sales || 0),
          table_count: existing.table_count,
          table_sales: existing.table_sales
        })
      } else {
        paymentMethodsMap.set(method, {
          method,
          count: payment.count,
          sales: parseFloat(payment.sales || 0),
          online_count: payment.count,
          online_sales: parseFloat(payment.sales || 0),
          table_count: 0,
          table_sales: 0
        })
      }
    }
    
    // Procesar pagos de mesa
    for (const payment of tablePaymentMethods as any[]) {
      const method = payment.method
      if (paymentMethodsMap.has(method)) {
        const existing = paymentMethodsMap.get(method)
        paymentMethodsMap.set(method, {
          method,
          count: existing.count + payment.count,
          sales: existing.sales + parseFloat(payment.sales || 0),
          online_count: existing.online_count,
          online_sales: existing.online_sales,
          table_count: existing.table_count + payment.count,
          table_sales: existing.table_sales + parseFloat(payment.sales || 0)
        })
      } else {
        paymentMethodsMap.set(method, {
          method,
          count: payment.count,
          sales: parseFloat(payment.sales || 0),
          online_count: 0,
          online_sales: 0,
          table_count: payment.count,
          table_sales: parseFloat(payment.sales || 0)
        })
      }
    }
    
    const paymentResult = Array.from(paymentMethodsMap.values()).sort((a, b) => b.sales - a.sales)
    
    // Status de órdenes
    const [statusResult] = await conn.execute(`
      SELECT 
        status,
        COUNT(*) as count
      FROM orders 
      WHERE created_at >= ?
      GROUP BY status
      ORDER BY count DESC
    `, [startDate.toISOString().slice(0, 19).replace('T', ' ')])

    // Calcular crecimiento real comparando con período anterior
    const previousStartDate = new Date(startDate)
    previousStartDate.setDate(previousStartDate.getDate() - period)
    
    const [previousPeriodResult] = await conn.execute(
      'SELECT COUNT(*) as prev_orders, SUM(total) as prev_sales FROM orders WHERE created_at >= ? AND created_at < ?',
      [previousStartDate.toISOString().slice(0, 19).replace('T', ' '), startDate.toISOString().slice(0, 19).replace('T', ' ')]
    ) as any[]
    
    const prevOrders = previousPeriodResult[0]?.prev_orders || 0
    const prevSales = parseFloat(previousPeriodResult[0]?.prev_sales || '0')
    
    const salesGrowth = prevSales > 0 ? ((totalSales - prevSales) / prevSales) * 100 : 0
    const ordersGrowth = prevOrders > 0 ? ((totalOrders - prevOrders) / prevOrders) * 100 : 0
    const avgTicketGrowth = prevOrders > 0 && totalOrders > 0 ? 
      ((averageTicket - (prevSales / prevOrders)) / (prevSales / prevOrders)) * 100 : 0

    const reportData = {
      totalSales: parseFloat(totalSales?.toString() || '0'),
      totalOrders: parseInt(totalOrders?.toString() || '0'),
      averageTicket: parseFloat(averageTicket.toFixed(2)),
      // Métricas de ganancia
      totalProfit: parseFloat(totalProfit.toFixed(2)),
      totalCost: parseFloat(totalCost.toFixed(2)),
      totalProfitMargin: parseFloat(totalProfitMargin.toFixed(2)),
      topProducts: productsResult,
      dailySales: dailyResult,
      hourlyPattern: hourlyResult,
      // Nuevos datos completos
      dailyDetails: dailyDetailResult,
      salesByTable: tableResult,
      salesByWaiter: waiterResult,
      dailyCut: (dailyCutResult as any[])[0],
      growth: {
        sales: parseFloat(salesGrowth.toFixed(1)),
        orders: parseFloat(ordersGrowth.toFixed(1)),
        avgTicket: parseFloat(avgTicketGrowth.toFixed(1))
      },
      paymentMethods: paymentResult,
      ordersByStatus: statusResult
    }
    
    return NextResponse.json(reportData)
    
  } catch (error) {
    console.error('Error generating reports:', error)
    return NextResponse.json(
      { 
        error: 'Error al generar reportes',
        message: error instanceof Error ? error.message : 'Error desconocido'
      },
      { status: 500 }
    )
  } finally {
    // Siempre liberar la conexión de vuelta al pool
    if (conn) {
      conn.release()
    }
  }
}