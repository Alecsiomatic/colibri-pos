import { NextRequest, NextResponse } from 'next/server'
import { executeQuery } from '@/lib/mysql-db'

// GET /api/modifiers/[id] - Obtener grupos de modificadores asignados a un producto
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: productId } = await params

    // Obtener grupos asignados al producto
    const modifiers = await executeQuery(
      `SELECT 
        pmg.id,
        pmg.modifier_group_id as group_id,
        mg.name as group_name,
        mg.is_required,
        mg.max_selections
       FROM product_modifier_groups pmg
       JOIN modifier_groups mg ON pmg.modifier_group_id = mg.id
       WHERE pmg.product_id = ? AND mg.is_active = 1
       ORDER BY mg.display_order, mg.id`,
      [productId]
    )

    return NextResponse.json({
      success: true,
      modifiers
    })

  } catch (error: any) {
    console.error('Error fetching product modifiers:', error)
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}

// POST /api/modifiers/[id] - Agregar modificador a producto
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: productId } = await params
    const body = await request.json()
    const { name, price_adjustment, modifier_type, display_order } = body

    const result = await executeQuery(
      `INSERT INTO product_modifiers 
       (product_id, name, price_adjustment, modifier_type, display_order) 
       VALUES (?, ?, ?, ?, ?)`,
      [productId, name, price_adjustment || 0, modifier_type || 'option', display_order || 0]
    ) as any

    // Actualizar flag has_modifiers del producto
    await executeQuery(
      `UPDATE products SET has_modifiers = 1 WHERE id = ?`,
      [productId]
    )

    return NextResponse.json({
      success: true,
      modifier_id: result.insertId,
      message: 'Modificador agregado'
    })

  } catch (error: any) {
    console.error('Error adding modifier:', error)
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}

// DELETE /api/modifiers/[id] - Eliminar modificador
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: modifierId } = await params

    await executeQuery(
      `DELETE FROM product_modifiers WHERE id = ?`,
      [modifierId]
    )

    return NextResponse.json({
      success: true,
      message: 'Modificador eliminado'
    })

  } catch (error: any) {
    console.error('Error deleting modifier:', error)
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}
