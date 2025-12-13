import { NextResponse } from 'next/server'
import { executeQuery } from '@/lib/mysql-db'

export async function GET() {
  try {
    // Contar productos que tienen modificadores
    const productsWithModifiers = await executeQuery(`
      SELECT 
        p.id,
        p.name,
        COUNT(DISTINCT m.id) as modifier_groups_count,
        COUNT(DISTINCT mo.id) as modifier_options_count
      FROM products p
      LEFT JOIN product_modifiers m ON m.product_id = p.id AND m.is_active = 1
      LEFT JOIN modifier_options mo ON mo.group_id = m.id AND mo.is_active = 1
      WHERE p.is_available = 1
      GROUP BY p.id, p.name
      HAVING modifier_groups_count > 0
      LIMIT 10
    `, [])
    
    return NextResponse.json({
      success: true,
      products_with_modifiers: productsWithModifiers,
      count: (productsWithModifiers as any[]).length
    })
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 })
  }
}
