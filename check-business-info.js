const mysql = require('mysql2/promise');

async function checkBusinessInfo() {
  console.log('🔌 Conectando a MySQL...');
  
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
    
    const [result] = await connection.execute('SELECT * FROM business_info LIMIT 1');
    
    console.log('📊 Información empresarial en la base de datos:');
    console.log(JSON.stringify(result, null, 2));
    
    if (result.length > 0) {
      console.log('\n🖼️ Logo URL específica:', result[0].logo_url);
      console.log('🏢 Nombre:', result[0].name);
      console.log('🗺️ Google Maps API Key:', result[0].google_maps_api_key ? 'Configurada ✅' : 'No configurada ❌');
      console.log('📍 Tracking habilitado:', result[0].enable_driver_tracking ? 'Sí ✅' : 'No ❌');
      console.log('📏 Radio de entrega:', result[0].delivery_radius_km + ' km');
    } else {
      console.log('❌ No hay información empresarial guardada');
    }
    
    await connection.end();
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
  
  process.exit(0);
}

checkBusinessInfo();