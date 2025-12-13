import { NextRequest, NextResponse } from 'next/server'
import { executeQuery } from '@/lib/mysql-db'

// GET /api/modifiers/options?group_id=X - Obtener opciones de un grupo
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const groupId = searchParams.get('group_id')

    if (!groupId) {
      return NextResponse.json(
        { success: false, error: 'group_id es requerido' },
        { status: 400 }
      )
    }

    const options = await executeQuery(
      `SELECT * FROM modifier_options 
       WHERE group_id = ? AND is_active = 1 
       ORDER BY display_order, name`,
      [groupId]
    ) as any[]

    return NextResponse.json({
      success: true,
      options: options
    })

  } catch (error: any) {
    console.error('Error fetching modifier options:', error)
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}

// POST /api/modifiers/options - Crear opción en un grupo
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { group_id, name, price_adjustment } = body

    if (!group_id || !name) {
      return NextResponse.json(
        { success: false, error: 'group_id y name son requeridos' },
        { status: 400 }
      )
    }

    const result = await executeQuery(
      `INSERT INTO modifier_options (group_id, name, price_adjustment) 
       VALUES (?, ?, ?)`,
      [group_id, name, price_adjustment || 0]
    ) as any

    return NextResponse.json({
      success: true,
      option_id: result.insertId,
      message: 'Opción creada exitosamente'
    })

  } catch (error: any) {
    console.error('Error creating modifier option:', error)
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}

// DELETE /api/modifiers/options - Eliminar opción
export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json()
    const { option_id } = body

    if (!option_id) {
      return NextResponse.json(
        { success: false, error: 'option_id es requerido' },
        { status: 400 }
      )
    }

    await executeQuery(
      `UPDATE modifier_options SET is_active = 0 WHERE id = ?`,
      [option_id]
    )

    return NextResponse.json({
      success: true,
      message: 'Opción eliminada'
    })

  } catch (error: any) {
    console.error('Error deleting modifier option:', error)
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}
