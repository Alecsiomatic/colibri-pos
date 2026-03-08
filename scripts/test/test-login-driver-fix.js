const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');

async function testLoginDriver() {
  console.log('🔐 Probando login de driver después de corrección...\n');
  
  const config = {
    host: 'srv440.hstgr.io',
    user: 'u191251575_manu',
    password: 'Cerounocero.com20182417',
    database: 'u191251575_manu',
    port: 3306
  };

  try {
    const connection = await mysql.createConnection(config);
    
    // Simular la función authenticateUser corregida
    const email = 'repa@supernova.com';
    console.log('🔍 Autenticando:', email);
    
    const query = `SELECT id, email, password, username, is_admin, is_driver, is_waiter FROM users WHERE email = ?`;
    const [users] = await connection.execute(query, [email]);
    
    if (users.length === 0) {
      console.log('❌ Usuario no encontrado');
      return;
    }
    
    const user = users[0];
    console.log('👤 Usuario encontrado:');
    console.log(`   ID: ${user.id}`);
    console.log(`   Username: ${user.username}`);
    console.log(`   Email: ${user.email}`);
    console.log(`   is_admin: ${user.is_admin} (${Boolean(user.is_admin)})`);
    console.log(`   is_driver: ${user.is_driver} (${Boolean(user.is_driver)}) ← DEBE SER TRUE`);
    console.log(`   is_waiter: ${user.is_waiter} (${Boolean(user.is_waiter)})`);
    
    console.log('\n✅ RESULTADO ESPERADO DESPUÉS DE LA CORRECCIÓN:');
    const result = {
      success: true,
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        is_admin: Boolean(user.is_admin),
        is_driver: Boolean(user.is_driver), // Ahora debe ser TRUE
        is_waiter: Boolean(user.is_waiter)
      }
    };
    
    console.log(JSON.stringify(result, null, 2));
    
    if (result.user.is_driver) {
      console.log('\n🎉 ¡PERFECTO! El driver será reconocido correctamente');
    } else {
      console.log('\n❌ PROBLEMA: is_driver sigue siendo false');
    }
    
    await connection.end();
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

testLoginDriver();