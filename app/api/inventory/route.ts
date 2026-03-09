import { NextRequest, NextResponse } from 'next/server'
import {
  getInventorySummary,
  getStockMovements,
  getValuationReport,
  getMovementAnalytics,
  adjustStock,
  type MovementType,
} from '@/lib/inventory'
import { getCurrentUser } from '@/lib/auth-simple'

export const dynamic = 'force-dynamic'

// GET /api/inventory?action=summary|movements|valuation|analytics
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser(request)
    if (!user?.is_admin) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const action = searchParams.get('action') || 'summary'

    switch (action) {
      case 'summary': {
        const data = await getInventorySummary()
        return NextResponse.json({ success: true, ...data })
      }

      case 'movements': {
        const movements = await getStockMovements({
          productId: searchParams.get('product_id') ? Number(searchParams.get('product_id')) : undefined,
          type: searchParams.get('type') || undefined,
          limit: Number(searchParams.get('limit') || 100),
          offset: Number(searchParams.get('offset') || 0),
          startDate: searchParams.get('start_date') || undefined,
          endDate: searchParams.get('end_date') || undefined,
        })
        return NextResponse.json({ success: true, movements })
      }

      case 'valuation': {
        const categories = await getValuationReport()
        return NextResponse.json({ success: true, categories })
      }

      case 'analytics': {
        const days = Number(searchParams.get('days') || 30)
        const data = await getMovementAnalytics(days)
        return NextResponse.json({ success: true, ...data })
      }

      default:
        return NextResponse.json({ error: 'Acción no válida' }, { status: 400 })
    }
  } catch (error: any) {
    console.error('Inventory GET error:', error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}

// POST /api/inventory — stock adjustments
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser(request)
    if (!user?.is_admin) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const body = await request.json()
    const { product_id, action, amount, notes } = body

    if (!product_id || !action) {
      return NextResponse.json({ error: 'product_id y action son requeridos' }, { status: 400 })
    }

    const qty = Number(amount) || 0

    let changeType: MovementType
    let changeAmount: number
    let absoluteSet: number | undefined

    switch (action) {
      case 'add':
        changeType = 'restock'
        changeAmount = qty
        break
      case 'reduce':
        changeType = 'manual_reduce'
        changeAmount = -qty
        break
      case 'set':
        changeType = 'adjustment'
        changeAmount = 0 // will be calculated
        absoluteSet = qty
        break
      case 'waste':
        changeType = 'waste'
        changeAmount = -qty
        break
      default:
        return NextResponse.json({ error: 'Acción no válida: add, reduce, set, waste' }, { status: 400 })
    }

    const result = await adjustStock(product_id, changeAmount, changeType, {
      notes: notes || `${action} manual: ${qty}`,
      userId: user.id,
      absoluteSet,
    })

    return NextResponse.json({ success: true, data: result })
  } catch (error: any) {
    console.error('Inventory POST error:', error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
