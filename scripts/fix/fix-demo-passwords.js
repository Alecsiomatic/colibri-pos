const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');

const NEW_DB = {
  host: 'srv440.hstgr.io',
  user: 'u191251575_colibridemo',
  password: 'Cerounocero.com20182417',
  database: 'u191251575_colibridemo',
  port: 3306
};

async function updateDemoPasswords() {
  let conn;
  
  try {
    console.log('🔐 Generando hash de password correctamente...\n');
    
    // Generar hash NUEVO con bcryptjs
    const passwordHash = await bcrypt.hash('admin123', 10);
    console.log('✅ Hash generado:', passwordHash);
    console.log('');
    
    conn = await mysql.createConnection(NEW_DB);
    console.log('✅ Conectado a la base de datos\n');
    
    const demoEmails = [
      'admin@supernova.com',
      'cajero@supernova.com',
      'mesero@supernova.com',
      'driver@supernova.com'
    ];
    
    console.log('🔄 Actualizando passwords...\n');
    
    for (const email of demoEmails) {
      await conn.execute(
        'UPDATE users SET password = ? WHERE email = ?',
        [passwordHash, email]
      );
      console.log(`✅ Password actualizado para: ${email}`);
    }
    
    console.log('\n🧪 Verificando passwords...\n');
    
    // Verificar que los passwords funcionan
    for (const email of demoEmails) {
      const [rows] = await conn.execute(
        'SELECT email, password FROM users WHERE email = ?',
        [email]
      );
      
      if (rows.length > 0) {
        const isValid = await bcrypt.compare('admin123', rows[0].password);
        console.log(`${isValid ? '✅' : '❌'} ${email}: ${isValid ? 'Password válido' : 'Password INVÁLIDO'}`);
      }
    }
    
    console.log('\n📋 CREDENCIALES DEMO:');
    console.log('   👨‍💼 Admin:      admin@supernova.com / admin123');
    console.log('   💰 Cajero:     cajero@supernova.com / admin123');
    console.log('   🍽️  Mesero:     mesero@supernova.com / admin123');
    console.log('   🛵 Repartidor: driver@supernova.com / admin123');
    console.log('\n✅ ¡Listo! Ahora intenta iniciar sesión');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    if (conn) await conn.end();
  }
}

updateDemoPasswords();
