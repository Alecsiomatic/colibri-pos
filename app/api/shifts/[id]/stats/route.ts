import { NextRequest, NextResponse } from 'next/server'
import { executeQuery } from '@/lib/mysql-db'

// GET /api/shifts/[id]/stats - Obtener estadísticas en tiempo real del turno
export async function GET(
  req: NextRequest,
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

    // Verificar que el turno existe y está abierto
    const shifts = await executeQuery(
      'SELECT * FROM cash_shifts WHERE id = ? AND status = "open"',
      [shiftId]
    ) as any[]

    if (!shifts || shifts.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Turno no encontrado o ya cerrado' },
        { status: 404 }
      )
    }

    // Obtener estadísticas de ventas del turno
    const statsQuery = `
      SELECT 
        COUNT(DISTINCT o.id) as total_orders,
        COALESCE(SUM(o.total), 0) as total_sales,
        COALESCE(SUM(CASE WHEN o.payment_method = 'cash' OR o.payment_method = 'efectivo' THEN o.total ELSE 0 END), 0) as cash_sales,
        COALESCE(SUM(CASE WHEN o.payment_method = 'card' OR o.payment_method = 'tarjeta' THEN o.total ELSE 0 END), 0) as card_sales,
        COUNT(DISTINCT CASE WHEN o.payment_method = 'cash' OR o.payment_method = 'efectivo' THEN o.id END) as cash_orders,
        COUNT(DISTINCT CASE WHEN o.payment_method = 'card' OR o.payment_method = 'tarjeta' THEN o.id END) as card_orders,
        COALESCE(SUM(CASE WHEN o.order_source IN ('kiosk', 'kiosko') AND o.waiter_order != 1 THEN o.total ELSE 0 END), 0) as kiosk_sales,
        COUNT(DISTINCT CASE WHEN o.order_source IN ('kiosk', 'kiosko') AND o.waiter_order != 1 THEN o.id END) as kiosk_orders,
        COALESCE(SUM(CASE WHEN (o.waiter_order = 1 OR o.order_source IN ('mesa', 'mesas', 'mesero')) THEN o.total ELSE 0 END), 0) as dine_in_sales,
        COUNT(DISTINCT CASE WHEN (o.waiter_order = 1 OR o.order_source IN ('mesa', 'mesas', 'mesero')) THEN o.id END) as dine_in_orders,
        COALESCE(SUM(CASE WHEN o.order_source IN ('online', 'menu', 'web') AND o.waiter_order != 1 THEN o.total ELSE 0 END), 0) as online_sales,
        COUNT(DISTINCT CASE WHEN o.order_source IN ('online', 'menu', 'web') AND o.waiter_order != 1 THEN o.id END) as online_orders
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
      card_orders: 0,
      kiosk_sales: 0,
      kiosk_orders: 0,
      dine_in_sales: 0,
      dine_in_orders: 0,
      online_sales: 0,
      online_orders: 0
    }

    // Obtener movimientos de efectivo (entradas y salidas)
    const cashMovementsQuery = `
      SELECT 
        transaction_type,
        COALESCE(SUM(amount), 0) as total_amount,
        COUNT(*) as count
      FROM cash_transactions
      WHERE shift_id = ?
        AND transaction_type IN ('cash_in', 'cash_out')
      GROUP BY transaction_type
    `

    const cashMovements = await executeQuery(cashMovementsQuery, [shiftId]) as any[]

    let cashIn = 0
    let cashInCount = 0
    let cashOut = 0
    let cashOutCount = 0

    cashMovements.forEach((movement: any) => {
      if (movement.transaction_type === 'cash_in') {
        cashIn = Number(movement.total_amount) || 0
        cashInCount = Number(movement.count) || 0
      } else if (movement.transaction_type === 'cash_out') {
        cashOut = Number(movement.total_amount) || 0
        cashOutCount = Number(movement.count) || 0
      }
    })

    // Obtener lista detallada de movimientos
    const movementsListQuery = `
      SELECT 
        id,
        transaction_type,
        amount,
        notes,
        created_at
      FROM cash_transactions
      WHERE shift_id = ?
        AND transaction_type IN ('cash_in', 'cash_out')
      ORDER BY created_at DESC
    `

    const movementsList = await executeQuery(movementsListQuery, [shiftId]) as any[]

    return NextResponse.json({
      success: true,
      stats: {
        total_orders: Number(statsData.total_orders) || 0,
        total_sales: Number(statsData.total_sales) || 0,
        cash_sales: Number(statsData.cash_sales) || 0,
        card_sales: Number(statsData.card_sales) || 0,
        cash_orders: Number(statsData.cash_orders) || 0,
        card_orders: Number(statsData.card_orders) || 0,
        kiosk_sales: Number(statsData.kiosk_sales) || 0,
        kiosk_orders: Number(statsData.kiosk_orders) || 0,
        dine_in_sales: Number(statsData.dine_in_sales) || 0,
        dine_in_orders: Number(statsData.dine_in_orders) || 0,
        online_sales: Number(statsData.online_sales) || 0,
        online_orders: Number(statsData.online_orders) || 0,
        cash_in: cashIn,
        cash_in_count: cashInCount,
        cash_out: cashOut,
        cash_out_count: cashOutCount,
        cash_movements: movementsList
      }
    })
  } catch (error: any) {
    console.error('Error fetching shift stats:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Error al obtener estadísticas del turno' },
      { status: 500 }
    )
  }
}
