const mysql = require('mysql2/promise');

const DB_CONFIG = {
  host: 'srv440.hstgr.io',
  user: 'u191251575_colibridemo',
  password: 'Cerounocero.com20182417',
  database: 'u191251575_colibridemo'
};

async function createDriverTables() {
  const connection = await mysql.createConnection(DB_CONFIG);
  
  try {
    console.log('📦 Creando tabla driver_assignments...\n');
    
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS driver_assignments (
        id INT PRIMARY KEY AUTO_INCREMENT,
        driver_id INT NOT NULL,
        order_id INT NOT NULL,
        status ENUM('pending', 'accepted', 'in_transit', 'delivered', 'cancelled') DEFAULT 'pending',
        assigned_at DATETIME NOT NULL,
        accepted_at DATETIME NULL,
        delivered_at DATETIME NULL,
        cancelled_at DATETIME NULL,
        notes TEXT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (driver_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
        INDEX idx_driver_status (driver_id, status),
        INDEX idx_order (order_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    
    console.log('✅ Tabla driver_assignments creada exitosamente!\n');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await connection.end();
  }
}

createDriverTables();
