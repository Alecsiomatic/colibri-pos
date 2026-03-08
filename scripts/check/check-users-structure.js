const mysql = require('mysql2/promise');

async function checkUsersAndRoles() {
  console.log('🔍 Revisando estructura de usuarios y roles...\n');
  
  const config = {
    host: 'srv440.hstgr.io',
    user: 'u191251575_manu',
    password: 'Cerounocero.com20182417',
    database: 'u191251575_manu',
    port: 3306
  };

  try {
    const connection = await mysql.createConnection(config);
    
    // 1. Ver estructura de tabla users
    console.log('👥 ESTRUCTURA DE TABLA USERS:');
    console.log('='.repeat(50));
    const [userColumns] = await connection.execute('DESCRIBE users');
    userColumns.forEach(col => {
      console.log(`  ${col.Field.padEnd(15)} | ${col.Type.padEnd(20)} | ${col.Null.padEnd(4)} | ${col.Key.padEnd(4)} | ${col.Default || 'NULL'}`);
    });
    
    // 2. Ver usuarios existentes con sus roles
    console.log('\n📊 USUARIOS EXISTENTES Y SUS ROLES:');
    console.log('='.repeat(50));
    const [users] = await connection.execute(`
      SELECT id, username, email, full_name, is_admin, is_driver, is_waiter, active, created_at 
      FROM users 
      ORDER BY created_at DESC
    `);
    
    if (users.length > 0) {
      console.log('ID | Username | Email | Admin | Driver | Waiter | Active');
      console.log('-'.repeat(70));
      users.forEach(user => {
        console.log(`${user.id.toString().padEnd(2)} | ${(user.username || '').padEnd(8)} | ${(user.email || '').padEnd(20)} | ${user.is_admin ? '✅' : '❌'} | ${user.is_driver ? '✅' : '❌'} | ${user.is_waiter ? '✅' : '❌'} | ${user.active ? '✅' : '❌'}`);
      });
    } else {
      console.log('❌ No hay usuarios en la base de datos');
    }
    
    // 3. Ver tabla de sesiones de usuario
    console.log('\n🔑 ESTRUCTURA DE TABLA USER_SESSIONS:');
    console.log('='.repeat(50));
    try {
      const [sessionColumns] = await connection.execute('DESCRIBE user_sessions');
      sessionColumns.forEach(col => {
        console.log(`  ${col.Field.padEnd(15)} | ${col.Type.padEnd(20)} | ${col.Null.padEnd(4)} | ${col.Key.padEnd(4)} | ${col.Default || 'NULL'}`);
      });
      
      // Ver sesiones activas
      const [activeSessions] = await connection.execute(`
        SELECT s.id, s.user_id, u.username, s.expires_at, s.created_at
        FROM user_sessions s 
        JOIN users u ON s.user_id = u.id 
        WHERE s.expires_at > NOW()
        ORDER BY s.created_at DESC
      `);
      
      console.log('\n🟢 SESIONES ACTIVAS:');
      if (activeSessions.length > 0) {
        activeSessions.forEach(session => {
          console.log(`  Usuario: ${session.username} | Expira: ${session.expires_at}`);
        });
      } else {
        console.log('  No hay sesiones activas');
      }
      
    } catch (error) {
      console.log('  ❌ Tabla user_sessions no existe o no es accesible');
    }
    
    // 4. Ver drivers si existe la tabla
    console.log('\n🚗 INFORMACIÓN DE DRIVERS:');
    console.log('='.repeat(50));
    try {
      const [drivers] = await connection.execute(`
        SELECT u.id, u.username, u.email, u.is_driver, u.active
        FROM users u 
        WHERE u.is_driver = 1
      `);
      
      if (drivers.length > 0) {
        console.log('Drivers registrados:');
        drivers.forEach(driver => {
          console.log(`  ID: ${driver.id} | Usuario: ${driver.username} | Email: ${driver.email} | Activo: ${driver.active ? '✅' : '❌'}`);
        });
      } else {
        console.log('  No hay drivers registrados');
      }
      
      // Ver si existe tabla delivery_drivers
      try {
        const [deliveryDrivers] = await connection.execute('SELECT * FROM delivery_drivers LIMIT 5');
        console.log('\n📦 TABLA DELIVERY_DRIVERS:');
        const [ddColumns] = await connection.execute('DESCRIBE delivery_drivers');
        ddColumns.forEach(col => {
          console.log(`  ${col.Field.padEnd(15)} | ${col.Type.padEnd(20)}`);
        });
        
        if (deliveryDrivers.length > 0) {
          console.log('\nPrimeros registros:');
          deliveryDrivers.forEach(dd => {
            console.log(`  ID: ${dd.id} | User ID: ${dd.user_id} | Estado: ${dd.status}`);
          });
        }
      } catch (error) {
        console.log('  ❌ Tabla delivery_drivers no existe');
      }
      
    } catch (error) {
      console.log('  ❌ Error al consultar drivers:', error.message);
    }
    
    // 5. Estadísticas generales
    console.log('\n📈 ESTADÍSTICAS:');
    console.log('='.repeat(50));
    
    const [stats] = await connection.execute(`
      SELECT 
        COUNT(*) as total_users,
        SUM(is_admin) as admins,
        SUM(is_driver) as drivers,
        SUM(is_waiter) as waiters,
        SUM(active) as active_users
      FROM users
    `);
    
    const stat = stats[0];
    console.log(`Total usuarios: ${stat.total_users}`);
    console.log(`Administradores: ${stat.admins}`);
    console.log(`Drivers: ${stat.drivers}`);
    console.log(`Meseros: ${stat.waiters}`);
    console.log(`Usuarios activos: ${stat.active_users}`);
    
    await connection.end();
    console.log('\n✅ Revisión completada!');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

checkUsersAndRoles();