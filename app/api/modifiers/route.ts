import { NextRequest, NextResponse } from 'next/server'
import { executeQuery } from '@/lib/mysql-db'

// GET /api/modifiers - Obtener todos los grupos de modificadores
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const productId = searchParams.get('product_id')

    // Simplemente obtener todos los grupos de modificadores
    const sql = `SELECT * FROM modifier_groups WHERE is_active = 1 ORDER BY display_order, id`
    
    const groups = await executeQuery(sql, []) as any[]

    return NextResponse.json({
      success: true,
      groups: groups
    })

  } catch (error: any) {
    console.error('Error fetching modifiers:', error)
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}

// POST /api/modifiers - Crear grupo de modificadores
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, description, is_required, min_selections, max_selections } = body

    const result = await executeQuery(
      `INSERT INTO modifier_groups (name, description, is_required, min_selections, max_selections) 
       VALUES (?, ?, ?, ?, ?)`,
      [name, description || null, is_required || false, min_selections || 0, max_selections || 1]
    ) as any

    return NextResponse.json({
      success: true,
      group_id: result.insertId,
      message: 'Grupo de modificadores creado'
    })

  } catch (error: any) {
    console.error('Error creating modifier group:', error)
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}
