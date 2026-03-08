// Script para crear usuarios demo usando la API
const BASE_URL = 'http://localhost:3000';

async function createDemoUsers() {
  console.log('🔐 Creando usuarios demo para Colibrí-REST...\n');
  
  const demoUsers = [
    {
      name: 'Administrador Demo',
      email: 'admin@supernova.com',
      password: 'admin123',
      role: '👨‍💼 Admin → /admin/dashboard'
    },
    {
      name: 'Cajero Demo',
      email: 'cajero@supernova.com',
      password: 'admin123',
      role: '💰 Cajero → /caja'
    },
    {
      name: 'Mesero Demo',
      email: 'mesero@supernova.com',
      password: 'admin123',
      role: '🍽️  Mesero → /mesero/mesas-abiertas'
    },
    {
      name: 'Repartidor Demo',
      email: 'driver@supernova.com',
      password: 'admin123',
      role: '🛵 Repartidor → /driver/dashboard'
    }
  ];
  
  for (const user of demoUsers) {
    try {
      // Intentar login primero para ver si ya existe
      const loginResponse = await fetch(`${BASE_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: user.email, password: user.password })
      });
      
      if (loginResponse.ok) {
        console.log(`✅ ${user.role} ya existe y funciona`);
      } else {
        // Si no existe, verificar el endpoint de registro
        console.log(`⚠️  ${user.role} - necesita ser creado manualmente en DB`);
      }
    } catch (error) {
      console.log(`❌ ${user.role} - Error: ${error.message}`);
    }
  }
  
  console.log('\n📋 CREDENCIALES DEMO:');
  console.log('   Email: admin@supernova.com   Password: admin123');
  console.log('   Email: cajero@supernova.com  Password: admin123');
  console.log('   Email: mesero@supernova.com  Password: admin123');
  console.log('   Email: driver@supernova.com  Password: admin123');
  console.log('\n⚠️  NOTA: Si los usuarios no existen, usa phpMyAdmin para crearlos manualmente.');
  console.log('   O asegúrate de que el servidor esté corriendo en localhost:3000');
}

createDemoUsers();
