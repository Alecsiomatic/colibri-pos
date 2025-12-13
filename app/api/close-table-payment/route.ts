import { NextRequest, NextResponse } from 'next/server'
import { getPool } from '@/lib/mysql-db'
import { RowDataPacket } from 'mysql2'

export async function POST(req: NextRequest) {
  try {
    console.log('🔄 Iniciando cierre de mesa con pago...')
    
    const body = await req.json()
    const { tableId, paymentMethod, amountPaid, totalAmount } = body

    console.log('💳 Datos de pago recibidos:', {
      tableId,
      paymentMethod,
      amountPaid,
      totalAmount
    })

    // Validaciones
    if (!tableId || !paymentMethod || !totalAmount) {
      return NextResponse.json({
        success: false,
        error: 'Faltan datos requeridos'
      }, { status: 400 })
    }

    if (paymentMethod === 'efectivo' && (!amountPaid || parseFloat(amountPaid) < parseFloat(totalAmount))) {
      return NextResponse.json({
        success: false,
        error: 'El monto pagado debe ser mayor o igual al total'
      }, { status: 400 })
    }

    // Iniciar transacción
    const pool = getPool()
    const connection = await pool.getConnection()
    await connection.beginTransaction()

    try {
      // 1. Obtener las órdenes de la mesa
      const [orders] = await connection.execute<RowDataPacket[]>(
        'SELECT id, total, customer_info FROM orders WHERE (`table` = ? OR unified_table_id = ?) AND status IN ("open_table", "confirmed", "completed", "pendiente", "preparing")',
        [tableId, tableId]
      )

      console.log(`📝 Órdenes encontradas para mesa ${tableId}:`, orders.length)

      if (orders.length === 0) {
        await connection.rollback()
        connection.release()
        return NextResponse.json({
          success: false,
          error: 'No hay órdenes activas en esta mesa'
        }, { status: 404 })
      }

      // 2. Actualizar todas las órdenes a "paid" 
      for (const order of orders) {
        await connection.execute(
          'UPDATE orders SET status = "paid", updated_at = NOW() WHERE id = ?',
          [order.id]
        )
      }

      console.log('✅ Órdenes actualizadas a estado "paid"')

      // 3. Registrar el pago en la tabla de pagos
      const changeAmount = paymentMethod === 'efectivo' ? 
        Math.max(0, parseFloat(amountPaid) - parseFloat(totalAmount)) : 0

      await connection.execute(
        `INSERT INTO payments (
          table_name, 
          total_amount, 
          payment_method, 
          amount_paid, 
          change_amount, 
          order_ids,
          payment_date,
          created_at
        ) VALUES (?, ?, ?, ?, ?, ?, NOW(), NOW())`,
        [
          tableId,
          totalAmount,
          paymentMethod,
          paymentMethod === 'efectivo' ? amountPaid : totalAmount,
          changeAmount,
          JSON.stringify(orders.map((o: any) => o.id))
        ]
      )

      console.log('💰 Pago registrado exitosamente')

      // 4. Registrar en el historial de la mesa (opcional)
      await connection.execute(
        `INSERT INTO table_history (
          table_name,
          action_type,
          total_amount,
          payment_method,
          order_count,
          created_at
        ) VALUES (?, ?, ?, ?, ?, NOW())`,
        [
          tableId,
          'closed_with_payment',
          totalAmount,
          paymentMethod,
          orders.length
        ]
      )

      // Confirmar transacción
      await connection.commit()
      connection.release()

      console.log('🎉 Mesa cerrada exitosamente con pago')

      return NextResponse.json({
        success: true,
        message: 'Mesa cerrada y pago registrado exitosamente',
        data: {
          tableId,
          totalAmount,
          paymentMethod,
          changeAmount,
          ordersProcessed: orders.length
        }
      })

    } catch (transactionError) {
      await connection.rollback()
      connection.release()
      throw transactionError
    }

  } catch (error) {
    console.error('❌ Error cerrando mesa con pago:', error)
    return NextResponse.json({
      success: false,
      error: 'Error interno del servidor'
    }, { status: 500 })
  }
}