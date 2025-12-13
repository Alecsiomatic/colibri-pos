const mysql = require('mysql2/promise');

async function checkBusinessLogo() {
  try {
    const dbConfig = {
      host: process.env.DB_HOST || 'srv440.hstgr.io',
      user: process.env.DB_USER || 'u191251575_manu',
      password: process.env.DB_PASSWORD || 'Cerounocero.com20182417',
      database: process.env.DB_NAME || 'u191251575_manu',
      port: parseInt(process.env.DB_PORT || '3306')
    };

    console.log('🔍 Verificando configuración del logo del negocio...');
    const connection = await mysql.createConnection(dbConfig);

    // Verificar si existe la tabla business_info
    console.log('\n📋 Verificando tabla business_info...');
    try {
      const [tables] = await connection.execute(`
        SHOW TABLES LIKE 'business_info'
      `);
      
      if (tables.length === 0) {
        console.log('❌ La tabla business_info no existe');
        console.log('💡 Creando tabla business_info...');
        
        await connection.execute(`
          CREATE TABLE business_info (
            id INT AUTO_INCREMENT PRIMARY KEY,
            name VARCHAR(255) DEFAULT 'SUPER NOVA',
            slogan VARCHAR(255) DEFAULT 'Restaurante & Delivery',
            address TEXT,
            phone VARCHAR(50),
            email VARCHAR(100),
            website VARCHAR(255),
            instagram VARCHAR(100),
            facebook VARCHAR(100),
            whatsapp VARCHAR(50),
            logo_url VARCHAR(500),
            google_maps_api_key VARCHAR(255),
            enable_driver_tracking BOOLEAN DEFAULT TRUE,
            delivery_radius_km DECIMAL(5,2) DEFAULT 10.0,
            openai_api_key VARCHAR(255),
            openai_model VARCHAR(50) DEFAULT 'gpt-3.5-turbo',
            enable_ai_reports BOOLEAN DEFAULT FALSE,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
          )
        `);
        
        console.log('✅ Tabla business_info creada');
        
        // Insertar datos por defecto con un logo de ejemplo
        await connection.execute(`
          INSERT INTO business_info (
            name, slogan, address, phone, email, website, 
            instagram, facebook, whatsapp, logo_url
          ) VALUES (
            'SUPER NOVA',
            'Restaurante & Delivery',
            'Av. Principal #123',
            '(555) 123-4567',
            'info@supernova.com',
            'www.supernova-delivery.com',
            '@SuperNovaRestaurante',
            '@SuperNovaOficial',
            '+52 555 123 4567',
            'https://via.placeholder.com/150x150.png?text=LOGO'
          )
        `);
        
        console.log('✅ Datos por defecto insertados con logo de ejemplo');
      } else {
        console.log('✅ Tabla business_info existe');
      }
      
    } catch (error) {
      console.error('❌ Error verificando/creando tabla:', error);
    }

    // Verificar información del negocio
    const [businessRows] = await connection.execute(`
      SELECT * FROM business_info LIMIT 1
    `);

    if (businessRows.length === 0) {
      console.log('❌ No hay información del negocio configurada');
    } else {
      const business = businessRows[0];
      console.log('\n🏢 Información del negocio:');
      console.log('   ID:', business.id);
      console.log('   Nombre:', business.name);
      console.log('   Logo URL:', business.logo_url);
      console.log('   Slogan:', business.slogan);
      console.log('   Dirección:', business.address);
      console.log('   Teléfono:', business.phone);
      console.log('   Email:', business.email);
      console.log('   Instagram:', business.instagram);
      console.log('   Facebook:', business.facebook);
      console.log('   Website:', business.website);
      console.log('   WhatsApp:', business.whatsapp);

      if (business.logo_url) {
        console.log('\n🖼️ Análisis del logo:');
        console.log('   URL configurada:', business.logo_url);
        
        if (business.logo_url.startsWith('http')) {
          console.log('   ✅ URL absoluta - debería funcionar en tickets');
        } else if (business.logo_url.startsWith('/')) {
          console.log('   ⚠️ URL relativa - se convertirá a absoluta en el ticket');
          console.log('   Se mostrará como: http://localhost:3001' + business.logo_url);
        } else {
          console.log('   ⚠️ Path relativo sin barra - se agregará el dominio');
          console.log('   Se mostrará como: http://localhost:3001/' + business.logo_url);
        }
        
        // Verificar si el logo es accesible
        if (business.logo_url.startsWith('http')) {
          console.log('   🔍 Testing logo accessibility...');
          try {
            const fetch = require('node-fetch');
            const response = await fetch(business.logo_url, { method: 'HEAD' });
            if (response.ok) {
              console.log('   ✅ Logo is accessible');
            } else {
              console.log('   ❌ Logo is not accessible (Status:', response.status, ')');
            }
          } catch (error) {
            console.log('   ❌ Error testing logo accessibility:', error.message);
          }
        }
      } else {
        console.log('\n❌ No hay logo configurado');
        console.log('   Se mostrará el emoji por defecto: ⭐🚀');
        console.log('   💡 Para configurar un logo, actualiza el campo logo_url en business_info');
      }
    }

    await connection.end();
    console.log('\n🎯 Recomendaciones:');
    console.log('   1. Usa URLs absolutas para logos (https://ejemplo.com/logo.png)');
    console.log('   2. Asegúrate de que el logo sea accesible públicamente');
    console.log('   3. Tamaño recomendado: 150x150px o más');
    console.log('   4. Formatos soportados: PNG, JPG, SVG');

  } catch (error) {
    console.error('❌ Error verificando logo del negocio:', error);
  }
}

checkBusinessLogo();