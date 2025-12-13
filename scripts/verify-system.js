const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');

async function testFullSystem() {
  console.log('🧪 VERIFICACIÓN COMPLETA DEL SISTEMA');
  console.log('=====================================\n');

  try {
    // 1. Test conexión DB con .env.local
    console.log('1. ✅ Testing conexión MySQL local...');
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'srv440.hstgr.io',
      user: process.env.DB_USER || 'u191251575_manu', 
      password: process.env.DB_PASSWORD || 'Cerounocero.com20182417',
      database: process.env.DB_NAME || 'u191251575_manu',
      port: parseInt(process.env.DB_PORT || '3306')
    });

    // Test básico
    const [result] = await connection.execute('SELECT 1 as test');
    console.log('   ✅ Conexión DB exitosa:', result[0]);

    // 2. Test tablas principales
    console.log('\n2. ✅ Verificando tablas principales...');
    const tables = ['users', 'orders', 'products', 'categories'];
    for (const table of tables) {
      try {
        const [rows] = await connection.execute(`SELECT COUNT(*) as count FROM ${table}`);
        console.log(`   ✅ Tabla ${table}: ${rows[0].count} registros`);
      } catch (err) {
        console.log(`   ❌ Tabla ${table}: Error - ${err.message}`);
      }
    }

    // 3. Test usuario admin
    console.log('\n3. ✅ Verificando usuario admin...');
    const [users] = await connection.execute('SELECT id, email, username, is_admin FROM users WHERE is_admin = 1');
    if (users.length > 0) {
      console.log(`   ✅ Admin encontrado: ${users[0].email} (${users[0].username})`);
    } else {
      console.log('   ⚠️  No hay usuarios admin. Creando...');
      const hashedPassword = await bcrypt.hash('admin123', 12);
      await connection.execute(
        'INSERT INTO users (email, password, username, is_admin, created_at) VALUES (?, ?, ?, ?, NOW())',
        ['admin@restaurant.com', hashedPassword, 'admin', 1]
      );
      console.log('   ✅ Usuario admin creado: admin@restaurant.com / admin123');
    }

    // 4. Test productos
    console.log('\n4. ✅ Verificando productos...');
    const [products] = await connection.execute('SELECT COUNT(*) as count FROM products WHERE is_available = 1');
    console.log(`   ✅ Productos disponibles: ${products[0].count}`);

    // 5. Test categorías 
    console.log('\n5. ✅ Verificando categorías...');
    const [categories] = await connection.execute('SELECT COUNT(*) as count FROM categories WHERE is_active = 1');
    console.log(`   ✅ Categorías activas: ${categories[0].count}`);

    await connection.end();

    console.log('\n🎉 SISTEMA VERIFICADO - LISTO PARA PRODUCCIÓN');
    console.log('============================================');
    
    return true;
  } catch (error) {
    console.error('\n❌ ERROR EN VERIFICACIÓN:', error.message);
    console.log('\n🔧 POSIBLES SOLUCIONES:');
    console.log('- Verificar credenciales de DB');
    console.log('- Verificar que el servidor MySQL esté accesible');
    console.log('- Verificar que las tablas existan');
    return false;
  }
}

// Ejecutar test
testFullSystem().then(success => {
  process.exit(success ? 0 : 1);
});