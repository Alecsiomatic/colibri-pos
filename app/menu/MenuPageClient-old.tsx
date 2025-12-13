"use client"

import { useState, useEffect } from "react"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Search, Star, Zap, Rocket } from "lucide-react"
import { useCart } from "@/components/cart/cart-provider"
import Image from "next/image"

interface Product {
  id: string
  name: string
  description: string
  price: number
  category_id: string // Asumiendo que tienes category_id en products
  category_slug?: string // Para el filtrado
  image_url?: string
  is_featured?: boolean
  available?: boolean // Cambiado de is_active
  stock?: number // Para consistencia
}

interface Category {
  id: string
  name: string
  description?: string
  slug: string
}

export default function MenuPageClient() {
  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("all")
  const { addToCart } = useCart()
  const supabase = createClientComponentClient()

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      setLoading(true) // Asegurar que loading se setea al inicio
      // Fetch categories
      const { data: categoriesData, error: categoriesError } = await supabase
        .from("categories")
        .select("id, name, slug") // Asegúrate de seleccionar slug
        .order("name")

      if (categoriesError) throw categoriesError
      setCategories(categoriesData || [])

      // Fetch products
      const { data: productsData, error: productsError } = await supabase
        .from("products")
        .select("*") // Selecciona todo, incluyendo category_id
        .eq("available", true) // Usar 'available'
        .gt("stock", 0) // Asegurar que hay stock
        .order("name")

      if (productsError) throw productsError

      // Map products to include category_slug
      const productsWithCategorySlug = productsData?.map((product) => {
        const category = categoriesData?.find((cat) => cat.id === product.category_id)
        return {
          ...product,
          category_slug: category?.slug,
        }
      })

      setProducts(productsWithCategorySlug || [])
    } catch (error) {
      console.error("Error fetching data:", error)
      setProducts([]) // En caso de error, limpiar productos para evitar mostrar datos viejos
      setCategories([])
    } finally {
      setLoading(false)
    }
  }

  const filteredProducts = products.filter((product) => {
    const matchesSearch =
      product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.description?.toLowerCase().includes(searchQuery.toLowerCase())
    // Ahora comparamos con product.category_slug
    const matchesCategory = selectedCategory === "all" || product.category_slug === selectedCategory
    return matchesSearch && matchesCategory
  })

  const featuredProducts = products.filter((product) => product.is_featured)

  const handleAddToCart = (product: Product) => {
    addToCart({
      id: product.id,
      name: product.name,
      price: product.price,
      quantity: 1,
      image: product.image_url,
    })
  }

  const getCategoryIcon = (categoryName: string) => {
    if (!categoryName) return "🚀" // Fallback si no hay nombre de categoría
    const name = categoryName.toLowerCase()
    // ... resto de la lógica de getCategoryIcon
    if (name.includes("burger") || name.includes("hamburguesa")) return "🍔"
    if (name.includes("wing") || name.includes("alita")) return "🍗"
    if (name.includes("side") || name.includes("acompañamiento")) return "🍟"
    if (name.includes("drink") || name.includes("bebida")) return "🥤"
    if (name.includes("dessert") || name.includes("postre")) return "🍰"
    return "🚀"
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-black via-purple-950 to-black">
        <div className="container mx-auto px-4 py-8">
          <div className="text-center py-20">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-purple-400"></div>
            <p className="mt-4 text-purple-300">Cargando menú galáctico...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-purple-950 to-black relative overflow-hidden">
      {/* Cosmic Background Effects */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-2 h-2 bg-purple-400 rounded-full animate-pulse"></div>
        <div className="absolute top-40 right-20 w-1 h-1 bg-pink-400 rounded-full animate-ping"></div>
        <div className="absolute bottom-40 left-1/4 w-1.5 h-1.5 bg-orange-400 rounded-full animate-pulse"></div>
        <div className="absolute top-60 left-1/3 w-1 h-1 bg-purple-300 rounded-full animate-ping"></div>
        <div className="absolute bottom-60 right-1/3 w-2 h-2 bg-pink-300 rounded-full animate-pulse"></div>
      </div>

      <div className="container mx-auto px-4 py-8 relative z-10">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-5xl md:text-6xl font-bold mb-4 bg-gradient-to-r from-purple-400 via-pink-400 to-orange-400 bg-clip-text text-transparent">
            Menú Galáctico
          </h1>
          <p className="text-xl text-gray-300 max-w-2xl mx-auto">Descubre sabores que están fuera de este mundo 🚀</p>
        </div>

        {/* Search Bar */}
        <div className="max-w-md mx-auto mb-8">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-purple-400 h-5 w-5" />
            <Input
              type="search"
              placeholder="Buscar hamburguesas, alitas..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-black/50 border-purple-800 text-white placeholder:text-gray-400 backdrop-blur-sm"
            />
          </div>
        </div>

        {/* Featured Products */}
        {featuredProducts.length > 0 && (
          <div className="mb-12">
            <h2 className="text-3xl font-bold text-center mb-8 text-white flex items-center justify-center gap-2">
              <Star className="text-yellow-400" />
              Especialidades Estelares
              <Star className="text-yellow-400" />
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {featuredProducts.map((product) => (
                <Card
                  key={product.id}
                  className="bg-black/50 border-purple-800 backdrop-blur-sm hover:bg-black/60 transition-all duration-300 group"
                >
                  <CardHeader className="pb-3">
                    <div className="relative h-48 mb-4 rounded-lg overflow-hidden">
                      {product.image_url ? (
                        <Image
                          src={product.image_url || "/placeholder.svg"}
                          alt={product.name}
                          fill
                          className="object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-purple-900 to-pink-900 flex items-center justify-center">
                          <span className="text-6xl">🍔</span>
                        </div>
                      )}
                      <Badge className="absolute top-2 right-2 bg-yellow-500 text-black">
                        <Star className="w-3 h-3 mr-1" />
                        Destacado
                      </Badge>
                    </div>
                    <CardTitle className="text-white group-hover:text-purple-300 transition-colors">
                      {product.name}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-300 text-sm mb-4">{product.description}</p>
                    <div className="flex items-center justify-between">
                      <span className="text-2xl font-bold text-orange-400">${product.price.toFixed(2)}</span>
                      <Button
                        onClick={() => handleAddToCart(product)}
                        className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white"
                        disabled={product.stock === 0}
                      >
                        <Rocket className="w-4 h-4 mr-2" />
                        {product.stock === 0 ? "Agotado" : "Agregar"}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Categories Tabs */}
        <Tabs value={selectedCategory} onValueChange={setSelectedCategory} className="w-full">
          <TabsList className="grid w-full grid-cols-2 md:grid-cols-4 lg:grid-cols-6 bg-black/50 border-purple-800 backdrop-blur-sm mb-8">
            <TabsTrigger
              value="all"
              className="data-[state=active]:bg-purple-600 data-[state=active]:text-white text-gray-300"
            >
              <Zap className="w-4 h-4 mr-2" />
              Todos
            </TabsTrigger>
            {categories.map((category) => (
              <TabsTrigger
                key={category.id}
                value={category.slug}
                className="data-[state=active]:bg-purple-600 data-[state=active]:text-white text-gray-300"
              >
                <span className="mr-2">{getCategoryIcon(category.name)}</span>
                {category.name}
              </TabsTrigger>
            ))}
          </TabsList>

          <TabsContent value={selectedCategory} className="mt-8">
            {filteredProducts.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-6xl mb-4">🔍</div>
                <h3 className="text-xl font-semibold text-white mb-2">No se encontraron productos</h3>
                <p className="text-gray-400">Intenta con otros términos de búsqueda o categoría</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {filteredProducts.map((product) => (
                  <Card
                    key={product.id}
                    className="bg-black/50 border-purple-800 backdrop-blur-sm hover:bg-black/60 transition-all duration-300 group"
                  >
                    <CardHeader className="pb-3">
                      <div className="relative h-40 mb-4 rounded-lg overflow-hidden">
                        {product.image_url ? (
                          <Image
                            src={product.image_url || "/placeholder.svg"}
                            alt={product.name}
                            fill
                            className="object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                        ) : (
                          <div className="w-full h-full bg-gradient-to-br from-purple-900 to-pink-900 flex items-center justify-center">
                            <span className="text-4xl">
                              {getCategoryIcon(categories.find((c) => c.id === product.category_id)?.name || "")}
                            </span>
                          </div>
                        )}
                        {product.stock === 0 && (
                          <div className="absolute inset-0 bg-black/70 flex items-center justify-center">
                            <Badge variant="destructive">Agotado</Badge>
                          </div>
                        )}
                      </div>
                      <CardTitle className="text-white group-hover:text-purple-300 transition-colors text-lg">
                        {product.name}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-gray-300 text-sm mb-4 line-clamp-2">{product.description}</p>
                      <div className="flex items-center justify-between">
                        <span className="text-xl font-bold text-orange-400">${product.price.toFixed(2)}</span>
                        <Button
                          onClick={() => handleAddToCart(product)}
                          size="sm"
                          className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white"
                          disabled={product.stock === 0}
                        >
                          <Rocket className="w-3 h-3 mr-1" />
                          Agregar
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
