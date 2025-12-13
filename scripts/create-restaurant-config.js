const mysql = require('mysql2/promise');
require('dotenv').config({ path: '.env.local' });

const dbConfig = {
  host: process.env.DB_HOST || 'srv440.hstgr.io',
  user: process.env.DB_USER || 'u191251575_colibridemo',
  password: process.env.DB_PASSWORD || 'Cerounocero.com20182417',
  database: process.env.DB_NAME || 'u191251575_colibridemo',
  port: parseInt(process.env.DB_PORT || '3306')
};

async function createRestaurantConfig() {
  let connection;
  
  try {
    console.log('🔌 Conectando a la base de datos...');
    connection = await mysql.createConnection(dbConfig);
    console.log('✅ Conectado exitosamente');

    console.log('\n📋 Creando tabla restaurant_config...');
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS restaurant_config (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(200) NOT NULL,
        address TEXT NOT NULL,
        latitude DECIMAL(10, 8) NOT NULL,
        longitude DECIMAL(11, 8) NOT NULL,
        phone VARCHAR(20),
        email VARCHAR(100),
        delivery_base_fee DECIMAL(10, 2) DEFAULT 50.00,
        delivery_per_km_fee DECIMAL(10, 2) DEFAULT 15.00,
        delivery_time_fee DECIMAL(10, 2) DEFAULT 5.00,
        delivery_free_threshold DECIMAL(10, 2) DEFAULT 500.00,
        delivery_radius_km DECIMAL(5, 2) DEFAULT 10.00,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_location (latitude, longitude)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    console.log('✅ Tabla restaurant_config creada');

    const [existing] = await connection.execute('SELECT COUNT(*) as count FROM restaurant_config');
    
    if (existing[0].count === 0) {
      console.log('\n🏪 Insertando configuración inicial...');
      await connection.execute(`
        INSERT INTO restaurant_config (
          name, address, latitude, longitude, phone, email,
          delivery_base_fee, delivery_per_km_fee, delivery_time_fee,
          delivery_free_threshold, delivery_radius_km
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        'Supernova Restaurant',
        'Zenon Fernandez 470, San Luis Potosí, SLP, México',
        22.156500,
        -100.985500,
        '+52 444 123 4567',
        'info@supernovarestaurant.com',
        50.00, 15.00, 5.00, 500.00, 10.00
      ]);
      console.log('✅ Configuración inicial insertada');
    }

    const [config] = await connection.execute('SELECT * FROM restaurant_config LIMIT 1');
    console.log('\n📊 Configuración actual:');
    console.log('   Nombre:', config[0].name);
    console.log('   Dirección:', config[0].address);
    console.log('   Coordenadas:', config[0].latitude, ',', config[0].longitude);
    console.log('   Tarifa base: $' + config[0].delivery_base_fee);
    console.log('   Por km: $' + config[0].delivery_per_km_fee);
    console.log('\n✅ Proceso completado exitosamente');

  } catch (error) {
    console.error('❌ Error:', error.message);
    throw error;
  } finally {
    if (connection) await connection.end();
  }
}

if (require.main === module) {
  createRestaurantConfig()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}

module.exports = createRestaurantConfig;
