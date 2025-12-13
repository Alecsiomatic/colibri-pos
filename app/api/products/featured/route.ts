import { NextResponse } from 'next/server'
import { getFeaturedProductsWithImages } from '@/lib/product-service'

export async function GET() {
  try {
    const products = await getFeaturedProductsWithImages()
    return NextResponse.json(products)
  } catch (error) {
    console.error('Error fetching featured products:', error)
    return NextResponse.json(
      { error: 'Failed to fetch featured products' },
      { status: 500 }
    )
  }
}
