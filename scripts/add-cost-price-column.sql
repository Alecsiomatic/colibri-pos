-- Script para agregar campo cost_price a la tabla products
-- para manejar precios de costo y calcular ganancias

USE restaurante_db;

-- Agregar columna cost_price a la tabla products
ALTER TABLE products 
ADD COLUMN cost_price DECIMAL(10,2) DEFAULT 0.00 
COMMENT 'Precio de costo del producto para cálculo de ganancias';

-- Verificar que la columna se agregó correctamente
DESCRIBE products;

-- Mostrar algunos productos para verificar
SELECT id, name, price, cost_price FROM products LIMIT 5;