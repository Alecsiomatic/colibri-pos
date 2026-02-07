'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useToast } from '@/hooks/use-notifications'
import { ProductModifierModal } from '@/components/ProductModifierModal'
import {
  DollarSign,
  CreditCard,
  ShoppingCart,
  Clock,
  TrendingUp,
  LogOut,
  BarChart3,
  Search,
  Trash2,
  Plus,
  Minus,
  Globe,
  Store,
  Receipt
} from 'lucide-react'
import Image from 'next/image'

interface Product {
  id: number
  name: string
  price: string | number
  category_id?: number
  category?: string
  image_url?: string
  has_modifiers?: boolean
}

interface CartItem {
  id: number
  name: string
  price: number
  quantity: number
  cartId: number
  modifiers?: any[]
  image_url?: string
}

interface PendingOrder {
  id: number
  customer_name: string
  customer_email?: string
  total: number
  status: string
  created_at: string
  items: any[]
  payment_method?: string
  order_source?: string
}

interface ShiftStats {
  total_sales: number
  total_orders: number
  cash_sales: number
  card_sales: number
  average_ticket: number
}

export default function CajaPage() {
  const router = useRouter()
  const toast = useToast()
  const searchInputRef = useRef<HTMLInputElement>(null)
  
  const [currentShift, setCurrentShift] = useState<any>(null)
  const [cart, setCart] = useState<CartItem[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<any[]>([])
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [loading, setLoading] = useState(true)
  const [customerName, setCustomerName] = useState('')
  const [paymentMethod, setPaymentMethod] = useState<'efectivo' | 'tarjeta'>('efectivo')
  const [cashReceived, setCashReceived] = useState('')
  const [selectedProduct, setSelectedProduct] = useState<any>(null)
  const [showModifierModal, setShowModifierModal] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [pendingKioskoOrders, setPendingKioskoOrders] = useState<PendingOrder[]>([])
  const [pendingOnlineOrders, setPendingOnlineOrders] = useState<PendingOrder[]>([])
  const [shiftStats, setShiftStats] = useState<ShiftStats>({
    total_sales: 0,
    total_orders: 0,
    cash_sales: 0,
    card_sales: 0,
    average_ticket: 0
  })
  const [activeTab, setActiveTab] = useState('venta')

  useEffect(() => {
    checkShift()
    loadProducts()
    loadCategories()
    loadPendingOrders()
    
    const interval = setInterval(() => {
      loadPendingOrders()
    }, 30000)
    
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    if (currentShift) {
      loadShiftStats()
    }
  }, [currentShift])

  const checkShift = async () => {
    try {
      const response = await fetch('/api/shifts?status=open')
      const data = await response.json()
      
      if (data.success && data.shifts && data.shifts.length > 0) {
        setCurrentShift(data.shifts[0])
      }
    } catch (error) {
      console.error('Error checking shift:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadProducts = async () => {
    try {
      const response = await fetch('/api/products-mysql?available=true')
      const data = await response.json()
      setProducts(data.products || [])
    } catch (error) {
      console.error('Error loading products:', error)
    }
  }

  const loadCategories = async () => {
    try {
      const response = await fetch('/api/categories')
      const data = await response.json()
      setCategories(data.categories || [])
    } catch (error) {
      console.error('Error loading categories:', error)
    }
  }

  const getShiftType = () => {
    const hour = new Date().getHours()
    if (hour < 12) return 'morning'
    if (hour < 18) return 'afternoon'
    if (hour < 22) return 'evening'
    return 'night'
  }

  const handleOpenShift = async () => {
    const openingCash = prompt('¿Con cuánto efectivo abres caja?', '0')
    if (!openingCash) return

    try {
      const user = { id: 1, username: 'Cajero' }
      
      const response = await fetch('/api/shifts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: user.id,
          user_name: user.username,
          shift_type: getShiftType(),
          opening_cash: parseFloat(openingCash)
        })
      })

      const data = await response.json()
      if (data.success) {
        toast.success('¡Turno Abierto!', 'Puedes empezar a vender')
        checkShift()
      }
    } catch (error: any) {
      toast.error('Error', error.message)
    }
  }

  const loadPendingOrders = async () => {
    try {
      const response = await fetch('/api/orders-mysql?status=pending,paid')
      const data = await response.json()
      
      if (data.success && data.orders) {
        const kiosko = data.orders.filter((o: PendingOrder) => 
          o.order_source === 'kiosk' || o.customer_email === 'kiosk@supernova.com'
        )
        const online = data.orders.filter((o: PendingOrder) => 
          o.order_source !== 'kiosk' && o.customer_email !== 'kiosk@supernova.com'
        )
        
        setPendingKioskoOrders(kiosko)
        setPendingOnlineOrders(online)
      }
    } catch (error) {
      console.error('Error loading pending orders:', error)
    }
  }

  const loadShiftStats = async () => {
    if (!currentShift) return
    try {
      const response = await fetch(`/api/shifts/${currentShift.id}/stats`)
      const data = await response.json()
      
      if (data.success) {
        setShiftStats(data.stats)
      }
    } catch (error) {
      console.error('Error loading shift stats:', error)
    }
  }

  const addToCart = (product: Product, modifiers?: any[]) => {
    const price = modifiers 
      ? parseFloat(product.price.toString()) + modifiers.reduce((sum, m) => sum + (m.price || 0), 0)
      : parseFloat(product.price.toString())

    setCart(prev => [...prev, {
      id: product.id,
      name: product.name,
      price,
      quantity: 1,
      cartId: Date.now(),
      modifiers,
      image_url: product.image_url
    }])
    
    toast.success('Agregado', product.name)
  }

  const removeFromCart = (cartId: number) => {
    setCart(prev => prev.filter(item => item.cartId !== cartId))
  }

  const updateQuantity = (cartId: number, delta: number) => {
    setCart(prev => prev.map(item => {
      if (item.cartId === cartId) {
        const newQty = item.quantity + delta
        if (newQty <= 0) return item
        return { ...item, quantity: newQty }
      }
      return item
    }))
  }

  const calculateTotal = () => {
    return cart.reduce((sum, item) => sum + (item.price * item.quantity), 0)
  }

  const calculateChange = () => {
    const received = parseFloat(cashReceived) || 0
    const total = calculateTotal()
    return Math.max(0, received - total)
  }

  const handleCheckout = async () => {
    if (!currentShift) {
      toast.error('Error', 'Debes abrir un turno primero')
      return
    }

    if (cart.length === 0) {
      toast.error('Error', 'El carrito está vacío')
      return
    }

    if (paymentMethod === 'efectivo' && parseFloat(cashReceived) < calculateTotal()) {
      toast.error('Error', 'El efectivo recibido es insuficiente')
      return
    }

    try {
      const response = await fetch('/api/orders-mysql', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customer_name: customerName || 'Cliente Mostrador',
          items: cart.map(item => ({
            id: item.id,
            name: item.name,
            price: item.price,
            quantity: item.quantity,
            modifiers: item.modifiers
          })),
          total: calculateTotal(),
          payment_method: paymentMethod,
          cash_received: paymentMethod === 'efectivo' ? parseFloat(cashReceived) : null,
          change_given: paymentMethod === 'efectivo' ? calculateChange() : null,
          shift_id: currentShift.id,
          order_source: 'caja',
          status: 'confirmed'
        })
      })

      const data = await response.json()
      if (data.success) {
        const change = paymentMethod === 'efectivo' ? calculateChange() : 0
        toast.success(
          '¡Venta Exitosa!', 
          `Total: $${calculateTotal().toFixed(2)}${change > 0 ? ` | Cambio: $${change.toFixed(2)}` : ''}`
        )
        
        setCart([])
        setCustomerName('')
        setCashReceived('')
        
        loadShiftStats()
        loadPendingOrders()
        checkShift()
      }
    } catch (error: any) {
      toast.error('Error', error.message)
    }
  }

  const handleConfirmOrder = async (orderId: number) => {
    try {
      const response = await fetch(`/api/orders-mysql/${orderId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'confirmed' })
      })

      const data = await response.json()
      if (data.success) {
        toast.success('Pedido Confirmado', 'El pedido ha sido enviado a producción')
        loadPendingOrders()
        loadShiftStats()
      }
    } catch (error: any) {
      toast.error('Error', error.message)
    }
  }

  const handleCloseShift = () => {
    router.push(`/caja/cierre/${currentShift.id}`)
  }

  const filteredProducts = products.filter(p => {
    const matchesCategory = selectedCategory === 'all' || p.category_id?.toString() === selectedCategory
    const matchesSearch = !searchTerm || p.name.toLowerCase().includes(searchTerm.toLowerCase())
    return matchesCategory && matchesSearch
  })

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-950 to-slate-950 flex items-center justify-center">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-purple-500"></div>
      </div>
    )
  }

  if (!currentShift) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-950 to-slate-950 flex items-center justify-center p-4">
        <Card className="max-w-md w-full bg-gradient-to-br from-purple-900/50 to-slate-900/50 border-purple-700/50 backdrop-blur-xl">
          <CardHeader>
            <CardTitle className="text-2xl text-white text-center">
              💰 Punto de Venta
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-center text-gray-300 mb-6">
              <Clock className="h-16 w-16 mx-auto mb-4 text-purple-400" />
              <p className="text-lg">No hay turno activo</p>
              <p className="text-sm text-gray-400 mt-2">
                Abre un turno para comenzar a vender
              </p>
            </div>
            
            <Button
              onClick={handleOpenShift}
              className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white py-6 text-lg"
            >
              Abrir Turno
            </Button>
            
            <Button
              variant="outline"
              onClick={() => router.push('/admin/orders')}
              className="w-full border-purple-600 text-purple-400"
            >
              <BarChart3 className="mr-2 h-4 w-4" />
              Ver Pedidos
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-950 to-slate-950">
      <header className="bg-gradient-to-r from-purple-900/50 to-slate-900/50 backdrop-blur-xl border-b border-purple-700/30 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 py-3">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-white">💰 Caja - Supernova</h1>
              <p className="text-xs sm:text-sm text-purple-300">
                Turno: {currentShift.shift_type} | {currentShift.user_name}
              </p>
            </div>
            
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="bg-green-600/20 text-green-400 px-2 sm:px-3 py-1 text-xs sm:text-sm">
                <DollarSign className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                ${(shiftStats.total_sales || 0).toFixed(2)}
              </Badge>
              
              <Button
                variant="outline"
                size="sm"
                onClick={handleCloseShift}
                className="border-red-600 text-red-400 h-8 sm:h-9"
              >
                <LogOut className="h-3 w-3 sm:h-4 sm:w-4 sm:mr-2" />
                <span className="hidden sm:inline">Cerrar Turno</span>
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto p-3 sm:p-4">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList className="grid w-full grid-cols-4 bg-purple-900/30">
            <TabsTrigger value="venta" className="text-xs sm:text-sm">
              <ShoppingCart className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
              <span className="hidden sm:inline">Venta</span>
            </TabsTrigger>
            <TabsTrigger value="kiosko" className="text-xs sm:text-sm">
              <Store className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
              Kiosko
              {pendingKioskoOrders.length > 0 && (
                <Badge className="ml-1 sm:ml-2 bg-orange-600 text-white text-[10px] sm:text-xs h-4 sm:h-5 px-1 sm:px-1.5">
                  {pendingKioskoOrders.length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="online" className="text-xs sm:text-sm">
              <Globe className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
              Online
              {pendingOnlineOrders.length > 0 && (
                <Badge className="ml-1 sm:ml-2 bg-blue-600 text-white text-[10px] sm:text-xs h-4 sm:h-5 px-1 sm:px-1.5">
                  {pendingOnlineOrders.length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="stats" className="text-xs sm:text-sm">
              <BarChart3 className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
              <span className="hidden sm:inline">Stats</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="venta">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              <div className="lg:col-span-2 space-y-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    ref={searchInputRef}
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Buscar producto..."
                    className="pl-10 bg-slate-800 border-purple-700 text-white"
                  />
                </div>

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

                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
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
                      className="cursor-pointer bg-purple-900/30 border-purple-800/50 hover:border-purple-600 transition-all hover:scale-105"
                    >
                      <CardContent className="p-3">
                        {product.image_url && (
                          <div className="relative h-20 mb-2 rounded overflow-hidden">
                            <Image
                              src={product.image_url}
                              alt={product.name}
                              fill
                              className="object-cover"
                            />
                          </div>
                        )}
                        <h4 className="font-semibold text-white text-sm mb-1 line-clamp-2">
                          {product.name}
                        </h4>
                        <p className="text-purple-400 font-bold">
                          ${parseFloat(product.price.toString()).toFixed(2)}
                        </p>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>

              <div className="space-y-4">
                <Card className="bg-gradient-to-br from-purple-900/50 to-slate-900/50 border-purple-700/50 backdrop-blur-xl sticky top-20">
                  <CardHeader>
                    <CardTitle className="text-white flex items-center gap-2">
                      <ShoppingCart className="h-5 w-5" />
                      Carrito ({cart.length})
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label className="text-gray-300">Cliente (opcional)</Label>
                      <Input
                        value={customerName}
                        onChange={(e) => setCustomerName(e.target.value)}
                        placeholder="Nombre del cliente"
                        className="bg-slate-800 border-purple-700 text-white"
                      />
                    </div>

                    <div className="max-h-64 overflow-y-auto space-y-2">
                      {cart.length === 0 ? (
                        <p className="text-center text-gray-400 py-8">Carrito vacío</p>
                      ) : (
                        cart.map(item => (
                          <div key={item.cartId} className="flex items-center justify-between p-2 bg-slate-800/50 rounded">
                            <div className="flex-1">
                              <p className="text-white text-sm font-medium">{item.name}</p>
                              {item.modifiers && item.modifiers.length > 0 && (
                                <p className="text-xs text-gray-400">
                                  {item.modifiers.map((m: any) => m.modifier).join(', ')}
                                </p>
                              )}
                            </div>
                            <div className="flex items-center gap-2">
                              <div className="flex items-center gap-1">
                                <Button size="sm" variant="ghost" onClick={() => updateQuantity(item.cartId, -1)} className="h-6 w-6 p-0 text-purple-400">
                                  <Minus className="h-3 w-3" />
                                </Button>
                                <span className="text-white w-6 text-center">{item.quantity}</span>
                                <Button size="sm" variant="ghost" onClick={() => updateQuantity(item.cartId, 1)} className="h-6 w-6 p-0 text-purple-400">
                                  <Plus className="h-3 w-3" />
                                </Button>
                              </div>
                              <span className="text-purple-400 font-bold">${(item.price * item.quantity).toFixed(2)}</span>
                              <Button size="sm" variant="ghost" onClick={() => removeFromCart(item.cartId)} className="h-6 w-6 p-0 text-red-400 hover:text-red-300">
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </div>
                          </div>
                        ))
                      )}
                    </div>

                    <div>
                      <Label className="text-gray-300 mb-2 block">Método de Pago</Label>
                      <div className="grid grid-cols-2 gap-2">
                        <Button
                          variant={paymentMethod === 'efectivo' ? 'default' : 'outline'}
                          onClick={() => setPaymentMethod('efectivo')}
                          className={paymentMethod === 'efectivo' ? 'bg-green-600' : 'border-purple-600 text-purple-400'}
                        >
                          <DollarSign className="h-4 w-4 mr-2" />
                          Efectivo
                        </Button>
                        <Button
                          variant={paymentMethod === 'tarjeta' ? 'default' : 'outline'}
                          onClick={() => setPaymentMethod('tarjeta')}
                          className={paymentMethod === 'tarjeta' ? 'bg-blue-600' : 'border-purple-600 text-purple-400'}
                        >
                          <CreditCard className="h-4 w-4 mr-2" />
                          Tarjeta
                        </Button>
                      </div>
                    </div>

                    {paymentMethod === 'efectivo' && (
                      <div>
                        <Label className="text-gray-300">Efectivo Recibido</Label>
                        <Input
                          type="number"
                          value={cashReceived}
                          onChange={(e) => setCashReceived(e.target.value)}
                          placeholder="0.00"
                          className="bg-slate-800 border-purple-700 text-white text-lg"
                        />
                        {cashReceived && (
                          <p className="text-sm text-purple-300 mt-1">Cambio: ${calculateChange().toFixed(2)}</p>
                        )}
                      </div>
                    )}

                    <div className="border-t border-purple-700/30 pt-4">
                      <div className="flex items-center justify-between mb-4">
                        <span className="text-gray-300 text-lg">Total:</span>
                        <span className="text-3xl font-bold text-purple-400">${calculateTotal().toFixed(2)}</span>
                      </div>

                      <Button
                        onClick={handleCheckout}
                        disabled={cart.length === 0}
                        className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white py-6 text-lg"
                      >
                        Cobrar ${calculateTotal().toFixed(2)}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="kiosko">
            <Card className="bg-gradient-to-br from-purple-900/50 to-slate-900/50 border-purple-700/50">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Store className="h-5 w-5" />
                  Pedidos del Kiosko ({pendingKioskoOrders.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                {pendingKioskoOrders.length === 0 ? (
                  <p className="text-center text-gray-400 py-8">No hay pedidos pendientes del kiosko</p>
                ) : (
                  <div className="space-y-4">
                    {pendingKioskoOrders.map(order => (
                      <Card key={order.id} className="bg-slate-800/50 border-orange-600/50">
                        <CardContent className="p-4">
                          <div className="flex justify-between items-start mb-3">
                            <div>
                              <p className="text-white font-bold">Pedido #{order.id}</p>
                              <p className="text-sm text-gray-400">{order.customer_name}</p>
                            </div>
                            <Badge className="bg-orange-600">${(order.total || 0).toFixed(2)}</Badge>
                          </div>
                          <div className="space-y-1 mb-3">
                            {order.items?.map((item: any, idx: number) => (
                              <p key={idx} className="text-sm text-gray-300">{item.quantity}x {item.name}</p>
                            ))}
                          </div>
                          <Button onClick={() => handleConfirmOrder(order.id)} className="w-full bg-green-600 hover:bg-green-700">
                            Confirmar Pedido
                          </Button>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="online">
            <Card className="bg-gradient-to-br from-purple-900/50 to-slate-900/50 border-purple-700/50">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Globe className="h-5 w-5" />
                  Pedidos Online ({pendingOnlineOrders.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                {pendingOnlineOrders.length === 0 ? (
                  <p className="text-center text-gray-400 py-8">No hay pedidos online pendientes</p>
                ) : (
                  <div className="space-y-4">
                    {pendingOnlineOrders.map(order => (
                      <Card key={order.id} className="bg-slate-800/50 border-blue-600/50">
                        <CardContent className="p-4">
                          <div className="flex justify-between items-start mb-3">
                            <div>
                              <p className="text-white font-bold">Pedido #{order.id}</p>
                              <p className="text-sm text-gray-400">{order.customer_name}</p>
                              <p className="text-xs text-gray-500">{order.customer_email}</p>
                            </div>
                            <Badge className="bg-blue-600">${(order.total || 0).toFixed(2)}</Badge>
                          </div>
                          <div className="space-y-1 mb-3">
                            {order.items?.map((item: any, idx: number) => (
                              <p key={idx} className="text-sm text-gray-300">{item.quantity}x {item.name}</p>
                            ))}
                          </div>
                          <Button onClick={() => handleConfirmOrder(order.id)} className="w-full bg-green-600 hover:bg-green-700">
                            Confirmar Pedido
                          </Button>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="stats">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Card className="bg-gradient-to-br from-green-900/50 to-slate-900/50 border-green-700/50">
                <CardContent className="p-4 text-center">
                  <DollarSign className="h-8 w-8 mx-auto text-green-400 mb-2" />
                  <p className="text-2xl font-bold text-white">${(shiftStats.total_sales || 0).toFixed(2)}</p>
                  <p className="text-sm text-gray-400">Ventas Totales</p>
                </CardContent>
              </Card>
              <Card className="bg-gradient-to-br from-blue-900/50 to-slate-900/50 border-blue-700/50">
                <CardContent className="p-4 text-center">
                  <Receipt className="h-8 w-8 mx-auto text-blue-400 mb-2" />
                  <p className="text-2xl font-bold text-white">{shiftStats.total_orders}</p>
                  <p className="text-sm text-gray-400">Pedidos</p>
                </CardContent>
              </Card>
              <Card className="bg-gradient-to-br from-purple-900/50 to-slate-900/50 border-purple-700/50">
                <CardContent className="p-4 text-center">
                  <TrendingUp className="h-8 w-8 mx-auto text-purple-400 mb-2" />
                  <p className="text-2xl font-bold text-white">${(shiftStats.average_ticket || 0).toFixed(2)}</p>
                  <p className="text-sm text-gray-400">Ticket Promedio</p>
                </CardContent>
              </Card>
              <Card className="bg-gradient-to-br from-yellow-900/50 to-slate-900/50 border-yellow-700/50">
                <CardContent className="p-4 text-center">
                  <DollarSign className="h-8 w-8 mx-auto text-yellow-400 mb-2" />
                  <p className="text-2xl font-bold text-white">${(shiftStats.cash_sales || 0).toFixed(2)}</p>
                  <p className="text-sm text-gray-400">Efectivo</p>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>

      <ProductModifierModal
        isOpen={showModifierModal}
        onClose={() => {
          setShowModifierModal(false)
          setSelectedProduct(null)
        }}
        product={selectedProduct}
        onAddToCart={(product, modifiers) => {
          addToCart(product, modifiers)
        }}
      />
    </div>
  )
}
