const mysql = require('mysql2/promise');

(async () => {
  const conn = await mysql.createConnection({
    host: 'srv440.hstgr.io',
    user: 'u191251575_manu',
    password: 'Cerounocero.com20182417',
    database: 'u191251575_manu'
  });
  
  console.log('📊 Estructura de la tabla categories:\n');
  const [structure] = await conn.execute('DESCRIBE categories');
  console.table(structure);
  
  console.log('\n📋 Datos actuales de categories:\n');
  const [categories] = await conn.execute('SELECT * FROM categories');
  console.table(categories);
  
  await conn.end();
})();
