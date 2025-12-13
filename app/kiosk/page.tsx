'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useCart } from '@/hooks/use-cart'
import { useToast } from '@/hooks/use-notifications'
import { ProductModifierModal } from '@/components/ProductModifierModal'
import { WelcomeBubblyPanel } from '@/components/kiosk/WelcomeBubblyPanel'
import { FloatingCartButton } from '@/components/kiosk/FloatingCartButton'
import { FloatingCartKiosk } from '@/components/kiosk/FloatingCartKiosk'
import { FlyingImageManager } from '@/components/animations/FlyingProductImage'
import { ShoppingCart, ArrowLeft } from 'lucide-react'
import Image from 'next/image'

export default function KioskPage() {
  const router = useRouter()
  const { items, addItem, total, updateQuantity, removeItem, clearCart, createOrder } = useCart()
  const toast = useToast()
  
  const [products, setProducts] = useState<any[]>([])
  const [categories, setCategories] = useState<any[]>([])
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [loading, setLoading] = useState(true)
  const [selectedProduct, setSelectedProduct] = useState<any>(null)
  const [showModifierModal, setShowModifierModal] = useState(false)
  const [kioskSettings, setKioskSettings] = useState<any>({})
  const [isCartOpen, setIsCartOpen] = useState(false)
  const [flyingItems, setFlyingItems] = useState<any[]>([])
  const cartButtonRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    loadData()
    loadKioskSettings()
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

  const loadKioskSettings = async () => {
    try {
      const response = await fetch('/api/kiosk/settings')
      const data = await response.json()
      if (data.success) {
        setKioskSettings(data.settings)
        
        // Aplicar fullscreen si está habilitado
        if (data.settings.kiosk_fullscreen) {
          document.documentElement.requestFullscreen?.()
        }
      }
    } catch (error) {
      console.error('Error loading kiosk settings:', error)
    }
  }

  const loadData = async () => {
    try {
      setLoading(true)
      const [productsRes, categoriesRes] = await Promise.all([
        fetch('/api/products-mysql?available=true'),
        fetch('/api/categories')
      ])

      const productsData = await productsRes.json()
      const categoriesData = await categoriesRes.json()

      setProducts(productsData.products || [])
      setCategories(categoriesData.categories || [])
    } catch (error) {
      console.error('Error loading data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleProductClick = async (product: any, event: React.MouseEvent<HTMLButtonElement>) => {
    // Verificar si tiene modificadores
    if (product.has_modifiers) {
      setSelectedProduct(product)
      setShowModifierModal(true)
    } else {
      // Agregar directo al carrito
      addItem({
        id: product.id,
        name: product.name,
        price: parseFloat(product.price),
        image_url: product.image_url || '/placeholder.svg',
        category_name: product.category || 'General'
      }, 1)
      
      // Animación de imagen voladora - usar el card parent en lugar del botón
      const buttonElement = event?.currentTarget
      if (!buttonElement) return
      
      const cardElement = buttonElement.closest('.product-card') as HTMLElement
      
      setFlyingItems(prev => [...prev, {
        id: `${product.id}-${Date.now()}`,
        imageSrc: product.image_url || '/placeholder.svg',
        productName: product.name,
        fromElement: cardElement || buttonElement
      }])
    }
  }

  const handleAddWithModifiers = (product: any, modifiers: any[], totalPrice: number) => {
    addItem({
      id: product.id,
      name: product.name,
      price: totalPrice,
      image_url: product.image_url || '/placeholder.svg',
      category_name: product.category || 'General',
      modifiers: modifiers
    }, 1)
    
    setShowModifierModal(false)
  }

  const handleCheckout = async (customerName: string, notes: string, paymentMethod: 'efectivo' | 'tarjeta') => {
    try {
      const orderData = {
        customer_info: {
          name: customerName,
          deliveryType: 'pickup'
        },
        notes: notes,
        payment_method: paymentMethod,
        order_type: 'kiosk',
        status: 'pending'
      }

      const result = await createOrder(orderData)
      
      if (result.success) {
        toast.success('¡Pedido realizado!', 'Tu pedido ha sido confirmado')
        setIsCartOpen(false)
        clearCart()
      } else {
        toast.error('Error', result.message || 'No se pudo crear el pedido')
      }
    } catch (error) {
      console.error('Error al crear pedido:', error)
      toast.error('Error', 'Ocurrió un error al procesar tu pedido')
    }
  }

  const filteredProducts = selectedCategory === 'all' 
    ? products 
    : products.filter(p => p.category_id?.toString() === selectedCategory)

  // Calcular counts por categoría
  const categoriesWithCount = categories.map(cat => ({
    ...cat,
    productCount: products.filter(p => p.category_id === cat.id).length
  }))

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-colibri-green to-slate-950 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-colibri-gold mx-auto mb-4"></div>
          <p className="text-white text-xl">Cargando menú...</p>
        </div>
      </div>
    )
  }

  // Si está en "all", mostrar pantalla de bienvenida
  if (selectedCategory === 'all') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-colibri-green to-slate-950 flex items-center justify-center">
        <WelcomeBubblyPanel
          selectedCategory={selectedCategory}
          onCategoryChange={setSelectedCategory}
          categories={categoriesWithCount}
        />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-colibri-green to-slate-950">
      <ProductModifierModal
        isOpen={showModifierModal}
        onClose={() => setShowModifierModal(false)}
        product={selectedProduct}
        onAddToCart={handleAddWithModifiers}
      />

      {/* Header para vista de productos */}
      <header className="bg-gradient-to-r from-colibri-green/50 to-slate-900/50 backdrop-blur-xl border-b border-colibri-gold/30 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setSelectedCategory('all')}
                className="text-colibri-gold hover:text-colibri-beige hover:bg-colibri-green/20"
              >
                <ArrowLeft className="h-6 w-6" />
              </Button>
              <div>
                <h1 className="text-2xl font-bold text-white flex items-center gap-2">
                  {selectedCategory !== 'all' 
                    ? categories.find(c => c.id.toString() === selectedCategory)?.name || 'Productos'
                    : 'Todos los Productos'
                  }
                </h1>
                <p className="text-colibri-gold text-sm">Selecciona tus productos</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Categories */}
      <div className="max-w-7xl mx-auto py-6">
        <div className="flex gap-3 overflow-x-auto pb-4 px-4 scrollbar-hide scroll-smooth snap-x snap-mandatory">
          {categories.map(category => (
            <Button
              key={category.id}
              onClick={() => setSelectedCategory(category.id.toString())}
              variant={selectedCategory === category.id.toString() ? 'default' : 'outline'}
              className={`flex-shrink-0 whitespace-nowrap snap-start px-6 ${selectedCategory === category.id.toString()
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
      <div className="max-w-7xl mx-auto px-4 pb-12">
        {filteredProducts.length === 0 ? (
          <Card className="relative overflow-hidden rounded-3xl border border-white/10 bg-white/5 backdrop-blur-2xl shadow-[0_20px_45px_-20px_rgba(31,79,55,0.55)]">
            <span className="pointer-events-none absolute inset-0 bg-gradient-to-br from-colibri-green/20 via-transparent to-colibri-gold/20 opacity-70" />
            <CardContent className="relative z-10 p-12 pt-12 text-center">
              <div className="text-6xl mb-4">🍽️</div>
              <h3 className="text-xl font-semibold text-white mb-2">
                No hay productos disponibles
              </h3>
              <p className="text-gray-400">
                Selecciona otra categoría o vuelve más tarde
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {filteredProducts.map(product => (
              <Card
                key={product.id}
                className="product-card group relative overflow-hidden rounded-3xl border border-white/10 bg-white/5 backdrop-blur-2xl shadow-[0_20px_45px_-20px_rgba(31,79,55,0.55)] transition-all duration-300 hover:-translate-y-1 hover:border-colibri-gold/60 hover:shadow-colibri-green/40"
              >
                <span className="pointer-events-none absolute inset-0 bg-gradient-to-br from-colibri-green/15 via-transparent to-colibri-gold/10 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />

                <div className="relative h-48 overflow-hidden">
                  <Image
                    src={product.image_url || '/placeholder.svg'}
                    alt={product.name}
                    fill
                    className="object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-b from-transparent via-slate-950/30 to-slate-950/70" />
                  {product.has_modifiers && (
                    <Badge className="absolute top-3 right-3 z-10 bg-colibri-green/90 backdrop-blur-sm text-white shadow-lg shadow-colibri-gold/40">
                      🎛️ Personalizable
                    </Badge>
                  )}
                  {product.is_featured && (
                    <Badge className="absolute top-3 left-3 z-10 bg-gradient-to-r from-colibri-wine/90 to-colibri-green/90 backdrop-blur-sm text-white shadow-lg shadow-colibri-wine/40">
                      ⭐ Destacado
                    </Badge>
                  )}
                </div>
                <CardContent className="relative z-10 p-5 pt-6">
                  <h3 className="text-lg font-semibold text-white mb-2 line-clamp-2">
                    {product.name}
                  </h3>
                  {product.description && (
                    <p className="text-gray-300/90 text-sm mb-4 line-clamp-2">
                      {product.description}
                    </p>
                  )}
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-colibri-gold via-colibri-beige to-colibri-gold">
                      ${Number(product.price).toFixed(2)}
                    </span>
                    <Button
                      onClick={(event) => {
                        event.stopPropagation()
                        handleProductClick(product, event)
                      }}
                      className="flex items-center gap-2 rounded-full bg-gradient-to-r from-colibri-green to-colibri-wine px-5 py-2 text-white shadow-lg shadow-colibri-green/30 transition-transform duration-300 hover:from-colibri-green/90 hover:to-colibri-wine/90 hover:scale-105"
                    >
                      <ShoppingCart className="h-4 w-4" />
                      Agregar
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Flying Image Animation */}
      <FlyingImageManager 
        items={flyingItems} 
        cartButtonRef={cartButtonRef as any} 
      />

      {/* Floating Cart Button */}
      <div ref={cartButtonRef as any}>
        <FloatingCartButton 
          cartCount={items.reduce((sum, item) => sum + item.quantity, 0)}
          onCartClick={() => setIsCartOpen(true)}
        />
      </div>

      {/* Floating Cart Modal */}
      <FloatingCartKiosk
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        items={items}
        onUpdateQuantity={updateQuantity}
        onRemoveItem={removeItem}
        onClearCart={clearCart}
        onCheckout={handleCheckout}
      />
    </div>
  )
}
