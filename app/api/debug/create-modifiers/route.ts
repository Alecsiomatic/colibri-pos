import { NextResponse } from 'next/server'
import { executeQuery } from '@/lib/mysql-db'

export async function GET() {
  try {
    const products = await executeQuery(`
      SELECT id, name, price FROM products WHERE is_available = 1 LIMIT 5
    `, [])
    
    return NextResponse.json({ success: true, products })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const { product_id } = await request.json()
    
    if (!product_id) {
      return NextResponse.json({ error: 'product_id requerido' }, { status: 400 })
    }
    
    // Crear grupo de modificadores "Tamaño"
    const [result1]: any = await executeQuery(`
      INSERT INTO product_modifiers (product_id, name, price_adjustment, modifier_type, is_active, display_order)
      VALUES (?, 'Tamaño', 0, 'size', 1, 1)
    `, [product_id])
    
    const sizeGroupId = result1.insertId
    
    // Crear opciones de tamaño
    await executeQuery(`
      INSERT INTO modifier_options (group_id, name, price_adjustment, display_order, is_active)
      VALUES 
        (?, 'Chico', 0, 1, 1),
        (?, 'Mediano', 15, 2, 1),
        (?, 'Grande', 30, 3, 1)
    `, [sizeGroupId, sizeGroupId, sizeGroupId])
    
    // Crear grupo de modificadores "Extras"
    const [result2]: any = await executeQuery(`
      INSERT INTO product_modifiers (product_id, name, price_adjustment, modifier_type, is_active, display_order)
      VALUES (?, 'Extras', 0, 'extra', 1, 2)
    `, [product_id])
    
    const extrasGroupId = result2.insertId
    
    // Crear opciones de extras
    await executeQuery(`
      INSERT INTO modifier_options (group_id, name, price_adjustment, display_order, is_active)
      VALUES 
        (?, 'Queso extra', 10, 1, 1),
        (?, 'Aguacate', 15, 2, 1),
        (?, 'Tocino', 20, 3, 1)
    `, [extrasGroupId, extrasGroupId, extrasGroupId])
    
    return NextResponse.json({
      success: true,
      message: 'Modificadores creados',
      product_id,
      groups: [
        { id: sizeGroupId, name: 'Tamaño', options: 3 },
        { id: extrasGroupId, name: 'Extras', options: 3 }
      ]
    })
    
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
