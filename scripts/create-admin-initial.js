const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');
require('dotenv').config();

async function createAdminUser() {
  try {
    const connection = await mysql.createConnection({
      host: process.env.MYSQL_HOST || 'localhost',
      user: process.env.MYSQL_USER || 'root',
      password: process.env.MYSQL_PASSWORD || '',
      database: process.env.MYSQL_DATABASE || 'restaurante_db',
      port: process.env.MYSQL_PORT || 3306
    });

    console.log('✅ Conectado a MySQL');

    // Crear contraseña hasheada
    const password = 'admin123'; // Cambiar en producción
    const hashedPassword = await bcrypt.hash(password, 10);

    // Verificar si ya existe un admin
    const [existing] = await connection.execute(
      'SELECT id FROM users WHERE is_admin = TRUE LIMIT 1'
    );

    if (existing.length > 0) {
      console.log('⚠️  Ya existe un usuario administrador');
      process.exit(0);
    }

    // Crear usuario admin
    await connection.execute(
      `INSERT INTO users (email, username, password, is_admin, is_active) 
       VALUES (?, ?, ?, TRUE, TRUE)`,
      ['admin@supernova.com', 'superadmin', hashedPassword]
    );

    console.log('✅ Usuario administrador creado exitosamente');
    console.log('📧 Email: admin@supernova.com');
    console.log('🔑 Usuario: superadmin');
    console.log('🔒 Contraseña: admin123');
    console.log('⚠️  IMPORTANTE: Cambiar la contraseña después del primer login');

    await connection.end();
    process.exit(0);

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

createAdminUser();