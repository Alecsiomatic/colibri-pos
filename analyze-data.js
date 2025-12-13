const mysql = require('mysql2/promise');

async function analyzeData() {
  const connection = await mysql.createConnection({
    host: 'srv440.hstgr.io',
    user: 'u191251575_manu',
    password: 'Cerounocero.com20182417',
    database: 'u191251575_manu',
  });

  try {
    console.log('📊 ANÁLISIS DE DATOS DISPONIBLES:\n');
    
    // Estructura de pedidos
    const [orders] = await connection.execute('SELECT * FROM orders LIMIT 1');
    if (orders.length > 0) {
      console.log('🛍️ DATOS DE PEDIDOS:');
      Object.keys(orders[0]).forEach(key => {
        console.log(`  - ${key}: ${orders[0][key]}`);
      });
    }
    
    // Estructura de productos
    const [products] = await connection.execute('SELECT * FROM products LIMIT 1');
    if (products.length > 0) {
      console.log('\n🍔 DATOS DE PRODUCTOS:');
      Object.keys(products[0]).forEach(key => {
        console.log(`  - ${key}: ${products[0][key]}`);
      });
    }
    
    // Estructura de usuarios
    const [users] = await connection.execute('SELECT * FROM users LIMIT 1');
    if (users.length > 0) {
      console.log('\n👤 DATOS DE USUARIOS:');
      Object.keys(users[0]).forEach(key => {
        console.log(`  - ${key}: ${users[0][key]}`);
      });
    }
    
    // Estadísticas rápidas
    const [orderStats] = await connection.execute(`
      SELECT 
        COUNT(*) as total_orders,
        SUM(total) as total_revenue,
        AVG(total) as avg_order_value,
        MIN(created_at) as first_order,
        MAX(created_at) as last_order
      FROM orders
    `);
    
    console.log('\n📈 ESTADÍSTICAS DISPONIBLES:');
    console.log(`  - Total pedidos: ${orderStats[0].total_orders}`);
    console.log(`  - Ingresos totales: $${orderStats[0].total_revenue}`);
    console.log(`  - Ticket promedio: $${parseFloat(orderStats[0].avg_order_value).toFixed(2)}`);
    console.log(`  - Primer pedido: ${orderStats[0].first_order}`);
    console.log(`  - Último pedido: ${orderStats[0].last_order}`);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await connection.end();
  }
}

analyzeData();