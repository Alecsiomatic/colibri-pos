"use client"

import { useState, useEffect, useCallback } from "react"
import { useParams } from "next/navigation"
import { ArrowLeft } from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import { toast } from "sonner"
import AddToCartButton from "@/components/menu/add-to-cart-button"
import ProductImagePreview from "@/components/menu/product-image-preview"

interface Product {
  id: number
  name: string
  description: string | null
  price: number
  image_url: string | null
  category_id: number | null
  available: boolean
  stock: number
  slug: string
  images?: Array<{
    id: number
    image_url: string
    alt_text: string | null
    is_primary: boolean
    display_order: number
  }>
}

interface Category {
  id: number
  name: string
  slug: string
  description: string | null
  image_url?: string | null
  subtitle?: string | null
  product_count?: number
}

export default function CategoryPage() {
  const params = useParams()
  const categoryId = params.slug as string
  const [category, setCategory] = useState<Category | null>(null)
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)

  const fetchCategoryAndProducts = useCallback(async () => {
    try {
      setLoading(true)

      // ✅ Obtener categoría dinámicamente desde API
      const categoriesRes = await fetch('/api/categories/with-products')
      const categories = await categoriesRes.json()
      const foundCategory = categories.find((cat: Category) => cat.id === Number.parseInt(categoryId))

      if (!foundCategory) {
        toast.error("Categoría no encontrada")
        return
      }

      setCategory(foundCategory)

      // ✅ Obtener productos con imágenes dinámicamente desde API
      const productsRes = await fetch(`/api/products/by-category?categoryId=${categoryId}`)
      const productsData = await productsRes.json()
      setProducts(productsData)

      console.log(`Categoría: ${foundCategory.name}, Productos encontrados: ${productsData.length}`)
    } catch (error) {
      console.error("Error al cargar categoría y productos:", error)
      toast.error("Error al cargar los productos")
    } finally {
      setLoading(false)
    }
  }, [categoryId])

  useEffect(() => {
    if (categoryId) {
      fetchCategoryAndProducts()
    }
  }, [categoryId, fetchCategoryAndProducts])

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 py-12">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <p className="text-center text-xl text-gray-600">Cargando productos...</p>
        </div>
      </div>
    )
  }

  if (!category) {
    return (
      <div className="min-h-screen bg-gray-100 py-12">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Categoría no encontrada</h1>
            <Link
              href="/menu"
              className="inline-flex items-center px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Volver al menú
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-100 py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header con información de la categoría */}
        <div className="mb-8">
          <Link href="/menu" className="inline-flex items-center text-amber-600 hover:text-amber-700 mb-4">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Volver al menú
          </Link>

          <div className="bg-white rounded-xl overflow-hidden shadow-lg">
            {category.image_url && (
              <div className="h-48 relative">
                <Image
                  src={category.image_url || "/placeholder.svg"}
                  alt={category.name}
                  fill
                  className="object-cover"
                />
              </div>
            )}
            <div className="p-6">
              <h1 className="text-3xl font-bold text-gray-900 mb-2 font-serif">{category.name}</h1>
              {category.subtitle && <p className="text-xl text-amber-600 italic mb-2">{category.subtitle}</p>}
              {category.description && <p className="text-gray-700">{category.description}</p>}
              <div className="mt-4 text-sm text-gray-500">{category.product_count} productos disponibles</div>
            </div>
          </div>
        </div>

        {/* Lista de productos */}
        {products.length === 0 ? (
          <div className="bg-white rounded-xl p-8 text-center shadow-lg">
            <h2 className="text-xl font-semibold text-gray-900 mb-2">No hay productos disponibles</h2>
            <p className="text-gray-600">Esta categoría no tiene productos disponibles en este momento.</p>
            <p className="text-sm text-gray-500 mt-2">
              Los productos pueden estar agotados o temporalmente no disponibles.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {products.map((product) => (
              <div
                key={product.id}
                className="bg-white rounded-xl overflow-hidden shadow-lg border border-gray-200 hover:shadow-xl transition-shadow"
              >
                <div className="h-48 relative">
                  <ProductImagePreview
                    productId={product.id}
                    productName={product.name}
                    fallbackImage={product.image_url || undefined}
                    className="h-full w-full"
                    showImageCount={true}
                  />
                </div>
                <div className="p-6">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="text-xl font-bold text-gray-900">{product.name}</h3>
                    <span className="text-2xl font-bold text-amber-600">${product.price.toFixed(2)}</span>
                  </div>

                  {product.description && <p className="text-gray-700 mb-4">{product.description}</p>}

                  {product.stock !== undefined && (
                    <p className="text-sm text-gray-500 mb-4">Stock disponible: {product.stock} unidades</p>
                  )}

                  <AddToCartButton
                    menuItem={{
                      title: product.name,
                      price: product.price,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
