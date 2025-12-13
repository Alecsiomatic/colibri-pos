const mysql = require('mysql2/promise');
require('dotenv').config({ path: '.env.local' });

async function addCostPriceColumn() {
  let connection;
  
  try {
    console.log('🔌 Conectando a la base de datos...');
    
    connection = await mysql.createConnection({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
      port: parseInt(process.env.DB_PORT || '3306'),
      charset: 'utf8mb4',
      connectTimeout: 60000,
      acquireTimeout: 60000,
      timeout: 60000,
      ssl: false
    });

    console.log('✅ Conexión establecida');

    // Verificar si la columna ya existe
    console.log('🔍 Verificando si la columna cost_price ya existe...');
    const [columns] = await connection.execute(`
      SELECT COLUMN_NAME 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'products' AND COLUMN_NAME = 'cost_price'
    `, [process.env.DB_NAME]);

    if (columns.length > 0) {
      console.log('⚠️  La columna cost_price ya existe en la tabla products');
      return;
    }

    // Agregar la columna cost_price
    console.log('📊 Agregando columna cost_price a la tabla products...');
    await connection.execute(`
      ALTER TABLE products 
      ADD COLUMN cost_price DECIMAL(10,2) DEFAULT 0.00 
      COMMENT 'Precio de costo del producto para cálculo de ganancias'
    `);

    console.log('✅ Columna cost_price agregada exitosamente');

    // Verificar que se agregó correctamente
    console.log('🔍 Verificando estructura de la tabla...');
    const [tableInfo] = await connection.execute('DESCRIBE products');
    
    console.log('\n📋 Estructura actual de la tabla products:');
    console.table(tableInfo);

    // Mostrar algunos productos de ejemplo
    console.log('\n🛍️  Algunos productos (con nuevo campo cost_price):');
    const [products] = await connection.execute(
      'SELECT id, name, price, cost_price FROM products LIMIT 5'
    );
    
    if (products.length > 0) {
      console.table(products);
    } else {
      console.log('No hay productos en la base de datos');
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
      console.log('🔌 Conexión cerrada');
    }
  }
}

// Ejecutar el script
addCostPriceColumn();