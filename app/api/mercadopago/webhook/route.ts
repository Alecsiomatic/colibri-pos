import { NextRequest, NextResponse } from 'next/server'
import mysql from 'mysql2/promise'
// @ts-ignore
import { MercadoPagoConfig, Payment } from 'mercadopago'

const dbConfig = {
  host: 'srv440.hstgr.io',
  user: 'u191251575_manu',
  password: 'Cerounocero.com20182417',
  database: 'u191251575_manu'
}

async function getConnection() {
  return await mysql.createConnection(dbConfig)
}

async function getMPAccessToken() {
  const connection = await getConnection()
  try {
    const [rows] = await connection.execute(
      'SELECT setting_value FROM system_settings WHERE setting_key = ?',
      ['mercadopago_access_token']
    )
    return (rows as any[])[0]?.setting_value
  } finally {
    await connection.end()
  }
}

export async function POST(request: NextRequest) {
  let connection
  try {
    const body = await request.json()
    console.log('Webhook de Mercado Pago recibido:', body)
    
    // Mercado Pago envía el tipo de notificación
    const { type, data } = body
    
    if (type !== 'payment') {
      return NextResponse.json({ message: 'Tipo de notificación no procesada' })
    }
    
    // Obtener el ID del pago
    const paymentId = data.id
    
    if (!paymentId) {
      return NextResponse.json({ error: 'No se recibió ID de pago' }, { status: 400 })
    }
    
    // Obtener access token
    const accessToken = await getMPAccessToken()
    if (!accessToken) {
      console.error('Access token no configurado')
      return NextResponse.json({ error: 'Configuración incompleta' }, { status: 500 })
    }
    
    // Configurar cliente de MP
    const client = new MercadoPagoConfig({ accessToken })
    const payment = new Payment(client)
    
    // Obtener información del pago
    const paymentInfo = await payment.get({ id: paymentId })
    console.log('Información del pago:', paymentInfo)
    
    const orderId = paymentInfo.external_reference
    const status = paymentInfo.status
    const statusDetail = paymentInfo.status_detail
    
    if (!orderId) {
      console.error('No se encontró referencia externa')
      return NextResponse.json({ error: 'Orden no encontrada' }, { status: 400 })
    }
    
    connection = await getConnection()
    
    // Mapear estado de MP a estado de orden
    let orderStatus = 'pending'
    let paymentStatus = 'pending'
    
    switch (status) {
      case 'approved':
        orderStatus = 'confirmed'
        paymentStatus = 'paid'
        break
      case 'pending':
      case 'in_process':
        orderStatus = 'pending'
        paymentStatus = 'pending'
        break
      case 'rejected':
      case 'cancelled':
        orderStatus = 'cancelled'
        paymentStatus = 'failed'
        break
    }
    
    // Actualizar orden
    await connection.execute(
      `UPDATE orders 
       SET status = ?, 
           payment_status = ?, 
           payment_id = ?,
           payment_details = ?,
           updated_at = NOW() 
       WHERE id = ?`,
      [
        orderStatus,
        paymentStatus,
        paymentId.toString(),
        JSON.stringify({
          status,
          status_detail: statusDetail,
          payment_method: paymentInfo.payment_method_id,
          payment_type: paymentInfo.payment_type_id,
          transaction_amount: paymentInfo.transaction_amount,
          date_approved: paymentInfo.date_approved
        }),
        orderId
      ]
    )
    
    console.log(`Orden ${orderId} actualizada: ${orderStatus} / ${paymentStatus}`)
    
    return NextResponse.json({ 
      success: true,
      message: 'Webhook procesado correctamente' 
    })
    
  } catch (error) {
    console.error('Error procesando webhook de Mercado Pago:', error)
    return NextResponse.json(
      { error: 'Error procesando webhook', details: (error as Error).message },
      { status: 500 }
    )
  } finally {
    if (connection) await connection.end()
  }
}

// Mercado Pago puede enviar GET para verificar la URL
export async function GET(request: NextRequest) {
  return NextResponse.json({ status: 'OK', message: 'Webhook de Mercado Pago activo' })
}
