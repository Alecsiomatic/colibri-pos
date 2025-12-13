const mysql = require('mysql2/promise');

const NEW_DB = {
  host: 'srv440.hstgr.io',
  user: 'u191251575_colibridemo',
  password: 'Cerounocero.com20182417',
  database: 'u191251575_colibridemo',
  port: 3306
};

async function createDemoUsers() {
  let conn;
  
  try {
    console.log('🔐 Creando usuarios demo en u191251575_colibridemo...\n');
    
    conn = await mysql.createConnection(NEW_DB);
    
    // Verificar estructura de tabla users
    const [columns] = await conn.query('SHOW COLUMNS FROM users');
    console.log('📋 Columnas en tabla users:');
    columns.forEach(col => console.log(`   - ${col.Field} (${col.Type})`));
    console.log('');
    
    const passwordHash = '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy';
    
    const demoUsers = [
      {
        username: 'Administrador Demo',
        email: 'admin@supernova.com',
        password: passwordHash,
        is_admin: 1,
        is_waiter: 0,
        is_driver: 0,
        role: 'Admin'
      },
      {
        username: 'Cajero Demo',
        email: 'cajero@supernova.com',
        password: passwordHash,
        is_admin: 0,
        is_waiter: 0,
        is_driver: 0,
        role: 'Cajero'
      },
      {
        username: 'Mesero Demo',
        email: 'mesero@supernova.com',
        password: passwordHash,
        is_admin: 0,
        is_waiter: 1,
        is_driver: 0,
        role: 'Mesero'
      },
      {
        username: 'Repartidor Demo',
        email: 'driver@supernova.com',
        password: passwordHash,
        is_admin: 0,
        is_waiter: 0,
        is_driver: 1,
        role: 'Repartidor'
      }
    ];
    
    // Eliminar usuarios demo anteriores
    await conn.execute(
      "DELETE FROM users WHERE email IN ('admin@supernova.com', 'cajero@supernova.com', 'mesero@supernova.com', 'driver@supernova.com')"
    );
    
    for (const user of demoUsers) {
      await conn.execute(
        `INSERT INTO users (username, email, password, is_admin, is_waiter, is_driver, created_at)
         VALUES (?, ?, ?, ?, ?, ?, NOW())`,
        [user.username, user.email, user.password, user.is_admin, user.is_waiter, user.is_driver]
      );
      console.log(`✨ ${user.role}: ${user.email}`);
    }
    
    console.log('\n📋 CREDENCIALES DEMO:');
    console.log('   👨‍💼 Admin:      admin@supernova.com / admin123     → /admin/dashboard');
    console.log('   💰 Cajero:     cajero@supernova.com / admin123    → /caja');
    console.log('   🍽️  Mesero:     mesero@supernova.com / admin123    → /mesero/mesas-abiertas');
    console.log('   🛵 Repartidor: driver@supernova.com / admin123    → /driver/dashboard');
    
    console.log('\n✅ USUARIOS DEMO CREADOS! Ahora actualiza el .env.local');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    if (conn) await conn.end();
  }
}

createDemoUsers();
