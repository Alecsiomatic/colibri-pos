import { NextRequest, NextResponse } from 'next/server'
import { getPool } from '@/lib/mysql-db'
import { restoreStockForOrder } from '@/lib/inventory'
import { restoreIngredientsForProduct, restoreIngredientsForModifiers } from '@/lib/ingredients'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ orderId: string }> }
) {
  try {
    const { orderId } = await params
    const pool = getPool()
    
    // Obtener orden con datos del repartidor asignado
    const [orderRows] = await pool.execute<any[]>(
      `SELECT 
        o.*,
        dd.name as driver_username,
        dd.phone as driver_phone,
        dd.current_location as driver_location
       FROM orders o
       LEFT JOIN delivery_assignments da ON da.order_id = o.id AND da.status IN ('accepted', 'pending')
       LEFT JOIN delivery_drivers dd ON dd.id = da.driver_id
       WHERE o.id = ?`,
      [orderId]
    )
    
    if (orderRows.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Order not found' },
        { status: 404 }
      )
    }
    
    const order = orderRows[0]
    
    // Parsear campos JSON
    if (order.customer_info && typeof order.customer_info === 'string') {
      try {
        order.customer_info = JSON.parse(order.customer_info)
      } catch (e) {
        console.error('Error parsing customer_info:', e)
      }
    }
    
    if (order.delivery_address && typeof order.delivery_address === 'string') {
      try {
        order.delivery_address = JSON.parse(order.delivery_address)
      } catch (e) {
        // Si no es JSON, dejarlo como string
      }
    }
    
    // Obtener configuración del restaurante
    const [restaurantRows] = await pool.execute<any[]>(
      'SELECT latitude, longitude FROM restaurant_config LIMIT 1'
    )
    
    // Construir objeto de respuesta con ubicaciones
    const response: any = {
      success: true,
      order: {
        ...order,
        driver: order.driver_username ? {
          id: order.driver_id,
          username: order.driver_username,
          phone: order.driver_phone
        } : null,
        driver_location: order.driver_lat && order.driver_lng ? {
          lat: parseFloat(order.driver_lat),
          lng: parseFloat(order.driver_lng),
          updated_at: order.driver_location_updated_at
        } : null,
        restaurant_location: restaurantRows.length > 0 ? {
          lat: parseFloat(restaurantRows[0].latitude),
          lng: parseFloat(restaurantRows[0].longitude)
        } : null,
        delivery_location: order.delivery_address && 
                          typeof order.delivery_address === 'object' &&
                          order.delivery_address.lat &&
                          order.delivery_address.lng ? {
          lat: parseFloat(order.delivery_address.lat),
          lng: parseFloat(order.delivery_address.lng)
        } : null
      }
    }
    
    return NextResponse.json(response)
    
  } catch (error: any) {
    console.error('❌ Error getting order:', error)
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ orderId: string }> }
) {
  try {
    const { orderId } = await params
    const body = await request.json()
    const { status, shift_id, payment_method } = body
    
    if (!status) {
      return NextResponse.json(
        { success: false, error: 'Status is required' },
        { status: 400 }
      )
    }
    
    const pool = getPool()
    
    // Construir query dinámicamente con los campos que existen en la tabla
    const updates: string[] = ['status = ?']
    const values: any[] = [status]
    
    if (shift_id !== undefined) {
      updates.push('shift_id = ?')
      values.push(shift_id)
    }
    
    if (payment_method) {
      updates.push('payment_method = ?')
      values.push(payment_method)
    }
    
    values.push(orderId)
    
    const query = `UPDATE orders SET ${updates.join(', ')} WHERE id = ?`
    
    console.log('📝 Actualizando pedido:', { orderId, updates, values })
    
    // Check if cancelling — restore stock
    const isCancelling = ['cancelado', 'cancelled', 'canceled'].includes(status?.toLowerCase())
    if (isCancelling) {
      try {
        const [orderRows] = await pool.execute<any[]>('SELECT items, status FROM orders WHERE id = ?', [orderId])
        if (orderRows.length > 0) {
          const prevStatus = (orderRows[0].status || '').toLowerCase()
          const wasCancelled = ['cancelado', 'cancelled', 'canceled'].includes(prevStatus)
          if (!wasCancelled) {
            let items = orderRows[0].items
            if (typeof items === 'string') items = JSON.parse(items)
            if (Array.isArray(items)) {
              // Restore ingredients first, then product stock for items without recipes
              const { adjustStock } = await import('@/lib/inventory')
              for (const it of items) {
                const pid = it.id || it.product_id
                if (!pid) continue
                const q = Number(it.quantity) || 1
                const restoredIngredients = await restoreIngredientsForProduct(pid, q, Number(orderId))
                if (!restoredIngredients) {
                  await adjustStock(pid, q, 'cancel_restore', {
                    referenceId: `order-${orderId}`,
                    notes: `Cancelación pedido #${orderId}`,
                  })
                }
                // Restore modifier ingredients
                if (it.modifiers && Array.isArray(it.modifiers) && it.modifiers.length > 0) {
                  await restoreIngredientsForModifiers(it.modifiers, q, Number(orderId))
                }
              }
            }
          }
        }
      } catch (stockErr) {
        console.error('Error restoring stock on cancel:', stockErr)
      }
    }
    
    await pool.execute(query, values)
    
    return NextResponse.json({
      success: true,
      message: 'Order updated successfully'
    })
    
  } catch (error: any) {
    console.error('❌ Error updating order:', error)
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ orderId: string }> }
) {
  try {
    const { orderId } = await params
    const body = await request.json()
    const { driverId } = body
    
    if (!driverId) {
      return NextResponse.json(
        { success: false, error: 'Driver ID is required' },
        { status: 400 }
      )
    }
    
    const pool = getPool()
    
    // Buscar repartidor en delivery_drivers (por id o user_id)
    const [driverInfoRows] = await pool.execute<any[]>(
      'SELECT dd.id as driver_id, dd.user_id, u.username FROM delivery_drivers dd JOIN users u ON dd.user_id = u.id WHERE dd.id = ? OR dd.user_id = ?',
      [driverId, driverId]
    )
    
    if (driverInfoRows.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Repartidor no encontrado' },
        { status: 404 }
      )
    }
    
    const driverInfo = driverInfoRows[0]
    const deliveryDriverId = driverInfo.driver_id
    
    // Cancelar asignaciones activas previas en delivery_assignments
    const [existingAssignments] = await pool.execute<any[]>(
      'SELECT id FROM delivery_assignments WHERE order_id = ? AND status IN ("pending", "accepted")',
      [orderId]
    )
    
    if (existingAssignments.length > 0) {
      await pool.execute(
        'UPDATE delivery_assignments SET status = "cancelled" WHERE order_id = ? AND status IN ("pending", "accepted")',
        [orderId]
      )
    }
    
    // Crear nueva asignación en delivery_assignments
    await pool.execute(
      `INSERT INTO delivery_assignments (order_id, driver_id, status, assigned_at) 
       VALUES (?, ?, 'pending', NOW())`,
      [orderId, deliveryDriverId]
    )
    
    // Actualizar estado de la orden
    await pool.execute(
      'UPDATE orders SET status = "asignado_repartidor" WHERE id = ?',
      [orderId]
    )
    
    // Marcar repartidor como no disponible
    await pool.execute(
      'UPDATE delivery_drivers SET is_available = 0 WHERE id = ?',
      [deliveryDriverId]
    )
    
    return NextResponse.json({
      success: true,
      message: 'Repartidor asignado exitosamente',
      driver: {
        id: driverInfo.user_id,
        name: driverInfo.username
      }
    })
    
  } catch (error: any) {
    console.error('Error assigning driver:', error)
    return NextResponse.json(
      { success: false, error: 'Error al asignar repartidor' },
      { status: 500 }
    )
  }
}
