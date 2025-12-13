-- Script para limpiar historial de órdenes/compras
-- MANTIENE: usuarios, productos, categorías, configuración
-- ELIMINA: órdenes, items de órdenes, historial de compras

USE u191251575_manu;

-- ========================================
-- LIMPIEZA DE HISTORIAL DE ÓRDENES
-- ========================================

-- 1. Eliminar items de órdenes (detalles)
DELETE FROM order_items WHERE 1=1;
SELECT 'order_items eliminados' as resultado;

-- 2. Eliminar órdenes principales
DELETE FROM orders WHERE 1=1;
SELECT 'orders eliminadas' as resultado;

-- 3. Eliminar asignaciones de repartidores (si existe la tabla)
DELETE FROM driver_assignments WHERE 1=1;
SELECT 'driver_assignments eliminadas' as resultado;

-- 4. Eliminar movimientos de inventario relacionados con ventas
DELETE FROM inventory_movements WHERE movement_type = 'sale';
SELECT 'inventory_movements de ventas eliminados' as resultado;

-- 5. Resetear stocks a valores iniciales (opcional)
-- UPDATE products SET stock = 100 WHERE stock IS NOT NULL;
-- SELECT 'Stocks reseteados a 100' as resultado;

-- ========================================
-- VERIFICACIÓN DE LIMPIEZA
-- ========================================

-- Contar registros restantes
SELECT 
    'RESUMEN DE LIMPIEZA' as tipo,
    '' as tabla,
    '' as registros;

SELECT 
    'Órdenes restantes:' as tipo,
    'orders' as tabla,
    COUNT(*) as registros
FROM orders;

SELECT 
    'Items de órdenes restantes:' as tipo,
    'order_items' as tabla,
    COUNT(*) as registros  
FROM order_items;

SELECT 
    'Usuarios conservados:' as tipo,
    'users' as tabla,
    COUNT(*) as registros
FROM users;

SELECT 
    'Productos conservados:' as tipo,
    'products' as tabla,
    COUNT(*) as registros
FROM products;

SELECT 
    'Categorías conservadas:' as tipo,
    'categories' as tabla,
    COUNT(*) as registros
FROM categories;

-- ========================================
-- RESETEAR AUTO_INCREMENT (OPCIONAL)
-- ========================================

-- Resetear IDs de órdenes para empezar desde 1
ALTER TABLE orders AUTO_INCREMENT = 1;
ALTER TABLE order_items AUTO_INCREMENT = 1;

SELECT 'AUTO_INCREMENT reseteado para orders y order_items' as resultado;

SELECT '✅ LIMPIEZA COMPLETADA - Sistema listo para producción' as estado;