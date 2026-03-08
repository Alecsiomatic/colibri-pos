const mysql = require('mysql2/promise')
const bcrypt = require('bcryptjs')

const dbConfig = {
  host: 'srv440.hstgr.io',
  user: 'u191251575_manu',
  password: 'Cerounocero.com20182417',
  database: 'u191251575_manu',
  port: 3306,
}

async function createAdminUser() {
  let connection = null
  try {
    console.log('🔐 Conectando a la base de datos...')
    connection = await mysql.createConnection(dbConfig)
    console.log('✅ Conectado exitosamente')

    // Verificar si ya existe un admin
    const [existingAdmin] = await connection.execute(
      'SELECT * FROM users WHERE is_admin = 1 LIMIT 1'
    )

    if (existingAdmin.length > 0) {
      console.log('✅ Ya existe un usuario admin:')
      console.log('   ID:', existingAdmin[0].id)
      console.log('   Username:', existingAdmin[0].username)
      console.log('   Email:', existingAdmin[0].email)
      
      // Actualizar la contraseña para asegurar que sea 'admin123'
      const hashedPassword = await bcrypt.hash('admin123', 12)
      await connection.execute(
        'UPDATE users SET password = ? WHERE id = ?',
        [hashedPassword, existingAdmin[0].id]
      )
      
      console.log('� Contraseña actualizada')
      console.log('�📝 Credenciales de acceso:')
      console.log('   Email:', existingAdmin[0].email)
      console.log('   Username:', existingAdmin[0].username)
      console.log('   Password: admin123')
      console.log('🌐 Accede en: http://localhost:3002/login')
      return
    }

    // Datos del admin
    const adminData = {
      username: 'admin',
      email: 'admin@supernova.com',
      password: 'admin123',
    }

    // Hash de la contraseña
    const hashedPassword = await bcrypt.hash(adminData.password, 12)

    // Verificar si el usuario ya existe con este email
    const [existing] = await connection.execute(
      'SELECT id FROM users WHERE email = ?',
      [adminData.email]
    )

    if (existing.length > 0) {
      // Actualizar usuario existente para hacerlo admin
      await connection.execute(
        'UPDATE users SET is_admin = 1, password = ?, username = ? WHERE id = ?',
        [hashedPassword, adminData.username, existing[0].id]
      )
      console.log('✅ Usuario existente actualizado a admin')
    } else {
      // Crear nuevo usuario admin
      const [result] = await connection.execute(
        `INSERT INTO users (username, email, password, is_admin, created_at)
         VALUES (?, ?, ?, ?, NOW())`,
        [adminData.username, adminData.email, hashedPassword, true]
      )
      console.log('✅ Nuevo usuario admin creado con ID:', result.insertId)
    }

    console.log('🎉 Usuario admin configurado correctamente!')
    console.log('📝 Credenciales de acceso:')
    console.log('   Email:', adminData.email)
    console.log('   Password:', adminData.password)
    console.log('🌐 Accede en: http://localhost:3002/login')

  } catch (error) {
    console.error('❌ Error creando usuario admin:', error.message)
  } finally {
    if (connection) {
      await connection.end()
    }
  }
}

// Ejecutar
createAdminUser()