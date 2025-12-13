import mysql from 'mysql2/promise'
import { config } from 'dotenv'
import { resolve } from 'path'

// Cargar variables de entorno
config({ path: resolve(process.cwd(), '.env.local') })

async function checkUsersTable() {
  console.log('Connecting to:', {
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    database: process.env.DB_NAME,
  })
  
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'supernova_db',
    connectTimeout: 10000,
  })

  try {
    console.log('Checking users table structure...')
    const [columns] = await connection.query('DESCRIBE users')
    console.log('Users table columns:', columns)
    
    console.log('\nChecking users count...')
    const [countResult] = await connection.query('SELECT COUNT(*) as count FROM users') as any
    console.log('Total users:', countResult[0].count)
    
    console.log('\nFetching sample user...')
    const [users] = await connection.query('SELECT * FROM users LIMIT 1') as any
    console.log('Sample user:', users[0])
    
  } catch (error) {
    console.error('Error:', error)
  } finally {
    await connection.end()
  }
}

checkUsersTable()
