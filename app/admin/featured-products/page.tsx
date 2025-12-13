"use client"

import { useState, useEffect } from "react"
import AdminLayout from "@/components/admin/admin-layout"
import { Star, StarOff, Search, Eye, EyeOff } from "lucide-react"
import { toast } from "sonner"
import ImageWithFallback from "@/components/ImageWithFallback"

type Product = {
  id: number
  name: string
  description: string
  price: number
  image_url: string
  category_id: number | null
  is_featured: boolean
  available: boolean
  category_name?: string
}

export default function FeaturedProductsPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [showOnlyFeatured, setShowOnlyFeatured] = useState(false)
  const [updating, setUpdating] = useState<number | null>(null)

  useEffect(() => {
    fetchProducts()
  }, [])

  async function fetchProducts() {
    try {
      setLoading(true)
      const response = await fetch('/api/products-mysql?available=true', {
        credentials: 'include'
      })
      
      if (!response.ok) throw new Error('Error al cargar productos')
      
      const data = await response.json()
      setProducts(data.products || [])
    } catch (error) {
      console.error("Error al cargar productos:", error)
      toast.error("Error al cargar productos")
    } finally {
      setLoading(false)
    }
  }

  async function toggleFeatured(productId: number, currentFeatured: boolean) {
    try {
      setUpdating(productId)

      const response = await fetch('/api/products-mysql', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          id: productId,
          is_featured: !currentFeatured
        })
      })

      if (!response.ok) throw new Error('Error al actualizar')

      // Actualizar estado local
      setProducts(products.map((p) => (p.id === productId ? { ...p, is_featured: !currentFeatured } : p)))

      toast.success(!currentFeatured ? "Producto agregado a destacados" : "Producto removido de destacados")
    } catch (error) {
      console.error("Error al actualizar producto:", error)
      toast.error("Error al actualizar producto")
    } finally {
      setUpdating(null)
    }
  }

  const filteredProducts = products.filter((product) => {
    const matchesSearch =
      product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.category_name?.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesFilter = showOnlyFeatured ? product.is_featured : true

    return matchesSearch && matchesFilter
  })

  const featuredCount = products.filter((p) => p.is_featured).length

  return (
    <AdminLayout>
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-2xl font-bold text-purple-900">Productos Destacados</h2>
            <p className="text-gray-600 mt-1">Gestiona qué productos aparecen en la sección destacada del home</p>
          </div>
          <div className="bg-purple-50 px-4 py-2 rounded-lg">
            <span className="text-purple-800 font-semibold">{featuredCount} productos destacados</span>
          </div>
        </div>

        {/* Filtros */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <input
              type="text"
              placeholder="Buscar productos..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full p-3 pl-10 border border-purple-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
            />
            <Search className="absolute left-3 top-3.5 text-purple-500" size={18} />
          </div>

          <button
            onClick={() => setShowOnlyFeatured(!showOnlyFeatured)}
            className={`flex items-center px-4 py-3 rounded-md transition-colors ${
              showOnlyFeatured ? "bg-purple-600 text-white" : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            {showOnlyFeatured ? <Eye size={18} className="mr-2" /> : <EyeOff size={18} className="mr-2" />}
            {showOnlyFeatured ? "Mostrar todos" : "Solo destacados"}
          </button>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="bg-gray-200 rounded-lg h-64 animate-pulse"></div>
            ))}
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500">
              {showOnlyFeatured
                ? "No hay productos destacados"
                : searchTerm
                  ? "No se encontraron productos"
                  : "No hay productos disponibles"}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredProducts.map((product) => (
              <div
                key={product.id}
                className={`bg-white border-2 rounded-lg overflow-hidden transition-all duration-200 ${
                  product.is_featured
                    ? "border-purple-400 shadow-lg ring-2 ring-purple-200"
                    : "border-gray-200 hover:border-purple-300"
                }`}
              >
                <div className="relative h-48">
                  <ImageWithFallback
                    src={product.image_url || "/placeholder.svg"}
                    fallbackSrc="/placeholder.svg?height=200&width=300&text=Producto"
                    alt={product.name}
                    fill
                    className="object-cover"
                  />
                  {product.is_featured && (
                    <div className="absolute top-2 right-2 bg-purple-500 text-white px-2 py-1 rounded-full text-xs font-semibold">
                      Destacado
                    </div>
                  )}
                </div>

                <div className="p-4">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-bold text-lg text-gray-900 line-clamp-1">{product.name}</h3>
                    <span className="text-lg font-bold text-purple-600">${product.price}</span>
                  </div>

                  <p className="text-gray-600 text-sm mb-3 line-clamp-2">{product.description || "Sin descripción"}</p>

                  <div className="flex justify-between items-center">
                    <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                      {product.category_name || "Sin categoría"}
                    </span>

                    <button
                      onClick={() => toggleFeatured(product.id, product.is_featured)}
                      disabled={updating === product.id}
                      className={`flex items-center px-3 py-2 rounded-md transition-colors ${
                        product.is_featured
                          ? "bg-purple-100 text-purple-700 hover:bg-purple-200"
                          : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                      } ${updating === product.id ? "opacity-50 cursor-not-allowed" : ""}`}
                    >
                      {updating === product.id ? (
                        <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin mr-2"></div>
                      ) : product.is_featured ? (
                        <StarOff size={16} className="mr-2" />
                      ) : (
                        <Star size={16} className="mr-2" />
                      )}
                      {product.is_featured ? "Quitar" : "Destacar"}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Información adicional */}
        <div className="mt-8 p-4 bg-purple-50 rounded-lg">
          <h3 className="font-semibold text-purple-900 mb-2">💡 Consejos:</h3>
          <ul className="text-sm text-purple-800 space-y-1">
            <li>• Los productos destacados aparecen en la página principal</li>
            <li>• Se recomienda tener entre 3-6 productos destacados</li>
            <li>• Los productos con mejores imágenes generan más ventas</li>
            <li>• Actualiza regularmente para mantener el interés</li>
          </ul>
        </div>
      </div>
    </AdminLayout>
  )
}
