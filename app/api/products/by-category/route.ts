import { NextRequest, NextResponse } from 'next/server'
import { getProductsByCategoryWithImages } from '@/lib/product-service'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const categoryId = searchParams.get('categoryId')

    if (!categoryId) {
      return NextResponse.json(
        { error: 'Category ID is required' },
        { status: 400 }
      )
    }

    const products = await getProductsByCategoryWithImages(parseInt(categoryId))
    return NextResponse.json(products)
  } catch (error) {
    console.error('Error fetching products by category:', error)
    return NextResponse.json(
      { error: 'Failed to fetch products' },
      { status: 500 }
    )
  }
}
