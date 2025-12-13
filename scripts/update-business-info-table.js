const mysql = require('mysql2/promise');

async function updateBusinessInfo() {
  let connection;
  
  try {
    console.log('⚙️  Actualizando tabla business_info...\n');
    
    connection = await mysql.createConnection({
      host: 'srv440.hstgr.io',
      user: 'u191251575_manu',
      password: 'Cerounocero.com20182417',
      database: 'u191251575_manu',
      port: 3306
    });

    // Agregar columnas una por una
    const columns = [
      { name: 'kiosk_enabled', type: 'BOOLEAN DEFAULT FALSE' },
      { name: 'qr_orders_enabled', type: 'BOOLEAN DEFAULT FALSE' },
      { name: 'cash_management_enabled', type: 'BOOLEAN DEFAULT TRUE' },
      { name: 'terminal_point_enabled', type: 'BOOLEAN DEFAULT FALSE' },
      { name: 'timezone', type: "VARCHAR(50) DEFAULT 'America/Mexico_City'" },
      { name: 'currency', type: "VARCHAR(10) DEFAULT 'MXN'" },
      { name: 'tax_rate', type: 'DECIMAL(5,2) DEFAULT 0.00' }
    ];

    for (const col of columns) {
      try {
        await connection.query(`
          ALTER TABLE business_info 
          ADD COLUMN ${col.name} ${col.type}
        `);
        console.log(`   ✓ Columna ${col.name} agregada`);
      } catch (error) {
        if (error.message.includes('Duplicate column')) {
          console.log(`   ℹ  Columna ${col.name} ya existe`);
        } else {
          console.log(`   ⚠️  ${col.name}: ${error.message}`);
        }
      }
    }

    console.log('\n✅ Tabla business_info actualizada\n');

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

updateBusinessInfo();
