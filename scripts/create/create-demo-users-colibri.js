const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');

const DB_CONFIG = {
  host: 'srv440.hstgr.io',
  user: 'u484426513_supernova',
  password: '98Hola!!',
  database: 'u484426513_supernova'
};

async function createDemoUsers() {
  const connection = await mysql.createConnection(DB_CONFIG);
  
  try {
    console.log('🔐 Creando usuarios demo para Colibrí-REST...\n');
    
    // Password hash para "admin123"
    const passwordHash = await bcrypt.hash('admin123', 10);
    
    const demoUsers = [
      {
        name: 'Administrador Demo',
        email: 'admin@supernova.com',
        password: passwordHash,
        is_admin: 1,
        is_waiter: 0,
        is_driver: 0,
        role: 'admin'
      },
      {
        name: 'Cajero Demo',
        email: 'cajero@supernova.com',
        password: passwordHash,
        is_admin: 0,
        is_waiter: 0,
        is_driver: 0,
        role: 'cashier'
      },
      {
        name: 'Mesero Demo',
        email: 'mesero@supernova.com',
        password: passwordHash,
        is_admin: 0,
        is_waiter: 1,
        is_driver: 0,
        role: 'waiter'
      },
      {
        name: 'Repartidor Demo',
        email: 'driver@supernova.com',
        password: passwordHash,
        is_admin: 0,
        is_waiter: 0,
        is_driver: 1,
        role: 'driver'
      }
    ];
    
    for (const user of demoUsers) {
      // Verificar si ya existe
      const [existing] = await connection.execute(
        'SELECT id FROM users WHERE email = ?',
        [user.email]
      );
      
      if (existing.length > 0) {
        // Actualizar usuario existente
        await connection.execute(
          `UPDATE users 
           SET name = ?, password = ?, is_admin = ?, is_waiter = ?, is_driver = ?
           WHERE email = ?`,
          [user.name, user.password, user.is_admin, user.is_waiter, user.is_driver, user.email]
        );
        console.log(`✅ ${user.role.toUpperCase()} actualizado: ${user.email}`);
      } else {
        // Crear nuevo usuario
        await connection.execute(
          `INSERT INTO users (name, email, password, is_admin, is_waiter, is_driver, created_at)
           VALUES (?, ?, ?, ?, ?, ?, NOW())`,
          [user.name, user.email, user.password, user.is_admin, user.is_waiter, user.is_driver]
        );
        console.log(`✨ ${user.role.toUpperCase()} creado: ${user.email}`);
      }
    }
    
    console.log('\n🎉 Usuarios demo listos!');
    console.log('\n📋 Credenciales:');
    console.log('   👨‍💼 Admin:      admin@supernova.com / admin123     → /admin/dashboard');
    console.log('   💰 Cajero:     cajero@supernova.com / admin123    → /caja');
    console.log('   🍽️  Mesero:     mesero@supernova.com / admin123    → /mesero/mesas-abiertas');
    console.log('   🛵 Repartidor: driver@supernova.com / admin123    → /driver/dashboard');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await connection.end();
  }
}

createDemoUsers();
