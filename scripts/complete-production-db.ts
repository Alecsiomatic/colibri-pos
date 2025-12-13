import mysql from 'mysql2/promise'
import { config } from 'dotenv'
import { resolve } from 'path'

config({ path: resolve(process.cwd(), '.env.local') })

async function completeProductionDatabase() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
  })

  try {
    console.log('🔧 COMPLETANDO BASE DE DATOS PARA PRODUCCIÓN\n')
    
    // 1. Agregar columnas faltantes a orders
    console.log('📝 Agregando columnas faltantes a tabla orders...')
    
    const ordersColumns = [
      { name: 'driver_id', sql: 'ADD COLUMN driver_id INT NULL AFTER customer_info' },
      { name: 'delivery_type', sql: "ADD COLUMN delivery_type ENUM('pickup', 'delivery') DEFAULT 'delivery' AFTER driver_id" },
      { name: 'delivery_address', sql: 'ADD COLUMN delivery_address TEXT NULL AFTER delivery_type' },
      { name: 'delivery_notes', sql: 'ADD COLUMN delivery_notes TEXT NULL AFTER delivery_address' },
    ]

    for (const col of ordersColumns) {
      try {
        await connection.query(`ALTER TABLE orders ${col.sql}`)
        console.log(`  ✅ Agregada columna: ${col.name}`)
      } catch (error: any) {
        if (error.code === 'ER_DUP_FIELDNAME') {
          console.log(`  ℹ️  Columna ${col.name} ya existe`)
        } else {
          console.error(`  ❌ Error agregando ${col.name}:`, error.message)
        }
      }
    }

    // 2. Crear tabla drivers (si no existe)
    console.log('\n🚗 Creando tabla drivers...')
    try {
      await connection.query(`
        CREATE TABLE IF NOT EXISTS drivers (
          id INT AUTO_INCREMENT PRIMARY KEY,
          user_id INT NOT NULL,
          vehicle_type VARCHAR(50),
          license_plate VARCHAR(20),
          phone VARCHAR(20),
          is_available TINYINT(1) DEFAULT 1,
          is_active TINYINT(1) DEFAULT 1,
          rating DECIMAL(3,2) DEFAULT 5.00,
          total_deliveries INT DEFAULT 0,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
          INDEX idx_user (user_id),
          INDEX idx_available (is_available)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
      `)
      console.log('  ✅ Tabla drivers creada')
    } catch (error: any) {
      if (error.code === 'ER_TABLE_EXISTS_ERROR') {
        console.log('  ℹ️  Tabla drivers ya existe')
      } else {
        console.error('  ❌ Error:', error.message)
      }
    }

    // 3. Crear tabla stock_changes (para historial de inventario)
    console.log('\n📊 Creando tabla stock_changes...')
    try {
      await connection.query(`
        CREATE TABLE IF NOT EXISTS stock_changes (
          id INT AUTO_INCREMENT PRIMARY KEY,
          product_id INT NOT NULL,
          quantity_before INT NOT NULL,
          quantity_after INT NOT NULL,
          quantity_change INT NOT NULL,
          change_type ENUM('order', 'manual', 'adjustment', 'restock') NOT NULL,
          reference_id INT NULL COMMENT 'order_id if type=order',
          user_id INT NULL,
          notes TEXT,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
          FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
          INDEX idx_product (product_id),
          INDEX idx_created (created_at),
          INDEX idx_type (change_type)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
      `)
      console.log('  ✅ Tabla stock_changes creada')
    } catch (error: any) {
      if (error.code === 'ER_TABLE_EXISTS_ERROR') {
        console.log('  ℹ️  Tabla stock_changes ya existe')
      } else {
        console.error('  ❌ Error:', error.message)
      }
    }

    // 4. Crear tabla inventory_movements (para auditoría de inventario)
    console.log('\n📦 Creando tabla inventory_movements...')
    try {
      await connection.query(`
        CREATE TABLE IF NOT EXISTS inventory_movements (
          id INT AUTO_INCREMENT PRIMARY KEY,
          product_id INT NOT NULL,
          movement_type ENUM('entrada', 'salida', 'ajuste', 'merma') NOT NULL,
          quantity INT NOT NULL,
          reason VARCHAR(255),
          user_id INT NULL,
          reference VARCHAR(100) COMMENT 'Número de factura, orden, etc',
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
          FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
          INDEX idx_product (product_id),
          INDEX idx_type (movement_type),
          INDEX idx_created (created_at)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
      `)
      console.log('  ✅ Tabla inventory_movements creada')
    } catch (error: any) {
      if (error.code === 'ER_TABLE_EXISTS_ERROR') {
        console.log('  ℹ️  Tabla inventory_movements ya existe')
      } else {
        console.error('  ❌ Error:', error.message)
      }
    }

    // 5. Agregar foreign key de driver_id en orders
    console.log('\n🔗 Agregando foreign keys...')
    try {
      await connection.query(`
        ALTER TABLE orders 
        ADD CONSTRAINT fk_orders_driver 
        FOREIGN KEY (driver_id) REFERENCES drivers(id) ON DELETE SET NULL
      `)
      console.log('  ✅ Foreign key orders -> drivers creada')
    } catch (error: any) {
      if (error.code === 'ER_DUP_KEY' || error.code === 'ER_FK_DUP_NAME') {
        console.log('  ℹ️  Foreign key ya existe')
      } else {
        console.error('  ❌ Error:', error.message)
      }
    }

    console.log('\n✅ BASE DE DATOS COMPLETADA PARA PRODUCCIÓN')
    
  } catch (error: any) {
    console.error('❌ Error:', error)
  } finally {
    await connection.end()
  }
}

completeProductionDatabase()
