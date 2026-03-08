const mysql = require('mysql2/promise');

async function debugOrders() {
  try {
    const dbConfig = {
      host: process.env.DB_HOST || 'srv440.hstgr.io',
      user: process.env.DB_USER || 'u191251575_manu',
      password: process.env.DB_PASSWORD || 'Cerounocero.com20182417',
      database: process.env.DB_NAME || 'u191251575_manu',
      port: parseInt(process.env.DB_PORT || '3306')
    };

    console.log('🔍 Analizando órdenes en la base de datos...');
    const connection = await mysql.createConnection(dbConfig);

    // Ver todas las órdenes con sus estados
    console.log('\n📊 Todas las órdenes:');
    const [allOrders] = await connection.execute(`
      SELECT id, \`table\`, unified_table_id, status, total, created_at
      FROM orders 
      ORDER BY created_at DESC
      LIMIT 10
    `);

    if (allOrders.length === 0) {
      console.log('❌ No hay órdenes en la base de datos');
    } else {
      console.log('📋 Órdenes encontradas:');
      allOrders.forEach(order => {
        console.log(`   ID: ${order.id} | Mesa: "${order.table}" | Unified: ${order.unified_table_id} | Status: "${order.status}" | Total: $${order.total} | Fecha: ${order.created_at}`);
      });
    }

    // Ver estados únicos
    console.log('\n🏷️ Estados únicos en la base de datos:');
    const [statuses] = await connection.execute(`
      SELECT DISTINCT status, COUNT(*) as count
      FROM orders 
      GROUP BY status
    `);

    statuses.forEach(status => {
      console.log(`   "${status.status}": ${status.count} órdenes`);
    });

    // Ver mesas únicas
    console.log('\n🏠 Mesas únicas:');
    const [tables] = await connection.execute(`
      SELECT 
        COALESCE(\`table\`, CONCAT('UNIFIED-', unified_table_id), 'SIN-MESA') as mesa,
        COUNT(*) as ordenes,
        SUM(total) as total_mesa,
        GROUP_CONCAT(DISTINCT status) as estados
      FROM orders 
      GROUP BY COALESCE(\`table\`, unified_table_id, 'SIN-MESA')
    `);

    tables.forEach(table => {
      console.log(`   Mesa: "${table.mesa}" | Órdenes: ${table.ordenes} | Total: $${parseFloat(table.total_mesa).toFixed(2)} | Estados: ${table.estados}`);
    });

    await connection.end();

  } catch (error) {
    console.error('❌ Error analizando órdenes:', error);
  }
}

debugOrders();