const mysql = require('mysql2/promise');

const dbConfig = {
  host: 'srv440.hstgr.io',
  user: 'u191251575_manu',
  password: 'Manu2024$',
  database: 'u191251575_manu',
  port: 3306
};

async function resetOrdersToZero() {
  let connection;
  
  try {
    console.log('🔌 Conectando a la base de datos...');
    connection = await mysql.createConnection(dbConfig);
    
    console.log('🧹 INICIANDO LIMPIEZA COMPLETA DE ÓRDENES...\n');
    
    // 1. Eliminar asignaciones de delivery
    console.log('📦 Eliminando asignaciones de delivery...');
    await connection.execute('DELETE FROM delivery_assignments');
    console.log('✅ Asignaciones de delivery eliminadas');
    
    // 2. Eliminar todas las órdenes
    console.log('🛒 Eliminando todas las órdenes...');
    await connection.execute('DELETE FROM orders');
    console.log('✅ Todas las órdenes eliminadas');
    
    // 3. Limpiar inventario (resetear a stock inicial)
    console.log('📦 Reseteando inventario a stock inicial...');
    await connection.execute(`
      UPDATE inventory i 
      JOIN products p ON i.product_id = p.id 
      SET i.quantity = p.stock
    `);
    console.log('✅ Inventario reseteado');
    
    // 4. Limpiar movimientos de inventario
    console.log('📊 Eliminando movimientos de inventario...');
    await connection.execute('DELETE FROM inventory_movements');
    console.log('✅ Movimientos de inventario eliminados');
    
    // 5. Resetear AUTO_INCREMENT de las tablas
    console.log('🔄 Reseteando AUTO_INCREMENT...');
    await connection.execute('ALTER TABLE orders AUTO_INCREMENT = 1');
    await connection.execute('ALTER TABLE delivery_assignments AUTO_INCREMENT = 1');
    await connection.execute('ALTER TABLE inventory_movements AUTO_INCREMENT = 1');
    console.log('✅ AUTO_INCREMENT reseteado');
    
    // 6. Verificar que se conservaron datos importantes
    console.log('\n📊 VERIFICANDO DATOS CONSERVADOS:');
    
    const [users] = await connection.execute('SELECT COUNT(*) as count FROM users');
    console.log(`👥 Usuarios: ${users[0].count}`);
    
    const [products] = await connection.execute('SELECT COUNT(*) as count FROM products');
    console.log(`🍔 Productos: ${products[0].count}`);
    
    const [categories] = await connection.execute('SELECT COUNT(*) as count FROM categories');
    console.log(`📂 Categorías: ${categories[0].count}`);
    
    const [drivers] = await connection.execute('SELECT COUNT(*) as count FROM delivery_drivers');
    console.log(`🚗 Repartidores: ${drivers[0].count}`);
    
    const [ordersCheck] = await connection.execute('SELECT COUNT(*) as count FROM orders');
    console.log(`🛒 Órdenes: ${ordersCheck[0].count} (debería ser 0)`);
    
    const [assignmentsCheck] = await connection.execute('SELECT COUNT(*) as count FROM delivery_assignments');
    console.log(`📦 Asignaciones: ${assignmentsCheck[0].count} (debería ser 0)`);
    
    console.log('\n🎉 ¡LIMPIEZA COMPLETA EXITOSA!');
    console.log('✅ Todos los pedidos y órdenes eliminados');
    console.log('✅ Inventario reseteado');
    console.log('✅ Productos, categorías, usuarios y drivers conservados');
    console.log('✅ Sistema listo para empezar desde 0');
    
  } catch (error) {
    console.error('❌ Error en la limpieza:', error);
    throw error;
  } finally {
    if (connection) {
      await connection.end();
      console.log('🔌 Conexión cerrada');
    }
  }
}

// Ejecutar el script
resetOrdersToZero()
  .then(() => {
    console.log('\n✨ ¡PROCESO COMPLETADO CON ÉXITO!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 ERROR EN EL PROCESO:', error);
    process.exit(1);
  });