import { NextResponse } from 'next/server'
import { executeQuery } from '@/lib/mysql-db'

export async function GET() {
  try {
    // 1. Verificar datos en product_modifiers
    const allModifiers = await executeQuery(`
      SELECT * FROM product_modifiers WHERE is_active = 1
    `, [])
    
    // 2. Verificar datos en modifier_options
    const allOptions = await executeQuery(`
      SELECT * FROM modifier_options WHERE is_active = 1
    `, [])
    
    // 3. Ver productos con sus modificadores (JOIN completo)
    const productsWithMods = await executeQuery(`
      SELECT 
        p.id as product_id,
        p.name as product_name,
        m.id as modifier_id,
        m.name as modifier_name,
        m.modifier_type,
        mo.id as option_id,
        mo.name as option_name,
        mo.price_adjustment
      FROM products p
      INNER JOIN product_modifiers m ON m.product_id = p.id
      LEFT JOIN modifier_options mo ON mo.group_id = m.id
      WHERE p.is_available = 1 AND m.is_active = 1
      LIMIT 20
    `, [])
    
    return NextResponse.json({
      success: true,
      total_modifiers: (allModifiers as any[]).length,
      total_options: (allOptions as any[]).length,
      modifiers: allModifiers,
      options: allOptions,
      products_with_modifiers: productsWithMods
    })
    
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: error.message,
      stack: error.stack
    }, { status: 500 })
  }
}
