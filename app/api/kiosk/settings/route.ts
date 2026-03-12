import { NextRequest, NextResponse } from 'next/server'
import { executeQuery } from '@/lib/mysql-db'

// GET /api/kiosk/settings - Obtener configuraciones del kiosko
export async function GET(request: NextRequest) {
  try {
    const settings = await executeQuery(
      `SELECT * FROM kiosk_settings ORDER BY setting_key`,
      []
    ) as any[]

    // Convertir a objeto clave-valor
    const settingsObj: any = {}
    for (const setting of settings) {
      let value = setting.setting_value

      // Convertir según el tipo de dato
      if (setting.data_type === 'boolean') {
        value = value === 'true'
      } else if (setting.data_type === 'number') {
        value = parseFloat(value)
      } else if (setting.data_type === 'json') {
        try {
          value = JSON.parse(value)
        } catch (e) {
          value = null
        }
      }

      settingsObj[setting.setting_key] = value
    }

    return NextResponse.json({
      success: true,
      settings: settingsObj
    })

  } catch (error: any) {
    console.error('Error fetching kiosk settings:', error)
    return NextResponse.json(
      { success: false, error: 'Error al obtener configuraciones del kiosko' },
      { status: 500 }
    )
  }
}

// POST /api/kiosk/settings - Actualizar configuraciones
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { settings } = body

    for (const [key, value] of Object.entries(settings)) {
      let stringValue = String(value)
      let dataType = 'string'

      if (typeof value === 'boolean') {
        dataType = 'boolean'
        stringValue = value ? 'true' : 'false'
      } else if (typeof value === 'number') {
        dataType = 'number'
      } else if (typeof value === 'object') {
        dataType = 'json'
        stringValue = JSON.stringify(value)
      }

      await executeQuery(
        `INSERT INTO kiosk_settings (setting_key, setting_value, data_type) 
         VALUES (?, ?, ?) 
         ON DUPLICATE KEY UPDATE 
           setting_value = VALUES(setting_value),
           data_type = VALUES(data_type),
           updated_at = CURRENT_TIMESTAMP`,
        [key, stringValue, dataType]
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Configuraciones actualizadas'
    })

  } catch (error: any) {
    console.error('Error updating kiosk settings:', error)
    return NextResponse.json(
      { success: false, error: 'Error al actualizar configuraciones del kiosko' },
      { status: 500 }
    )
  }
}
