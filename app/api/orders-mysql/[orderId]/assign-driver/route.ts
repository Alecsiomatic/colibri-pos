import { NextRequest, NextResponse } from 'next/server'
import { getPool } from '@/lib/mysql-db'

export async function POST(
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
    
    // Buscar en delivery_drivers (por id o user_id)
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
