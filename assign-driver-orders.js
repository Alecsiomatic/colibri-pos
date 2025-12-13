const mysql = require('mysql2/promise');

const DB_CONFIG = {
  host: 'srv440.hstgr.io',
  user: 'u191251575_colibridemo',
  password: 'Cerounocero.com20182417',
  database: 'u191251575_colibridemo'
};

async function assignDriverOrders() {
  const connection = await mysql.createConnection(DB_CONFIG);
  
  try {
    console.log('🛵 Asignando pedidos al repartidor demo...\n');
    
    // 1. Obtener el driver demo
    const [drivers] = await connection.execute(
      'SELECT id, username, email FROM users WHERE email = ? AND is_driver = 1',
      ['driver@supernova.com']
    );
    
    if (drivers.length === 0) {
      console.log('❌ Driver demo no encontrado. Ejecuta create-demo-users-colibri.js primero');
      return;
    }
    
    const driver = drivers[0];
    console.log(`✅ Driver encontrado: ${driver.username} (ID: ${driver.id})\n`);
    
    // 2. Crear pedidos de delivery si no existen
    const deliveryOrders = [
      {
        customer_name: 'Juan Pérez',
        customer_email: 'juan@example.com',
        customer_phone: '555-0101',
        delivery_address: 'Av. Principal 123, Col. Centro',
        delivery_notes: 'Casa verde con portón negro',
        total: 250.00,
        items: [
          { name: 'Hamburguesa Clásica', quantity: 2, price: 80.00 },
          { name: 'Papas Fritas', quantity: 1, price: 45.00 },
          { name: 'Coca Cola', quantity: 2, price: 22.50 }
        ]
      },
      {
        customer_name: 'María González',
        customer_email: 'maria@example.com',
        customer_phone: '555-0202',
        delivery_address: 'Calle Secundaria 456, Depto 3B',
        delivery_notes: 'Tocar el timbre 2 veces',
        total: 380.50,
        items: [
          { name: 'Pizza Especial', quantity: 1, price: 180.00 },
          { name: 'Alitas BBQ', quantity: 12, price: 150.00 },
          { name: 'Agua Mineral', quantity: 2, price: 25.25 }
        ]
      },
      {
        customer_name: 'Carlos Rodríguez',
        customer_email: 'carlos@example.com',
        customer_phone: '555-0303',
        delivery_address: 'Boulevard Norte 789, Torre A',
        delivery_notes: 'Llamar al llegar',
        total: 195.75,
        items: [
          { name: 'Ensalada César', quantity: 1, price: 95.00 },
          { name: 'Sándwich Club', quantity: 1, price: 75.00 },
          { name: 'Jugo Natural', quantity: 1, price: 25.75 }
        ]
      },
      {
        customer_name: 'Ana Martínez',
        customer_email: 'ana@example.com',
        customer_phone: '555-0404',
        delivery_address: 'Av. Reforma 321, Oficina 12',
        delivery_notes: 'Dejar en recepción',
        total: 420.00,
        items: [
          { name: 'Tacos al Pastor', quantity: 6, price: 180.00 },
          { name: 'Quesadillas', quantity: 3, price: 120.00 },
          { name: 'Horchata', quantity: 2, price: 60.00 }
        ]
      },
      {
        customer_name: 'Luis Hernández',
        customer_email: 'luis@example.com',
        customer_phone: '555-0505',
        delivery_address: 'Calle del Sol 567',
        delivery_notes: null,
        total: 310.25,
        items: [
          { name: 'Sushi Variado', quantity: 18, price: 250.00 },
          { name: 'Sopa Miso', quantity: 2, price: 60.25 }
        ]
      }
    ];
    
    console.log('📦 Creando pedidos de delivery...\n');
    
    for (const orderData of deliveryOrders) {
      // Preparar items como JSON
      const itemsJson = JSON.stringify(orderData.items.map((item, idx) => ({
        id: idx + 1,
        name: item.name,
        price: item.price.toString(),
        quantity: item.quantity,
        modifiers: []
      })));
      
      // Preparar delivery_address como JSON (como lo hace la API)
      const deliveryAddressJson = JSON.stringify({
        street: orderData.delivery_address,
        city: 'Ciudad',
        state: 'Estado',
        zip: '00000'
      });
      
      // Crear el pedido con items
      const [result] = await connection.execute(
        `INSERT INTO orders (
          delivery_address, notes, items,
          total, payment_method, status,
          created_at
        ) VALUES (?, ?, ?, ?, 'cash', 'pending', NOW())`,
        [
          deliveryAddressJson,
          `Cliente: ${orderData.customer_name} | Tel: ${orderData.customer_phone}${orderData.delivery_notes ? ' | ' + orderData.delivery_notes : ''}`,
          itemsJson,
          orderData.total
        ]
      );
      
      const orderId = result.insertId;
      
      // Asignar al driver - 3 pendientes, 2 aceptados
      const statusIndex = deliveryOrders.indexOf(orderData);
      let assignmentStatus = 'pending';
      let acceptedAt = null;
      
      if (statusIndex >= 3) { // Los últimos 2 ya aceptados
        assignmentStatus = 'accepted';
        acceptedAt = new Date();
      }
      
      await connection.execute(
        `INSERT INTO driver_assignments (
          driver_id, order_id, status, assigned_at, accepted_at, created_at
        ) VALUES (?, ?, ?, NOW(), ?, NOW())`,
        [driver.id, orderId, assignmentStatus, acceptedAt]
      );
      
      console.log(`✅ Pedido #${orderId} creado y asignado (${assignmentStatus}) - Cliente: ${orderData.customer_name}`);
    }
    
    console.log('\n🎉 ¡Pedidos asignados exitosamente!');
    console.log('\n📊 Resumen:');
    console.log(`   • 3 pedidos pendientes de aceptar`);
    console.log(`   • 2 pedidos ya aceptados (listos para entregar)`);
    console.log(`   • Total de pedidos: ${deliveryOrders.length}`);
    console.log('\n🔑 Credenciales del repartidor:');
    console.log('   Email: driver@supernova.com');
    console.log('   Password: admin123');
    console.log('\n📱 Accede en: http://localhost:3000/driver/dashboard');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await connection.end();
  }
}

assignDriverOrders();
