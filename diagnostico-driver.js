const mysql = require('mysql2/promise');

async function diagnosticarProblemaDriver() {
  console.log('🚨 DIAGNÓSTICO: Problema de Reconocimiento de Driver\n');
  
  const config = {
    host: 'srv440.hstgr.io',
    user: 'u191251575_manu',
    password: 'Cerounocero.com20182417',
    database: 'u191251575_manu',
    port: 3306
  };

  try {
    const connection = await mysql.createConnection(config);
    
    console.log('🔍 PROBLEMA IDENTIFICADO:');
    console.log('=' .repeat(50));
    console.log('1. getCurrentUser() no retorna is_driver');
    console.log('2. delivery_drivers.user_id está NULL');
    console.log('3. API /api/driver/me falla porque no encuentra registro\n');
    
    // Verificar drivers en users
    console.log('📊 DRIVERS EN TABLA USERS:');
    const [users] = await connection.execute(`
      SELECT id, username, email, is_driver, is_admin, active
      FROM users 
      WHERE is_driver = 1
    `);
    
    users.forEach(user => {
      console.log(`✅ User ID ${user.id}: ${user.username} (${user.email})`);
      console.log(`   is_driver: ${user.is_driver}, is_admin: ${user.is_admin}, active: ${user.active}`);
    });
    
    // Verificar delivery_drivers
    console.log('\n📦 REGISTROS EN DELIVERY_DRIVERS:');
    const [drivers] = await connection.execute(`
      SELECT id, user_id, name, phone, email, is_active
      FROM delivery_drivers
    `);
    
    drivers.forEach(driver => {
      console.log(`❌ Driver ID ${driver.id}: ${driver.name} (${driver.phone})`);
      console.log(`   user_id: ${driver.user_id || 'NULL'} ⚠️ PROBLEMA AQUÍ`);
      console.log(`   email: ${driver.email}, active: ${driver.is_active}`);
    });
    
    console.log('\n🔧 SOLUCIONES NECESARIAS:');
    console.log('=' .repeat(50));
    console.log('1. Modificar lib/auth-simple.ts para retornar is_driver');
    console.log('2. Asociar registros de delivery_drivers con users.id');
    console.log('3. Actualizar API /api/driver/me para manejar ambos casos');
    console.log('4. Verificar middleware para drivers');
    
    // Proponer asociaciones
    console.log('\n💡 PROPUESTA DE ASOCIACIÓN:');
    console.log('=' .repeat(50));
    
    if (users.length > 0 && drivers.length > 0) {
      console.log('Drivers en users que necesitan asociación:');
      users.forEach((user, index) => {
        if (index < drivers.length) {
          const driver = drivers[index];
          console.log(`🔗 User ${user.id} (${user.username}) → Driver ${driver.id} (${driver.name})`);
          console.log(`   SQL: UPDATE delivery_drivers SET user_id = ${user.id} WHERE id = ${driver.id};`);
        }
      });
    }
    
    await connection.end();
    console.log('\n✅ Diagnóstico completado!');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

diagnosticarProblemaDriver();