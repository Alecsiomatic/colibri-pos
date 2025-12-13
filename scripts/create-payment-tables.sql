-- Script para crear las tablas necesarias para el sistema de pagos y cierre de mesas

-- Tabla de pagos para registrar todas las transacciones
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
);

-- Tabla de historial de mesas para tracking de actividades
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
);

-- Verificar estructura de la tabla orders (en caso de que necesite actualizaciones)
-- La tabla orders debería tener estos campos:
-- id, customer_name, items, total, table_name, status, notes, created_at, updated_at

-- Agregar índices si no existen
ALTER TABLE orders ADD INDEX IF NOT EXISTS idx_table_name (table_name);
ALTER TABLE orders ADD INDEX IF NOT EXISTS idx_status (status);
ALTER TABLE orders ADD INDEX IF NOT EXISTS idx_created_at (created_at);

-- Ejemplo de consultas útiles para reportes:

-- 1. Pagos por método en un rango de fechas
-- SELECT 
--     payment_method,
--     COUNT(*) as transactions,
--     SUM(total_amount) as total_amount,
--     SUM(change_amount) as total_change
-- FROM payments 
-- WHERE payment_date BETWEEN '2024-01-01' AND '2024-01-31'
-- GROUP BY payment_method;

-- 2. Actividad de mesas por día
-- SELECT 
--     DATE(created_at) as date,
--     table_name,
--     COUNT(*) as activities,
--     SUM(CASE WHEN action_type = 'closed_with_payment' THEN total_amount ELSE 0 END) as revenue
-- FROM table_history
-- WHERE created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)
-- GROUP BY DATE(created_at), table_name
-- ORDER BY date DESC, table_name;

-- 3. Órdenes pagadas en efectivo vs tarjeta
-- SELECT 
--     p.payment_method,
--     COUNT(DISTINCT p.table_name) as tables_served,
--     AVG(p.total_amount) as avg_ticket,
--     SUM(p.total_amount) as total_revenue
-- FROM payments p
-- WHERE p.payment_date >= DATE_SUB(NOW(), INTERVAL 1 DAY)
-- GROUP BY p.payment_method;