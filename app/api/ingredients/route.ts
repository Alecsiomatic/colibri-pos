/**
 * Ingredients (Insumos) API
 * GET  — list all ingredients + summary
 * POST — create / adjust stock / bulk recalc
 * PUT  — update ingredient
 * DELETE — delete ingredient
 */

import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth-simple'
import {
  getIngredients, createIngredient, updateIngredient, deleteIngredient,
  adjustIngredientStock, getIngredientsSummary, getIngredientMovements,
  recalcAllProductCosts,
} from '@/lib/ingredients'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser(req)
    if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

    const { searchParams } = new URL(req.url)
    const action = searchParams.get('action') || 'list'

    if (action === 'summary') {
      const data = await getIngredientsSummary()
      return NextResponse.json({ success: true, data })
    }

    if (action === 'movements') {
      const ingredientId = searchParams.get('ingredient_id')
      const type = searchParams.get('type')
      const page = Number(searchParams.get('page')) || 1
      const limit = Number(searchParams.get('limit')) || 50
      const data = await getIngredientMovements({
        ingredientId: ingredientId ? Number(ingredientId) : undefined,
        type: type || undefined,
        limit, offset: (page - 1) * limit,
      })
      return NextResponse.json({ success: true, data })
    }

    // Default: list
    const category = searchParams.get('category') || undefined
    const ingredients = await getIngredients({ category })
    return NextResponse.json({ success: true, data: ingredients })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser(req)
    if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

    const body = await req.json()
    const { action } = body

    // Adjust stock
    if (action === 'adjust') {
      const { ingredient_id, type, quantity, notes } = body
      if (!ingredient_id || !type || quantity === undefined) {
        return NextResponse.json({ error: 'ingredient_id, type y quantity son requeridos' }, { status: 400 })
      }
      let changeAmount = Number(quantity)
      let changeType = type
      let absoluteSet: number | undefined

      if (type === 'entry') changeAmount = Math.abs(changeAmount)
      else if (type === 'manual_reduce' || type === 'waste') changeAmount = -Math.abs(changeAmount)
      else if (type === 'adjustment') { absoluteSet = Math.max(0, changeAmount); changeAmount = 0; changeType = 'adjustment' }

      const result = await adjustIngredientStock(ingredient_id, changeAmount, changeType, {
        notes: notes || `${type}: ${quantity}`,
        userId: user.id, absoluteSet,
      })
      return NextResponse.json({ success: true, data: result })
    }

    // Recalc all product costs
    if (action === 'recalc_costs') {
      const count = await recalcAllProductCosts()
      return NextResponse.json({ success: true, message: `${count} productos recalculados` })
    }

    // Create ingredient
    const { name, unit, stock, cost_per_unit, min_stock, supplier, category } = body
    if (!name) return NextResponse.json({ error: 'Nombre requerido' }, { status: 400 })

    const result = await createIngredient({ name, unit, stock, cost_per_unit, min_stock, supplier, category })
    return NextResponse.json({ success: true, data: result })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}

export async function PUT(req: NextRequest) {
  try {
    const user = await getCurrentUser(req)
    if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

    const body = await req.json()
    const { id, ...data } = body
    if (!id) return NextResponse.json({ error: 'ID requerido' }, { status: 400 })

    await updateIngredient(id, data)
    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const user = await getCurrentUser(req)
    if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

    const { searchParams } = new URL(req.url)
    const id = Number(searchParams.get('id'))
    if (!id) return NextResponse.json({ error: 'ID requerido' }, { status: 400 })

    await deleteIngredient(id)
    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
