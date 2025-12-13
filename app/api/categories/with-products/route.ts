import { NextResponse } from 'next/server'
import { getCategoriesWithProducts } from '@/lib/product-service'

export async function GET() {
  try {
    const categories = await getCategoriesWithProducts()
    return NextResponse.json(categories)
  } catch (error) {
    console.error('Error fetching categories with products:', error)
    return NextResponse.json(
      { error: 'Failed to fetch categories' },
      { status: 500 }
    )
  }
}
