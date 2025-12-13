'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ProductModifierModal } from '@/components/ProductModifierModal'
import { useToast } from '@/hooks/use-notifications'
import {
  ShoppingCart,
  Check,
  Clock,
  AlertCircle,
  Sparkles,
  QrCode
} from 'lucide-react'
import Image from 'next/image'

export default function QROrderPage() {
  const params = useParams()
  const router = useRouter()
  const toast = useToast()
  const token = params.token as string

  const [table, setTable] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [validating, setValidating] = useState(true)
  const [products, setProducts] = useState<any[]>([])
  const [categories, setCategories] = useState<any[]>([])
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [cart, setCart] = useState<any[]>([])
  const [customerName, setCustomerName] = useState('')
  const [customerPhone, setCustomerPhone] = useState('')
  const [notes, setNotes] = useState('')
  const [selectedProduct, setSelectedProduct] = useState<any>(null)
  const [showModifierModal, setShowModifierModal] = useState(false)
  const [orderSubmitted, setOrderSubmitted] = useState(false)

  useEffect(() => {
    validateQRAndLoadData()
  }, [token])

  const validateQRAndLoadData = async () => {
    try {
      setValidating(true)
      
      // Validar token QR
      const qrResponse = await fetch(`/api/qr-tables/${token}`)
      const qrData = await qrResponse.json()

      if (!qrData.success) {
        toast.error('QR Inválido', qrData.message)
        return
      }

      setTable(qrData.table)

      // Cargar productos y categorías
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
      toast.error('Error', 'No se pudo cargar el menú')
    } finally {
      setValidating(false)
      setLoading(false)
    }
  }

  const addToCart = (product: any, modifiers?: any[]) => {
    const price = modifiers
      ? parseFloat(product.price) + modifiers.reduce((sum, m) => sum + m.price, 0)
      : parseFloat(product.price)

    setCart(prev => [...prev, {
      ...product,
      modifiers,
      price,
      quantity: 1,
      cartId: Date.now()
    }])

    toast.success('¡Agregado!', product.name)
  }

  const removeFromCart = (cartId: number) => {
    setCart(prev => prev.filter(item => item.cartId !== cartId))
  }

  const calculateTotal = () => {
    return cart.reduce((sum, item) => sum + (item.price * item.quantity), 0)
  }

  const handleSubmitOrder = async () => {
    if (cart.length === 0) {
      toast.error('Error', 'El carrito está vacío')
      return
    }

    if (!customerName.trim()) {
      toast.error('Error', 'Por favor ingresa tu nombre')
      return
    }

    try {
      const response = await fetch('/api/orders-mysql', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customer_name: customerName,
          customer_phone: customerPhone,
          table_number: table.table_name,
          items: cart.map(item => ({
            id: item.id,
            name: item.name,
            price: item.price,
            quantity: item.quantity,
            modifiers: item.modifiers
          })),
          total: calculateTotal(),
          notes: notes,
          order_source: 'qr',
          status: 'pending',
          qr_token: token
        })
      })

      const data = await response.json()
      if (data.success) {
        toast.success('¡Pedido Enviado!', 'Pronto estará listo')
        setOrderSubmitted(true)
      }
    } catch (error: any) {
      toast.error('Error', error.message || 'No se pudo enviar el pedido')
    }
  }

  const filteredProducts = selectedCategory === 'all'
    ? products
    : products.filter(p => p.category_id?.toString() === selectedCategory)

  if (validating) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-950 to-slate-950 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-purple-500 mx-auto mb-4"></div>
          <p className="text-white text-xl">Validando QR...</p>
        </div>
      </div>
    )
  }

  if (!table) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-950 to-slate-950 flex items-center justify-center p-4">
        <Card className="max-w-md w-full bg-gradient-to-br from-red-900/50 to-slate-900/50 border-red-700/50">
          <CardContent className="p-8 text-center">
            <AlertCircle className="h-16 w-16 text-red-400 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-white mb-2">QR Inválido</h2>
            <p className="text-gray-300">
              Este código QR no es válido o ha expirado
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (orderSubmitted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-950 to-slate-950 flex items-center justify-center p-4">
        <Card className="max-w-md w-full bg-gradient-to-br from-green-900/50 to-slate-900/50 border-green-700/50 backdrop-blur-xl">
          <CardContent className="p-8 text-center">
            <div className="mb-6">
              <div className="h-20 w-20 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4 animate-bounce">
                <Check className="h-12 w-12 text-white" />
              </div>
              <h2 className="text-3xl font-bold text-white mb-2">
                ¡Pedido Enviado!
              </h2>
              <p className="text-gray-300 mb-4">
                Tu pedido ha sido recibido y pronto estará listo
              </p>
              
              <div className="bg-slate-800/50 rounded-lg p-4 mb-6">
                <div className="flex items-center justify-between text-sm mb-2">
                  <span className="text-gray-400">Mesa:</span>
                  <span className="text-white font-bold">{table.table_name}</span>
                </div>
                <div className="flex items-center justify-between text-sm mb-2">
                  <span className="text-gray-400">Cliente:</span>
                  <span className="text-white">{customerName}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-400">Total:</span>
                  <span className="text-2xl font-bold text-green-400">
                    ${calculateTotal().toFixed(2)}
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-center gap-2 text-purple-400 text-sm">
                <Clock className="h-4 w-4" />
                <span>Tiempo estimado: 15-20 minutos</span>
              </div>
            </div>

            <Button
              onClick={() => {
                setOrderSubmitted(false)
                setCart([])
                setCustomerName('')
                setCustomerPhone('')
                setNotes('')
              }}
              className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
            >
              Hacer Otro Pedido
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-950 to-slate-950 flex items-center justify-center">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-purple-500"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-950 to-slate-950">
      {/* Header */}
      <header className="bg-gradient-to-r from-purple-900/50 to-slate-900/50 backdrop-blur-xl border-b border-purple-700/30 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <QrCode className="h-8 w-8 text-purple-400" />
              <div>
                <h1 className="text-2xl font-bold text-white flex items-center gap-2">
                  <Sparkles className="h-6 w-6" />
                  Supernova
                </h1>
                <p className="text-purple-300 text-sm">
                  Mesa: <span className="font-bold">{table.table_name}</span>
                </p>
              </div>
            </div>

            {cart.length > 0 && (
              <Badge className="bg-purple-600 text-white px-4 py-2 text-lg">
                {cart.length} items
              </Badge>
            )}
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto p-4">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Products Section */}
          <div className="lg:col-span-2 space-y-4">
            {/* Info Banner */}
            <Card className="bg-gradient-to-r from-purple-900/30 to-pink-900/30 border-purple-700/50">
              <CardContent className="p-4">
                <p className="text-white text-center">
                  🎯 Escanea el QR, elige tus productos y nosotros te los llevamos a la mesa
                </p>
              </CardContent>
            </Card>

            {/* Categories */}
            <div className="flex gap-2 overflow-x-auto pb-2">
              <Button
                size="sm"
                variant={selectedCategory === 'all' ? 'default' : 'outline'}
                onClick={() => setSelectedCategory('all')}
                className={selectedCategory === 'all' ? 'bg-purple-600' : 'border-purple-600 text-purple-400'}
              >
                Todos
              </Button>
              {categories.map(cat => (
                <Button
                  key={cat.id}
                  size="sm"
                  variant={selectedCategory === cat.id.toString() ? 'default' : 'outline'}
                  onClick={() => setSelectedCategory(cat.id.toString())}
                  className={selectedCategory === cat.id.toString() ? 'bg-purple-600' : 'border-purple-600 text-purple-400'}
                >
                  {cat.name}
                </Button>
              ))}
            </div>

            {/* Products Grid */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {filteredProducts.map(product => (
                <Card
                  key={product.id}
                  onClick={() => {
                    if (product.has_modifiers) {
                      setSelectedProduct(product)
                      setShowModifierModal(true)
                    } else {
                      addToCart(product)
                    }
                  }}
                  className="cursor-pointer overflow-hidden bg-gradient-to-br from-purple-900/40 to-slate-900/40 border-purple-800/50 hover:border-purple-600 transition-all hover:scale-105"
                >
                  <div className="relative h-32">
                    <Image
                      src={product.image_url || '/placeholder.svg'}
                      alt={product.name}
                      fill
                      className="object-cover"
                    />
                    {product.has_modifiers && (
                      <Badge className="absolute top-2 right-2 bg-purple-600 text-xs">
                        🎛️
                      </Badge>
                    )}
                  </div>
                  <CardContent className="p-3">
                    <h4 className="text-sm font-bold text-white mb-1 line-clamp-2">
                      {product.name}
                    </h4>
                    <p className="text-purple-400 font-bold">
                      ${parseFloat(product.price).toFixed(2)}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Order Summary */}
          <div className="space-y-4">
            <Card className="bg-gradient-to-br from-purple-900/50 to-slate-900/50 border-purple-700/50 backdrop-blur-xl sticky top-24">
              <CardContent className="p-4 space-y-4">
                <h3 className="text-xl font-bold text-white flex items-center gap-2">
                  <ShoppingCart className="h-5 w-5" />
                  Tu Pedido
                </h3>

                {/* Customer Info */}
                <div className="space-y-3">
                  <div>
                    <Label className="text-gray-300 text-sm">Tu Nombre *</Label>
                    <Input
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      placeholder="¿Cómo te llamas?"
                      className="bg-slate-800 border-purple-700 text-white"
                    />
                  </div>

                  <div>
                    <Label className="text-gray-300 text-sm">Teléfono (opcional)</Label>
                    <Input
                      value={customerPhone}
                      onChange={(e) => setCustomerPhone(e.target.value)}
                      placeholder="Tu número"
                      className="bg-slate-800 border-purple-700 text-white"
                    />
                  </div>
                </div>

                {/* Cart Items */}
                <div className="max-h-64 overflow-y-auto space-y-2">
                  {cart.length === 0 ? (
                    <p className="text-center text-gray-400 py-4 text-sm">
                      Tu carrito está vacío
                    </p>
                  ) : (
                    cart.map(item => (
                      <div
                        key={item.cartId}
                        className="flex items-start justify-between p-2 bg-slate-800/50 rounded text-sm"
                      >
                        <div className="flex-1 mr-2">
                          <p className="text-white font-medium">{item.name}</p>
                          {item.modifiers && (
                            <p className="text-xs text-gray-400">
                              {item.modifiers.map((m: any) => m.modifier).join(', ')}
                            </p>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-purple-400 font-bold whitespace-nowrap">
                            ${(item.price * item.quantity).toFixed(2)}
                          </span>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => removeFromCart(item.cartId)}
                            className="h-6 w-6 p-0 text-red-400 hover:text-red-300"
                          >
                            ×
                          </Button>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                {/* Notes */}
                <div>
                  <Label className="text-gray-300 text-sm">Notas especiales</Label>
                  <Input
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Ej: sin cebolla"
                    className="bg-slate-800 border-purple-700 text-white"
                  />
                </div>

                {/* Total */}
                <div className="border-t border-purple-700/30 pt-3">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-gray-300">Total:</span>
                    <span className="text-2xl font-bold text-purple-400">
                      ${calculateTotal().toFixed(2)}
                    </span>
                  </div>

                  <Button
                    onClick={handleSubmitOrder}
                    disabled={cart.length === 0 || !customerName.trim()}
                    className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white py-6 text-lg disabled:opacity-50"
                  >
                    Enviar Pedido
                  </Button>

                  <p className="text-xs text-gray-400 text-center mt-2">
                    Tu pedido se enviará a la cocina
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      <ProductModifierModal
        isOpen={showModifierModal}
        onClose={() => {
          setShowModifierModal(false)
          setSelectedProduct(null)
        }}
        product={selectedProduct}
        onAddToCart={(product, modifiers, totalPrice) => {
          addToCart(product, modifiers)
        }}
      />
    </div>
  )
}
