import mysql from 'mysql2/promise'
import { config } from 'dotenv'
import { resolve } from 'path'

// Cargar variables de entorno
config({ path: resolve(process.cwd(), '.env.local') })

async function updateUsersTable() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
  })

  try {
    console.log('Adding missing columns to users table...')
    
    // Agregar columnas una por una (ignorar errores si ya existen)
    const columnsToAdd = [
      { name: 'full_name', sql: 'ADD COLUMN full_name VARCHAR(255) NULL AFTER username' },
      { name: 'phone', sql: 'ADD COLUMN phone VARCHAR(20) NULL AFTER full_name' },
      { name: 'is_driver', sql: 'ADD COLUMN is_driver TINYINT(1) DEFAULT 0 AFTER is_admin' },
      { name: 'active', sql: 'ADD COLUMN active TINYINT(1) DEFAULT 1 AFTER is_driver' },
      { name: 'last_login', sql: 'ADD COLUMN last_login TIMESTAMP NULL AFTER active' },
    ]

    for (const col of columnsToAdd) {
      try {
        await connection.query(`ALTER TABLE users ${col.sql}`)
        console.log(`✓ Added column: ${col.name}`)
      } catch (error: any) {
        if (error.code === 'ER_DUP_FIELDNAME') {
          console.log(`- Column ${col.name} already exists`)
        } else {
          console.error(`✗ Error adding ${col.name}:`, error.message)
        }
      }
    }

    console.log('\nVerifying table structure...')
    const [columns] = await connection.query('DESCRIBE users')
    console.log('Users table now has:', columns)
    
    console.log('\n✅ Users table updated successfully!')
  } catch (error) {
    console.error('Error:', error)
  } finally {
    await connection.end()
  }
}

updateUsersTable()
