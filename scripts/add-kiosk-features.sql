-- ============================================
-- 🚀 SUPERNOVA - NUEVAS FUNCIONALIDADES
-- Modificadores, Turnos de Caja, Kiosko, QR
-- ============================================

-- Usar la base de datos actual (no necesitamos especificar USE)
-- USE restaurante_db;

-- ============================================
-- 🎛️ TABLA DE MODIFICADORES DE PRODUCTOS
-- ============================================
CREATE TABLE IF NOT EXISTS product_modifiers (
  id INT AUTO_INCREMENT PRIMARY KEY,
  product_id INT NOT NULL,
  name VARCHAR(255) NOT NULL,
  price_adjustment DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  modifier_type ENUM('size', 'extra', 'option', 'ingredient') DEFAULT 'option',
  is_active BOOLEAN DEFAULT TRUE,
  display_order INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
  INDEX idx_product_id (product_id),
  INDEX idx_active (is_active),
  INDEX idx_display_order (display_order)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- 🎯 TABLA DE GRUPOS DE MODIFICADORES
-- ============================================
CREATE TABLE IF NOT EXISTS modifier_groups (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  is_required BOOLEAN DEFAULT FALSE,
  min_selections INT DEFAULT 0,
  max_selections INT DEFAULT 1,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_active (is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- 🔗 TABLA DE RELACIÓN PRODUCTO-GRUPO
-- ============================================
CREATE TABLE IF NOT EXISTS product_modifier_groups (
  id INT AUTO_INCREMENT PRIMARY KEY,
  product_id INT NOT NULL,
  modifier_group_id INT NOT NULL,
  display_order INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
  FOREIGN KEY (modifier_group_id) REFERENCES modifier_groups(id) ON DELETE CASCADE,
  UNIQUE KEY unique_product_group (product_id, modifier_group_id),
  INDEX idx_product_id (product_id),
  INDEX idx_group_id (modifier_group_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- 💰 TABLA DE TURNOS DE CAJA
-- ============================================
CREATE TABLE IF NOT EXISTS cash_shifts (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  user_name VARCHAR(255) NOT NULL,
  shift_type ENUM('morning', 'afternoon', 'evening', 'night') DEFAULT 'morning',
  opening_cash DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  closing_cash DECIMAL(10,2) DEFAULT NULL,
  expected_cash DECIMAL(10,2) DEFAULT NULL,
  cash_difference DECIMAL(10,2) DEFAULT NULL,
  total_sales DECIMAL(10,2) DEFAULT 0.00,
  cash_sales DECIMAL(10,2) DEFAULT 0.00,
  card_sales DECIMAL(10,2) DEFAULT 0.00,
  mercadopago_sales DECIMAL(10,2) DEFAULT 0.00,
  total_orders INT DEFAULT 0,
  status ENUM('open', 'closed') DEFAULT 'open',
  opened_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  closed_at TIMESTAMP NULL,
  notes TEXT,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_user_id (user_id),
  INDEX idx_status (status),
  INDEX idx_shift_type (shift_type),
  INDEX idx_opened_at (opened_at),
  INDEX idx_closed_at (closed_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- 💵 TABLA DE TRANSACCIONES DE EFECTIVO
-- ============================================
CREATE TABLE IF NOT EXISTS cash_transactions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  shift_id INT NOT NULL,
  order_id INT,
  transaction_type ENUM('sale', 'refund', 'adjustment', 'opening', 'closing') NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  payment_method ENUM('efectivo', 'tarjeta', 'mercadopago') NOT NULL,
  cash_received DECIMAL(10,2) DEFAULT NULL,
  change_given DECIMAL(10,2) DEFAULT NULL,
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (shift_id) REFERENCES cash_shifts(id) ON DELETE CASCADE,
  FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE SET NULL,
  INDEX idx_shift_id (shift_id),
  INDEX idx_order_id (order_id),
  INDEX idx_transaction_type (transaction_type),
  INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- 📱 TABLA DE CÓDIGOS QR PARA MESAS
-- ============================================
CREATE TABLE IF NOT EXISTS table_qr_codes (
  id INT AUTO_INCREMENT PRIMARY KEY,
  table_number VARCHAR(50) NOT NULL UNIQUE,
  table_name VARCHAR(255) NOT NULL,
  qr_code_url VARCHAR(500),
  qr_token VARCHAR(255) NOT NULL UNIQUE,
  is_active BOOLEAN DEFAULT TRUE,
  max_capacity INT DEFAULT 4,
  location VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_table_number (table_number),
  INDEX idx_qr_token (qr_token),
  INDEX idx_active (is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- 🏪 CONFIGURACIÓN DE KIOSKO
-- ============================================
CREATE TABLE IF NOT EXISTS kiosk_settings (
  id INT AUTO_INCREMENT PRIMARY KEY,
  setting_key VARCHAR(100) NOT NULL UNIQUE,
  setting_value TEXT,
  data_type ENUM('string', 'number', 'boolean', 'json') DEFAULT 'string',
  description TEXT,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_setting_key (setting_key)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- 💳 CONFIGURACIÓN DE MERCADOPAGO POINT
-- ============================================
CREATE TABLE IF NOT EXISTS payment_terminal_config (
  id INT AUTO_INCREMENT PRIMARY KEY,
  terminal_type ENUM('mercadopago_point', 'mercadopago_checkout', 'stripe') NOT NULL,
  access_token VARCHAR(500),
  public_key VARCHAR(500),
  device_id VARCHAR(255),
  webhook_secret VARCHAR(255),
  is_active BOOLEAN DEFAULT FALSE,
  test_mode BOOLEAN DEFAULT TRUE,
  config_data JSON,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY unique_terminal_type (terminal_type),
  INDEX idx_active (is_active),
  INDEX idx_terminal_type (terminal_type)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- AGREGAR CAMPOS A TABLA orders
-- ============================================
ALTER TABLE orders 
  ADD COLUMN IF NOT EXISTS qr_table_id INT DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS shift_id INT DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS cash_received DECIMAL(10,2) DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS change_given DECIMAL(10,2) DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS order_source ENUM('web', 'kiosk', 'qr', 'admin', 'waiter', 'driver') DEFAULT 'web',
  ADD COLUMN IF NOT EXISTS modifiers_data JSON DEFAULT NULL;

-- Agregar índices para los nuevos campos
ALTER TABLE orders ADD INDEX IF NOT EXISTS idx_qr_table_id (qr_table_id);
ALTER TABLE orders ADD INDEX IF NOT EXISTS idx_shift_id (shift_id);
ALTER TABLE orders ADD INDEX IF NOT EXISTS idx_order_source (order_source);

-- Agregar foreign keys
ALTER TABLE orders 
  ADD CONSTRAINT IF NOT EXISTS fk_orders_qr_table 
    FOREIGN KEY (qr_table_id) REFERENCES table_qr_codes(id) ON DELETE SET NULL,
  ADD CONSTRAINT IF NOT EXISTS fk_orders_shift 
    FOREIGN KEY (shift_id) REFERENCES cash_shifts(id) ON DELETE SET NULL;

-- ============================================
-- AGREGAR CAMPOS A TABLA products
-- ============================================
ALTER TABLE products 
  ADD COLUMN IF NOT EXISTS has_modifiers BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS preparation_time INT DEFAULT 10,
  ADD COLUMN IF NOT EXISTS calories INT DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS allergens TEXT DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS images JSON DEFAULT NULL;

ALTER TABLE products ADD INDEX IF NOT EXISTS idx_has_modifiers (has_modifiers);

-- ============================================
-- INSERTAR CONFIGURACIONES INICIALES DE KIOSKO
-- ============================================
INSERT INTO kiosk_settings (setting_key, setting_value, data_type, description) VALUES
('kiosk_mode_enabled', 'false', 'boolean', 'Activar modo kiosko'),
('kiosk_fullscreen', 'true', 'boolean', 'Pantalla completa automática'),
('kiosk_timeout_seconds', '120', 'number', 'Tiempo de inactividad antes de reiniciar'),
('kiosk_show_prices', 'true', 'boolean', 'Mostrar precios en kiosko'),
('kiosk_auto_print', 'false', 'boolean', 'Impresión automática de tickets'),
('kiosk_require_confirmation', 'true', 'boolean', 'Requiere confirmación antes de enviar pedido'),
('kiosk_welcome_message', 'Bienvenido a Supernova', 'string', 'Mensaje de bienvenida'),
('kiosk_background_theme', 'cosmic', 'string', 'Tema de fondo (cosmic, dark, gradient)')
ON DUPLICATE KEY UPDATE updated_at = CURRENT_TIMESTAMP;

-- ============================================
-- INSERTAR GRUPOS DE MODIFICADORES DE EJEMPLO
-- ============================================
INSERT INTO modifier_groups (name, description, is_required, min_selections, max_selections) VALUES
('Tamaño', 'Elige el tamaño de tu producto', true, 1, 1),
('Ingredientes Extra', 'Agrega ingredientes adicionales', false, 0, 5),
('Salsas', 'Selecciona tus salsas favoritas', false, 0, 3),
('Bebida', 'Elige tu bebida', false, 0, 1),
('Temperatura', 'Temperatura de tu bebida', false, 0, 1);

-- ============================================
-- INSERTAR CÓDIGOS QR DE EJEMPLO PARA MESAS
-- ============================================
INSERT INTO table_qr_codes (table_number, table_name, qr_token, max_capacity, location) VALUES
('M1', 'Mesa 1', UUID(), 4, 'Zona Principal'),
('M2', 'Mesa 2', UUID(), 4, 'Zona Principal'),
('M3', 'Mesa 3', UUID(), 4, 'Zona Principal'),
('M4', 'Mesa 4', UUID(), 6, 'Zona Terraza'),
('M5', 'Mesa 5', UUID(), 6, 'Zona Terraza'),
('M6', 'Mesa 6', UUID(), 2, 'Barra'),
('M7', 'Mesa 7', UUID(), 2, 'Barra'),
('M8', 'Mesa 8', UUID(), 8, 'Salón VIP');

-- ============================================
-- ACTUALIZAR business_info CON NUEVOS CAMPOS
-- ============================================
ALTER TABLE business_info
  ADD COLUMN IF NOT EXISTS kiosk_enabled BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS qr_orders_enabled BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS cash_management_enabled BOOLEAN DEFAULT TRUE,
  ADD COLUMN IF NOT EXISTS terminal_point_enabled BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS timezone VARCHAR(50) DEFAULT 'America/Mexico_City',
  ADD COLUMN IF NOT EXISTS currency VARCHAR(10) DEFAULT 'MXN',
  ADD COLUMN IF NOT EXISTS tax_rate DECIMAL(5,2) DEFAULT 0.00;

-- ============================================
-- VISTAS ÚTILES
-- ============================================

-- Vista de turnos activos
CREATE OR REPLACE VIEW active_shifts AS
SELECT 
  cs.*,
  u.username,
  u.email,
  COUNT(DISTINCT o.id) as current_orders,
  TIMESTAMPDIFF(MINUTE, cs.opened_at, NOW()) as minutes_open
FROM cash_shifts cs
LEFT JOIN users u ON cs.user_id = u.id
LEFT JOIN orders o ON o.shift_id = cs.id
WHERE cs.status = 'open'
GROUP BY cs.id;

-- Vista de estadísticas de turnos
CREATE OR REPLACE VIEW shift_statistics AS
SELECT 
  cs.id,
  cs.user_name,
  cs.shift_type,
  cs.opened_at,
  cs.closed_at,
  cs.total_sales,
  cs.total_orders,
  cs.cash_difference,
  CASE 
    WHEN cs.total_orders > 0 THEN cs.total_sales / cs.total_orders 
    ELSE 0 
  END as average_ticket,
  TIMESTAMPDIFF(MINUTE, cs.opened_at, COALESCE(cs.closed_at, NOW())) as duration_minutes
FROM cash_shifts cs
ORDER BY cs.opened_at DESC;

-- ============================================
-- TRIGGERS PARA ACTUALIZAR TURNOS AUTOMÁTICAMENTE
-- ============================================

DELIMITER //

-- Trigger para actualizar estadísticas de turno cuando se crea una orden
CREATE TRIGGER IF NOT EXISTS update_shift_on_order_insert
AFTER INSERT ON orders
FOR EACH ROW
BEGIN
  IF NEW.shift_id IS NOT NULL AND NEW.status NOT IN ('cancelled') THEN
    UPDATE cash_shifts 
    SET 
      total_orders = total_orders + 1,
      total_sales = total_sales + NEW.total,
      cash_sales = CASE 
        WHEN NEW.payment_method = 'efectivo' THEN cash_sales + NEW.total 
        ELSE cash_sales 
      END,
      card_sales = CASE 
        WHEN NEW.payment_method = 'tarjeta' THEN card_sales + NEW.total 
        ELSE card_sales 
      END,
      mercadopago_sales = CASE 
        WHEN NEW.payment_method = 'mercadopago' THEN mercadopago_sales + NEW.total 
        ELSE mercadopago_sales 
      END
    WHERE id = NEW.shift_id AND status = 'open';
  END IF;
END//

-- Trigger para actualizar cuando se modifica el estado de una orden
CREATE TRIGGER IF NOT EXISTS update_shift_on_order_update
AFTER UPDATE ON orders
FOR EACH ROW
BEGIN
  IF OLD.shift_id IS NOT NULL AND NEW.status = 'cancelled' AND OLD.status != 'cancelled' THEN
    -- Restar orden cancelada
    UPDATE cash_shifts 
    SET 
      total_orders = GREATEST(0, total_orders - 1),
      total_sales = GREATEST(0, total_sales - OLD.total),
      cash_sales = CASE 
        WHEN OLD.payment_method = 'efectivo' THEN GREATEST(0, cash_sales - OLD.total)
        ELSE cash_sales 
      END,
      card_sales = CASE 
        WHEN OLD.payment_method = 'tarjeta' THEN GREATEST(0, card_sales - OLD.total)
        ELSE card_sales 
      END,
      mercadopago_sales = CASE 
        WHEN OLD.payment_method = 'mercadopago' THEN GREATEST(0, mercadopago_sales - OLD.total)
        ELSE mercadopago_sales 
      END
    WHERE id = OLD.shift_id AND status = 'open';
  END IF;
END//

DELIMITER ;

-- ============================================
-- ✅ SCRIPT COMPLETADO
-- ============================================

SELECT 'Extensión de base de datos completada exitosamente! 🚀' as status;
