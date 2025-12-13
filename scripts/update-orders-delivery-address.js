const mysql = require('mysql2/promise')
require('dotenv').config({ path: '.env.local' })

;(async () => {
  try {
    const conn = await mysql.createConnection({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME
    })
    
    const [rows] = await conn.execute('DESCRIBE orders')
    console.log('Columnas actuales en orders:')
    rows.forEach(r => console.log(`  - ${r.Field} (${r.Type})`))
    
    const hasDeliveryAddress = rows.some(r => r.Field === 'delivery_address')
    
    if (hasDeliveryAddress) {
      await conn.execute('ALTER TABLE orders MODIFY COLUMN delivery_address JSON NULL')
      console.log('\n✅ Columna delivery_address convertida a JSON')
    } else {
      await conn.execute('ALTER TABLE orders ADD COLUMN delivery_address JSON NULL')
      console.log('\n✅ Columna delivery_address agregada como JSON')
    }
    
    await conn.end()
  } catch (error) {
    console.error('❌ Error:', error.message)
    process.exit(1)
  }
})()
