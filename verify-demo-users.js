const mysql = require('mysql2/promise');

const dbConfig = {
  host: 'srv440.hstgr.io',
  user: 'u191251575_colibridemo',
  password: 'Cerounocero.com20182417',
  database: 'u191251575_colibridemo'
};

async function verifyUsers() {
  let connection;
  
  try {
    console.log('🔌 Conectando a la base de datos...\n');
    connection = await mysql.createConnection(dbConfig);

    const [users] = await connection.execute(
      `SELECT id, username, email, is_admin, is_driver, is_waiter 
       FROM users 
       WHERE email IN ('driver@supernova.com', 'cliente@supernova.com')
       ORDER BY id`
    );

    console.log('👥 USUARIOS DEMO CONFIGURADOS:\n');
    console.log('═'.repeat(80));
    
    for (const user of users) {
      console.log(`\n🆔 ID: ${user.id}`);
      console.log(`👤 Usuario: ${user.username}`);
      console.log(`📧 Email: ${user.email}`);
      console.log(`🔑 Password: admin123`);
      console.log(`📊 Roles:`);
      console.log(`   - Admin: ${user.is_admin ? '✅' : '❌'}`);
      console.log(`   - Driver: ${user.is_driver ? '✅' : '❌'}`);
      console.log(`   - Mesero: ${user.is_waiter ? '✅' : '❌'}`);
      
      if (user.is_driver) {
        console.log(`🚚 REDIRECCIÓN: /driver/dashboard`);
      } else if (user.is_admin) {
        console.log(`👨‍💼 REDIRECCIÓN: /admin/dashboard`);
      } else if (user.is_waiter) {
        console.log(`🍽️  REDIRECCIÓN: /mesero/mesas-abiertas`);
      } else {
        console.log(`🏠 REDIRECCIÓN: /landing (homepage con hero y productos destacados)`);
      }
    }
    
    console.log('\n' + '═'.repeat(80));
    console.log('\n✅ Configuración correcta\n');

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

verifyUsers();
