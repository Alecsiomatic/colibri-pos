const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');

const DB_CONFIG = {
  host: 'srv440.hstgr.io',
  user: 'u484426513_supernova',
  password: '98Hola!!',
  database: 'u484426513_supernova',
  port: 3306
};

async function createDemoUsers() {
  let connection;
  
  try {
    console.log('🔐 Conectando a la base de datos...\n');
    
    // Intentar conexión sin restricción de IP
    connection = await mysql.createConnection({
      ...DB_CONFIG,
      connectTimeout: 10000
    });
    
    console.log('✅ Conectado exitosamente!\n');
    console.log('🔐 Creando usuarios demo para Colibrí-REST...\n');
    
    // Password hash para "admin123"
    const passwordHash = '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy';
    
    const demoUsers = [
      {
        name: 'Administrador Demo',
        email: 'admin@supernova.com',
        password: passwordHash,
        is_admin: 1,
        is_waiter: 0,
        is_driver: 0,
        role: 'Admin'
      },
      {
        name: 'Cajero Demo',
        email: 'cajero@supernova.com',
        password: passwordHash,
        is_admin: 0,
        is_waiter: 0,
        is_driver: 0,
        role: 'Cajero'
      },
      {
        name: 'Mesero Demo',
        email: 'mesero@supernova.com',
        password: passwordHash,
        is_admin: 0,
        is_waiter: 1,
        is_driver: 0,
        role: 'Mesero'
      },
      {
        name: 'Repartidor Demo',
        email: 'driver@supernova.com',
        password: passwordHash,
        is_admin: 0,
        is_waiter: 0,
        is_driver: 1,
        role: 'Repartidor'
      }
    ];
    
    // Eliminar usuarios existentes
    await connection.execute(
      "DELETE FROM users WHERE email IN ('admin@supernova.com', 'cajero@supernova.com', 'mesero@supernova.com', 'driver@supernova.com')"
    );
    console.log('🗑️  Usuarios anteriores eliminados\n');
    
    for (const user of demoUsers) {
      await connection.execute(
        `INSERT INTO users (name, email, password, is_admin, is_waiter, is_driver, created_at)
         VALUES (?, ?, ?, ?, ?, ?, NOW())`,
        [user.name, user.email, user.password, user.is_admin, user.is_waiter, user.is_driver]
      );
      console.log(`✨ ${user.role.toUpperCase()} creado: ${user.email}`);
    }
    
    console.log('\n🎉 Usuarios demo listos!');
    console.log('\n📋 Credenciales:');
    console.log('   👨‍💼 Admin:      admin@supernova.com / admin123     → /admin/dashboard');
    console.log('   💰 Cajero:     cajero@supernova.com / admin123    → /caja');
    console.log('   🍽️  Mesero:     mesero@supernova.com / admin123    → /mesero/mesas-abiertas');
    console.log('   🛵 Repartidor: driver@supernova.com / admin123    → /driver/dashboard');
    
    // Verificar
    console.log('\n📊 Verificación:\n');
    const [rows] = await connection.execute(
      `SELECT id, name, email, is_admin, is_waiter, is_driver 
       FROM users 
       WHERE email IN ('admin@supernova.com', 'cajero@supernova.com', 'mesero@supernova.com', 'driver@supernova.com')`
    );
    
    console.log('ID  | Nombre              | Email                    | Admin | Mesero | Repartidor');
    console.log('----|---------------------|--------------------------|-------|--------|------------');
    rows.forEach(row => {
      console.log(
        `${String(row.id).padEnd(4)}| ${row.name.padEnd(20)}| ${row.email.padEnd(25)}| ${row.is_admin ? 'Sí   ' : 'No   '}| ${row.is_waiter ? 'Sí    ' : 'No    '}| ${row.is_driver ? 'Sí' : 'No'}`
      );
    });
    
  } catch (error) {
    if (error.code === 'ER_ACCESS_DENIED_ERROR') {
      console.error('\n❌ ERROR: Acceso denegado desde tu IP');
      console.error('💡 SOLUCIÓN: Usa el archivo create-demo-users.php');
      console.error('   1. Sube create-demo-users.php a tu servidor');
      console.error('   2. Visita: https://tudominio.com/create-demo-users.php');
      console.error('   3. Los usuarios se crearán automáticamente\n');
    } else {
      console.error('❌ Error:', error.message);
    }
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

createDemoUsers();
