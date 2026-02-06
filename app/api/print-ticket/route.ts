import { NextRequest, NextResponse } from 'next/server'

const PRINT_SERVER_URL = process.env.PRINT_SERVER_URL || 'http://localhost:3002'

export async function POST(request: NextRequest) {
  try {
    const data = await request.json()
    
    const {
      orderId,
      customerName,
      items,
      subtotal,
      total,
      paymentMethod,
      cashReceived,
      change
    } = data
    
    // Formatear para el servidor de impresión
    const printData = {
      type: 'table-ticket',
      orderId: orderId,
      tableName: `Venta #${orderId}`,
      customerName: customerName || 'Cliente',
      items: items.map((item: any) => ({
        name: item.name,
        quantity: item.quantity,
        price: item.price,
        subtotal: item.quantity * item.price,
        modifiers: item.modifiers || []
      })),
      subtotal: subtotal,
      total: total,
      paymentMethod: paymentMethod === 'efectivo' ? 'Efectivo' : 
                     paymentMethod === 'tarjeta' ? 'Tarjeta' : 
                     paymentMethod === 'card' ? 'Tarjeta' : paymentMethod,
      cashReceived: cashReceived,
      change: change,
      timestamp: new Date().toISOString()
    }
    
    console.log('📄 Enviando a imprimir:', JSON.stringify(printData, null, 2))
    
    // Enviar al servidor de impresión
    const printResponse = await fetch(`${PRINT_SERVER_URL}/print`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(printData)
    })
    
    if (!printResponse.ok) {
      const errorText = await printResponse.text()
      console.error('❌ Error del servidor de impresión:', errorText)
      return NextResponse.json({
        success: false,
        error: 'Error al conectar con la impresora',
        details: errorText
      }, { status: 500 })
    }
    
    const result = await printResponse.json()
    
    return NextResponse.json({
      success: true,
      message: 'Ticket enviado a imprimir',
      ...result
    })
    
  } catch (error: any) {
    console.error('❌ Error en print-ticket:', error)
    
    // Si no hay servidor de impresión, no es error crítico
    if (error.cause?.code === 'ECONNREFUSED') {
      return NextResponse.json({
        success: false,
        error: 'Servidor de impresión no disponible',
        code: 'PRINT_SERVER_OFFLINE'
      }, { status: 503 })
    }
    
    return NextResponse.json({
      success: false,
      error: error.message || 'Error desconocido'
    }, { status: 500 })
  }
}
