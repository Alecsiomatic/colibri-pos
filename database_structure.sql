CREATE DATABASE IF NOT EXISTS restaurante_db;
USE restaurante_db;

-- Tabla de usuarios
CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  email VARCHAR(255) NOT NULL UNIQUE,
  username VARCHAR(255) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  is_admin BOOLEAN DEFAULT FALSE,
  is_driver BOOLEAN DEFAULT FALSE,
  is_waiter BOOLEAN DEFAULT FALSE,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Tabla de categorías
CREATE TABLE IF NOT EXISTS categories (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  image_url VARCHAR(500),
  is_active BOOLEAN DEFAULT TRUE,
  sort_order INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Tabla de productos
CREATE TABLE IF NOT EXISTS products (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  price DECIMAL(10,2) NOT NULL,
  cost_price DECIMAL(10,2) DEFAULT 0,
  category_id INT,
  image_url VARCHAR(500),
  is_available BOOLEAN DEFAULT TRUE,
  is_featured BOOLEAN DEFAULT FALSE,
  stock_quantity INT DEFAULT 0,
  stock_threshold INT DEFAULT 10,
  sort_order INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL
);

-- Tabla de órdenes
CREATE TABLE IF NOT EXISTS orders (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT,
  customer_name VARCHAR(255),
  customer_email VARCHAR(255),
  customer_phone VARCHAR(50),
  customer_address TEXT,
  delivery_type ENUM('pickup', 'delivery') DEFAULT 'pickup',
  payment_method ENUM('efectivo', 'tarjeta', 'mercadopago') DEFAULT 'efectivo',
  status ENUM('pending', 'confirmed', 'preparing', 'ready', 'in_delivery', 'delivered', 'cancelled', 'open_table', 'paid') DEFAULT 'pending',
  items JSON NOT NULL,
  total DECIMAL(10,2) NOT NULL,
  notes TEXT,
  table_name VARCHAR(100),
  waiter_order BOOLEAN DEFAULT FALSE,
  driver_id INT,
  estimated_delivery_time DATETIME,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
  FOREIGN KEY (driver_id) REFERENCES users(id) ON DELETE SET NULL
);

-- Tabla de pagos (para cierre de mesas)
CREATE TABLE IF NOT EXISTS payments (
  id INT AUTO_INCREMENT PRIMARY KEY,
  table_name VARCHAR(100) NOT NULL,
  total_amount DECIMAL(10,2) NOT NULL,
  payment_method ENUM('efectivo', 'tarjeta') NOT NULL,
  amount_paid DECIMAL(10,2) NOT NULL,
  change_amount DECIMAL(10,2) DEFAULT 0,
  waiter_id INT,
  payment_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  notes TEXT,
  FOREIGN KEY (waiter_id) REFERENCES users(id) ON DELETE SET NULL
);

-- Tabla de historial de mesas
CREATE TABLE IF NOT EXISTS table_history (
  id INT AUTO_INCREMENT PRIMARY KEY,
  table_name VARCHAR(100) NOT NULL,
  waiter_id INT,
  orders_count INT DEFAULT 0,
  total_amount DECIMAL(10,2) DEFAULT 0,
  payment_method ENUM('efectivo', 'tarjeta'),
  opened_at TIMESTAMP,
  closed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (waiter_id) REFERENCES users(id) ON DELETE SET NULL
);

-- Tabla de configuración del negocio
CREATE TABLE IF NOT EXISTS business_info (
  id INT AUTO_INCREMENT PRIMARY KEY,
  business_name VARCHAR(255) NOT NULL DEFAULT 'Mi Restaurante',
  business_address TEXT,
  business_phone VARCHAR(50),
  business_email VARCHAR(255),
  logo_url VARCHAR(500),
  openai_api_key VARCHAR(255),
  openai_model VARCHAR(100) DEFAULT 'gpt-3.5-turbo',
  ai_enabled BOOLEAN DEFAULT FALSE,
  mercadopago_access_token VARCHAR(500),
  mercadopago_public_key VARCHAR(500),
  delivery_enabled BOOLEAN DEFAULT TRUE,
  pickup_enabled BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Tabla de asignaciones de drivers
CREATE TABLE IF NOT EXISTS driver_assignments (
  id INT AUTO_INCREMENT PRIMARY KEY,
  order_id INT NOT NULL,
  driver_id INT NOT NULL,
  assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  accepted_at TIMESTAMP NULL,
  completed_at TIMESTAMP NULL,
  status ENUM('assigned', 'accepted', 'completed', 'cancelled') DEFAULT 'assigned',
  driver_location JSON,
  FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
  FOREIGN KEY (driver_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Tabla de movimientos de inventario
CREATE TABLE IF NOT EXISTS inventory_movements (
  id INT AUTO_INCREMENT PRIMARY KEY,
  product_id INT NOT NULL,
  movement_type ENUM('in', 'out', 'adjustment') NOT NULL,
  quantity INT NOT NULL,
  previous_stock INT NOT NULL,
  new_stock INT NOT NULL,
  reason VARCHAR(255),
  user_id INT,
  order_id INT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
  FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE SET NULL
);

-- Insertar categorías iniciales
INSERT IGNORE INTO categories (id, name, description, is_active) VALUES
(1, 'Entrantes', 'Aperitivos y entradas', TRUE),
(2, 'Platos Principales', 'Comidas principales', TRUE),
(3, 'Postres', 'Dulces y postres', TRUE),
(4, 'Bebidas', 'Bebidas frías y calientes', TRUE);

-- Insertar productos de ejemplo
INSERT IGNORE INTO products (id, name, description, price, cost_price, category_id, is_available, is_featured) VALUES
(1, 'Ensalada César', 'Lechuga, pollo, crutones, queso parmesano', 85.00, 35.00, 1, TRUE, TRUE),
(2, 'Hamburguesa Clásica', 'Carne, lechuga, tomate, cebolla, queso', 120.00, 50.00, 2, TRUE, TRUE),
(3, 'Pizza Margherita', 'Salsa de tomate, mozzarella, albahaca', 150.00, 60.00, 2, TRUE, FALSE),
(4, 'Tiramisú', 'Postre italiano tradicional', 65.00, 25.00, 3, TRUE, FALSE),
(5, 'Coca Cola', 'Refresco 355ml', 35.00, 15.00, 4, TRUE, FALSE);

-- Insertar configuración inicial del negocio
INSERT IGNORE INTO business_info (id, business_name, business_address, business_phone) VALUES
(1, 'Super Nova Restaurant', 'Calle Principal 123', '+52 123 456 7890');

-- Crear usuario admin inicial (password: admin123)
-- Nota: En producción, cambiar inmediatamente esta contraseña
INSERT IGNORE INTO users (id, email, username, password, is_admin, is_active) VALUES
(1, 'admin@supernova.com', 'admin', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', TRUE, TRUE);

-- Índices para optimización
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_created_at ON orders(created_at);
CREATE INDEX idx_orders_user_id ON orders(user_id);
CREATE INDEX idx_orders_driver_id ON orders(driver_id);
CREATE INDEX idx_products_category_id ON products(category_id);
CREATE INDEX idx_products_is_available ON products(is_available);
CREATE INDEX idx_payments_payment_date ON payments(payment_date);
CREATE INDEX idx_payments_waiter_id ON payments(waiter_id);
CREATE INDEX idx_driver_assignments_driver_id ON driver_assignments(driver_id);
CREATE INDEX idx_driver_assignments_order_id ON driver_assignments(order_id);
CREATE INDEX idx_inventory_movements_product_id ON inventory_movements(product_id);
CREATE INDEX idx_inventory_movements_created_at ON inventory_movements(created_at);