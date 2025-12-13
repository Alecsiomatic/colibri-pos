'use client'

import { useState, useEffect } from "react"
import Image from "next/image"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { useCart } from "@/hooks/use-cart"
import { useToast } from "@/hooks/use-notifications"
import { Plus } from "lucide-react"
import { ProductModifierModal } from "@/components/ProductModifierModal"

// Componente para productos destacados
function FeaturedProducts({ products }: { products: any[] }) {
  const { addItem } = useCart()
  const toast = useToast()
  const [selectedProduct, setSelectedProduct] = useState<any>(null)
  const [showModifierModal, setShowModifierModal] = useState(false)

  const handleProductClick = async (product: any, event: React.MouseEvent) => {
    // Verificar si el producto tiene modificadores
    try {
      const response = await fetch(`/api/modifiers/product/${product.id}`)
      const data = await response.json()
      
      if (data.success && data.groups && data.groups.length > 0) {
        // Tiene modificadores, abrir modal
        setSelectedProduct(product)
        setShowModifierModal(true)
      } else {
        // No tiene modificadores, agregar directo
        handleAddToCart(product, event)
      }
    } catch (error) {
      console.error('Error checking modifiers:', error)
      // En caso de error, agregar directo
      handleAddToCart(product, event)
    }
  }

  const handleAddToCart = (product: any, event: React.MouseEvent) => {
    addItem({
      id: product.id,
      name: product.name,
      price: Number(product.price),
      image: product.image_url || '/placeholder.svg',
      category: product.category || 'Destacados'
    })
    
    toast.success('¡Agregado!', `${product.name} agregado al carrito`)
    
    // Animación de imagen volando al carrito
    try {
      const button = event.currentTarget as HTMLElement
      const productCard = button.closest('.product-card') as HTMLElement
      const productImage = productCard?.querySelector('img')
      
      if (productImage) {
        const clone = productImage.cloneNode(true) as HTMLElement
        const rect = productImage.getBoundingClientRect()
        
        clone.style.position = 'fixed'
        clone.style.top = rect.top + 'px'
        clone.style.left = rect.left + 'px'
        clone.style.width = rect.width + 'px'
        clone.style.height = rect.height + 'px'
        clone.style.zIndex = '9999'
        clone.style.pointerEvents = 'none'
        clone.style.transition = 'all 0.8s cubic-bezier(0.25, 0.46, 0.45, 0.94)'
        clone.style.borderRadius = '50%'
        
        document.body.appendChild(clone)
        
        // Buscar el floating cart
        const floatingCart = document.querySelector('[data-floating-cart]') as HTMLElement
        
        setTimeout(() => {
          if (floatingCart) {
            const cartRect = floatingCart.getBoundingClientRect()
            clone.style.top = cartRect.top + cartRect.height/2 - 10 + 'px'
            clone.style.left = cartRect.left + cartRect.width/2 - 10 + 'px'
            clone.style.width = '20px'
            clone.style.height = '20px'
            clone.style.opacity = '0'
          }
          
          setTimeout(() => {
            document.body.removeChild(clone)
          }, 800)
        }, 50)
      }
    } catch (error) {
      // Error en animación, pero el producto ya se agregó
      console.error('Error en animación:', error)
    }
  }

  const handleAddWithModifiers = (product: any, modifiers: any[], totalPrice: number) => {
    addItem({
      ...product,
      price: totalPrice,
      modifiers: modifiers
    }, 1)
    
    toast.success('¡Agregado!', `${product.name} personalizado agregado`)
    setShowModifierModal(false)
  }

  if (products.length === 0) {
    return (
      <div className="col-span-full text-center py-12">
        <h3 className="text-xl font-semibold mb-4 text-white">¡Próximamente!</h3>
        <p className="text-gray-400 mb-6">Estamos preparando nuestras mejores hamburguesas galácticas para ti.</p>
        <Link href="/menu">
          <Button className="bg-colibri-green hover:bg-colibri-green/90">Ver Menú Completo</Button>
        </Link>
      </div>
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
      
      {products.map((product) => (
        <Card key={product.id} className="product-card overflow-hidden bg-colibri-green/20 border-colibri-gold hover:border-colibri-wine transition-all">
          <div className="relative h-56">
            <Image
              src={product.image_url || '/placeholder.svg'}
              alt={product.name}
              fill
              className="object-cover"
            />
          </div>
          <CardContent className="p-6">
            <h3 className="text-xl font-bold mb-2 text-white">{product.name}</h3>
            <p className="text-gray-400 text-sm mb-4 line-clamp-2">{product.description}</p>
            <div className="flex items-center justify-between">
              <span className="text-2xl font-bold text-colibri-gold">${Number(product.price).toFixed(2)}</span>
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  size="sm"
                  asChild 
                  className="border-colibri-gold text-colibri-gold hover:bg-colibri-green hover:text-white"
                >
                  <Link href="/menu">Ver Menú</Link>
                </Button>
                <Button 
                  onClick={(e) => handleProductClick(product, e)}
                  className="bg-colibri-green hover:bg-colibri-green/90 text-white flex items-center gap-2"
                >
                  <Plus className="h-4 w-4" />
                  Agregar
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </>
  )
}

// Componente wrapper que obtiene productos destacados en el cliente
function FeaturedProductsWrapper() {
  const [products, setProducts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  useEffect(() => {
    async function fetchProducts() {
      try {
        setLoading(true)
        const response = await fetch('/api/products-mysql?featured=true&available=true')
        
        if (!response.ok) {
          throw new Error('Error al cargar productos')
        }
        
        const data = await response.json()
        setProducts(data.products || [])
        setError(false)
      } catch (error) {
        console.error('Error al cargar productos destacados:', error)
        setError(true)
        setProducts([])
      } finally {
        setLoading(false)
      }
    }

    fetchProducts()
  }, [])

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <Card key={i} className="overflow-hidden bg-colibri-green/20 border-colibri-gold">
            <div className="h-56 bg-colibri-green/30 animate-pulse"></div>
            <CardContent className="p-6">
              <div className="h-4 bg-colibri-green/30 rounded mb-2 animate-pulse"></div>
              <div className="h-3 bg-colibri-green/30 rounded mb-4 animate-pulse"></div>
              <div className="h-10 bg-colibri-green/30 rounded animate-pulse"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  if (error || products.length === 0) {
    return (
      <div className="col-span-full text-center py-12">
        <h3 className="text-xl font-semibold mb-4 text-white">¡Próximamente!</h3>
        <p className="text-gray-400 mb-6">Estamos preparando nuestras mejores hamburguesas galácticas para ti.</p>
        <Link href="/menu">
          <Button className="bg-colibri-green hover:bg-colibri-green/90">Ver Menú Completo</Button>
        </Link>
      </div>
    )
  }

  return <FeaturedProducts products={products} />
}

export default function HomePageClient() {
  return (
    <main className="flex min-h-screen flex-col">
      {/* Hero Section */}
      <section className="relative min-h-[70vh] w-full flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-black/50 to-black" />

        <div className="relative z-10 container mx-auto px-4 py-20 flex flex-col lg:flex-row items-center justify-between gap-12">
          <div className="flex-1 text-center lg:text-left">
            <Image
              src="/supernova-logo.png"
              alt="Supernova Burgers & Wings"
              width={200}
              height={200}
              className="mx-auto lg:mx-0 mb-8 animate-pulse-neon"
            />
            <h1 className="text-5xl md:text-7xl font-bold text-white mb-6">
              <span className="bg-gradient-to-r from-colibri-gold via-colibri-wine to-colibri-green bg-clip-text text-transparent">
                Supernova
              </span>
              <br />
              <span className="text-3xl md:text-5xl">Burgers & Wings</span>
            </h1>
            <p className="text-xl md:text-2xl text-gray-300 mb-8 text-neon">Sabores que están fuera de este mundo</p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
              <Button
                asChild
                size="lg"
                className="bg-gradient-to-r from-colibri-green to-colibri-wine hover:from-colibri-green/90 hover:to-colibri-wine/90 text-white neon-glow"
              >
                <Link href="/menu">Ver Menú</Link>
              </Button>
              <Button
                asChild
                size="lg"
                variant="outline"
                className="border-colibri-gold text-colibri-gold hover:bg-colibri-green/20"
              >
                <Link href="/checkout">Ordenar Ahora</Link>
              </Button>
            </div>
          </div>

          <div className="flex-1 relative">
            <Image
              src="/neon-burger.png"
              alt="Hamburguesa Supernova"
              width={600}
              height={600}
              className="w-full max-w-lg mx-auto animate-float"
              priority
            />
          </div>
        </div>
      </section>

      {/* Featured Products */}
      <section className="py-20 px-4 bg-gradient-to-b from-black to-colibri-green/20">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4 bg-gradient-to-r from-colibri-gold to-colibri-wine bg-clip-text text-transparent">
              Nuestras Creaciones Estelares
            </h2>
            <div className="w-24 h-1 bg-gradient-to-r from-colibri-green to-colibri-wine mx-auto mb-6"></div>
            <p className="text-lg text-gray-400 max-w-2xl mx-auto">
              Descubre nuestras hamburguesas y alitas con sabores de otro planeta. Haz clic en las imágenes para
              explorar.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 auto-rows-fr">
            <FeaturedProductsWrapper />
          </div>

          <div className="text-center mt-16">
            <Button
              asChild
              size="lg"
              className="bg-gradient-to-r from-colibri-green to-colibri-wine hover:from-colibri-green/90 hover:to-colibri-wine/90 neon-glow"
            >
              <Link href="/menu">Ver Todo el Menú</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Experiencia Section */}
      <section className="py-16 px-4 bg-black/50 backdrop-blur">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-bold mb-4 bg-gradient-to-r from-colibri-gold to-colibri-wine bg-clip-text text-transparent">
            Experiencia Supernova
          </h2>
          <div className="w-24 h-1 bg-gradient-to-r from-colibri-gold to-colibri-wine mx-auto mb-8"></div>
          <p className="text-lg mb-8 text-gray-300">
            Descubre por qué nuestras hamburguesas y alitas son las más solicitadas de la galaxia. Ingredientes premium,
            sabores únicos y una experiencia fuera de este mundo.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-sm text-gray-400">
            <div className="flex flex-col items-center">
              <div className="w-16 h-16 bg-gradient-to-br from-colibri-green to-colibri-wine rounded-full flex items-center justify-center mb-3 neon-glow">
                <span className="text-2xl">🍔</span>
              </div>
              <p>Hamburguesas artesanales con blend especial</p>
            </div>
            <div className="flex flex-col items-center">
              <div className="w-16 h-16 bg-gradient-to-br from-colibri-wine to-colibri-gold rounded-full flex items-center justify-center mb-3 neon-glow">
                <span className="text-2xl">🔥</span>
              </div>
              <p>Alitas con salsas exclusivas de la casa</p>
            </div>
            <div className="flex flex-col items-center">
              <div className="w-16 h-16 bg-gradient-to-br from-colibri-gold to-colibri-green rounded-full flex items-center justify-center mb-3 neon-glow">
                <span className="text-2xl">🚀</span>
              </div>
              <p>Entrega rápida a velocidad luz</p>
            </div>
          </div>
        </div>
      </section>
    </main>
  )
}