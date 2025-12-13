// Script para probar el cierre de mesa con una mesa real
async function testRealTableClosure() {
  try {
    console.log('🧪 Probando cierre de mesa real...');
    
    const testData = {
      tableId: "Mesa 7", // Mesa que existe con estado open_table
      paymentMethod: "efectivo",
      amountPaid: 120.00,
      totalAmount: 90.00
    };

    console.log('📝 Datos de prueba:', testData);

    const response = await fetch('http://localhost:3000/api/close-table-payment', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testData)
    });

    const result = await response.json();
    
    console.log('📊 Respuesta del API:');
    console.log('Status:', response.status);
    console.log('Body:', result);

    if (result.success) {
      console.log('✅ ¡Mesa cerrada exitosamente!');
      console.log('💰 Cambio calculado:', result.data.changeAmount);
    } else {
      console.log('❌ Error:', result.error);
    }

  } catch (error) {
    console.error('❌ Error en la prueba:', error);
  }
}

// Solo ejecutar si estamos en Node.js
if (typeof window === 'undefined') {
  testRealTableClosure();
}