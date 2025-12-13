-- Actualizar cash_transactions para soportar entradas y salidas de efectivo
ALTER TABLE cash_transactions 
MODIFY COLUMN transaction_type ENUM('sale', 'refund', 'adjustment', 'opening', 'closing', 'cash_in', 'cash_out') NOT NULL;

-- Agregar campo total_orders a cash_shifts si no existe
ALTER TABLE cash_shifts 
ADD COLUMN IF NOT EXISTS total_orders INT DEFAULT 0 AFTER mercadopago_sales;
