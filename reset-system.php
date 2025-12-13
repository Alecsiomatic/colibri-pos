<?php
$host = 'srv440.hstgr.io';
$username = 'u191251575_manu';
$password = 'Manu2024$';
$database = 'u191251575_manu';
$port = 3306;

try {
    echo "🔌 Conectando a la base de datos...\n";
    $pdo = new PDO("mysql:host=$host;port=$port;dbname=$database", $username, $password);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    
    echo "🧹 INICIANDO LIMPIEZA COMPLETA DE ÓRDENES...\n\n";
    
    // 1. Eliminar asignaciones de delivery
    echo "📦 Eliminando asignaciones de delivery...\n";
    $pdo->exec('DELETE FROM delivery_assignments');
    echo "✅ Asignaciones de delivery eliminadas\n";
    
    // 2. Eliminar todas las órdenes
    echo "🛒 Eliminando todas las órdenes...\n";
    $pdo->exec('DELETE FROM orders');
    echo "✅ Todas las órdenes eliminadas\n";
    
    // 3. Limpiar inventario (resetear a stock inicial)
    echo "📦 Reseteando inventario a stock inicial...\n";
    $pdo->exec("
        UPDATE inventory i 
        JOIN products p ON i.product_id = p.id 
        SET i.quantity = p.stock
    ");
    echo "✅ Inventario reseteado\n";
    
    // 4. Limpiar movimientos de inventario
    echo "📊 Eliminando movimientos de inventario...\n";
    $pdo->exec('DELETE FROM inventory_movements');
    echo "✅ Movimientos de inventario eliminados\n";
    
    // 5. Resetear AUTO_INCREMENT de las tablas
    echo "🔄 Reseteando AUTO_INCREMENT...\n";
    $pdo->exec('ALTER TABLE orders AUTO_INCREMENT = 1');
    $pdo->exec('ALTER TABLE delivery_assignments AUTO_INCREMENT = 1');
    $pdo->exec('ALTER TABLE inventory_movements AUTO_INCREMENT = 1');
    echo "✅ AUTO_INCREMENT reseteado\n";
    
    // 6. Verificar que se conservaron datos importantes
    echo "\n📊 VERIFICANDO DATOS CONSERVADOS:\n";
    
    $users = $pdo->query('SELECT COUNT(*) as count FROM users')->fetch();
    echo "👥 Usuarios: " . $users['count'] . "\n";
    
    $products = $pdo->query('SELECT COUNT(*) as count FROM products')->fetch();
    echo "🍔 Productos: " . $products['count'] . "\n";
    
    $categories = $pdo->query('SELECT COUNT(*) as count FROM categories')->fetch();
    echo "📂 Categorías: " . $categories['count'] . "\n";
    
    $drivers = $pdo->query('SELECT COUNT(*) as count FROM delivery_drivers')->fetch();
    echo "🚗 Repartidores: " . $drivers['count'] . "\n";
    
    $ordersCheck = $pdo->query('SELECT COUNT(*) as count FROM orders')->fetch();
    echo "🛒 Órdenes: " . $ordersCheck['count'] . " (debería ser 0)\n";
    
    $assignmentsCheck = $pdo->query('SELECT COUNT(*) as count FROM delivery_assignments')->fetch();
    echo "📦 Asignaciones: " . $assignmentsCheck['count'] . " (debería ser 0)\n";
    
    echo "\n🎉 ¡LIMPIEZA COMPLETA EXITOSA!\n";
    echo "✅ Todos los pedidos y órdenes eliminados\n";
    echo "✅ Inventario reseteado\n";
    echo "✅ Productos, categorías, usuarios y drivers conservados\n";
    echo "✅ Sistema listo para empezar desde 0\n";
    
} catch (PDOException $e) {
    echo "❌ Error: " . $e->getMessage() . "\n";
    exit(1);
}
?>