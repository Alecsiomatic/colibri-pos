const mysql = require('mysql2/promise');

async function setupPaymentTables() {
  try {
    // Configuración de la base de datos
    const dbConfig = {
      host: process.env.DB_HOST || 'srv440.hstgr.io',
      user: process.env.DB_USER || 'u191251575_manu',
      password: process.env.DB_PASSWORD || 'Cerounocero.com20182417',
      database: process.env.DB_NAME || 'u191251575_manu',
      port: parseInt(process.env.DB_PORT || '3306')
    };

    console.log('🔄 Conectando a la base de datos...');
    const connection = await mysql.createConnection(dbConfig);

    // Crear tabla de pagos
    console.log('💰 Creando tabla de pagos...');
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS payments (
          id INT AUTO_INCREMENT PRIMARY KEY,
          table_name VARCHAR(50) NOT NULL,
          total_amount DECIMAL(10,2) NOT NULL,
          payment_method ENUM('efectivo', 'tarjeta') NOT NULL,
          amount_paid DECIMAL(10,2) NOT NULL,
          change_amount DECIMAL(10,2) DEFAULT 0,
          order_ids JSON,
          payment_date DATETIME NOT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          
          INDEX idx_table_name (table_name),
          INDEX idx_payment_date (payment_date),
          INDEX idx_payment_method (payment_method)
      )
    `);

    // Crear tabla de historial de mesas
    console.log('📝 Creando tabla de historial de mesas...');
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS table_history (
          id INT AUTO_INCREMENT PRIMARY KEY,
          table_name VARCHAR(50) NOT NULL,
          action_type ENUM('opened', 'closed_with_payment', 'order_added', 'order_cancelled') NOT NULL,
          total_amount DECIMAL(10,2) DEFAULT 0,
          payment_method ENUM('efectivo', 'tarjeta') NULL,
          order_count INT DEFAULT 0,
          additional_data JSON,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          
          INDEX idx_table_name (table_name),
          INDEX idx_action_type (action_type),
          INDEX idx_created_at (created_at)
      )
    `);

    // Verificar y agregar índices a la tabla orders si no existen
    console.log('🔍 Verificando índices en tabla orders...');
    
    try {
      await connection.execute('ALTER TABLE orders ADD INDEX idx_table_name (table_name)');
      console.log('✅ Índice idx_table_name agregado a orders');
    } catch (e) {
      console.log('ℹ️ Índice idx_table_name ya existe en orders');
    }

    try {
      await connection.execute('ALTER TABLE orders ADD INDEX idx_status (status)');
      console.log('✅ Índice idx_status agregado a orders');
    } catch (e) {
      console.log('ℹ️ Índice idx_status ya existe en orders');
    }

    try {
      await connection.execute('ALTER TABLE orders ADD INDEX idx_created_at (created_at)');
      console.log('✅ Índice idx_created_at agregado a orders');
    } catch (e) {
      console.log('ℹ️ Índice idx_created_at ya existe en orders');
    }

    console.log('🎉 ¡Tablas de pago configuradas exitosamente!');
    
    // Insertar un registro de prueba
    const testPayment = await connection.execute(`
      INSERT INTO payments (
        table_name, total_amount, payment_method, amount_paid, 
        change_amount, order_ids, payment_date
      ) VALUES (?, ?, ?, ?, ?, ?, NOW())
    `, ['MESA-TEST', 50.00, 'efectivo', 60.00, 10.00, JSON.stringify([1, 2])]);

    console.log('✅ Registro de prueba insertado en payments');

    await connection.execute('DELETE FROM payments WHERE table_name = ?', ['MESA-TEST']);
    console.log('🧹 Registro de prueba eliminado');

    await connection.end();
    console.log('✅ Conexión cerrada');

  } catch (error) {
    console.error('❌ Error configurando tablas de pago:', error);
    process.exit(1);
  }
}

setupPaymentTables();