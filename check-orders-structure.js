const mysql = require('mysql2/promise');

async function checkOrdersStructure() {
  const connection = await mysql.createConnection({
    host: 'srv440.hstgr.io',
    user: 'u191251575_manu',
    password: 'Cerounocero.com20182417',
    database: 'u191251575_manu',
    port: 3306
  });

  try {
    console.log('🔍 Verificando estructura de la tabla orders...');

    // Estructura de la tabla orders
    const [structure] = await connection.execute('DESCRIBE orders');
    console.log('\n📋 Estructura de la tabla orders:');
    structure.forEach(column => {
      console.log(`   ${column.Field}: ${column.Type} ${column.Null === 'YES' ? '(NULL)' : '(NOT NULL)'} ${column.Default ? `DEFAULT ${column.Default}` : ''}`);
    });

    // Muestra de datos
    const [sample] = await connection.execute('SELECT * FROM orders LIMIT 3');
    console.log('\n📊 Muestra de datos de orders:');
    console.log(sample);

    // Estructura de order_items si existe
    try {
      const [itemsStructure] = await connection.execute('DESCRIBE order_items');
      console.log('\n📋 Estructura de la tabla order_items:');
      itemsStructure.forEach(column => {
        console.log(`   ${column.Field}: ${column.Type} ${column.Null === 'YES' ? '(NULL)' : '(NOT NULL)'} ${column.Default ? `DEFAULT ${column.Default}` : ''}`);
      });

      const [itemsSample] = await connection.execute('SELECT * FROM order_items LIMIT 3');
      console.log('\n📊 Muestra de datos de order_items:');
      console.log(itemsSample);
    } catch (error) {
      console.log('\n⚠️ Tabla order_items no encontrada');
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await connection.end();
  }
}

checkOrdersStructure();