const mysql = require('mysql2/promise');

async function testDriverLogin() {
  console.log('🚗 Probando login de repartidor...\n');
  
  const config = {
    host: 'srv440.hstgr.io',
    user: 'u191251575_manu',
    password: 'Cerounocero.com20182417',
    database: 'u191251575_manu',
    port: 3306
  };

  try {
    const connection = await mysql.createConnection(config);
    
    // Ver drivers registrados
    console.log('👥 DRIVERS REGISTRADOS:');
    console.log('='.repeat(50));
    
    const [drivers] = await connection.execute(`
      SELECT id, username, email, password, is_driver, is_admin, active, created_at
      FROM users 
      WHERE is_driver = 1
      ORDER BY id
    `);
    
    if (drivers.length > 0) {
      drivers.forEach(driver => {
        console.log(`ID: ${driver.id}`);
        console.log(`Username: ${driver.username}`);
        console.log(`Email: ${driver.email}`);
        console.log(`Password Hash: ${driver.password.substring(0, 20)}...`);
        console.log(`is_driver: ${driver.is_driver}`);
        console.log(`is_admin: ${driver.is_admin}`);
        console.log(`Active: ${driver.active}`);
        console.log(`Created: ${driver.created_at}`);
        console.log('-'.repeat(30));
      });
    } else {
      console.log('❌ No hay drivers registrados');
    }
    
    // Ver sesiones activas de drivers
    console.log('\n🔑 SESIONES ACTIVAS DE DRIVERS:');
    console.log('='.repeat(50));
    
    const [sessions] = await connection.execute(`
      SELECT s.id, s.user_id, u.username, u.email, s.session_token, s.expires_at, s.created_at
      FROM user_sessions s 
      JOIN users u ON s.user_id = u.id 
      WHERE u.is_driver = 1 AND s.expires_at > NOW()
      ORDER BY s.created_at DESC
      LIMIT 5
    `);
    
    if (sessions.length > 0) {
      sessions.forEach(session => {
        console.log(`Usuario: ${session.username} (${session.email})`);
        console.log(`Token: ${session.session_token.substring(0, 30)}...`);
        console.log(`Expira: ${session.expires_at}`);
        console.log(`Creada: ${session.created_at}`);
        console.log('-'.repeat(30));
      });
    } else {
      console.log('❌ No hay sesiones activas de drivers');
    }
    
    // Verificar tabla delivery_drivers
    console.log('\n📦 TABLA DELIVERY_DRIVERS:');
    console.log('='.repeat(50));
    
    try {
      const [deliveryDrivers] = await connection.execute(`
        SELECT dd.*, u.username, u.email
        FROM delivery_drivers dd
        LEFT JOIN users u ON dd.user_id = u.id
        ORDER BY dd.id
      `);
      
      if (deliveryDrivers.length > 0) {
        deliveryDrivers.forEach(dd => {
          console.log(`ID: ${dd.id}`);
          console.log(`User ID: ${dd.user_id}`);
          console.log(`Username: ${dd.username || 'NO ASOCIADO'}`);
          console.log(`Email: ${dd.email || 'NO ASOCIADO'}`);
          console.log(`Name: ${dd.name}`);
          console.log(`Phone: ${dd.phone}`);
          console.log(`Active: ${dd.is_active}`);
          console.log(`Available: ${dd.is_available}`);
          console.log('-'.repeat(30));
        });
      } else {
        console.log('❌ No hay registros en delivery_drivers');
      }
    } catch (error) {
      console.log('❌ Error accediendo a delivery_drivers:', error.message);
    }
    
    await connection.end();
    console.log('\n✅ Verificación completada!');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

testDriverLogin();