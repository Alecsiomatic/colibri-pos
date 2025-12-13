import mysql from 'mysql2/promise';

const dbConfig = {
  host: 'srv440.hstgr.io',
  user: 'u191251575_manu',
  password: 'Cerounocero.com20182417',
  database: 'u191251575_manu',
};

async function createSettingsTable() {
  const connection = await mysql.createConnection(dbConfig);

  try {
    console.log('📋 Creando tabla de configuraciones...\n');

    // Crear tabla
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS system_settings (
        id INT PRIMARY KEY AUTO_INCREMENT,
        setting_key VARCHAR(100) UNIQUE NOT NULL,
        setting_value TEXT,
        description TEXT,
        is_encrypted BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);

    console.log('✅ Tabla creada\n');

    // Insertar configuraciones de Mercado Pago
    await connection.execute(`
      INSERT INTO system_settings (setting_key, setting_value, description, is_encrypted) VALUES
      ('mercadopago_public_key', '', 'Mercado Pago Public Key', FALSE),
      ('mercadopago_access_token', '', 'Mercado Pago Access Token', TRUE),
      ('mercadopago_enabled', 'false', 'Habilitar pagos con Mercado Pago', FALSE)
      ON DUPLICATE KEY UPDATE setting_key = setting_key
    `);

    console.log('✅ Configuraciones de Mercado Pago insertadas\n');

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('✅ Sistema de configuraciones listo');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  } catch (error) {
    console.error('❌ Error:', error);
    throw error;
  } finally {
    await connection.end();
  }
}

createSettingsTable()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('❌ Error:', error);
    process.exit(1);
  });
