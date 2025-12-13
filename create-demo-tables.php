<?php
// Script para crear mesas demo para el mesero
$host = 'srv440.hstgr.io';
$dbname = 'u191251575_colibridemo';
$username = 'u191251575_manu';
$password = '0d1Xa1fz(M';

try {
    $conn = new PDO("mysql:host=$host;dbname=$dbname;charset=utf8mb4", $username, $password);
    $conn->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    
    echo "🔗 Conectado a la base de datos\n";
    
    // Insertar mesas demo
    $sql = "INSERT INTO orders 
            (user_id, customer_name, payment_method, status, items, total, notes, table_name, waiter_order, created_at) 
            VALUES 
            (15, 'Cuenta Mesa 1', 'efectivo', 'open_table', '[{\"name\":\"Café Espresso\",\"price\":30.00,\"quantity\":2}]', 60.00, 'Mesa abierta - demo', 'Mesa 1', 1, NOW()),
            (15, 'Cuenta Mesa 3', 'efectivo', 'open_table', '[{\"name\":\"Capuchino\",\"price\":35.00,\"quantity\":1},{\"name\":\"Agua Natural\",\"price\":15.00,\"quantity\":2}]', 65.00, 'Mesa abierta - demo', 'Mesa 3', 1, NOW()),
            (15, 'Cuenta Mesa 5', 'efectivo', 'open_table', '[{\"name\":\"Café Espresso\",\"price\":30.00,\"quantity\":3}]', 90.00, 'Mesa abierta - demo', 'Mesa 5', 1, NOW())";
    
    $stmt = $conn->prepare($sql);
    $stmt->execute();
    
    echo "✅ 3 mesas demo creadas exitosamente!\n";
    echo "Mesa 1: $60.00\n";
    echo "Mesa 3: $65.00\n";
    echo "Mesa 5: $90.00\n";
    echo "\n✨ Ahora puedes acceder con mesero@supernova.com y verás las mesas abiertas\n";
    
} catch(PDOException $e) {
    echo "❌ Error: " . $e->getMessage() . "\n";
}
?>
