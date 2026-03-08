const mysql = require('mysql2/promise');

async function arreglarAsociacionDrivers() {
  console.log('🔧 Arreglando asociación de drivers en base de datos...\n');
  
  const config = {
    host: 'srv440.hstgr.io',
    user: 'u191251575_manu',
    password: 'Cerounocero.com20182417',
    database: 'u191251575_manu',
    port: 3306
  };

  try {
    const connection = await mysql.createConnection(config);
    
    // Ver estado actual
    console.log('📊 ESTADO ACTUAL:');
    console.log('='.repeat(50));
    
    const [userDrivers] = await connection.execute(`
      SELECT id, username, email FROM users WHERE is_driver = 1
    `);
    
    const [deliveryDrivers] = await connection.execute(`
      SELECT id, user_id, name, email FROM delivery_drivers
    `);
    
    console.log('Drivers en users:');
    userDrivers.forEach(user => {
      console.log(`  ${user.id}: ${user.username} (${user.email})`);
    });
    
    console.log('\nDrivers en delivery_drivers:');
    deliveryDrivers.forEach(driver => {
      console.log(`  ${driver.id}: ${driver.name} (${driver.email}) - user_id: ${driver.user_id || 'NULL'}`);
    });
    
    // Hacer las asociaciones
    console.log('\n🔗 ASOCIANDO DRIVERS:');
    console.log('='.repeat(50));
    
    // Asociar User 4 (smart_star_758) → Driver 1
    if (userDrivers.length > 0 && deliveryDrivers.length > 0) {
      const user1 = userDrivers.find(u => u.id === 4); // smart_star_758
      const user2 = userDrivers.find(u => u.id === 7); // calm_user_36
      
      if (user1) {
        await connection.execute(
          'UPDATE delivery_drivers SET user_id = ?, email = ? WHERE id = 1',
          [user1.id, user1.email]
        );
        console.log(`✅ Asociado Driver 1 → User ${user1.id} (${user1.username})`);
      }
      
      if (user2) {
        await connection.execute(
          'UPDATE delivery_drivers SET user_id = ?, email = ? WHERE id = 2',
          [user2.id, user2.email]
        );
        console.log(`✅ Asociado Driver 2 → User ${user2.id} (${user2.username})`);
      }
    }
    
    // Verificar resultado
    console.log('\n✅ RESULTADO FINAL:');
    console.log('='.repeat(50));
    
    const [finalDrivers] = await connection.execute(`
      SELECT dd.id, dd.user_id, dd.name, dd.email as driver_email, 
             u.username, u.email as user_email, u.is_driver
      FROM delivery_drivers dd
      LEFT JOIN users u ON dd.user_id = u.id
      ORDER BY dd.id
    `);
    
    finalDrivers.forEach(driver => {
      const status = driver.user_id ? '✅' : '❌';
      console.log(`${status} Driver ${driver.id}: ${driver.name}`);
      console.log(`   user_id: ${driver.user_id || 'NULL'}`);
      console.log(`   username: ${driver.username || 'NO ASOCIADO'}`);
      console.log(`   email: ${driver.user_email || driver.driver_email}`);
      console.log('');
    });
    
    await connection.end();
    console.log('🎉 Asociación completada exitosamente!');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

arreglarAsociacionDrivers();