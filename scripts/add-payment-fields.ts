import mysql from 'mysql2/promise'

const dbConfig = {
  host: 'srv440.hstgr.io',
  user: 'u191251575_manu',
  password: 'Cerounocero.com20182417',
  database: 'u191251575_manu'
}

async function addPaymentFields() {
  let connection
  
  try {
    console.log('🔄 Conectando a la base de datos...')
    connection = await mysql.createConnection(dbConfig)
    
    console.log('➕ Agregando campos de pago...')
    
    // Agregar campos para Mercado Pago si no existen
    try {
      await connection.execute(`
        ALTER TABLE orders 
        ADD COLUMN IF NOT EXISTS payment_preference_id VARCHAR(255) NULL,
        ADD COLUMN IF NOT EXISTS payment_id VARCHAR(255) NULL,
        ADD COLUMN IF NOT EXISTS payment_details TEXT NULL
      `)
      console.log('✅ Campos de pago agregados exitosamente')
    } catch (error: any) {
      if (error.code === 'ER_DUP_FIELDNAME') {
        console.log('ℹ️ Los campos ya existen')
      } else {
        throw error
      }
    }
    
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    console.log('✅ Tabla actualizada correctamente')
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n')
    
  } catch (error) {
    console.error('❌ Error:', error)
    throw error
  } finally {
    if (connection) {
      await connection.end()
    }
  }
}

addPaymentFields()
