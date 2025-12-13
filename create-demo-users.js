const mysql = require('mysql2/promise')
const bcrypt = require('bcryptjs')

async function createDemoUsers() {
  const connection = await mysql.createConnection({
    host: 'srv440.hstgr.io',
    user: 'u472469844_supernova_us',
    password: 'Hablandodelaestrategiaa12',
    database: 'u472469844_supernova_db',
    charset: 'utf8mb4'
  })

  try {
    console.log('🔗 Conectado a la base de datos')

    // Contraseña hasheada para "admin123"
    const hashedPassword = await bcrypt.hash('admin123', 10)

    const users = [
      {
        email: 'admin@supernova.com',
        username: 'Admin',
        password: hashedPassword,
        is_admin: 1,
        is_driver: 0,
        is_waiter: 0
      },
      {
        email: 'cajero@supernova.com',
        username: 'Cajero',
        password: hashedPassword,
        is_admin: 0,
        is_driver: 0,
        is_waiter: 0
      },
      {
        email: 'mesero@supernova.com',
        username: 'Mesero',
        password: hashedPassword,
        is_admin: 0,
        is_driver: 0,
        is_waiter: 1
      },
      {
        email: 'driver@supernova.com',
        username: 'Repartidor',
        password: hashedPassword,
        is_admin: 0,
        is_driver: 1,
        is_waiter: 0
      }
    ]

    for (const user of users) {
      // Verificar si el usuario ya existe
      const [existing] = await connection.execute(
        'SELECT id FROM users WHERE email = ?',
        [user.email]
      )

      if (existing.length > 0) {
        // Actualizar usuario existente
        await connection.execute(
          `UPDATE users SET 
            username = ?,
            password = ?,
            is_admin = ?,
            is_driver = ?,
            is_waiter = ?
          WHERE email = ?`,
          [user.username, user.password, user.is_admin, user.is_driver, user.is_waiter, user.email]
        )
        console.log(`✅ Usuario actualizado: ${user.email}`)
      } else {
        // Insertar nuevo usuario
        await connection.execute(
          `INSERT INTO users (email, username, password, is_admin, is_driver, is_waiter) 
           VALUES (?, ?, ?, ?, ?, ?)`,
          [user.email, user.username, user.password, user.is_admin, user.is_driver, user.is_waiter]
        )
        console.log(`✨ Usuario creado: ${user.email}`)
      }
    }

    console.log('\n🎉 Usuarios demo creados/actualizados exitosamente!')
    console.log('\n📋 Credenciales de acceso:')
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    console.log('👨‍💼 Admin:      admin@supernova.com')
    console.log('💰 Cajero:     cajero@supernova.com')
    console.log('🍽️  Mesero:     mesero@supernova.com')
    console.log('🚚 Repartidor: driver@supernova.com')
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    console.log('🔐 Contraseña para todos: admin123')
    console.log('')

  } catch (error) {
    console.error('❌ Error:', error)
  } finally {
    await connection.end()
  }
}

createDemoUsers()
