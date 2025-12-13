import mysql from 'mysql2/promise'
import { config } from 'dotenv'
import { resolve } from 'path'

config({ path: resolve(process.cwd(), '.env.local') })

async function verifyProductionDatabase() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
  })

  try {
    console.log('🔍 VERIFICANDO BASE DE DATOS PARA PRODUCCIÓN\n')
    console.log('=' .repeat(60))
    
    // Tablas requeridas para el sistema
    const requiredTables = [
      'users',
      'products',
      'categories',
      'orders',
      'chat_conversations',
      'chat_messages',
      'drivers',
      'stock_changes',
      'inventory_movements'
    ]

    console.log('\n📊 TABLAS EXISTENTES:')
    const [tables] = await connection.query('SHOW TABLES')
    const existingTables = (tables as any[]).map(t => Object.values(t)[0])
    
    for (const table of requiredTables) {
      const exists = existingTables.includes(table)
      console.log(`${exists ? '✅' : '❌'} ${table}${!exists ? ' - FALTA CREAR' : ''}`)
    }

    // Verificar estructura de tabla users
    console.log('\n👤 ESTRUCTURA DE TABLA USERS:')
    const [userColumns] = await connection.query('DESCRIBE users')
    const userCols = (userColumns as any[]).map(c => c.Field)
    const requiredUserCols = ['id', 'username', 'email', 'password', 'full_name', 'phone', 'is_admin', 'is_driver', 'active', 'last_login', 'created_at']
    
    for (const col of requiredUserCols) {
      const exists = userCols.includes(col)
      console.log(`${exists ? '✅' : '❌'} ${col}`)
    }

    // Verificar estructura de tabla products
    console.log('\n📦 ESTRUCTURA DE TABLA PRODUCTS:')
    const [productColumns] = await connection.query('DESCRIBE products')
    const productCols = (productColumns as any[]).map(c => c.Field)
    const requiredProductCols = ['id', 'name', 'description', 'price', 'stock', 'image_url', 'category_id', 'is_available', 'is_featured', 'created_at']
    
    for (const col of requiredProductCols) {
      const exists = productCols.includes(col)
      console.log(`${exists ? '✅' : '❌'} ${col}`)
    }

    // Verificar estructura de tabla orders
    console.log('\n🛒 ESTRUCTURA DE TABLA ORDERS:')
    const [orderColumns] = await connection.query('DESCRIBE orders')
    const orderCols = (orderColumns as any[]).map(c => c.Field)
    const requiredOrderCols = ['id', 'user_id', 'items', 'total', 'status', 'customer_info', 'driver_id', 'delivery_type', 'created_at']
    
    for (const col of requiredOrderCols) {
      const exists = orderCols.includes(col)
      console.log(`${exists ? '✅' : '❌'} ${col}`)
    }

    // Contar registros
    console.log('\n📈 ESTADÍSTICAS:')
    const [userCount] = await connection.query('SELECT COUNT(*) as count FROM users') as any
    const [productCount] = await connection.query('SELECT COUNT(*) as count FROM products') as any
    const [categoryCount] = await connection.query('SELECT COUNT(*) as count FROM categories') as any
    const [orderCount] = await connection.query('SELECT COUNT(*) as count FROM orders') as any
    
    console.log(`👤 Usuarios: ${userCount[0].count}`)
    console.log(`📦 Productos: ${productCount[0].count}`)
    console.log(`🏷️  Categorías: ${categoryCount[0].count}`)
    console.log(`🛒 Órdenes: ${orderCount[0].count}`)

    // Verificar índices importantes
    console.log('\n🔑 ÍNDICES IMPORTANTES:')
    const [indexes] = await connection.query(`
      SELECT TABLE_NAME, INDEX_NAME, COLUMN_NAME 
      FROM INFORMATION_SCHEMA.STATISTICS 
      WHERE TABLE_SCHEMA = ? 
      AND INDEX_NAME != 'PRIMARY'
      ORDER BY TABLE_NAME, INDEX_NAME
    `, [process.env.DB_NAME])
    
    console.log((indexes as any[]).map(i => `  ${i.TABLE_NAME}.${i.COLUMN_NAME} (${i.INDEX_NAME})`).join('\n'))

    console.log('\n' + '='.repeat(60))
    console.log('✅ VERIFICACIÓN COMPLETADA')
    
  } catch (error: any) {
    console.error('❌ Error:', error.message)
  } finally {
    await connection.end()
  }
}

verifyProductionDatabase()
