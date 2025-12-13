import { NextRequest, NextResponse } from 'next/server'
import mysql from 'mysql2/promise'

const dbConfig = {
  host: 'srv440.hstgr.io',
  user: 'u191251575_manu',
  password: 'Cerounocero.com20182417',
  database: 'u191251575_manu'
}

async function getConnection() {
  return await mysql.createConnection(dbConfig)
}

// GET - Obtener configuraciones
export async function GET(request: NextRequest) {
  let connection
  try {
    connection = await getConnection()
    
    const [rows] = await connection.execute(
      'SELECT setting_key, setting_value FROM system_settings'
    )
    
    // Convertir array a objeto
    const settings: Record<string, string> = {}
    ;(rows as any[]).forEach((row) => {
      settings[row.setting_key] = row.setting_value
    })
    
    return NextResponse.json(settings)
  } catch (error) {
    console.error('Error al obtener configuraciones:', error)
    return NextResponse.json(
      { error: 'Error al obtener configuraciones' },
      { status: 500 }
    )
  } finally {
    if (connection) await connection.end()
  }
}

// POST - Actualizar configuraciones
export async function POST(request: NextRequest) {
  let connection
  try {
    const body = await request.json()
    const { mercadopago_public_key, mercadopago_access_token, mercadopago_enabled } = body
    
    connection = await getConnection()
    
    // Actualizar cada configuración
    if (mercadopago_public_key !== undefined) {
      await connection.execute(
        'UPDATE system_settings SET setting_value = ?, updated_at = NOW() WHERE setting_key = ?',
        [mercadopago_public_key, 'mercadopago_public_key']
      )
    }
    
    if (mercadopago_access_token !== undefined) {
      await connection.execute(
        'UPDATE system_settings SET setting_value = ?, updated_at = NOW() WHERE setting_key = ?',
        [mercadopago_access_token, 'mercadopago_access_token']
      )
    }
    
    if (mercadopago_enabled !== undefined) {
      await connection.execute(
        'UPDATE system_settings SET setting_value = ?, updated_at = NOW() WHERE setting_key = ?',
        [mercadopago_enabled ? 'true' : 'false', 'mercadopago_enabled']
      )
    }
    
    return NextResponse.json({ 
      success: true,
      message: 'Configuración actualizada exitosamente' 
    })
  } catch (error) {
    console.error('Error al actualizar configuraciones:', error)
    return NextResponse.json(
      { error: 'Error al actualizar configuraciones' },
      { status: 500 }
    )
  } finally {
    if (connection) await connection.end()
  }
}
