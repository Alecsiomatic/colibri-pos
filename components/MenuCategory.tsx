"use client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Star, Rocket, Flame } from "lucide-react"
import { useCart } from "@/components/cart/cart-provider"
import Image from "next/image"

interface Product {
  id: string
  name: string
  description: string
  price: number
  image_url?: string
  is_featured?: boolean
  stock_quantity?: number
}

interface MenuCategoryProps {
  title: string
  products: Product[]
  icon?: string
}

export default function MenuCategory({ title, products, icon = "🚀" }: MenuCategoryProps) {
  const { addToCart } = useCart()

  const handleAddToCart = (product: Product) => {
    addToCart({
      id: product.id,
      name: product.name,
      price: product.price,
      quantity: 1,
      image: product.image_url,
    })
  }

  if (products.length === 0) {
    return null
  }

  return (
    <div className="mb-12">
      <div className="flex items-center justify-center mb-8">
        <div className="flex items-center gap-3 bg-black/50 backdrop-blur-sm border border-purple-800 rounded-full px-6 py-3">
          <span className="text-2xl">{icon}</span>
          <h2 className="text-2xl md:text-3xl font-bold text-white">{title}</h2>
          <Flame className="text-orange-400 w-6 h-6" />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {products.map((product) => (
          <Card
            key={product.id}
            className="bg-black/50 border-purple-800 backdrop-blur-sm hover:bg-black/60 transition-all duration-300 group overflow-hidden"
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
                  <div className="w-full h-full bg-gradient-to-br from-purple-900 via-pink-900 to-orange-900 flex items-center justify-center">
                    <span className="text-6xl">{icon}</span>
                  </div>
                )}

                {/* Badges */}
                <div className="absolute top-2 left-2 flex flex-col gap-1">
                  {product.is_featured && (
                    <Badge className="bg-yellow-500 text-black text-xs">
                      <Star className="w-3 h-3 mr-1" />
                      Destacado
                    </Badge>
                  )}
                  {product.stock_quantity === 0 && (
                    <Badge variant="destructive" className="text-xs">
                      Agotado
                    </Badge>
                  )}
                </div>

                {/* Cosmic overlay effect */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              </div>

              <CardTitle className="text-white group-hover:text-purple-300 transition-colors text-lg leading-tight">
                {product.name}
              </CardTitle>
            </CardHeader>

            <CardContent className="space-y-4">
              <p className="text-gray-300 text-sm line-clamp-2 leading-relaxed">{product.description}</p>

              <div className="flex items-center justify-between">
                <div className="flex flex-col">
                  <span className="text-2xl font-bold bg-gradient-to-r from-orange-400 to-pink-400 bg-clip-text text-transparent">
                    ${product.price.toFixed(2)}
                  </span>
                  {product.stock_quantity !== undefined &&
                    product.stock_quantity > 0 &&
                    product.stock_quantity <= 5 && (
                      <span className="text-xs text-orange-400">¡Solo {product.stock_quantity} disponibles!</span>
                    )}
                </div>

                <Button
                  onClick={() => handleAddToCart(product)}
                  className="bg-gradient-to-r from-colibri-green to-colibri-wine hover:from-colibri-green/90 hover:to-colibri-wine/90 text-white shadow-lg hover:shadow-colibri-wine/50 transition-all duration-300"
                  disabled={product.stock_quantity === 0}
                  size="sm"
                >
                  <Rocket className="w-4 h-4 mr-2" />
                  {product.stock_quantity === 0 ? "Agotado" : "Agregar"}
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
