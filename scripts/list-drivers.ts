import mysql from 'mysql2/promise'

async function listDrivers() {
  const connection = await mysql.createConnection({
    host: 'srv440.hstgr.io',
    user: 'u191251575_manu',
    password: 'Manu1234',
    database: 'u191251575_manu'
  })

  try {
    console.log('\n🚚 REPARTIDORES REGISTRADOS\n')
    console.log('─'.repeat(80))

    const [drivers] = await connection.execute<any>(
      `SELECT 
        dd.id, 
        dd.user_id, 
        dd.name, 
        dd.phone, 
        dd.vehicle_type,
        dd.is_available,
        dd.created_at,
        u.email,
        u.is_driver
      FROM delivery_drivers dd
      LEFT JOIN users u ON dd.user_id = u.id
      ORDER BY dd.id`
    )

    if (!drivers || drivers.length === 0) {
      console.log('\n❌ No hay repartidores registrados.')
      console.log('\n💡 Para crear uno, ejecuta: npm run create-driver\n')
      return
    }

    drivers.forEach((driver: any, index: number) => {
      const status = driver.is_available ? '✅ DISPONIBLE' : '⛔ NO DISPONIBLE'
      const userFlag = driver.is_driver ? '✅' : '❌'
      
      console.log(`\n[${index + 1}] Repartidor ID: ${driver.id}`)
      console.log(`    👤 Nombre: ${driver.name}`)
      console.log(`    📞 Teléfono: ${driver.phone || 'N/A'}`)
      console.log(`    🚗 Vehículo: ${driver.vehicle_type || 'N/A'}`)
      console.log(`    📧 Email: ${driver.email || 'N/A'}`)
      console.log(`    🆔 User ID: ${driver.user_id || 'N/A'}`)
      console.log(`    👨‍💼 Flag is_driver en users: ${userFlag}`)
      console.log(`    📊 Estado: ${status}`)
      console.log(`    📅 Creado: ${driver.created_at ? new Date(driver.created_at).toLocaleString('es-CL') : 'N/A'}`)
    })

    console.log('\n' + '─'.repeat(80))
    console.log(`\nTotal: ${drivers.length} repartidor(es)`)
    console.log(`Disponibles: ${drivers.filter((d: any) => d.is_available).length}`)
    console.log(`No disponibles: ${drivers.filter((d: any) => !d.is_available).length}`)
    
    console.log('\n💡 Comandos útiles:')
    console.log('   - Marcar como disponible: npm run set-driver-available')
    console.log('   - Crear nuevo repartidor: npm run create-driver\n')

  } catch (error: any) {
    console.error('❌ Error:', error.message)
  } finally {
    await connection.end()
  }
}

listDrivers()
