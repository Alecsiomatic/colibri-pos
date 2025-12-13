import { NextRequest, NextResponse } from 'next/server'
import mysql from 'mysql2/promise'
// @ts-ignore
import { MercadoPagoConfig, Preference } from 'mercadopago'

const dbConfig = {
  host: 'srv440.hstgr.io',
  user: 'u191251575_manu',
  password: 'Cerounocero.com20182417',
  database: 'u191251575_manu'
}

async function getConnection() {
  return await mysql.createConnection(dbConfig)
}

async function getMPCredentials() {
  const connection = await getConnection()
  try {
    const [rows] = await connection.execute(
      'SELECT setting_key, setting_value FROM system_settings WHERE setting_key IN (?, ?, ?)',
      ['mercadopago_access_token', 'mercadopago_enabled', 'mercadopago_public_key']
    )
    
    const settings: Record<string, string> = {}
    ;(rows as any[]).forEach((row) => {
      settings[row.setting_key] = row.setting_value
    })
    
    return settings
  } finally {
    await connection.end()
  }
}

export async function POST(request: NextRequest) {
  let connection
  try {
    // Obtener credenciales
    const credentials = await getMPCredentials()
    
    if (credentials.mercadopago_enabled !== 'true') {
      return NextResponse.json(
        { error: 'Mercado Pago no está habilitado' },
        { status: 400 }
      )
    }
    
    if (!credentials.mercadopago_access_token) {
      return NextResponse.json(
        { error: 'Access Token de Mercado Pago no configurado' },
        { status: 400 }
      )
    }
    
    const body = await request.json()
    const { items, orderId, customerInfo } = body
    
    // Configurar cliente de Mercado Pago
    const client = new MercadoPagoConfig({
      accessToken: credentials.mercadopago_access_token
    })
    
    const preference = new Preference(client)
    
    // Preparar items para MP
    const mpItems = items.map((item: any) => ({
      id: item.id.toString(),
      title: item.name,
      description: item.description || item.name,
      quantity: parseInt(item.quantity),
      unit_price: parseFloat(item.price),
      currency_id: 'MXN'
    }))
    
    // Calcular total
    const total = items.reduce((sum: number, item: any) => 
      sum + (parseFloat(item.price) * parseInt(item.quantity)), 0
    )
    
    // Crear preferencia
    const preferenceData = {
      items: mpItems,
      payer: {
        name: customerInfo.name,
        email: customerInfo.email,
        phone: {
          number: customerInfo.phone
        },
        address: {
          street_name: customerInfo.address,
          zip_code: customerInfo.postalCode || '00000'
        }
      },
      back_urls: {
        success: `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/orders/thank-you?orderId=${orderId}&payment=mercadopago&status=success`,
        failure: `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/checkout?status=failure`,
        pending: `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/orders/thank-you?orderId=${orderId}&payment=mercadopago&status=pending`
      },
      auto_return: 'approved' as const,
      external_reference: orderId.toString(),
      notification_url: `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/mercadopago/webhook`,
      statement_descriptor: 'KALABAS BOOOM',
      payment_methods: {
        excluded_payment_types: [],
        installments: 12
      }
    }
    
    const response = await preference.create({ body: preferenceData })
    
    // Guardar preferencia en la orden
    connection = await getConnection()
    await connection.execute(
      'UPDATE orders SET payment_preference_id = ?, updated_at = NOW() WHERE id = ?',
      [response.id, orderId]
    )
    
    return NextResponse.json({
      id: response.id,
      init_point: response.init_point,
      sandbox_init_point: response.sandbox_init_point
    })
    
  } catch (error) {
    console.error('Error al crear preferencia de pago:', error)
    return NextResponse.json(
      { error: 'Error al crear preferencia de pago', details: (error as Error).message },
      { status: 500 }
    )
  } finally {
    if (connection) await connection.end()
  }
}
