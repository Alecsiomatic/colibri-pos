<?php
// Script para crear usuarios demo en Colibrí-REST
// Sube este archivo a tu servidor y ejecútalo visitando: https://tudominio.com/create-demo-users.php

header('Content-Type: text/html; charset=utf-8');

$host = 'srv440.hstgr.io';
$user = 'u484426513_supernova';
$password = '98Hola!!';
$database = 'u484426513_supernova';

try {
    $conn = new mysqli($host, $user, $password, $database);
    
    if ($conn->connect_error) {
        die("❌ Error de conexión: " . $conn->connect_error);
    }
    
    echo "<h1>🔐 Creando Usuarios Demo - Colibrí-REST</h1>";
    echo "<pre>";
    
    // Password hash para "admin123"
    $passwordHash = password_hash('admin123', PASSWORD_BCRYPT);
    
    $demoUsers = [
        [
            'name' => 'Administrador Demo',
            'email' => 'admin@supernova.com',
            'is_admin' => 1,
            'is_waiter' => 0,
            'is_driver' => 0,
            'role' => 'Admin'
        ],
        [
            'name' => 'Cajero Demo',
            'email' => 'cajero@supernova.com',
            'is_admin' => 0,
            'is_waiter' => 0,
            'is_driver' => 0,
            'role' => 'Cajero'
        ],
        [
            'name' => 'Mesero Demo',
            'email' => 'mesero@supernova.com',
            'is_admin' => 0,
            'is_waiter' => 1,
            'is_driver' => 0,
            'role' => 'Mesero'
        ],
        [
            'name' => 'Repartidor Demo',
            'email' => 'driver@supernova.com',
            'is_admin' => 0,
            'is_waiter' => 0,
            'is_driver' => 1,
            'role' => 'Repartidor'
        ]
    ];
    
    foreach ($demoUsers as $user) {
        // Verificar si ya existe
        $check = $conn->prepare("SELECT id FROM users WHERE email = ?");
        $check->bind_param("s", $user['email']);
        $check->execute();
        $result = $check->get_result();
        
        if ($result->num_rows > 0) {
            // Actualizar usuario existente
            $update = $conn->prepare(
                "UPDATE users 
                 SET name = ?, password = ?, is_admin = ?, is_waiter = ?, is_driver = ?
                 WHERE email = ?"
            );
            $update->bind_param(
                "ssiiss",
                $user['name'],
                $passwordHash,
                $user['is_admin'],
                $user['is_waiter'],
                $user['is_driver'],
                $user['email']
            );
            
            if ($update->execute()) {
                echo "✅ {$user['role']} ACTUALIZADO: {$user['email']}\n";
            } else {
                echo "❌ Error actualizando {$user['role']}: " . $update->error . "\n";
            }
            $update->close();
        } else {
            // Crear nuevo usuario
            $insert = $conn->prepare(
                "INSERT INTO users (name, email, password, is_admin, is_waiter, is_driver, created_at)
                 VALUES (?, ?, ?, ?, ?, ?, NOW())"
            );
            $insert->bind_param(
                "sssiii",
                $user['name'],
                $user['email'],
                $passwordHash,
                $user['is_admin'],
                $user['is_waiter'],
                $user['is_driver']
            );
            
            if ($insert->execute()) {
                echo "✨ {$user['role']} CREADO: {$user['email']}\n";
            } else {
                echo "❌ Error creando {$user['role']}: " . $insert->error . "\n";
            }
            $insert->close();
        }
        $check->close();
    }
    
    echo "\n🎉 Usuarios demo listos!\n\n";
    echo "📋 CREDENCIALES:\n";
    echo "   👨‍💼 Admin:      admin@supernova.com / admin123     → /admin/dashboard\n";
    echo "   💰 Cajero:     cajero@supernova.com / admin123    → /caja\n";
    echo "   🍽️  Mesero:     mesero@supernova.com / admin123    → /mesero/mesas-abiertas\n";
    echo "   🛵 Repartidor: driver@supernova.com / admin123    → /driver/dashboard\n";
    
    // Verificar que se crearon
    echo "\n📊 VERIFICACIÓN:\n";
    $verify = $conn->query("SELECT id, name, email, is_admin, is_waiter, is_driver FROM users WHERE email IN ('admin@supernova.com', 'cajero@supernova.com', 'mesero@supernova.com', 'driver@supernova.com')");
    
    if ($verify->num_rows > 0) {
        echo "\nID | Nombre              | Email                    | Admin | Mesero | Repartidor\n";
        echo "---|---------------------|--------------------------|-------|--------|------------\n";
        while ($row = $verify->fetch_assoc()) {
            printf(
                "%-3d| %-20s| %-25s| %-6s| %-7s| %-10s\n",
                $row['id'],
                $row['name'],
                $row['email'],
                $row['is_admin'] ? 'Sí' : 'No',
                $row['is_waiter'] ? 'Sí' : 'No',
                $row['is_driver'] ? 'Sí' : 'No'
            );
        }
    }
    
    echo "\n⚠️  IMPORTANTE: Elimina este archivo después de usarlo por seguridad.\n";
    echo "</pre>";
    
    $conn->close();
    
} catch (Exception $e) {
    echo "❌ Error: " . $e->getMessage();
}
?>
