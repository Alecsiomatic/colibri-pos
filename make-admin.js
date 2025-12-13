const mysql = require('mysql2/promise')

const dbConfig = {
  host: 'srv440.hstgr.io',
  user: 'u191251575_manu',
  password: 'Cerounocero.com20182417',
  database: 'u191251575_manu',
  port: 3306,
}

async function makeUserAdmin() {
  let connection = null
  try {
    console.log('🔐 Conectando a la base de datos...')
    connection = await mysql.createConnection(dbConfig)
    console.log('✅ Conectado exitosamente')

    // Buscar el usuario con email admin@supernova.com
    const [users] = await connection.execute(
      'SELECT * FROM users WHERE email = ?',
      ['admin@supernova.com']
    )

    if (users.length === 0) {
      console.log('❌ Usuario admin@supernova.com no encontrado')
      return
    }

    const user = users[0]
    console.log('👤 Usuario encontrado:')
    console.log('   ID:', user.id)
    console.log('   Email:', user.email)
    console.log('   Username actual:', user.username)
    console.log('   is_admin actual:', user.is_admin)

    // Actualizar para hacerlo admin y cambiar username
    await connection.execute(
      'UPDATE users SET is_admin = 1, username = ? WHERE id = ?',
      ['superadmin', user.id]
    )

    console.log('✅ Usuario actualizado exitosamente!')
    console.log('📝 Nuevas credenciales:')
    console.log('   Email: admin@supernova.com')
    console.log('   Username: superadmin')
    console.log('   Password: admin123')
    console.log('   is_admin: 1 (TRUE)')
    console.log('🌐 Accede en: http://localhost:3002/login')

  } catch (error) {
    console.error('❌ Error:', error.message)
  } finally {
    if (connection) {
      await connection.end()
    }
  }
}

// Ejecutar
makeUserAdmin()