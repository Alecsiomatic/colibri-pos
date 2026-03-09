import { NextRequest, NextResponse } from 'next/server'
import { getPool } from '@/lib/mysql-db'
import { restoreStockForOrder } from '@/lib/inventory'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ orderId: string }> }
) {
  try {
    const { orderId } = await params
    const pool = getPool()
    
    // Obtener orden
    const [orderRows] = await pool.execute<any[]>(
      `SELECT 
        o.*,
        u.username as driver_username,
        u.phone as driver_phone,
        u.driver_lat,
        u.driver_lng,
        u.driver_location_updated_at
       FROM orders o
       LEFT JOIN driver_assignments da ON da.order_id = o.id AND da.status IN ('accepted', 'pending')
       LEFT JOIN users u ON u.id = da.driver_id
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
            if (Array.isArray(items)) await restoreStockForOrder(Number(orderId), items)
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
    
    console.log('🔍 Buscando driver con ID:', driverId)
    
    // El driverId puede venir como ID de la tabla delivery_drivers o user_id
    const [driverInfoRows] = await pool.execute<any[]>(
      'SELECT dd.id as driver_id, dd.user_id, u.username, u.is_driver FROM delivery_drivers dd JOIN users u ON dd.user_id = u.id WHERE dd.id = ? OR dd.user_id = ?',
      [driverId, driverId]
    )
    
    console.log('📊 Drivers encontrados:', driverInfoRows.length)
    console.log('📋 Driver info:', driverInfoRows)
    
    if (driverInfoRows.length === 0) {
      // Intentar buscar directamente en users si es driver
      const [userRows] = await pool.execute<any[]>(
        'SELECT id as user_id, username, is_driver FROM users WHERE id = ? AND is_driver = 1',
        [driverId]
      )
      
      console.log('🔍 Búsqueda en users:', userRows)
      
      if (userRows.length === 0) {
        return NextResponse.json(
          { success: false, error: 'Driver not found' },
          { status: 404 }
        )
      }
      
      const userInfo = userRows[0]
      const actualUserId = userInfo.user_id
      
      // Verificar si ya existe una asignación activa
      const [existingAssignments] = await pool.execute<any[]>(
        'SELECT id FROM driver_assignments WHERE order_id = ? AND status IN ("pending", "accepted")',
        [orderId]
      )
      
      if (existingAssignments.length > 0) {
        await pool.execute(
          'UPDATE driver_assignments SET status = "cancelled" WHERE order_id = ? AND status IN ("pending", "accepted")',
          [orderId]
        )
      }
      
      // Crear nueva asignación
      await pool.execute(
        `INSERT INTO driver_assignments (order_id, driver_id, status, assigned_at) 
         VALUES (?, ?, 'pending', NOW())`,
        [orderId, actualUserId]
      )
      
      await pool.execute(
        'UPDATE orders SET status = "assigned_to_driver" WHERE id = ?',
        [orderId]
      )
      
      return NextResponse.json({
        success: true,
        message: 'Driver assigned successfully',
        driver: {
          id: actualUserId,
          name: userInfo.username
        }
      })
    }
    
    const driverInfo = driverInfoRows[0]
    const actualUserId = driverInfo.user_id
    
    // Verificar si ya existe una asignación activa
    const [existingAssignments] = await pool.execute<any[]>(
      'SELECT id FROM driver_assignments WHERE order_id = ? AND status IN ("pending", "accepted")',
      [orderId]
    )
    
    if (existingAssignments.length > 0) {
      // Cancelar asignación anterior
      await pool.execute(
        'UPDATE driver_assignments SET status = "cancelled" WHERE order_id = ? AND status IN ("pending", "accepted")',
        [orderId]
      )
    }
    
    // Crear nueva asignación usando user_id
    await pool.execute(
      `INSERT INTO driver_assignments (order_id, driver_id, status, assigned_at) 
       VALUES (?, ?, 'pending', NOW())`,
      [orderId, actualUserId]
    )
    
    // Actualizar estado de la orden
    await pool.execute(
      'UPDATE orders SET status = "assigned_to_driver" WHERE id = ?',
      [orderId]
    )
    
    return NextResponse.json({
      success: true,
      message: 'Driver assigned successfully',
      driver: {
        id: actualUserId,
        name: driverInfo.username
      }
    })
    
  } catch (error: any) {
    console.error('❌ Error assigning driver:', error)
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}
