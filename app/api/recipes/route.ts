/**
 * Recipes API — manage product recipes (BOM)
 * GET  ?product_id=X  — get recipe for a product
 * GET  ?action=all    — all products with recipe info
 * POST — set recipe for a product
 */

import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth-simple'
import { getRecipe, setRecipe, getProductsWithRecipes, checkIngredientsAvailability } from '@/lib/ingredients'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser(req)
    if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

    const { searchParams } = new URL(req.url)
    const action = searchParams.get('action')
    const productId = searchParams.get('product_id')

    if (action === 'all') {
      const data = await getProductsWithRecipes()
      return NextResponse.json({ success: true, data })
    }

    if (action === 'check' && productId) {
      const qty = Number(searchParams.get('quantity')) || 1
      const data = await checkIngredientsAvailability(Number(productId), qty)
      return NextResponse.json({ success: true, data })
    }

    if (productId) {
      const recipe = await getRecipe(Number(productId))
      return NextResponse.json({ success: true, data: recipe })
    }

    return NextResponse.json({ error: 'product_id o action requerido' }, { status: 400 })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser(req)
    if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

    const body = await req.json()
    const { product_id, items } = body

    if (!product_id || !Array.isArray(items)) {
      return NextResponse.json({ error: 'product_id y items[] requeridos' }, { status: 400 })
    }

    const recipe = await setRecipe(product_id, items)
    return NextResponse.json({ success: true, data: recipe })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
