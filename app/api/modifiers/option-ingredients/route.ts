import { NextRequest, NextResponse } from 'next/server'
import {
  getModifierOptionIngredients,
  setModifierOptionIngredients,
  getModifierOptionCost,
} from '@/lib/ingredients'

export const dynamic = 'force-dynamic'

// GET /api/modifiers/option-ingredients?option_id=X
export async function GET(request: NextRequest) {
  try {
    const optionId = Number(request.nextUrl.searchParams.get('option_id'))
    if (!optionId) {
      return NextResponse.json({ success: false, error: 'option_id requerido' }, { status: 400 })
    }

    const items = await getModifierOptionIngredients(optionId)
    const cost = await getModifierOptionCost(optionId)

    return NextResponse.json({ success: true, items, cost })
  } catch (error: any) {
    console.error('Error fetching modifier option ingredients:', error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}

// POST /api/modifiers/option-ingredients
// Body: { option_id, items: [{ingredient_id, quantity}] }
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { option_id, items } = body

    if (!option_id || !Array.isArray(items)) {
      return NextResponse.json(
        { success: false, error: 'option_id y items[] son requeridos' },
        { status: 400 }
      )
    }

    const result = await setModifierOptionIngredients(option_id, items)
    const cost = await getModifierOptionCost(option_id)

    return NextResponse.json({ success: true, items: result, cost })
  } catch (error: any) {
    console.error('Error setting modifier option ingredients:', error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
