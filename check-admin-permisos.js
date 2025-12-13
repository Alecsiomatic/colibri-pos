const mysql = require('mysql2/promise');

async function checkAdminPermisos() {
  const connection = await mysql.createConnection({
    host: 'srv440.hstgr.io',
    user: 'u191251575_colibridemo',
    password: 'Cerounocero.com20182417',
    database: 'u191251575_colibridemo',
    port: 3306
  });

  try {
    console.log('🔍 Verificando usuarios y permisos...\n');

    // Ver todos los usuarios
    const [users] = await connection.execute(
      'SELECT id, email, username, is_admin, is_waiter, is_driver FROM users'
    );

    console.log('👥 USUARIOS EN LA BASE DE DATOS:');
    console.log('=====================================');
    users.forEach(user => {
      console.log(`ID: ${user.id}`);
      console.log(`Email: ${user.email}`);
      console.log(`Username: ${user.username}`);
      console.log(`is_admin: ${user.is_admin}`);
      console.log(`is_waiter: ${user.is_waiter}`);
      console.log(`is_driver: ${user.is_driver}`);
      console.log('-------------------------------------');
    });

    console.log('\n📊 VERIFICANDO PEDIDOS:');
    console.log('=====================================');
    
    // Contar pedidos totales
    const [totalOrders] = await connection.execute(
      'SELECT COUNT(*) as total FROM orders'
    );
    console.log(`Total de pedidos en BD: ${totalOrders[0].total}`);

    // Pedidos por estado
    const [ordersByStatus] = await connection.execute(
      'SELECT status, COUNT(*) as count FROM orders GROUP BY status'
    );
    console.log('\nPedidos por estado:');
    ordersByStatus.forEach(row => {
      console.log(`  ${row.status}: ${row.count}`);
    });

    // Pedidos por origen
    const [ordersBySource] = await connection.execute(
      'SELECT order_source, COUNT(*) as count FROM orders GROUP BY order_source'
    );
    console.log('\nPedidos por origen:');
    ordersBySource.forEach(row => {
      console.log(`  ${row.order_source || 'NULL'}: ${row.count}`);
    });

    // Últimos 5 pedidos
    const [recentOrders] = await connection.execute(
      'SELECT id, status, order_source, total, created_at FROM orders ORDER BY created_at DESC LIMIT 5'
    );
    console.log('\nÚltimos 5 pedidos:');
    recentOrders.forEach(order => {
      console.log(`  #${order.id} - ${order.status} - ${order.order_source || 'NULL'} - $${order.total}`);
    });

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await connection.end();
  }
}

checkAdminPermisos();
