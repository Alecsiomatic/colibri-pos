const mysql = require('mysql2/promise')
require('dotenv').config({ path: '.env.local' })

async function createDemoTables() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
  })

  try {
    console.log('🔗 Conectado a la base de datos')

    // Primero, obtener el ID del mesero
    const [meseros] = await connection.execute(
      'SELECT id FROM users WHERE email = ? LIMIT 1',
      ['mesero@supernova.com']
    )

    if (meseros.length === 0) {
      console.error('❌ No se encontró el usuario mesero')
      return
    }

    const meseroId = meseros[0].id

    // Crear algunas órdenes de mesa abiertas (status = 'open_table')
    const mesas = [
      { table: 'Mesa 1', items: [{ name: 'Café Espresso', price: 30.00, quantity: 2 }], total: 60.00 },
      { table: 'Mesa 3', items: [{ name: 'Capuchino', price: 35.00, quantity: 1 }, { name: 'Agua Natural', price: 15.00, quantity: 2 }], total: 65.00 },
      { table: 'Mesa 5', items: [{ name: 'Café Espresso', price: 30.00, quantity: 3 }], total: 90.00 }
    ]

    for (const mesa of mesas) {
      const result = await connection.execute(
        `INSERT INTO orders 
        (user_id, customer_name, payment_method, status, items, total, notes, table_name, waiter_order, created_at) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
        [
          15, // ID del mesero mesero@supernova.com
          `Cuenta ${mesa.table}`,
          'efectivo',
          'open_table',
          JSON.stringify(mesa.items),
          mesa.total,
          'Mesa abierta - demo',
          mesa.table,
          1
        ]
      )
      console.log(`✅ ${mesa.table} creada (ID: ${result[0].insertId}) con total $${mesa.total}`)
    }

    console.log('\n✨ Mesas demo creadas exitosamente!')
    console.log('Ahora puedes acceder con mesero@supernova.com y verás las mesas abiertas')

  } catch (error) {
    console.error('❌ Error:', error.message)
  } finally {
    await connection.end()
  }
}

createDemoTables()
