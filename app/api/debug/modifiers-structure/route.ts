import { NextResponse } from 'next/server'
import { executeQuery } from '@/lib/mysql-db'

export async function GET() {
  try {
    // Estructura de product_modifiers
    const modifiersCols = await executeQuery('DESCRIBE product_modifiers', [])
    
    // Estructura de modifier_options
    const optionsCols = await executeQuery('DESCRIBE modifier_options', [])
    
    // Datos de ejemplo
    const modifiers = await executeQuery('SELECT * FROM product_modifiers LIMIT 3', [])
    const options = await executeQuery('SELECT * FROM modifier_options LIMIT 5', [])
    
    return NextResponse.json({
      success: true,
      product_modifiers: {
        structure: modifiersCols,
        sample: modifiers
      },
      modifier_options: {
        structure: optionsCols,
        sample: options
      }
    })
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 })
  }
}
