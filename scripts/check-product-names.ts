import mysql from 'mysql2/promise';

const dbConfig = {
  host: process.env.DB_HOST || 'srv440.hstgr.io',
  user: process.env.DB_USER || 'u191251575_manu',
  password: process.env.DB_PASSWORD || 'Cerounocero.com20182417',
  database: process.env.DB_NAME || 'u191251575_manu',
};

async function checkNames() {
  const connection = await mysql.createConnection(dbConfig);
  
  const [rows]: any = await connection.execute(
    'SELECT id, name, category_id FROM products ORDER BY category_id, id'
  );
  
  console.log('📋 Productos en la base de datos:\n');
  rows.forEach((row: any) => {
    console.log(`ID: ${row.id} | Cat: ${row.category_id} | "${row.name}"`);
  });
  
  await connection.end();
}

checkNames();
