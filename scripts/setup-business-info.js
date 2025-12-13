const mysql = require('mysql2/promise');

const dbConfig = {
  host: 'srv440.hstgr.io',
  port: 3306,
  user: 'u191251575_manu',
  password: 'Cerounocero.com20182417',
  database: 'u191251575_manu'
};

async function createBusinessInfoTable() {
  let connection;
  
  try {
    console.log('🔗 Conectando a la base de datos...');
    connection = await mysql.createConnection(dbConfig);
    
    console.log('✅ Conexión establecida');
    
    // Crear tabla business_info
    const createTableQuery = `
      CREATE TABLE IF NOT EXISTS business_info (
          id INT AUTO_INCREMENT PRIMARY KEY,
          name VARCHAR(255) NOT NULL DEFAULT 'SUPER NOVA',
          slogan VARCHAR(255) DEFAULT 'Restaurante & Delivery',
          address TEXT,
          phone VARCHAR(50),
          email VARCHAR(255),
          website VARCHAR(255),
          instagram VARCHAR(100),
          facebook VARCHAR(100),
          whatsapp VARCHAR(50),
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `;
    
    await connection.execute(createTableQuery);
    console.log('✅ Tabla business_info creada');
    
    // Verificar si ya existe configuración
    const [existing] = await connection.execute('SELECT COUNT(*) as count FROM business_info');
    const count = existing[0].count;
    
    if (count === 0) {
      // Insertar datos por defecto
      const insertQuery = `
        INSERT INTO business_info (
          name, slogan, address, phone, email, website, instagram, facebook, whatsapp
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;
      
      await connection.execute(insertQuery, [
        'SUPER NOVA',
        'Restaurante & Delivery',
        'Av. Principal #123, Col. Centro',
        '(555) 123-4567',
        'info@supernova.com',
        'www.supernova-delivery.com',
        '@SuperNovaRestaurante',
        '@SuperNovaOficial',
        '+52 555 123 4567'
      ]);
      
      console.log('✅ Datos por defecto insertados');
    } else {
      console.log('ℹ️  Ya existe configuración empresarial');
    }
    
    // Verificar los datos
    const [rows] = await connection.execute('SELECT * FROM business_info');
    console.log('📋 Configuración actual:');
    console.log(rows[0]);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    if (connection) {
      await connection.end();
      console.log('🔌 Conexión cerrada');
    }
  }
}

createBusinessInfoTable();