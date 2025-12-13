import { NextRequest, NextResponse } from 'next/server'
import { executeQuery } from '@/lib/mysql-db'

// GET /api/modifiers/product/[id] - Obtener grupos de modificadores con opciones para un producto
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: productId } = await params

    // Obtener grupos asignados al producto
    const groups = await executeQuery(
      `SELECT 
        mg.id,
        mg.name,
        mg.description,
        mg.is_required,
        mg.min_selections,
        mg.max_selections
       FROM product_modifier_groups pmg
       JOIN modifier_groups mg ON pmg.modifier_group_id = mg.id
       WHERE pmg.product_id = ? AND mg.is_active = 1
       ORDER BY mg.display_order, mg.id`,
      [productId]
    ) as any[]

    // Para cada grupo, obtener sus opciones
    const groupsWithOptions = await Promise.all(
      groups.map(async (group) => {
        const options = await executeQuery(
          `SELECT 
            id,
            name,
            price_adjustment,
            display_order
           FROM modifier_options
           WHERE group_id = ? AND is_active = 1
           ORDER BY display_order, id`,
          [group.id]
        ) as any[]

        return {
          ...group,
          modifiers: options.map(opt => ({
            id: opt.id,
            name: opt.name,
            price_adjustment: parseFloat(opt.price_adjustment || 0),
            display_order: opt.display_order || 0,
            type: 'option'
          }))
        }
      })
    )

    return NextResponse.json({
      success: true,
      groups: groupsWithOptions
    })

  } catch (error: any) {
    console.error('Error fetching product modifiers:', error)
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}
