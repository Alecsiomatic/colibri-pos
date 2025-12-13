import bcrypt from 'bcryptjs'
import mysql from 'mysql2/promise'
import readline from 'readline'

const dbConfig = {
  host: 'srv440.hstgr.io',
  user: 'u191251575_manu',
  password: 'Cerounocero.com20182417',
  database: 'u191251575_manu'
}

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
})

function question(query: string): Promise<string> {
  return new Promise(resolve => rl.question(query, resolve))
}

async function createDriver() {
  try {
    console.log('\n🚚 Crear Nuevo Repartidor\n')
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n')

    const name = await question('Nombre completo: ')
    const email = await question('Email: ')
    const password = await question('Contraseña: ')
    const phone = await question('Teléfono (opcional): ')

    if (!name || !email || !password) {
      console.error('❌ Nombre, email y contraseña son obligatorios')
      rl.close()
      return
    }

    console.log('\n⏳ Creando repartidor...\n')

    const connection = await mysql.createConnection(dbConfig)

    // Verificar si el email ya existe
    const [existing] = await connection.execute(
      'SELECT id FROM users WHERE email = ?',
      [email]
    )

    if ((existing as any[]).length > 0) {
      console.error('❌ Error: Ya existe un usuario con ese email')
      await connection.end()
      rl.close()
      return
    }

    // Hash de la contraseña
    const hashedPassword = await bcrypt.hash(password, 10)

    // Crear el repartidor
    await connection.execute(
      `INSERT INTO users (email, password, name, phone, is_driver, role, created_at) 
       VALUES (?, ?, ?, ?, 1, 'driver', NOW())`,
      [email, hashedPassword, name, phone || null]
    )

    console.log('✅ ¡Repartidor creado exitosamente!\n')
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n')
    console.log('📋 Credenciales:')
    console.log(`   Email:    ${email}`)
    console.log(`   Password: ${password}`)
    console.log(`   Nombre:   ${name}`)
    if (phone) console.log(`   Teléfono: ${phone}`)
    console.log('\n🔗 Panel de acceso:')
    console.log('   https://tudominio.com/driver/dashboard\n')

    await connection.end()
  } catch (error) {
    console.error('❌ Error:', error)
  } finally {
    rl.close()
  }
}

createDriver()
