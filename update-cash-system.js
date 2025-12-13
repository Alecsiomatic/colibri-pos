const mysql = require('mysql2/promise')
require('dotenv').config({ path: '.env.local' })

async function updateDatabase() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: process.env.DB_PORT || 3306,
  })

  try {
    console.log('🔄 Actualizando base de datos...')

    // Actualizar transaction_type para incluir cash_in y cash_out
    console.log('📝 Actualizando tipos de transacción...')
    await connection.query(`
      ALTER TABLE cash_transactions 
      MODIFY COLUMN transaction_type ENUM('sale', 'refund', 'adjustment', 'opening', 'closing', 'cash_in', 'cash_out') NOT NULL
    `)

    // Agregar total_orders si no existe
    console.log('📝 Verificando columna total_orders...')
    const [columns] = await connection.query(`
      SELECT COLUMN_NAME 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'cash_shifts' AND COLUMN_NAME = 'total_orders'
    `, [process.env.DB_NAME])

    if (columns.length === 0) {
      console.log('➕ Agregando columna total_orders...')
      await connection.query(`
        ALTER TABLE cash_shifts 
        ADD COLUMN total_orders INT DEFAULT 0 AFTER mercadopago_sales
      `)
    }

    console.log('✅ Base de datos actualizada correctamente')
  } catch (error) {
    console.error('❌ Error:', error.message)
  } finally {
    await connection.end()
  }
}

updateDatabase()
