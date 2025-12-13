import { NextRequest, NextResponse } from "next/server"
import { executeQuery } from "@/lib/db-retry"
import { requireAdmin } from "@/lib/auth-simple"

export const POST = requireAdmin(async (request: NextRequest) => {
  try {
    console.log('🧹 INICIANDO LIMPIEZA COMPLETA DE ÓRDENES...')
    
    // 1. Eliminar asignaciones de delivery
    console.log('📦 Eliminando asignaciones de delivery...')
    const deletedAssignments = await executeQuery('DELETE FROM delivery_assignments')
    console.log('✅ Asignaciones de delivery eliminadas')
    
    // 2. Eliminar todas las órdenes
    console.log('🛒 Eliminando todas las órdenes...')
    const deletedOrders = await executeQuery('DELETE FROM orders')
    console.log('✅ Todas las órdenes eliminadas')
    
    // 3. Limpiar inventario (resetear a stock inicial)
    console.log('📦 Reseteando inventario a stock inicial...')
    await executeQuery(`
      UPDATE inventory i 
      JOIN products p ON i.product_id = p.id 
      SET i.quantity = p.stock
    `)
    console.log('✅ Inventario reseteado')
    
    // 4. Limpiar movimientos de inventario
    console.log('📊 Eliminando movimientos de inventario...')
    await executeQuery('DELETE FROM inventory_movements')
    console.log('✅ Movimientos de inventario eliminados')
    
    // 5. Resetear AUTO_INCREMENT de las tablas
    console.log('🔄 Reseteando AUTO_INCREMENT...')
    await executeQuery('ALTER TABLE orders AUTO_INCREMENT = 1')
    await executeQuery('ALTER TABLE delivery_assignments AUTO_INCREMENT = 1') 
    await executeQuery('ALTER TABLE inventory_movements AUTO_INCREMENT = 1')
    console.log('✅ AUTO_INCREMENT reseteado')
    
    // 6. Verificar que se conservaron datos importantes
    console.log('📊 VERIFICANDO DATOS CONSERVADOS:')
    
    const users = await executeQuery('SELECT COUNT(*) as count FROM users') as any[]
    const products = await executeQuery('SELECT COUNT(*) as count FROM products') as any[]
    const categories = await executeQuery('SELECT COUNT(*) as count FROM categories') as any[]
    const drivers = await executeQuery('SELECT COUNT(*) as count FROM delivery_drivers') as any[]
    const ordersCheck = await executeQuery('SELECT COUNT(*) as count FROM orders') as any[]
    const assignmentsCheck = await executeQuery('SELECT COUNT(*) as count FROM delivery_assignments') as any[]
    
    const summary = {
      users: users[0].count,
      products: products[0].count,
      categories: categories[0].count,
      drivers: drivers[0].count,
      orders: ordersCheck[0].count,
      assignments: assignmentsCheck[0].count
    }
    
    console.log('🎉 ¡LIMPIEZA COMPLETA EXITOSA!')
    console.log('✅ Todos los pedidos y órdenes eliminados')
    console.log('✅ Inventario reseteado')
    console.log('✅ Productos, categorías, usuarios y drivers conservados')
    console.log('✅ Sistema listo para empezar desde 0')
    
    return NextResponse.json({
      success: true,
      message: "Sistema reseteado exitosamente",
      summary: summary,
      deletedOrders: (deletedOrders as any)?.affectedRows || 0,
      deletedAssignments: (deletedAssignments as any)?.affectedRows || 0,
      details: [
        "✅ Todas las órdenes eliminadas",
        "✅ Asignaciones de delivery eliminadas", 
        "✅ Inventario reseteado a stock inicial",
        "✅ Movimientos de inventario eliminados",
        "✅ AUTO_INCREMENT reseteado",
        "✅ Productos, categorías, usuarios y drivers conservados"
      ]
    })
    
  } catch (error: any) {
    console.error('❌ Error en la limpieza:', error)
    return NextResponse.json({
      success: false,
      error: "Error al resetear el sistema",
      details: error.message
    }, { status: 500 })
  }
})