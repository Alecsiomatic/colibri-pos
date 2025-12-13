import { NextRequest, NextResponse } from 'next/server'
import { executeQuery } from '@/lib/mysql-db'

// GET /api/qr-tables/[token] - Validar token QR y obtener info de mesa
export async function GET(
  request: NextRequest,
  { params }: { params: { token: string } }
) {
  try {
    const qrToken = params.token

    const [table] = await executeQuery(
      `SELECT * FROM table_qr_codes 
       WHERE qr_token = ? AND is_active = 1`,
      [qrToken]
    ) as any[]

    if (!table) {
      return NextResponse.json(
        { success: false, error: 'Mesa no encontrada o inactiva' },
        { status: 404 }
      )
    }

    // Obtener pedidos activos de esta mesa
    const activeOrders = await executeQuery(
      `SELECT 
        o.*,
        COUNT(DISTINCT JSON_EXTRACT(items, '$[*]')) as items_count
       FROM orders o
       WHERE o.qr_table_id = ? 
       AND o.status NOT IN ('delivered', 'cancelled')
       GROUP BY o.id
       ORDER BY o.created_at DESC`,
      [table.id]
    )

    return NextResponse.json({
      success: true,
      table: {
        ...table,
        active_orders: activeOrders
      }
    })

  } catch (error: any) {
    console.error('Error validating QR token:', error)
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}
