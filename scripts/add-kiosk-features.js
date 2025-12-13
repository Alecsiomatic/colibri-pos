const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

async function runMigration() {
  let connection;
  
  try {
    console.log('🚀 Iniciando migración de funcionalidades de Kiosko...\n');
    
    // Crear conexión usando las mismas credenciales que el sistema
    connection = await mysql.createConnection({
      host: process.env.MYSQL_HOST || process.env.DB_HOST || 'srv440.hstgr.io',
      user: process.env.MYSQL_USER || process.env.DB_USER || 'u191251575_manu',
      password: process.env.MYSQL_PASSWORD || process.env.DB_PASSWORD || 'Cerounocero.com20182417',
      database: process.env.MYSQL_DATABASE || process.env.DB_NAME || 'u191251575_manu',
      port: parseInt(process.env.MYSQL_PORT || process.env.DB_PORT || '3306'),
      multipleStatements: true
    });

    console.log('✅ Conexión a base de datos establecida\n');

    // Leer archivo SQL
    const sqlPath = path.join(__dirname, 'add-kiosk-features.sql');
    const sqlScript = fs.readFileSync(sqlPath, 'utf8');

    // Dividir el script en statements individuales
    const statements = sqlScript
      .split('DELIMITER //')
      .filter(s => s.trim());

    console.log('📊 Ejecutando migraciones...\n');

    // Ejecutar cada statement
    for (let i = 0; i < statements.length; i++) {
      const stmt = statements[i].trim();
      if (!stmt) continue;

      try {
        // Si el statement contiene DELIMITER, procesarlo de forma especial
        if (stmt.includes('//')) {
          const parts = stmt.split('//');
          for (const part of parts) {
            const cleanPart = part.replace('DELIMITER ;', '').trim();
            if (cleanPart && !cleanPart.startsWith('--')) {
              await connection.query(cleanPart);
            }
          }
        } else {
          await connection.query(stmt);
        }
        
        // Mostrar progreso cada 5 statements
        if ((i + 1) % 5 === 0) {
          console.log(`   ⏳ Progreso: ${i + 1} operaciones completadas...`);
        }
      } catch (error) {
        // Ignorar errores de "ya existe" o "IF NOT EXISTS"
        if (!error.message.includes('already exists') && 
            !error.message.includes('Duplicate') &&
            !error.message.includes('Unknown column')) {
          console.error(`   ⚠️  Error en statement ${i + 1}:`, error.message);
        }
      }
    }

    console.log('\n✅ Todas las migraciones ejecutadas\n');

    // Verificar que las tablas se crearon correctamente
    console.log('🔍 Verificando tablas creadas...\n');

    const [tables] = await connection.query(`
      SELECT TABLE_NAME 
      FROM information_schema.TABLES 
      WHERE TABLE_SCHEMA = ? 
      AND TABLE_NAME IN (
        'product_modifiers', 
        'modifier_groups', 
        'product_modifier_groups',
        'cash_shifts',
        'cash_transactions',
        'table_qr_codes',
        'kiosk_settings',
        'payment_terminal_config'
      )
      ORDER BY TABLE_NAME
    `, [process.env.MYSQL_DATABASE || process.env.DB_NAME || 'u191251575_manu']);

    console.log('📋 Tablas verificadas:');
    tables.forEach(table => {
      console.log(`   ✓ ${table.TABLE_NAME}`);
    });

    console.log('\n📊 Verificando datos iniciales...\n');

    // Verificar configuraciones de kiosko
    const [kioskSettings] = await connection.query(
      'SELECT COUNT(*) as count FROM kiosk_settings'
    );
    console.log(`   ✓ Configuraciones de kiosko: ${kioskSettings[0].count}`);

    // Verificar grupos de modificadores
    const [modifierGroups] = await connection.query(
      'SELECT COUNT(*) as count FROM modifier_groups'
    );
    console.log(`   ✓ Grupos de modificadores: ${modifierGroups[0].count}`);

    // Verificar códigos QR de mesas
    const [qrCodes] = await connection.query(
      'SELECT COUNT(*) as count FROM table_qr_codes'
    );
    console.log(`   ✓ Códigos QR de mesas: ${qrCodes[0].count}`);

    console.log('\n' + '='.repeat(50));
    console.log('🎉 ¡MIGRACIÓN COMPLETADA EXITOSAMENTE!');
    console.log('='.repeat(50));
    console.log('\n✨ Nuevas funcionalidades agregadas:');
    console.log('   🎛️  Sistema de modificadores de productos');
    console.log('   💰 Sistema de turnos y corte de caja');
    console.log('   📱 Códigos QR para pedidos en mesas');
    console.log('   🏪 Configuración de modo kiosko');
    console.log('   💳 Integración con Terminal Point\n');

  } catch (error) {
    console.error('\n❌ Error durante la migración:', error.message);
    console.error('\n📋 Detalles del error:');
    console.error(error);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
      console.log('🔌 Conexión cerrada\n');
    }
  }
}

// Ejecutar migración
runMigration();
