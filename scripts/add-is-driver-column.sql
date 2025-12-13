-- Agregar columna is_driver a la tabla users
-- Esta columna permite identificar rápidamente si un usuario es repartidor

ALTER TABLE users 
ADD COLUMN IF NOT EXISTS is_driver BOOLEAN DEFAULT FALSE AFTER is_admin;

-- Crear índice para mejorar performance de queries
CREATE INDEX IF NOT EXISTS idx_is_driver ON users(is_driver);

-- Actualizar usuarios existentes que tienen registro en delivery_drivers
UPDATE users u
INNER JOIN delivery_drivers dd ON u.id = dd.user_id
SET u.is_driver = 1
WHERE dd.is_active = 1;

-- Verificar cambios
SELECT 
  u.id,
  u.username,
  u.is_driver,
  dd.id as driver_id,
  dd.name as driver_name
FROM users u
LEFT JOIN delivery_drivers dd ON u.id = dd.user_id
WHERE u.is_driver = 1 OR dd.id IS NOT NULL;
