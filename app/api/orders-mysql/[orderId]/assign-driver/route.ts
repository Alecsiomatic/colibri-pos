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
    
    // El driverId puede venir como ID de la tabla drivers o user_id
    // Primero intentar buscar en la tabla drivers
    const [driverInfoRows] = await pool.execute<any[]>(
      'SELECT d.id as driver_id, d.user_id, u.username, u.is_driver FROM drivers d JOIN users u ON d.user_id = u.id WHERE d.id = ? OR d.user_id = ?',
      [driverId, driverId]
    )
    
    if (driverInfoRows.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Driver not found' },
        { status: 404 }
      )
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
