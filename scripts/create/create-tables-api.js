// Script para crear mesas demo mediante la API
async function createDemoTables() {
  const mesasDemoauth = [
    {
      table_name: 'Mesa 1',
      customer_name: 'Cuenta Mesa 1',
      items: [
        { id: 1, name: 'Café Espresso', price: 30.00, quantity: 2 }
      ],
      total: 60.00
    },
    {
      table_name: 'Mesa 3',
      customer_name: 'Cuenta Mesa 3',
      items: [
        { id: 2, name: 'Capuchino', price: 35.00, quantity: 1 },
        { id: 3, name: 'Agua Natural', price: 15.00, quantity: 2 }
      ],
      total: 65.00
    },
    {
      table_name: 'Mesa 5',
      customer_name: 'Cuenta Mesa 5',
      items: [
        { id: 1, name: 'Café Espresso', price: 30.00, quantity: 3 }
      ],
      total: 90.00
    }
  ]

  console.log('🍽️ Creando mesas demo...\n')

  for (const mesa of mesasDemoauth) {
    try {
      const response = await fetch('http://localhost:3000/api/orders-mysql', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Cookie': 'auth-token=YOUR_MESERO_TOKEN_HERE' // Necesitas estar logueado como mesero
        },
        body: JSON.stringify({
          items: mesa.items,
          total: mesa.total,
          customer_name: mesa.customer_name,
          payment_method: 'efectivo',
          delivery_type: 'dine_in',
          table_name: mesa.table_name,
          waiter_order: true,
          status: 'open_table',
          notes: 'Mesa demo'
        })
      })

      const data = await response.json()
      if (data.success) {
        console.log(`✅ ${mesa.table_name} creada - Total: $${mesa.total}`)
      } else {
        console.log(`❌ Error creando ${mesa.table_name}:`, data.error)
      }
    } catch (error) {
      console.error(`❌ Error:`, error.message)
    }
  }

  console.log('\n✨ Proceso completado!')
  console.log('Recarga la página del mesero para ver las mesas')
}

createDemoTables()
