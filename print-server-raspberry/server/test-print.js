const moment = require('moment-timezone');
const { printOrder, printTest, checkPrinterStatus } = require('./printer');

console.log('\n===========================================');
console.log('🧪 SCRIPT DE PRUEBA - SERVIDOR DE IMPRESIÓN');
console.log('===========================================\n');

async function runTests() {
  try {
    // ============================================
    // TEST 1: VERIFICAR ESTADO DE IMPRESORA
    // ============================================
    console.log('📡 TEST 1: Verificando estado de impresora...');
    const status = await checkPrinterStatus();
    console.log('   Resultado:', JSON.stringify(status, null, 2));

    if (!status.connected) {
      console.error('\n❌ Impresora no conectada. Verifica:');
      console.error('   1. Que la impresora esté encendida');
      console.error('   2. Que el cable ethernet esté conectado');
      console.error('   3. Que la IP sea correcta: ' + process.env.PRINTER_IP);
      return;
    }

    console.log('✅ Impresora conectada correctamente\n');

    // ============================================
    // TEST 2: IMPRIMIR TICKET DE PRUEBA
    // ============================================
    console.log('📄 TEST 2: Imprimiendo ticket de prueba...');
    await printTest();
    console.log('✅ Ticket de prueba enviado\n');

    console.log('⏳ Esperando 3 segundos...\n');
    await new Promise(resolve => setTimeout(resolve, 3000));

    // ============================================
    // TEST 3: IMPRIMIR ORDEN DE PRUEBA
    // ============================================
    console.log('🍔 TEST 3: Imprimiendo orden de prueba...');
    
    const testOrder = {
      id: 'TEST-' + Date.now(),
      customer_name: 'Juan Pérez',
      customer_phone: '123-456-7890',
      delivery_type: 'delivery',
      delivery_address: 'Calle Falsa 123, Col. Centro',
      items: [
        {
          name: 'Hamburguesa SuperNova',
          quantity: 2,
          price: 89.50,
          extras: [
            { name: 'Queso extra', price: 15.00 },
            { name: 'Tocino', price: 20.00 }
          ],
          notes: 'Sin cebolla por favor'
        },
        {
          name: 'Papas Grandes',
          quantity: 1,
          price: 45.00,
          extras: []
        },
        {
          name: 'Refresco Coca-Cola',
          quantity: 2,
          price: 25.00,
          extras: []
        }
      ],
      total: 319.00,
      payment_method: 'cash',
      notes: 'Entregar en la puerta azul'
    };

    await printOrder(testOrder);
    console.log('✅ Orden de prueba impresa\n');

    // ============================================
    // RESUMEN
    // ============================================
    console.log('===========================================');
    console.log('✅ TODAS LAS PRUEBAS COMPLETADAS');
    console.log('===========================================');
    console.log('');
    console.log('Verifica que la impresora haya impreso:');
    console.log('  1. Ticket de prueba');
    console.log('  2. Orden de prueba con productos');
    console.log('');
    console.log('Si ambos tickets se imprimieron correctamente,');
    console.log('el servidor está listo para producción.');
    console.log('');

  } catch (error) {
    console.error('\n❌ ERROR EN PRUEBAS:');
    console.error(error);
    console.error('\nRevisa el archivo TROUBLESHOOTING.md');
  }
}

// Ejecutar pruebas
runTests();
