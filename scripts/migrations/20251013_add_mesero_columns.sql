-- Migración para soporte de pedidos de mesero
ALTER TABLE orders
  ADD COLUMN waiter_order TINYINT(1) DEFAULT 0,
  ADD COLUMN `table` VARCHAR(64) DEFAULT NULL;

-- Migración para actualizar pedidos de mesero a status 'open_table'
UPDATE orders
SET status = 'open_table'
WHERE waiter_order = 1 AND (status = 'pendiente' OR status = 1);
