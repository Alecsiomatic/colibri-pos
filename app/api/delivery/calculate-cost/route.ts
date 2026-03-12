import { NextRequest, NextResponse } from 'next/server'
import { calculateDeliveryCost } from '@/lib/maps-free'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { deliveryAddress, orderTotal = 0 } = body
    
    if (!deliveryAddress || typeof deliveryAddress !== 'string') {
      return NextResponse.json(
        { error: 'Delivery address is required' },
        { status: 400 }
      )
    }
    
    const result = await calculateDeliveryCost(deliveryAddress, orderTotal)
    
    // Si está fuera de rango, retornar con success pero con flag outOfRange
    if (result.outOfRange) {
      return NextResponse.json({
        success: false,
        outOfRange: true,
        distance: result.distance,
        maxRadius: result.maxRadius,
        error: result.errorMessage,
        locations: result.locations
      })
    }
    
    return NextResponse.json({
      success: true,
      ...result
    })
    
  } catch (error: any) {
    console.error('❌ Error calculating delivery cost:', error)
    
    return NextResponse.json(
      { 
        success: false,
        error: 'Error al calcular costo de envío'
      },
      { status: 500 }
    )
  }
}

export async function GET() {
  return NextResponse.json(
    { error: 'Method not allowed. Use POST.' },
    { status: 405 }
  )
}
