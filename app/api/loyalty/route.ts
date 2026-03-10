import { NextRequest, NextResponse } from 'next/server'
import {
  ensureLoyaltyTables,
  getLoyaltyConfig,
  updateLoyaltyConfig,
  getUserLoyalty,
  getUserTransactions,
  earnPoints,
  redeemPoints,
  addBonusPoints,
  getLoyaltyStats,
  previewEarnPoints,
  TIERS,
} from '@/lib/loyalty'
import { getCurrentUser } from '@/lib/auth-simple'

export const dynamic = 'force-dynamic'

// GET — balance, history, config, stats, preview
export async function GET(request: NextRequest) {
  try {
    await ensureLoyaltyTables()
    const { searchParams } = new URL(request.url)
    const action = searchParams.get('action') || 'balance'

    // ── Public: preview points for a total
    if (action === 'preview') {
      const orderTotal = Number(searchParams.get('total')) || 0
      const user = await getCurrentUser()
      const result = await previewEarnPoints(orderTotal, user?.id)
      return NextResponse.json({ success: true, ...result })
    }

    // ── Public: get config (non-sensitive)
    if (action === 'config') {
      const config = await getLoyaltyConfig()
      return NextResponse.json({
        success: true,
        config: {
          points_per_currency: config.points_per_currency,
          currency_per_point: config.currency_per_point,
          redemption_value: config.redemption_value,
          min_redeem: config.min_redeem,
          is_active: config.is_active,
          tiers: TIERS,
        }
      })
    }

    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    // ── User: balance
    if (action === 'balance') {
      const loyalty = await getUserLoyalty(user.id)
      return NextResponse.json({ success: true, loyalty })
    }

    // ── User: transaction history
    if (action === 'history') {
      const limit = Number(searchParams.get('limit')) || 50
      const offset = Number(searchParams.get('offset')) || 0
      const transactions = await getUserTransactions(user.id, { limit, offset })
      const loyalty = await getUserLoyalty(user.id)
      return NextResponse.json({ success: true, loyalty, transactions })
    }

    // ── Admin: stats
    if (action === 'stats') {
      if (!user.is_admin) return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
      const stats = await getLoyaltyStats()
      const config = await getLoyaltyConfig()
      return NextResponse.json({ success: true, stats, config, tiers: TIERS })
    }

    // ── Admin: full config
    if (action === 'admin-config') {
      if (!user.is_admin) return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
      const config = await getLoyaltyConfig()
      return NextResponse.json({ success: true, config, tiers: TIERS })
    }

    return NextResponse.json({ error: 'Acción no válida' }, { status: 400 })
  } catch (error: any) {
    console.error('[Loyalty GET]', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// POST — redeem, update-config, bonus
export async function POST(request: NextRequest) {
  try {
    await ensureLoyaltyTables()
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const body = await request.json()
    const action = body.action

    // ── User: redeem points
    if (action === 'redeem') {
      const points = Number(body.points) || 0
      if (points <= 0) return NextResponse.json({ error: 'Puntos inválidos' }, { status: 400 })
      const result = await redeemPoints(user.id, points, body.order_id || null, body.description)
      if ('error' in result) {
        return NextResponse.json({ success: false, error: result.error }, { status: 400 })
      }
      return NextResponse.json({ success: true, discount: result.discount, newBalance: result.newBalance })
    }

    // ── Admin: update config
    if (action === 'update-config') {
      if (!user.is_admin) return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
      await updateLoyaltyConfig(body.config)
      return NextResponse.json({ success: true, message: 'Configuración actualizada' })
    }

    // ── Admin: add/remove bonus points
    if (action === 'bonus') {
      if (!user.is_admin) return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
      const userId = Number(body.user_id)
      const points = Number(body.points)
      const description = body.description || 'Ajuste de puntos'
      if (!userId || !points) return NextResponse.json({ error: 'Datos inválidos' }, { status: 400 })
      const result = await addBonusPoints(userId, points, description)
      return NextResponse.json({ success: true, newBalance: result.newBalance })
    }

    return NextResponse.json({ error: 'Acción no válida' }, { status: 400 })
  } catch (error: any) {
    console.error('[Loyalty POST]', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
