const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');

async function createAdminUser() {
  console.log('👤 Creando usuario administrador...');
  
  const config = {
    host: 'srv440.hstgr.io',
    user: 'u191251575_manu',
    password: 'Cerounocero.com20182417',
    database: 'u191251575_manu',
    port: 3306
  };

  try {
    const connection = await mysql.createConnection(config);
    
    // Hash de la contraseña
    const hashedPassword = await bcrypt.hash('admin123', 12);
    
    // Insertar usuario admin
    const [result] = await connection.execute(
      'INSERT IGNORE INTO users (email, password, username, is_admin) VALUES (?, ?, ?, ?)',
      ['admin@restaurant.com', hashedPassword, 'admin', true]
    );
    
    if (result.affectedRows > 0) {
      console.log('✅ Usuario administrador creado exitosamente!');
      console.log('📧 Email: admin@restaurant.com');
      console.log('🔑 Contraseña: admin123');
    } else {
      console.log('ℹ️ Usuario administrador ya existe');
    }
    
    await connection.end();
    console.log('🎉 Configuración de usuario completada!');
    
  } catch (error) {
    console.error('❌ Error al crear usuario administrador:', error.message);
  }
}

createAdminUser();