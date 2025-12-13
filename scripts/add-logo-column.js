const mysql = require('mysql2/promise');

const dbConfig = {
  host: 'srv440.hstgr.io',
  port: 3306,
  user: 'u191251575_manu',
  password: 'Cerounocero.com20182417',
  database: 'u191251575_manu'
};

async function addLogoColumn() {
  let connection;
  
  try {
    console.log('🔗 Conectando a la base de datos...');
    connection = await mysql.createConnection(dbConfig);
    
    console.log('✅ Conexión establecida');
    
    // Verificar si la columna ya existe
    const [columns] = await connection.execute(`
      SELECT COLUMN_NAME 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = 'u191251575_manu' 
      AND TABLE_NAME = 'business_info' 
      AND COLUMN_NAME = 'logo_url'
    `);
    
    if (columns.length === 0) {
      // Agregar columna logo_url
      await connection.execute(`
        ALTER TABLE business_info 
        ADD COLUMN logo_url VARCHAR(255) NULL AFTER whatsapp
      `);
      console.log('✅ Columna logo_url agregada a business_info');
    } else {
      console.log('ℹ️  La columna logo_url ya existe');
    }
    
    // Verificar la estructura actual
    const [structure] = await connection.execute('DESCRIBE business_info');
    console.log('📋 Estructura actual de business_info:');
    structure.forEach(col => {
      console.log(`  - ${col.Field}: ${col.Type} (${col.Null === 'YES' ? 'NULL' : 'NOT NULL'})`);
    });
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    if (connection) {
      await connection.end();
      console.log('🔌 Conexión cerrada');
    }
  }
}

addLogoColumn();