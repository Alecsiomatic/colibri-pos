const mysql = require('mysql2/promise');

async function testMySQLConnection() {
  console.log('🔌 Probando conexión a MySQL...');
  
  const config = {
    host: 'srv440.hstgr.io',
    user: 'u191251575_manu',
    password: 'Cerounocero.com20182417',
    database: 'u191251575_manu',
    port: 3306
  };

  try {
    const connection = await mysql.createConnection(config);
    console.log('✅ Conexión exitosa a MySQL!');
    
    // Probar una consulta simple
    const [rows] = await connection.execute('SELECT 1 as test');
    console.log('✅ Consulta de prueba exitosa:', rows);
    
    // Mostrar tablas existentes
    const [tables] = await connection.execute('SHOW TABLES');
    console.log('📊 Tablas existentes:');
    tables.forEach((table, index) => {
      const tableName = Object.values(table)[0];
      console.log(`  ${index + 1}. ${tableName}`);
    });
    
    await connection.end();
    console.log('🎉 Test de conexión completado!');
    
  } catch (error) {
    console.error('❌ Error de conexión:', error.message);
    console.error('💡 Verifica:');
    console.error('   - Credenciales de la base de datos');
    console.error('   - Conectividad de red');
    console.error('   - Permisos del usuario de la BD');
  }
}

testMySQLConnection();