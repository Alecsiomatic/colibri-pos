const mysql = require('mysql2/promise');

async function addGoogleMapsConfig() {
  console.log('🗺️  Agregando configuración de Google Maps...');
  
  const config = {
    host: 'srv440.hstgr.io',
    user: 'u191251575_manu',
    password: 'Cerounocero.com20182417',
    database: 'u191251575_manu',
    port: 3306
  };

  try {
    const connection = await mysql.createConnection(config);
    console.log('✅ Conexión exitosa!');
    
    // Agregar columna para Google Maps API key
    await connection.execute(`
      ALTER TABLE business_info 
      ADD COLUMN google_maps_api_key VARCHAR(255) NULL AFTER logo_url
    `);
    
    console.log('✅ Columna google_maps_api_key agregada exitosamente');
    
    // Agregar columnas para configuración de tracking
    await connection.execute(`
      ALTER TABLE business_info 
      ADD COLUMN enable_driver_tracking BOOLEAN DEFAULT TRUE AFTER google_maps_api_key,
      ADD COLUMN delivery_radius_km DECIMAL(5,2) DEFAULT 10.00 AFTER enable_driver_tracking
    `);
    
    console.log('✅ Columnas de tracking agregadas exitosamente');
    
    await connection.end();
    
  } catch (error) {
    if (error.code === 'ER_DUP_FIELDNAME') {
      console.log('⚠️  Las columnas ya existen');
    } else {
      console.error('❌ Error:', error);
    }
  }
  
  process.exit(0);
}

addGoogleMapsConfig();