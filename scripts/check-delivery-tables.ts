import mysql from 'mysql2/promise'
import { config } from 'dotenv'
import { resolve } from 'path'

config({ path: resolve(process.cwd(), '.env.local') })

async function checkDeliveryTables() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
  })

  try {
    console.log('Verificando tablas de delivery...\n')
    
    const [tables] = await connection.query("SHOW TABLES LIKE '%deliver%'")
    console.log('Tablas encontradas:', tables)
    
    // Verificar tabla delivery_drivers
    try {
      const [ddCols] = await connection.query('DESCRIBE delivery_drivers')
      console.log('\nTabla delivery_drivers:', ddCols)
    } catch (e) {
      console.log('\nTabla delivery_drivers: NO EXISTE')
    }
    
    // Verificar tabla delivery_assignments
    try {
      const [daCols] = await connection.query('DESCRIBE delivery_assignments')
      console.log('\nTabla delivery_assignments:', daCols)
    } catch (e) {
      console.log('\nTabla delivery_assignments: NO EXISTE')
    }
    
    // Verificar tabla drivers
    try {
      const [dCols] = await connection.query('DESCRIBE drivers')
      console.log('\nTabla drivers:', dCols)
    } catch (e) {
      console.log('\nTabla drivers: NO EXISTE')
    }
    
  } catch (error) {
    console.error('Error:', error)
  } finally {
    await connection.end()
  }
}

checkDeliveryTables()
