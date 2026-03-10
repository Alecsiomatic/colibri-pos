import { NextRequest, NextResponse } from 'next/server'
import {
  getPromotions,
  getPromotionById,
  createPromotion,
  updatePromotion,
  deletePromotion,
  validateCoupon,
  applyPromotions,
  getProductsForPicker,
  getCategoriesForPicker,
  getPromotionStats,
  type CartItemForPromo,
} from '@/lib/promotions'
import { getCurrentUser } from '@/lib/auth-simple'

export const dynamic = 'force-dynamic'

// GET /api/promotions?action=list|detail|validate_coupon|apply|picker_products|picker_categories|stats
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const action = searchParams.get('action') || 'list'

    switch (action) {
      case 'list': {
        const user = await getCurrentUser(request)
        if (!user?.is_admin) {
          return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
        }
        const promotions = await getPromotions()
        return NextResponse.json({ success: true, promotions })
      }

      case 'detail': {
        const user = await getCurrentUser(request)
        if (!user?.is_admin) {
          return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
        }
        const id = Number(searchParams.get('id'))
        if (!id) return NextResponse.json({ error: 'ID requerido' }, { status: 400 })
        const promo = await getPromotionById(id)
        if (!promo) return NextResponse.json({ error: 'Promoción no encontrada' }, { status: 404 })
        return NextResponse.json({ success: true, promotion: promo })
      }

      case 'validate_coupon': {
        const code = searchParams.get('code')
        if (!code) return NextResponse.json({ error: 'Código requerido' }, { status: 400 })
        const result = await validateCoupon(code)
        return NextResponse.json({ success: true, ...result })
      }

      case 'active': {
        // Public endpoint: get currently active auto-applied promotions for display
        const channel = searchParams.get('channel') || 'all'
        const { getActivePromotions } = await import('@/lib/promotions')
        const promos = await getActivePromotions(channel)
        return NextResponse.json({
          success: true,
          promotions: promos.map(p => ({
            id: p.id,
            name: p.name,
            description: p.description,
            type: p.type,
            value: p.value,
          }))
        })
      }

      case 'picker_products': {
        const user = await getCurrentUser(request)
        if (!user?.is_admin) {
          return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
        }
        const products = await getProductsForPicker()
        return NextResponse.json({ success: true, products })
      }

      case 'picker_categories': {
        const user = await getCurrentUser(request)
        if (!user?.is_admin) {
          return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
        }
        const categories = await getCategoriesForPicker()
        return NextResponse.json({ success: true, categories })
      }

      case 'stats': {
        const user = await getCurrentUser(request)
        if (!user?.is_admin) {
          return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
        }
        const stats = await getPromotionStats()
        return NextResponse.json({ success: true, ...stats })
      }

      default:
        return NextResponse.json({ error: 'Acción no válida' }, { status: 400 })
    }
  } catch (error: any) {
    console.error('[Promotions GET]', error)
    return NextResponse.json({ error: error.message || 'Error interno' }, { status: 500 })
  }
}

// POST /api/promotions
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser(request)
    const body = await request.json()
    const action = body.action || 'create'

    // Apply promotions is public (used by checkout)
    if (action === 'apply') {
      const items: CartItemForPromo[] = body.items || []
      const channel = body.channel || 'all'
      const couponCode = body.coupon_code || undefined
      const result = await applyPromotions(items, channel, couponCode)
      return NextResponse.json({ success: true, ...result })
    }

    // Everything else requires admin
    if (!user?.is_admin) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    switch (action) {
      case 'create': {
        const id = await createPromotion(body)
        return NextResponse.json({ success: true, id })
      }

      case 'update': {
        if (!body.id) return NextResponse.json({ error: 'ID requerido' }, { status: 400 })
        await updatePromotion(body.id, body)
        return NextResponse.json({ success: true })
      }

      case 'delete': {
        if (!body.id) return NextResponse.json({ error: 'ID requerido' }, { status: 400 })
        await deletePromotion(body.id)
        return NextResponse.json({ success: true })
      }

      case 'toggle': {
        if (!body.id) return NextResponse.json({ error: 'ID requerido' }, { status: 400 })
        await updatePromotion(body.id, { is_active: body.is_active })
        return NextResponse.json({ success: true })
      }

      default:
        return NextResponse.json({ error: 'Acción no válida' }, { status: 400 })
    }
  } catch (error: any) {
    console.error('[Promotions POST]', error)
    return NextResponse.json({ error: error.message || 'Error interno' }, { status: 500 })
  }
}
