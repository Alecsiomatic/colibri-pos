const mysql = require('mysql2/promise');

async function checkTableStructures() {
  console.log('🔍 VERIFICANDO ESTRUCTURA DE TABLAS');
  console.log('===================================\n');

  try {
    const connection = await mysql.createConnection({
      host: 'srv440.hstgr.io',
      user: 'u191251575_manu', 
      password: 'Cerounocero.com20182417',
      database: 'u191251575_manu',
      port: 3306
    });

    // Verificar estructura de products
    console.log('📋 Estructura tabla PRODUCTS:');
    const [productsCols] = await connection.execute('DESCRIBE products');
    productsCols.forEach(col => {
      console.log(`   ${col.Field} (${col.Type}) ${col.Null === 'YES' ? 'NULL' : 'NOT NULL'}`);
    });

    // Verificar estructura de categories  
    console.log('\n📋 Estructura tabla CATEGORIES:');
    const [categoriesCols] = await connection.execute('DESCRIBE categories');
    categoriesCols.forEach(col => {
      console.log(`   ${col.Field} (${col.Type}) ${col.Null === 'YES' ? 'NULL' : 'NOT NULL'}`);
    });

    // Verificar estructura de users
    console.log('\n📋 Estructura tabla USERS:');
    const [usersCols] = await connection.execute('DESCRIBE users');
    usersCols.forEach(col => {
      console.log(`   ${col.Field} (${col.Type}) ${col.Null === 'YES' ? 'NULL' : 'NOT NULL'}`);
    });

    await connection.end();
    
  } catch (error) {
    console.error('❌ ERROR:', error.message);
  }
}

checkTableStructures();