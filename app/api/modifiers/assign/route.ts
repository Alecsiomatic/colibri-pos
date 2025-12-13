import { NextRequest, NextResponse } from 'next/server'
import { executeQuery } from '@/lib/mysql-db'

// POST /api/modifiers/assign - Asignar un grupo de modificadores a un producto
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { product_id, modifier_group_id } = body

    if (!product_id || !modifier_group_id) {
      return NextResponse.json(
        { success: false, error: 'Faltan parámetros requeridos' },
        { status: 400 }
      )
    }

    // Verificar si ya existe la asignación
    const existing = await executeQuery(
      `SELECT id FROM product_modifier_groups 
       WHERE product_id = ? AND modifier_group_id = ?`,
      [product_id, modifier_group_id]
    ) as any[]

    if (existing.length > 0) {
      return NextResponse.json({
        success: false,
        error: 'Este grupo ya está asignado al producto'
      }, { status: 400 })
    }

    // Crear la asignación
    const result = await executeQuery(
      `INSERT INTO product_modifier_groups (product_id, modifier_group_id) 
       VALUES (?, ?)`,
      [product_id, modifier_group_id]
    ) as any

    return NextResponse.json({
      success: true,
      id: result.insertId,
      message: 'Grupo asignado al producto'
    })

  } catch (error: any) {
    console.error('Error assigning modifier group:', error)
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}

// DELETE /api/modifiers/assign - Desasignar un grupo de modificadores de un producto
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl
    const product_id = searchParams.get('product_id')
    const group_id = searchParams.get('group_id')

    if (!product_id || !group_id) {
      return NextResponse.json(
        { success: false, error: 'Faltan parámetros requeridos' },
        { status: 400 }
      )
    }

    await executeQuery(
      `DELETE FROM product_modifier_groups 
       WHERE product_id = ? AND modifier_group_id = ?`,
      [product_id, group_id]
    )

    return NextResponse.json({
      success: true,
      message: 'Grupo desasignado del producto'
    })

  } catch (error: any) {
    console.error('Error unassigning modifier group:', error)
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}
