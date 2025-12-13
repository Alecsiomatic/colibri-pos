import mysql from 'mysql2/promise'
import * as readline from 'readline'

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
})

const question = (query: string): Promise<string> => {
  return new Promise((resolve) => {
    rl.question(query, resolve)
  })
}

async function setDriverAvailable() {
  const connection = await mysql.createConnection({
    host: 'srv440.hstgr.io',
    user: 'u191251575_manu',
    password: 'Manu1234',
    database: 'u191251575_manu'
  })

  try {
    console.log('\n🔍 Buscando repartidores...\n')

    const [drivers] = await connection.execute<any>(
      'SELECT id, name, phone, is_available FROM delivery_drivers'
    )

    if (!drivers || drivers.length === 0) {
      console.log('❌ No hay repartidores registrados.')
      console.log('💡 Ejecuta: npm run create-driver')
      return
    }

    console.log('📋 Repartidores registrados:\n')
    drivers.forEach((driver: any) => {
      const status = driver.is_available ? '✅ DISPONIBLE' : '⛔ NO DISPONIBLE'
      console.log(`  ID: ${driver.id} - ${driver.name} (${driver.phone || 'sin teléfono'}) - ${status}`)
    })

    console.log('\n')
    const driverId = await question('Ingresa el ID del repartidor que quieres marcar como DISPONIBLE: ')

    if (!driverId || isNaN(parseInt(driverId))) {
      console.log('❌ ID inválido')
      return
    }

    await connection.execute(
      'UPDATE delivery_drivers SET is_available = 1 WHERE id = ?',
      [parseInt(driverId)]
    )

    console.log(`\n✅ Repartidor ID ${driverId} marcado como DISPONIBLE\n`)

    // Mostrar estado actualizado
    const [updated] = await connection.execute<any>(
      'SELECT id, name, phone, is_available FROM delivery_drivers WHERE id = ?',
      [parseInt(driverId)]
    )

    if (updated && updated.length > 0) {
      const driver = updated[0]
      console.log(`📋 Estado actual:`)
      console.log(`   Nombre: ${driver.name}`)
      console.log(`   Teléfono: ${driver.phone || 'N/A'}`)
      console.log(`   Disponible: ${driver.is_available ? '✅ SÍ' : '❌ NO'}`)
    }

  } catch (error: any) {
    console.error('❌ Error:', error.message)
  } finally {
    await connection.end()
    rl.close()
  }
}

setDriverAvailable()
