import { createUser, authenticateUser, getUserByEmail } from '../lib/mysql-db'
import bcrypt from 'bcryptjs'

async function createAdminUser() {
  try {
    console.log('🔐 Creando usuario administrador...')

    // Verificar si ya existe un admin con el email
    let existingUser = null
    try {
      existingUser = await getUserByEmail('admin@supernova.com')
    } catch (error) {
      // Usuario no existe, podemos continuar
    }

    if (existingUser) {
      console.log('✅ Ya existe un usuario admin:', existingUser)
      return
    }

    // Crear usuario admin usando la función existente
    const result = await createUser('admin@supernova.com', 'admin123', {
      username: 'admin',
      full_name: 'Administrador Supernova',
      phone: '+1234567890',
      is_admin: true,
      is_driver: false,
      active: true
    })

    if (result.success) {
      console.log('✅ Usuario admin creado correctamente!')
      console.log('📝 Credenciales de acceso:')
      console.log('   Email: admin@supernova.com')
      console.log('   Password: admin123')
      console.log('🌐 Accede en: http://localhost:3002/login')
    } else {
      console.log('❌ Error:', result.message)
    }

  } catch (error) {
    console.error('❌ Error creando usuario admin:', error)
  }
}

// Ejecutar
createAdminUser()