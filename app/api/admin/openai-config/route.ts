import { NextRequest, NextResponse } from 'next/server'
import mysql from 'mysql2/promise'

const connection = mysql.createConnection({
  host: 'srv440.hstgr.io',
  user: 'u191251575_manu',
  password: 'Cerounocero.com20182417',
  database: 'u191251575_manu',
  port: 3306,
  charset: 'utf8mb4'
})

export async function POST(request: NextRequest) {
  try {
    const { openai_api_key, openai_model, enable_ai_reports } = await request.json()
    
    const conn = await connection
    
    // Actualizar configuración de OpenAI
    await conn.execute(
      `UPDATE business_info SET 
       openai_api_key = ?, 
       openai_model = ?, 
       enable_ai_reports = ? 
       WHERE id = 1`,
      [openai_api_key, openai_model || 'gpt-3.5-turbo', enable_ai_reports ? 1 : 0]
    )
    
    return NextResponse.json({ 
      message: 'Configuración de OpenAI actualizada correctamente',
      config: {
        api_key: openai_api_key ? `${openai_api_key.substring(0, 20)}...` : 'Eliminada',
        model: openai_model || 'gpt-3.5-turbo',
        enabled: enable_ai_reports
      }
    })
    
  } catch (error) {
    console.error('Error updating OpenAI config:', error)
    return NextResponse.json(
      { error: 'Error al actualizar configuración' },
      { status: 500 }
    )
  }
}

export async function GET() {
  try {
    const conn = await connection
    const [rows] = await conn.execute(
      'SELECT openai_api_key, openai_model, enable_ai_reports FROM business_info WHERE id = 1'
    ) as any[]
    
    if (rows.length > 0) {
      const config = rows[0]
      return NextResponse.json({
        api_key: config.openai_api_key ? `${config.openai_api_key.substring(0, 20)}...` : null,
        model: config.openai_model,
        enabled: config.enable_ai_reports
      })
    }
    
    return NextResponse.json({ error: 'Configuración no encontrada' }, { status: 404 })
    
  } catch (error) {
    console.error('Error getting OpenAI config:', error)
    return NextResponse.json(
      { error: 'Error al obtener configuración' },
      { status: 500 }
    )
  }
}