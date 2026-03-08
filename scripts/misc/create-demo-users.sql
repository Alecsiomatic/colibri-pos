-- ============================================
-- USUARIOS DEMO PARA COLIBRÍ-REST
-- ============================================
-- Ejecuta este SQL en phpMyAdmin
-- Contraseña para todos: admin123
-- ============================================

-- Hash de password "admin123" (bcrypt)
-- $2a$10$YourHashHere - lo generaremos con PHP

-- Primero verificar si existen y eliminarlos
DELETE FROM users WHERE email IN (
  'admin@supernova.com',
  'cajero@supernova.com',
  'mesero@supernova.com',
  'driver@supernova.com'
);

-- Crear usuarios demo
-- NOTA: Necesitas generar el hash de password primero

-- OPCIÓN 1: Si tienes bcrypt en PHP, ejecuta esto primero:
-- SELECT PASSWORD('admin123'); -- NO usar esto, es inseguro
-- Mejor usa: https://bcrypt-generator.com/ con el texto "admin123"

-- Hash generado de "admin123" con bcrypt (cost 10):
-- $2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy

INSERT INTO users (name, email, password, is_admin, is_waiter, is_driver, created_at) VALUES
('Administrador Demo', 'admin@supernova.com', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 1, 0, 0, NOW()),
('Cajero Demo', 'cajero@supernova.com', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 0, 0, 0, NOW()),
('Mesero Demo', 'mesero@supernova.com', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 0, 1, 0, NOW()),
('Repartidor Demo', 'driver@supernova.com', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 0, 0, 1, NOW());

-- Verificar que se crearon correctamente
SELECT id, name, email, is_admin, is_waiter, is_driver, created_at 
FROM users 
WHERE email IN (
  'admin@supernova.com',
  'cajero@supernova.com',
  'mesero@supernova.com',
  'driver@supernova.com'
);

-- ============================================
-- CREDENCIALES DEMO:
-- ============================================
-- 👨‍💼 Admin:      admin@supernova.com   / admin123  → /admin/dashboard
-- 💰 Cajero:     cajero@supernova.com  / admin123  → /caja
-- 🍽️  Mesero:     mesero@supernova.com  / admin123  → /mesero/mesas-abiertas
-- 🛵 Repartidor: driver@supernova.com  / admin123  → /driver/dashboard
-- ============================================
