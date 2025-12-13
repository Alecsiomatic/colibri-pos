"use client"

import { useState, useEffect, useRef } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ArrowLeft, ShoppingCart } from "lucide-react"
import { useCart } from "@/hooks/use-cart"
import { useToast } from "@/hooks/use-notifications"
import { ProductModifierModal } from "@/components/ProductModifierModal"
import { WelcomeBubblyPanel } from "@/components/kiosk/WelcomeBubblyPanel"
import { FlyingImageManager } from "@/components/animations/FlyingProductImage"
import Image from "next/image"

export default function MenuPageClient() {
  const { addItem } = useCart()
  const toast = useToast()
  
  const [products, setProducts] = useState<any[]>([])
  const [categories, setCategories] = useState<any[]>([])
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [loading, setLoading] = useState(true)
  const [selectedProduct, setSelectedProduct] = useState<any>(null)
  const [showModifierModal, setShowModifierModal] = useState(false)
  const [flyingItems, setFlyingItems] = useState<any[]>([])
  const productRefs = useRef<Map<number, HTMLElement>>(new Map())

  useEffect(() => {
    loadData()
  }, [])

  // Limpiar flyingItems después de que se agreguen a la animación
  useEffect(() => {
    if (flyingItems.length > 0) {
      const timer = setTimeout(() => {
        setFlyingItems([])
      }, 100)
      return () => clearTimeout(timer)
    }
  }, [flyingItems])

  const loadData = async () => {
    try {
      const [productsRes, categoriesRes] = await Promise.all([
        fetch('/api/products-mysql'),
        fetch('/api/categories')
      ])
      
      const productsData = await productsRes.json()
      const categoriesData = await categoriesRes.json()
      
      if (productsData.success) {
        setProducts(productsData.products.filter((p: any) => p.available))
      }
      
      if (categoriesData.success) {
        setCategories(categoriesData.categories)
      }
    } catch (error) {
      console.error('Error loading data:', error)
      toast.error('Error', 'No se pudo cargar el menú')
    } finally {
      setLoading(false)
    }
  }

  const filteredProducts = selectedCategory === 'all' 
    ? products 
    : products.filter(p => p.category_id?.toString() === selectedCategory)

  const categoriesWithCount = categories.map(cat => ({
    ...cat,
    productCount: products.filter(p => p.category_id === cat.id).length
  }))

  const handleProductClick = async (product: any, event: React.MouseEvent<HTMLButtonElement>) => {
    // Trigger animation immediately
    const buttonElement = event?.currentTarget
    if (buttonElement) {
      const cardElement = productRefs.current.get(product.id) || buttonElement.closest('.product-card') as HTMLElement
      
      setFlyingItems(prev => [...prev, {
        id: `${product.id}-${Date.now()}`,
        imageSrc: product.image_url || '/placeholder.svg',
        productName: product.name,
        fromElement: cardElement || buttonElement
      }])
    }
    
    try {
      const response = await fetch(`/api/modifiers/product/${product.id}`)
      const data = await response.json()
      
      if (data.success && data.groups && data.groups.length > 0) {
        setSelectedProduct(product)
        setShowModifierModal(true)
      } else {
        addItem({
          id: product.id,
          name: product.name,
          price: product.price,
          image_url: product.image_url,
          category_name: product.category_name
        }, 1)
      }
    } catch (error) {
      console.error('Error checking modifiers:', error)
      addItem({
        id: product.id,
        name: product.name,
        price: product.price,
        image_url: product.image_url,
        category_name: product.category_name
      }, 1)
    }
  }

  const handleAddToCart = (product: any, event?: React.MouseEvent<HTMLButtonElement>) => {
    addItem({
      id: product.id,
      name: product.name,
      price: product.price,
      image_url: product.image_url,
      category_name: product.category_name
    }, 1)
  }

  const handleAddWithModifiers = (product: any, modifiers: any[], totalPrice: number) => {
    addItem({
      id: product.id,
      name: product.name,
      price: totalPrice,
      image_url: product.image_url,
      category_name: product.category_name,
      modifiers: modifiers
    }, 1)
    
    setShowModifierModal(false)
    
    // Trigger animation from modal close
    const cardElement = productRefs.current.get(product.id)
    if (cardElement) {
      setFlyingItems(prev => [...prev, {
        id: `${product.id}-${Date.now()}`,
        imageSrc: product.image_url || '/placeholder.svg',
        productName: product.name,
        fromElement: cardElement
      }])
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-colibri-green to-slate-950 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-colibri-gold mx-auto mb-4"></div>
          <p className="text-colibri-gold text-lg">Cargando menú...</p>
        </div>
      </div>
    )
  }

  // Pantalla de bienvenida con categorías
  if (selectedCategory === 'all') {
    return (
      <>
        <div className="min-h-screen bg-gradient-to-br from-slate-950 via-colibri-green to-slate-950 flex items-center justify-center">
          <WelcomeBubblyPanel
            selectedCategory={selectedCategory}
            onCategoryChange={setSelectedCategory}
            categories={categoriesWithCount}
          />
        </div>
        <FlyingImageManager items={flyingItems} />
      </>
    )
  }

  return (
    <>
      <ProductModifierModal
        isOpen={showModifierModal}
        onClose={() => setShowModifierModal(false)}
        product={selectedProduct}
        onAddToCart={handleAddWithModifiers}
      />

      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-colibri-green to-slate-950 p-6">
        {/* Header para vista de productos */}
        <header className="bg-gradient-to-r from-colibri-green/50 to-slate-900/50 backdrop-blur-xl border-b border-colibri-gold/30 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 py-3 sm:py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 sm:gap-4">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setSelectedCategory('all')}
                className="text-colibri-gold hover:text-colibri-beige hover:bg-colibri-green/20 h-8 w-8 sm:h-10 sm:w-10"
              >
                <ArrowLeft className="h-4 w-4 sm:h-6 sm:w-6" />
              </Button>
              <div>
                <h1 className="text-lg sm:text-2xl font-bold text-white flex items-center gap-2 line-clamp-1">
                  {selectedCategory !== 'all' 
                    ? categories.find(c => c.id.toString() === selectedCategory)?.name || 'Productos'
                    : 'Todos los Productos'
                  }
                </h1>
                <p className="text-colibri-gold text-xs sm:text-sm hidden sm:block">Selecciona tus productos</p>
              </div>
            </div>
          </div>
        </div>
      </header>

        {/* Categories */}
        <div className="max-w-7xl mx-auto px-3 sm:px-4 py-3 sm:py-6">
        <div className="flex gap-2 sm:gap-3 overflow-x-auto pb-3 sm:pb-4 scrollbar-hide snap-x snap-mandatory">
          {categories.map(category => (
            <Button
              key={category.id}
              onClick={() => setSelectedCategory(category.id.toString())}
              variant={selectedCategory === category.id.toString() ? 'default' : 'outline'}
              className={`whitespace-nowrap text-xs sm:text-sm px-3 sm:px-4 py-2 snap-start flex-shrink-0 ${
                selectedCategory === category.id.toString()
                  ? 'bg-colibri-green hover:bg-colibri-green/90 text-white shadow-lg shadow-colibri-gold/50'
                  : 'border-colibri-gold text-colibri-gold hover:bg-colibri-green/20'
              }`}
            >
              {category.name}
            </Button>
          ))}
        </div>
        </div>

        {/* Products Grid */}
        <div className="max-w-7xl mx-auto px-3 sm:px-4 pb-20 sm:pb-12">
        {filteredProducts.length === 0 ? (
          <Card className="relative overflow-hidden rounded-2xl sm:rounded-3xl border border-white/10 bg-white/5 backdrop-blur-2xl shadow-[0_20px_45px_-20px_rgba(31,79,55,0.55)]">
            <span className="pointer-events-none absolute inset-0 bg-gradient-to-br from-colibri-green/20 via-transparent to-colibri-gold/20 opacity-70" />
            <CardContent className="relative z-10 p-8 sm:p-12 text-center">
              <div className="text-4xl sm:text-6xl mb-3 sm:mb-4">🍽️</div>
              <h3 className="text-lg sm:text-xl font-semibold text-white mb-2">
                No hay productos disponibles
              </h3>
              <p className="text-sm sm:text-base text-gray-400">
                Selecciona otra categoría o vuelve más tarde
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-6">
            {filteredProducts.map(product => (
              <Card
                key={product.id}
                ref={(el) => {
                  if (el) productRefs.current.set(product.id, el)
                  else productRefs.current.delete(product.id)
                }}
                className="product-card group relative overflow-hidden rounded-2xl sm:rounded-3xl border border-white/10 bg-white/5 backdrop-blur-2xl shadow-[0_20px_45px_-20px_rgba(31,79,55,0.55)] transition-all duration-300 hover:-translate-y-1 hover:border-colibri-gold/60 hover:shadow-colibri-green/40"
              >
                <span className="pointer-events-none absolute inset-0 bg-gradient-to-br from-colibri-green/15 via-transparent to-colibri-gold/10 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />

                <div className="relative aspect-square overflow-hidden">
                  {product.image_url ? (
                    <Image
                      src={product.image_url}
                      alt={product.name}
                      fill
                      className="object-cover transition-transform duration-500 group-hover:scale-105"
                      sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, (max-width: 1024px) 25vw, 20vw"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-colibri-green to-colibri-wine/80 flex items-center justify-center">
                      <ShoppingCart className="h-12 w-12 sm:h-16 sm:w-16 text-white/40" />
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-b from-transparent via-slate-950/20 to-slate-950/70" />
                  {product.category_name && (
                    <Badge className="absolute top-1.5 right-1.5 sm:top-2 sm:right-2 z-10 bg-colibri-green/90 backdrop-blur-sm text-white shadow-lg shadow-colibri-gold/40 text-[10px] sm:text-xs px-1.5 py-0.5 sm:px-2">
                      {product.category_name}
                    </Badge>
                  )}
                </div>
                
                <CardContent className="relative z-10 p-2 sm:p-3 md:p-4">
                  <h3 className="text-xs sm:text-sm md:text-base font-semibold text-white mb-1 line-clamp-2 leading-tight">
                    {product.name}
                  </h3>
                  {product.description && (
                    <p className="text-[10px] sm:text-xs text-gray-300/80 mb-2 line-clamp-1 hidden sm:line-clamp-2">
                      {product.description}
                    </p>
                  )}
                  <div className="flex items-center justify-between gap-1.5 sm:gap-2 mt-auto">
                    <span className="text-base sm:text-lg md:text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-colibri-gold via-colibri-beige to-colibri-gold">
                      ${Number(product.price).toFixed(2)}
                    </span>
                    <Button
                      size="sm"
                      onClick={(event) => {
                        event.stopPropagation()
                        handleProductClick(product, event)
                      }}
                      className="rounded-full bg-gradient-to-r from-colibri-green to-colibri-wine px-2 sm:px-3 md:px-4 py-1.5 sm:py-2 text-white shadow-lg shadow-colibri-green/30 transition-transform duration-300 hover:from-colibri-green/90 hover:to-colibri-wine/90 hover:scale-105 h-7 sm:h-8 md:h-9 min-w-[28px] sm:min-w-[32px]"
                    >
                      <ShoppingCart className="h-3 w-3 sm:h-3.5 sm:w-3.5 md:h-4 md:w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
        </div>
      </div>

      <FlyingImageManager items={flyingItems} />
    </>
  )
}
