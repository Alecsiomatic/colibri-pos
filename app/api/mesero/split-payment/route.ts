import { NextRequest, NextResponse } from 'next/server'
import { getPool } from '@/lib/mysql-db'
import { RowDataPacket } from 'mysql2'
import { ensureCajaMigrations } from '@/lib/db-migrations'

export async function POST(req: NextRequest) {
  try {
    await ensureCajaMigrations()
    const body = await req.json()
    const { tableName, totalAmount, splits, tip, waiterId, waiterName } = body

    if (!tableName || !totalAmount || !splits || !Array.isArray(splits) || splits.length < 2) {
      return NextResponse.json(
        { success: false, error: 'Datos incompletos. Se requieren al menos 2 cuentas.' },
        { status: 400 }
      )
    }

    // Validate each split
    for (const split of splits) {
      if (!split.amount || !split.paymentMethod || !split.label) {
        return NextResponse.json(
          { success: false, error: 'Cada cuenta debe tener monto, método de pago y etiqueta.' },
          { status: 400 }
        )
      }
      if (split.paymentMethod === 'efectivo' && (!split.amountPaid || parseFloat(split.amountPaid) < parseFloat(split.amount))) {
        return NextResponse.json(
          { success: false, error: `${split.label}: el monto pagado debe ser mayor o igual al subtotal.` },
          { status: 400 }
        )
      }
    }

    // Validate splits sum to total (allow $0.02 tolerance for rounding)
    const splitsTotal = splits.reduce((sum: number, s: any) => sum + (parseFloat(s.amount) || 0), 0)
    if (Math.abs(splitsTotal - parseFloat(totalAmount)) > 0.02) {
      return NextResponse.json(
        { success: false, error: `La suma de las cuentas ($${splitsTotal.toFixed(2)}) no coincide con el total ($${parseFloat(totalAmount).toFixed(2)}).` },
        { status: 400 }
      )
    }

    const pool = getPool()
    const connection = await pool.getConnection()
    await connection.beginTransaction()

    try {
      // 1. Get active orders for this table
      const [orders] = await connection.execute<RowDataPacket[]>(
        'SELECT id, total FROM orders WHERE (`table` = ? OR unified_table_id = ?) AND status IN ("open_table", "confirmed", "completed", "pendiente", "preparing")',
        [tableName, tableName]
      )

      if (orders.length === 0) {
        await connection.rollback()
        connection.release()
        return NextResponse.json(
          { success: false, error: 'No hay órdenes activas en esta mesa.' },
          { status: 404 }
        )
      }

      // 2. Mark all orders as paid
      for (const order of orders) {
        await connection.execute(
          'UPDATE orders SET status = "paid", updated_at = NOW() WHERE id = ?',
          [order.id]
        )
      }

      // 3. Record each split as a separate payment
      const orderIds = JSON.stringify(orders.map((o: any) => o.id))
      const tipPerSplit = splits.length > 0 ? (parseFloat(tip) || 0) / splits.length : 0
      for (const split of splits) {
        const changeAmount = split.paymentMethod === 'efectivo'
          ? Math.max(0, parseFloat(split.amountPaid) - parseFloat(split.amount))
          : 0

        await connection.execute(
          `INSERT INTO payments (table_name, total_amount, payment_method, amount_paid, change_amount, tip, waiter_id, waiter_name, order_ids, payment_date, created_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
          [
            `${tableName} - ${split.label}`,
            split.amount,
            split.paymentMethod,
            split.paymentMethod === 'efectivo' ? split.amountPaid : split.amount,
            changeAmount,
            tipPerSplit,
            waiterId || null,
            waiterName || null,
            orderIds
          ]
        )
      }

      // 4. Record in table history with split details
      await connection.execute(
        `INSERT INTO table_history (table_name, action_type, total_amount, payment_method, order_count, additional_data, created_at)
         VALUES (?, 'closed_with_payment', ?, ?, ?, ?, NOW())`,
        [
          tableName,
          totalAmount,
          splits[0].paymentMethod,
          orders.length,
          JSON.stringify({
            splitPayment: true,
            splitCount: splits.length,
            splits: splits.map((s: any) => ({
              label: s.label,
              amount: s.amount,
              method: s.paymentMethod
            }))
          })
        ]
      )

      await connection.commit()
      connection.release()

      return NextResponse.json({
        success: true,
        message: 'Mesa cerrada con cuenta dividida exitosamente',
        data: {
          tableName,
          totalAmount,
          splitsProcessed: splits.length,
          ordersProcessed: orders.length
        }
      })

    } catch (txError) {
      await connection.rollback()
      connection.release()
      throw txError
    }

  } catch (error) {
    console.error('Error en split-payment:', error)
    return NextResponse.json(
      { success: false, error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
