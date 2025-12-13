const mysql = require('mysql2/promise');
require('dotenv').config();

async function insertInitialData() {
  let connection;
  
  try {
    console.log('📦 Insertando datos iniciales...\n');
    
    connection = await mysql.createConnection({
      host: 'srv440.hstgr.io',
      user: 'u191251575_manu',
      password: 'Cerounocero.com20182417',
      database: 'u191251575_manu',
      port: 3306
    });

    console.log('✅ Conectado a base de datos\n');

    // Insertar configuraciones de kiosko
    console.log('🏪 Insertando configuraciones de kiosko...');
    await connection.query(`
      INSERT INTO kiosk_settings (setting_key, setting_value, data_type, description) VALUES
      ('kiosk_mode_enabled', 'false', 'boolean', 'Activar modo kiosko'),
      ('kiosk_fullscreen', 'true', 'boolean', 'Pantalla completa automática'),
      ('kiosk_timeout_seconds', '120', 'number', 'Tiempo de inactividad antes de reiniciar'),
      ('kiosk_show_prices', 'true', 'boolean', 'Mostrar precios en kiosko'),
      ('kiosk_auto_print', 'false', 'boolean', 'Impresión automática de tickets'),
      ('kiosk_require_confirmation', 'true', 'boolean', 'Requiere confirmación antes de enviar pedido'),
      ('kiosk_welcome_message', 'Bienvenido a Supernova', 'string', 'Mensaje de bienvenida'),
      ('kiosk_background_theme', 'cosmic', 'string', 'Tema de fondo (cosmic, dark, gradient)')
      ON DUPLICATE KEY UPDATE updated_at = CURRENT_TIMESTAMP
    `);
    console.log('   ✓ Configuraciones insertadas\n');

    // Insertar grupos de modificadores
    console.log('🎛️  Insertando grupos de modificadores...');
    await connection.query(`
      INSERT INTO modifier_groups (name, description, is_required, min_selections, max_selections) VALUES
      ('Tamaño', 'Elige el tamaño de tu producto', true, 1, 1),
      ('Ingredientes Extra', 'Agrega ingredientes adicionales', false, 0, 5),
      ('Salsas', 'Selecciona tus salsas favoritas', false, 0, 3),
      ('Bebida', 'Elige tu bebida', false, 0, 1),
      ('Temperatura', 'Temperatura de tu bebida', false, 0, 1),
      ('Tipo de Pan', 'Selecciona tu pan favorito', false, 0, 1),
      ('Punto de Cocción', 'Cómo deseas tu hamburguesa', false, 0, 1),
      ('Quesos', 'Tipos de queso', false, 0, 3),
      ('Vegetales', 'Selecciona vegetales', false, 0, 6)
    `);
    console.log('   ✓ Grupos insertados\n');

    // Insertar códigos QR para mesas
    console.log('📱 Insertando códigos QR de mesas...');
    await connection.query(`
      INSERT IGNORE INTO table_qr_codes (table_number, table_name, qr_token, max_capacity, location) VALUES
      ('M1', 'Mesa 1', UUID(), 4, 'Zona Principal'),
      ('M2', 'Mesa 2', UUID(), 4, 'Zona Principal'),
      ('M3', 'Mesa 3', UUID(), 4, 'Zona Principal'),
      ('M4', 'Mesa 4', UUID(), 6, 'Zona Terraza'),
      ('M5', 'Mesa 5', UUID(), 6, 'Zona Terraza'),
      ('M6', 'Mesa 6', UUID(), 2, 'Barra'),
      ('M7', 'Mesa 7', UUID(), 2, 'Barra'),
      ('M8', 'Mesa 8', UUID(), 8, 'Salón VIP'),
      ('M9', 'Mesa 9', UUID(), 4, 'Zona Principal'),
      ('M10', 'Mesa 10', UUID(), 4, 'Zona Principal')
    `);
    console.log('   ✓ Códigos QR generados\n');

    // Actualizar business_info con nuevos campos
    console.log('⚙️  Actualizando configuración de negocio...');
    await connection.query(`
      UPDATE business_info 
      SET 
        kiosk_enabled = false,
        qr_orders_enabled = false,
        cash_management_enabled = true,
        terminal_point_enabled = false,
        timezone = 'America/Mexico_City',
        currency = 'MXN',
        tax_rate = 0.00
      WHERE id = 1
    `);
    console.log('   ✓ Configuración actualizada\n');

    // Verificar datos
    console.log('🔍 Verificando datos insertados...\n');
    
    const [kioskSettings] = await connection.query('SELECT COUNT(*) as count FROM kiosk_settings');
    console.log(`   ✓ Configuraciones de kiosko: ${kioskSettings[0].count}`);

    const [modifierGroups] = await connection.query('SELECT COUNT(*) as count FROM modifier_groups');
    console.log(`   ✓ Grupos de modificadores: ${modifierGroups[0].count}`);

    const [qrCodes] = await connection.query('SELECT COUNT(*) as count FROM table_qr_codes');
    console.log(`   ✓ Códigos QR de mesas: ${qrCodes[0].count}`);

    console.log('\n✅ ¡Datos iniciales insertados correctamente!\n');

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

insertInitialData();
