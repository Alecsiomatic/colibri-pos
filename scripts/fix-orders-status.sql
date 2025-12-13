-- Corrige todos los pedidos con status nulo o vacío
UPDATE orders SET status='pending' WHERE status IS NULL OR status='';
