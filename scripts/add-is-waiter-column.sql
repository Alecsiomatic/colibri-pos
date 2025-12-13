-- Agregar columna is_waiter a la tabla users
ALTER TABLE users 
  ADD COLUMN is_waiter TINYINT(1) DEFAULT 0 AFTER is_driver;

CREATE INDEX IF NOT EXISTS idx_is_waiter ON users(is_waiter);

-- Para MySQL, si el índice ya existe, este comando lo ignora.
-- Si usas SQLite, elimina la línea CREATE INDEX y usa solo el ALTER TABLE.
