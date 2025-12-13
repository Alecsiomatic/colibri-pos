const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');

async function initializeDatabase() {
  console.log('🚀 Iniciando configuración de base de datos MySQL...');
  
  const config = {
    host: 'srv440.hstgr.io',
    user: 'u191251575_manu',
    password: 'Cerounocero.com20182417',
    database: 'u191251575_manu',
    port: 3306
  };

  try {
    // Conectar a MySQL
    const connection = await mysql.createConnection(config);
    console.log('✅ Conectado a MySQL');

    // Crear las tablas directamente (no depender del archivo .sql)
    const queries = [
      `CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        username VARCHAR(100) UNIQUE NOT NULL,
        is_admin BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_email (email),
        INDEX idx_username (username)
      )`,
      
      `CREATE TABLE IF NOT EXISTS categories (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        description TEXT,
        image_url VARCHAR(500),
        is_active BOOLEAN DEFAULT TRUE,
        sort_order INT DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )`,
      
      `CREATE TABLE IF NOT EXISTS products (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(200) NOT NULL,
        description TEXT,
        price DECIMAL(10,2) NOT NULL,
        category_id INT,
        image_url VARCHAR(500),
        is_available BOOLEAN DEFAULT TRUE,
        is_featured BOOLEAN DEFAULT FALSE,
        stock INT DEFAULT 0,
        ingredients TEXT,
        allergens TEXT,
        nutritional_info JSON,
        preparation_time INT DEFAULT 15,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL,
        INDEX idx_category (category_id),
        INDEX idx_featured (is_featured),
        INDEX idx_available (is_available)
      )`,
      
      `CREATE TABLE IF NOT EXISTS orders (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT,
        status ENUM('pendiente', 'preparando', 'listo_para_recoger', 'asignado_repartidor', 'en_camino', 'entregado', 'cancelado') DEFAULT 'pendiente',
        total DECIMAL(10,2) NOT NULL,
        items JSON NOT NULL,
        customer_info JSON,
        delivery_address JSON,
        payment_method VARCHAR(50) DEFAULT 'efectivo',
        payment_status ENUM('pendiente', 'pagado', 'fallido') DEFAULT 'pendiente',
        notes TEXT,
        estimated_delivery_time TIMESTAMP NULL,
        delivered_at TIMESTAMP NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
        INDEX idx_user (user_id),
        INDEX idx_status (status),
        INDEX idx_created (created_at)
      )`,
      
      `CREATE TABLE IF NOT EXISTS delivery_drivers (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT UNIQUE,
        name VARCHAR(100) NOT NULL,
        phone VARCHAR(20) NOT NULL,
        email VARCHAR(255),
        vehicle_type VARCHAR(50),
        license_plate VARCHAR(20),
        is_active BOOLEAN DEFAULT TRUE,
        is_available BOOLEAN DEFAULT TRUE,
        current_location JSON,
        rating DECIMAL(3,2) DEFAULT 5.0,
        total_deliveries INT DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        INDEX idx_active (is_active),
        INDEX idx_available (is_available)
      )`,
      
      `CREATE TABLE IF NOT EXISTS delivery_assignments (
        id INT AUTO_INCREMENT PRIMARY KEY,
        order_id INT NOT NULL,
        driver_id INT NOT NULL,
        status ENUM('pending', 'accepted', 'rejected', 'completed', 'cancelled') DEFAULT 'pending',
        assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        accepted_at TIMESTAMP NULL,
        completed_at TIMESTAMP NULL,
        start_location JSON,
        delivery_location JSON,
        estimated_distance DECIMAL(8,2),
        estimated_duration INT,
        actual_duration INT,
        driver_notes TEXT,
        FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
        FOREIGN KEY (driver_id) REFERENCES delivery_drivers(id) ON DELETE CASCADE,
        INDEX idx_order (order_id),
        INDEX idx_driver (driver_id),
        INDEX idx_status (status)
      )`,
      
      `CREATE TABLE IF NOT EXISTS chat_conversations (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT,
        phone_number VARCHAR(20),
        whatsapp_conversation_id VARCHAR(100),
        status ENUM('active', 'closed', 'archived') DEFAULT 'active',
        last_message_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
        INDEX idx_user (user_id),
        INDEX idx_phone (phone_number),
        INDEX idx_whatsapp (whatsapp_conversation_id)
      )`,
      
      `CREATE TABLE IF NOT EXISTS chat_messages (
        id INT AUTO_INCREMENT PRIMARY KEY,
        conversation_id INT NOT NULL,
        message_id VARCHAR(100),
        sender_type ENUM('user', 'assistant', 'whatsapp_user') NOT NULL,
        content TEXT NOT NULL,
        message_type ENUM('text', 'image', 'audio', 'document', 'order') DEFAULT 'text',
        metadata JSON,
        is_read BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (conversation_id) REFERENCES chat_conversations(id) ON DELETE CASCADE,
        INDEX idx_conversation (conversation_id),
        INDEX idx_sender (sender_type),
        INDEX idx_created (created_at)
      )`,
      
      `CREATE TABLE IF NOT EXISTS inventory (
        id INT AUTO_INCREMENT PRIMARY KEY,
        product_id INT NOT NULL,
        quantity INT NOT NULL DEFAULT 0,
        min_stock INT DEFAULT 5,
        max_stock INT DEFAULT 100,
        unit VARCHAR(20) DEFAULT 'unidad',
        cost_price DECIMAL(10,2),
        supplier VARCHAR(100),
        last_restocked TIMESTAMP NULL,
        expiry_date DATE NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
        INDEX idx_product (product_id),
        INDEX idx_quantity (quantity)
      )`,
      
      `CREATE TABLE IF NOT EXISTS user_sessions (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        session_token VARCHAR(255) UNIQUE NOT NULL,
        refresh_token VARCHAR(255) UNIQUE,
        expires_at TIMESTAMP NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        INDEX idx_user (user_id),
        INDEX idx_token (session_token),
        INDEX idx_expires (expires_at)
      )`,
      
      `CREATE TABLE IF NOT EXISTS system_config (
        id INT AUTO_INCREMENT PRIMARY KEY,
        config_key VARCHAR(100) UNIQUE NOT NULL,
        config_value TEXT,
        description TEXT,
        is_public BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_key (config_key)
      )`,
      
      // Insertar datos iniciales
      `INSERT IGNORE INTO categories (name, description, sort_order) VALUES 
       ('Entradas', 'Aperitivos y entradas', 1),
       ('Platos Principales', 'Platos principales del menú', 2),
       ('Bebidas', 'Bebidas frías y calientes', 3),
       ('Postres', 'Postres y dulces', 4)`,
       
      `INSERT IGNORE INTO system_config (config_key, config_value, description, is_public) VALUES 
       ('restaurant_name', 'Mi Restaurante', 'Nombre del restaurante', TRUE),
       ('restaurant_phone', '+1234567890', 'Teléfono del restaurante', TRUE),
       ('restaurant_address', 'Dirección del restaurante', 'Dirección física', TRUE),
       ('delivery_fee', '50', 'Tarifa de delivery en centavos', TRUE),
       ('min_order_amount', '1000', 'Monto mínimo de pedido en centavos', TRUE)`
    ];
    
    console.log(`📝 Ejecutando ${queries.length} consultas...`);
    
    // Ejecutar cada consulta
    for (let i = 0; i < queries.length; i++) {
      const query = queries[i];
      if (query.trim()) {
        try {
          await connection.execute(query);
          console.log(`✅ Consulta ${i + 1}/${queries.length} ejecutada correctamente`);
        } catch (error) {
          if (error.code === 'ER_TABLE_EXISTS_ERROR' || error.code === 'ER_DUP_ENTRY') {
            console.log(`⚠️ Consulta ${i + 1}: ${error.message} (ignorado)`);
          } else {
            console.error(`❌ Error en consulta ${i + 1}:`, error.message);
            throw error;
          }
        }
      }
    }
    
    // Verificar que las tablas se crearon correctamente
    const [tables] = await connection.execute('SHOW TABLES');
    console.log('📊 Tablas creadas:');
    tables.forEach((table, index) => {
      const tableName = Object.values(table)[0];
      console.log(`  ${index + 1}. ${tableName}`);
    });
    
    await connection.end();
    console.log('🎉 Base de datos inicializada correctamente!');
    
  } catch (error) {
    console.error('💥 Error al inicializar la base de datos:', error);
    process.exit(1);
  }
}

// Función para verificar la conexión
async function testConnection() {
  try {
    console.log('🔌 Probando conexión a MySQL...');
    const config = {
      host: 'srv440.hstgr.io',
      user: 'u191251575_manu',
      password: 'Cerounocero.com20182417',
      database: 'u191251575_manu',
      port: 3306
    };
    
    const connection = await mysql.createConnection(config);
    await connection.execute('SELECT 1');
    await connection.end();
    console.log('✅ Conexión exitosa!');
    return true;
  } catch (error) {
    console.error('❌ Error de conexión:', error);
    return false;
  }
}

// Ejecutar si es llamado directamente
if (require.main === module) {
  (async () => {
    const isConnected = await testConnection();
    if (isConnected) {
      await initializeDatabase();
    }
    process.exit(0);
  })();
}

module.exports = { initializeDatabase, testConnection };