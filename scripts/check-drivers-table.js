const mysql = require('mysql2/promise')
require('dotenv').config({ path: '.env.local' })

async function checkDrivers() {
  console.log('🔗 Conectando a:', {
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    database: process.env.DB_NAME
  })
  
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: parseInt(process.env.DB_PORT || '3306')
  })

  try {
    console.log('🔍 Verificando tablas de drivers...\n')

    // Verificar si existe la tabla drivers
    const [tables] = await connection.execute(
      "SHOW TABLES LIKE 'drivers'"
    )
    console.log('📊 Tabla drivers existe:', tables.length > 0)

    if (tables.length > 0) {
      // Ver estructura de la tabla
      const [structure] = await connection.execute('DESCRIBE drivers')
      console.log('\n📋 Estructura de la tabla drivers:')
      console.table(structure)

      // Ver contenido
      const [drivers] = await connection.execute('SELECT * FROM drivers')
      console.log('\n✅ Drivers en la tabla:')
      console.table(drivers)
    }

    // Ver usuarios que son drivers
    const [users] = await connection.execute(
      'SELECT id, username, email, is_driver FROM users WHERE is_driver = 1'
    )
    console.log('\n👥 Usuarios con is_driver = 1:')
    console.table(users)

    // Intentar el JOIN que usa el código
    const [joinResult] = await connection.execute(
      'SELECT d.id as driver_id, d.user_id, u.username, u.is_driver FROM drivers d JOIN users u ON d.user_id = u.id WHERE d.id = 3 OR d.user_id = 3'
    )
    console.log('\n🔗 Resultado del JOIN con ID 3:')
    console.table(joinResult)

  } catch (error) {
    console.error('❌ Error:', error.message)
  } finally {
    await connection.end()
  }
}

checkDrivers()
