import mysql from 'mysql2/promise'
import bcrypt from 'bcryptjs'

const db = mysql.createPool({
  host: 'srv440.hstgr.io',
  port: 3306,
  user: 'u191251575_manu',
  password: 'Cerounocero.com20182417',
  database: 'u191251575_manu',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
})

async function createAdminUser() {
  try {
    console.log('🔐 Creando usuario administrador...')

    // Verificar si ya existe un admin
    const [existingAdmin] = await db.execute(
      'SELECT * FROM users WHERE is_admin = 1 LIMIT 1'
    ) as any[]

    if (existingAdmin.length > 0) {
      console.log('✅ Ya existe un usuario admin:', existingAdmin[0].username)
      console.log('📧 Email:', existingAdmin[0].email)
      return
    }

    // Datos del admin
    const adminData = {
      username: 'admin',
      email: 'admin@supernova.com',
      password: 'admin123',  // Contraseña simple para testing
      full_name: 'Administrador Supernova',
      phone: '+1234567890',
      is_admin: true,
      is_driver: false,
      active: true
    }

    // Hash de la contraseña
    const hashedPassword = await bcrypt.hash(adminData.password, 10)

    // Verificar si el usuario ya existe con este username/email
    const [existing] = await db.execute(
      'SELECT id FROM users WHERE username = ? OR email = ?',
      [adminData.username, adminData.email]
    ) as any[]

    if (existing.length > 0) {
      // Actualizar usuario existente para hacerlo admin
      await db.execute(
        'UPDATE users SET is_admin = 1, password = ?, active = 1 WHERE id = ?',
        [hashedPassword, existing[0].id]
      )
      console.log('✅ Usuario existente actualizado a admin')
    } else {
      // Crear nuevo usuario admin
      const [result] = await db.execute(
        `INSERT INTO users 
         (username, email, password, full_name, phone, is_admin, is_driver, active, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
        [
          adminData.username,
          adminData.email,
          hashedPassword,
          adminData.full_name,
          adminData.phone,
          adminData.is_admin,
          adminData.is_driver,
          adminData.active
        ]
      ) as any[]

      console.log('✅ Nuevo usuario admin creado con ID:', result.insertId)
    }

    console.log('🎉 Usuario admin configurado correctamente!')
    console.log('📝 Credenciales de acceso:')
    console.log('   Username:', adminData.username)
    console.log('   Email:', adminData.email)
    console.log('   Password:', adminData.password)
    console.log('🌐 Accede en: http://localhost:3000/login')

  } catch (error) {
    console.error('❌ Error creando usuario admin:', error)
  } finally {
    await db.end()
  }
}

// Ejecutar si es llamado directamente
if (require.main === module) {
  createAdminUser()
}

export default createAdminUser