const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');

const dbConfig = {
  host: 'srv440.hstgr.io',
  user: 'u191251575_colibridemo',
  password: 'Cerounocero.com20182417',
  database: 'u191251575_colibridemo'
};

async function createCustomerDemo() {
  let connection;
  
  try {
    console.log('🔌 Conectando a la base de datos...');
    connection = await mysql.createConnection(dbConfig);
    console.log('✅ Conectado a MySQL');

    // Verificar si ya existe
    const [existing] = await connection.execute(
      'SELECT id, email FROM users WHERE email = ?',
      ['cliente@supernova.com']
    );

    if (existing.length > 0) {
      console.log('⚠️  Usuario cliente@supernova.com ya existe con ID:', existing[0].id);
      
      // Actualizar para asegurar que es cliente normal
      await connection.execute(
        `UPDATE users 
         SET is_admin = 0, is_driver = 0, is_waiter = 0 
         WHERE email = ?`,
        ['cliente@supernova.com']
      );
      console.log('✅ Usuario actualizado como cliente normal');
      return;
    }

    // Hash de la contraseña
    const hashedPassword = await bcrypt.hash('admin123', 10);

    // Crear usuario cliente normal
    const [result] = await connection.execute(
      `INSERT INTO users (username, email, password, is_admin, is_driver, is_waiter, created_at) 
       VALUES (?, ?, ?, 0, 0, 0, NOW())`,
      ['Cliente Demo', 'cliente@supernova.com', hashedPassword]
    );

    console.log('✅ Usuario cliente creado exitosamente');
    console.log('📧 Email: cliente@supernova.com');
    console.log('🔑 Password: admin123');
    console.log('🆔 ID:', result.insertId);
    console.log('👤 Tipo: Cliente normal (puede hacer pedidos)');
    console.log('');
    console.log('🎯 Este usuario debe ir a /demo al hacer login');
    console.log('🚚 El driver@supernova.com debe ir a /driver/dashboard');

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    if (connection) {
      await connection.end();
      console.log('🔌 Conexión cerrada');
    }
  }
}

createCustomerDemo();
