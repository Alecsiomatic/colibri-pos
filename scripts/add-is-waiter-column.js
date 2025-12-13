require('dotenv').config({ path: '.env.local' });
const mysql = require('mysql2/promise');

async function addIsWaiterColumn() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
  });

  try {
    console.log('Agregando columna is_waiter a la tabla users...');
    await connection.query('ALTER TABLE users ADD COLUMN is_waiter TINYINT(1) DEFAULT 0 AFTER is_driver');
    await connection.query('CREATE INDEX IF NOT EXISTS idx_is_waiter ON users(is_waiter)');
    console.log('✅ Columna is_waiter agregada correctamente.');
  } catch (error) {
    if (error.code === 'ER_DUP_FIELDNAME') {
      console.log('La columna is_waiter ya existe.');
    } else {
      console.error('Error al agregar la columna:', error.message);
    }
  } finally {
    await connection.end();
  }
}

addIsWaiterColumn();
