const mysql = require('mysql2/promise');

async function addOpenAIFields() {
  const connection = await mysql.createConnection({
    host: 'srv440.hstgr.io',
    user: 'u191251575_manu',
    password: 'Cerounocero.com20182417',
    database: 'u191251575_manu',
    port: 3306
  });

  try {
    console.log('🔧 Agregando campos de OpenAI...');

    // Verificar si las columnas ya existen
    const [columns] = await connection.execute(
      "SHOW COLUMNS FROM business_info LIKE 'openai_%'"
    );

    if (columns.length === 0) {
      // Agregar columnas de OpenAI
      await connection.execute(`
        ALTER TABLE business_info 
        ADD COLUMN openai_api_key VARCHAR(255) NULL,
        ADD COLUMN openai_model VARCHAR(50) DEFAULT 'gpt-3.5-turbo',
        ADD COLUMN enable_ai_reports BOOLEAN DEFAULT FALSE
      `);
      
      console.log('✅ Campos de OpenAI agregados correctamente');
    } else {
      console.log('ℹ️ Los campos de OpenAI ya existen');
    }

    // Mostrar estructura actualizada
    const [structure] = await connection.execute('DESCRIBE business_info');
    console.log('\n📋 Estructura actualizada de business_info:');
    structure.forEach(column => {
      console.log(`   ${column.Field}: ${column.Type} ${column.Null === 'YES' ? '(NULL)' : '(NOT NULL)'}`);
    });

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await connection.end();
  }
}

addOpenAIFields();