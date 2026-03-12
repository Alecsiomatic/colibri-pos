import { NextRequest, NextResponse } from 'next/server'
import { executeQuery } from '@/lib/db'

// GET - Obtener configuraciones
export async function GET(request: NextRequest) {
  try {
    const rows = await executeQuery<any>(
      'SELECT setting_key, setting_value FROM system_settings'
    )
    
    // Convertir array a objeto
    const settings: Record<string, string> = {}
    rows.forEach((row: any) => {
      settings[row.setting_key] = row.setting_value
    })
    
    return NextResponse.json(settings)
  } catch (error) {
    console.error('Error al obtener configuraciones:', error)
    return NextResponse.json(
      { error: 'Error al obtener configuraciones' },
      { status: 500 }
    )
  }
}

// POST - Actualizar configuraciones
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { mercadopago_public_key, mercadopago_access_token, mercadopago_enabled } = body
    
    // Actualizar cada configuración
    if (mercadopago_public_key !== undefined) {
      await executeQuery(
        'UPDATE system_settings SET setting_value = ?, updated_at = NOW() WHERE setting_key = ?',
        [mercadopago_public_key, 'mercadopago_public_key']
      )
    }
    
    if (mercadopago_access_token !== undefined) {
      await executeQuery(
        'UPDATE system_settings SET setting_value = ?, updated_at = NOW() WHERE setting_key = ?',
        [mercadopago_access_token, 'mercadopago_access_token']
      )
    }
    
    if (mercadopago_enabled !== undefined) {
      await executeQuery(
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
  }
}
