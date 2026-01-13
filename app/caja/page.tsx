'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useToast } from '@/hooks/use-notifications'
import { ProductModifierModal } from '@/components/ProductModifierModal'
import { CollectPaymentModal } from '@/components/CollectPaymentModal'
import { CashMovementModal } from '@/components/CashMovementModal'
import Image from 'next/image'
import {
  DollarSign,
  CreditCard,
  ShoppingCart,
  Clock,
  TrendingUp,
  TrendingDown,
  Package,
  LogOut,
  Search,
  Plus,
  Minus,
  Trash2,
  X,
  BarChart3,
  Globe,
  Monitor
} from 'lucide-react'

export default function CajaPage() {
  const router = useRouter()
  const toast = useToast()
  
  // Estado principal
  const [currentShift, setCurrentShift] = useState<any>(null)
  const [cart, setCart] = useState<any[]>([])
  const [products, setProducts] = useState<any[]>([])
  const [categories, setCategories] = useState<any[]>([])
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [loading, setLoading] = useState(true)
  const [customerName, setCustomerName] = useState('')
  const [paymentMethod, setPaymentMethod] = useState<'efectivo' | 'tarjeta'>('efectivo')
  const [cashReceived, setCashReceived] = useState('')
  const [selectedProduct, setSelectedProduct] = useState<any>(null)
  const [showModifierModal, setShowModifierModal] = useState(false)
  
  // Modal de cobro
  const [showCollectModal, setShowCollectModal] = useState(false)
  const [selectedOrder, setSelectedOrder] = useState<any>(null)
  
  // Movimientos de efectivo
  const [showCashMovement, setShowCashMovement] = useState(false)
  const [cashMovementType, setCashMovementType] = useState<'cash_in' | 'cash_out'>('cash_in')
  
  // Usuario actual
  const [currentUser, setCurrentUser] = useState<any>(null)
  
  // Nuevos estados
  const [searchTerm, setSearchTerm] = useState('')
  const [pendingOrders, setPendingOrders] = useState<any[]>([])
  const [onlineOrders, setOnlineOrders] = useState<any[]>([])
  const [comedorOrders, setComedorOrders] = useState<any[]>([])
  const [shiftStats, setShiftStats] = useState<any>({
    total_orders: 0,
    total_sales: 0,
    cash_sales: 0,
    card_sales: 0,
    cash_orders: 0,
    card_orders: 0
  })
  const [activeTab, setActiveTab] = useState('venta')

  useEffect(() => {
    checkAuth()
    checkShift()
    loadProducts()
    loadCategories()
    loadPendingOrders()
  }, [])

  const checkAuth = async () => {
    try {
      const response = await fetch('/api/users/profile')
      if (!response.ok) {
        throw new Error('No autenticado')
      }
      const data = await response.json()
      setCurrentUser(data.user)
    } catch (error) {
      console.error('Error checking auth:', error)
      router.push('/login')
    }
  }

  useEffect(() => {
    if (currentShift) {
      // Cargar estadísticas inmediatamente
      loadShiftStats()
      
      // Recargar estadísticas cada 30 segundos
      const interval = setInterval(() => {
        loadShiftStats()
        loadPendingOrders()
      }, 30000)
      return () => clearInterval(interval)
    }
  }, [currentShift])

  const checkShift = async () => {
    try {
      const response = await fetch('/api/shifts?status=open')
      const data = await response.json()
      
      if (data.success && data.shifts && data.shifts.length > 0) {
        setCurrentShift(data.shifts[0])
        loadShiftStats()
      }
    } catch (error) {
      console.error('Error checking shift:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadShiftStats = async () => {
    if (!currentShift) return
    
    try {
      const response = await fetch(`/api/shifts/${currentShift.id}/stats`)
      const data = await response.json()
      if (data.success) {
        setShiftStats(data.stats || {
          total_orders: 0,
          total_sales: 0,
          cash_sales: 0,
          card_sales: 0,
          cash_orders: 0,
          card_orders: 0
        })
      }
    } catch (error) {
      console.error('Error loading shift stats:', error)
      // Mantener valores por defecto en caso de error
      setShiftStats({
        total_orders: 0,
        total_sales: 0,
        cash_sales: 0,
        card_sales: 0,
        cash_orders: 0,
        card_orders: 0
      })
    }
  }

  const loadPendingOrders = async () => {
    try {
      // Cargar pedidos pendientes (pending) y pagados no entregados (paid)
      const response = await fetch('/api/orders-mysql')
      const data = await response.json()
      
      console.log('📦 Todos los pedidos recibidos:', data)
      
      if (data.success && data.orders) {
        console.log('📊 Total de pedidos:', data.orders.length)
        
        // Filtrar solo pedidos que necesitan ser cobrados/entregados
        // - pending: No pagados, esperando cobro
        // - paid: Pagados online/tarjeta, esperando entrega
        // - open_table: Mesas abiertas con consumo
        // EXCLUIR confirmed: Ya fueron entregados/completados
        const relevantOrders = data.orders.filter((o: any) => 
          o.status === 'pending' || 
          o.status === 'paid' || 
          o.status === 'open_table'
        )
        
        console.log('📋 Pedidos pendientes/paid/open_table:', relevantOrders.length)
        console.log('📋 Detalle:', relevantOrders.map((o: any) => ({
          id: o.id,
          status: o.status,
          order_source: o.order_source,
          waiter_order: o.waiter_order,
          table: o.table,
          total: o.total
        })))
        
        // Separar pedidos por origen
        const kiosko = relevantOrders.filter((o: any) => 
          (o.order_source === 'kiosk' || o.order_source === 'kiosko') &&
          !o.waiter_order
        )
        
        const comedor = relevantOrders.filter((o: any) => 
          o.waiter_order === 1 ||
          o.waiter_order === true ||
          o.status === 'open_table' ||
          o.order_source === 'mesa' || 
          o.order_source === 'mesas' ||
          o.order_source === 'mesero'
        )
        
        const online = relevantOrders.filter((o: any) => 
          !o.waiter_order &&
          o.status !== 'open_table' &&
          (
            o.order_source === 'online' || 
            o.order_source === 'menu' ||
            o.order_source === 'web'
          )
        )
        
        console.log('🖥️ Pedidos Kiosko:', kiosko.length, kiosko)
        console.log('🍽️ Pedidos Comedor:', comedor.length, comedor)
        console.log('🌐 Pedidos Online:', online.length, online)
        
        setPendingOrders(kiosko)
        setComedorOrders(comedor)
        setOnlineOrders(online)
      }
    } catch (error) {
      console.error('❌ Error loading pending orders:', error)
    }
  }

  const loadProducts = async () => {
    try {
      const response = await fetch('/api/products-mysql?available=true')
      const data = await response.json()
      console.log('🍽️ Productos cargados:', data.products?.length)
      if (data.products?.length > 0) {
        const withMods = data.products.filter((p: any) => p.has_modifiers)
        console.log('📋 Productos con modificadores:', withMods.length, withMods.map((p: any) => p.name))
      }
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

  const handleOpenShift = async () => {
    if (!currentUser) {
      toast.error('Acceso Denegado', 'Debes iniciar sesión')
      return
    }

    const openingCash = prompt('¿Con cuánto efectivo abres caja?', '0')
    if (!openingCash) return

    try {
      const response = await fetch('/api/shifts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: currentUser.id,
          user_name: currentUser.username,
          shift_type: getShiftType(),
          opening_cash: parseFloat(openingCash)
        })
      })

      const data = await response.json()
      if (data.success) {
        toast.success('¡Turno Abierto!', 'Puedes empezar a vender')
        checkShift()
      } else {
        toast.error('Error', data.error || 'No se pudo abrir el turno')
      }
    } catch (error: any) {
      toast.error('Error', error.message)
    }
  }

  const getShiftType = () => {
    const hour = new Date().getHours()
    if (hour < 12) return 'morning'
    if (hour < 18) return 'afternoon'
    if (hour < 22) return 'evening'
    return 'night'
  }

  const addToCart = (product: any, modifiers?: any[]) => {
    const basePrice = parseFloat(product.price)
    const modifiersPrice = modifiers ? modifiers.reduce((sum, m) => sum + (parseFloat(m.price) || 0), 0) : 0
    const totalPrice = basePrice + modifiersPrice

    // Buscar si ya existe el mismo producto con los mismos modificadores
    const existingIndex = cart.findIndex(item => {
      if (item.id !== product.id) return false
      if (!modifiers && !item.modifiers) return true
      if (!modifiers || !item.modifiers) return false
      return JSON.stringify(item.modifiers) === JSON.stringify(modifiers)
    })

    if (existingIndex >= 0) {
      // Incrementar cantidad
      const newCart = [...cart]
      newCart[existingIndex].quantity += 1
      setCart(newCart)
    } else {
      // Agregar nuevo item
      setCart(prev => [...prev, {
        ...product,
        modifiers,
        price: totalPrice,
        quantity: 1,
        cartId: Date.now() + Math.random()
      }])
    }
    
    toast.success('Agregado', product.name)
  }

  const updateQuantity = (cartId: number, delta: number) => {
    setCart(prev => {
      const newCart = prev.map(item => {
        if (item.cartId === cartId) {
          const newQuantity = item.quantity + delta
          if (newQuantity <= 0) return null
          return { ...item, quantity: newQuantity }
        }
        return item
      }).filter(Boolean) as any[]
      
      return newCart
    })
  }

  const removeFromCart = (cartId: number) => {
    setCart(prev => prev.filter(item => item.cartId !== cartId))
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
          customer_email: 'caja@supernova.com',
          items: cart.map(item => ({
            product_id: item.id,
            name: item.name,
            price: item.price,
            quantity: item.quantity,
            modifiers: item.modifiers
          })),
          total_amount: calculateTotal(),
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
        toast.success('¡Venta Exitosa!', `Total: $${calculateTotal().toFixed(2)}`)
        
        // Limpiar
        setCart([])
        setCustomerName('')
        setCashReceived('')
        
        // Recargar datos
        checkShift()
        loadShiftStats()
      }
    } catch (error: any) {
      toast.error('Error', error.message)
    }
  }

  const handleCollectOrder = async (order: any) => {
    if (!currentShift) {
      toast.error('Error', 'Debes abrir un turno primero')
      return
    }

    // Abrir modal
    setSelectedOrder(order)
    setShowCollectModal(true)
  }

  const handleConfirmCollect = async (paymentData: { cashReceived?: number; changeGiven?: number; paymentMethod?: string }) => {
    if (!selectedOrder || !currentShift) return

    const isPaid = selectedOrder.status === 'paid' || selectedOrder.payment_method === 'card' || selectedOrder.payment_method === 'tarjeta'

    try {
      const response = await fetch(`/api/orders-mysql/${selectedOrder.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: 'confirmed',
          shift_id: currentShift.id,
          payment_collected_at: new Date().toISOString(),
          payment_method: paymentData.paymentMethod || selectedOrder.payment_method || 'efectivo',
          cash_received: paymentData.cashReceived || null,
          change_given: paymentData.changeGiven || null
        })
      })

      const data = await response.json()
      if (data.success) {
        if (isPaid) {
          toast.success('¡Entregado!', `Pedido #${selectedOrder.id} entregado`)
        } else {
          const changeText = paymentData.changeGiven && paymentData.changeGiven > 0 
            ? ` Cambio: $${paymentData.changeGiven.toFixed(2)}`
            : ''
          toast.success('¡Cobrado!', `Pedido #${selectedOrder.id} cobrado.${changeText}`)
        }
        
        setShowCollectModal(false)
        setSelectedOrder(null)
        loadPendingOrders()
        loadShiftStats()
        checkShift()
      }
    } catch (error: any) {
      toast.error('Error', error.message)
    }
  }

  const handleCloseShift = () => {
    router.push(`/caja/cierre/${currentShift.id}`)
  }

  const handleCashMovement = (type: 'cash_in' | 'cash_out') => {
    setCashMovementType(type)
    setShowCashMovement(true)
  }

  const handleCashMovementSuccess = () => {
    toast.success('Registrado', 'Movimiento de efectivo registrado exitosamente')
    loadShiftStats()
  }

  // Helper para normalizar items de pedidos
  const normalizeOrderItems = (items: any) => {
    if (!items) return []
    
    // Si ya es un array, retornarlo
    if (Array.isArray(items)) {
      return items.map((item: any) => ({
        quantity: item.quantity || 1,
        name: item.name || item.product_name || 'Producto',
        price: item.price || item.subtotal || 0
      }))
    }
    
    // Si es string JSON, parsearlo
    if (typeof items === 'string') {
      try {
        const parsed = JSON.parse(items)
        return normalizeOrderItems(parsed)
      } catch {
        return []
      }
    }
    
    return []
  }

  // Filtrar productos
  const filteredProducts = products.filter(p => {
    const matchesCategory = selectedCategory === 'all' || p.category_id?.toString() === selectedCategory
    const matchesSearch = searchTerm === '' || 
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.category?.toLowerCase().includes(searchTerm.toLowerCase())
    return matchesCategory && matchesSearch
  })

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-colibri-beige via-colibri-green/10 to-colibri-beige flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-colibri-gold mx-auto mb-4"></div>
          <p className="text-colibri-gold">Cargando...</p>
        </div>
      </div>
    )
  }

  if (!currentShift) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-colibri-beige via-colibri-green/10 to-colibri-beige flex items-center justify-center p-4">
        <Card className="max-w-md w-full bg-gradient-to-br from-white/80 to-white/60 border-colibri-green/50 backdrop-blur-xl">
          <CardHeader>
            <CardTitle className="text-2xl text-slate-800 text-center">
              💰 Punto de Venta
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-center text-slate-600 mb-6">
              <Clock className="h-16 w-16 mx-auto mb-4 text-colibri-wine" />
              <p className="text-lg">No hay turno activo</p>
              <p className="text-sm text-gray-400 mt-2">
                Abre un turno para comenzar a vender
              </p>
            </div>
            
            <Button
              onClick={handleOpenShift}
              className="w-full bg-gradient-to-r from-colibri-wine to-colibri-green hover:from-colibri-green hover:to-colibri-wine text-slate-800 py-6 text-lg"
            >
              <Clock className="mr-2 h-5 w-5" />
              Abrir Turno
            </Button>
            
            <Button
              variant="outline"
              onClick={() => router.push('/admin/reportes')}
              className="w-full border-colibri-wine text-colibri-wine hover:bg-colibri-wine/10"
            >
              <BarChart3 className="mr-2 h-4 w-4" />
              Ver Reportes
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-colibri-beige via-colibri-green/10 to-colibri-beige">
      {/* Header */}
      <header className="bg-gradient-to-r from-white/80 to-white/60 backdrop-blur-xl border-b border-colibri-green/20 shadow-lg shadow-colibri-green/5 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 py-3">
          <div className="flex items-center justify-between gap-4">
            <div className="flex-1 min-w-0">
              <h1 className="text-lg sm:text-2xl font-bold text-slate-900 truncate">💰 Caja - Supernova</h1>
              <p className="text-xs sm:text-sm text-slate-700">
                Turno: {currentShift.shift_type} | {currentShift.user_name}
              </p>
            </div>
            
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="bg-colibri-wine/10 text-colibri-wine px-2 sm:px-3 py-1 text-xs sm:text-sm">
                <DollarSign className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                ${parseFloat(shiftStats?.total_sales || currentShift.total_sales || 0).toFixed(2)}
              </Badge>
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleCashMovement('cash_in')}
                className="border-colibri-green text-colibri-green hover:bg-colibri-green/10"
                title="Entrada de efectivo"
              >
                <TrendingUp className="h-3 w-3 sm:h-4 sm:w-4" />
              </Button>
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleCashMovement('cash_out')}
                className="border-colibri-wine text-colibri-wine hover:bg-colibri-wine/10"
                title="Salida de efectivo"
              >
                <TrendingDown className="h-3 w-3 sm:h-4 sm:w-4" />
              </Button>
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => router.push('/admin/reportes')}
                className="border-colibri-green text-colibri-green hover:bg-colibri-green/10 hidden sm:flex"
              >
                <BarChart3 className="h-4 w-4" />
              </Button>
              
              <Button
                variant="outline"
                size="sm"
                onClick={handleCloseShift}
                className="border-colibri-wine text-colibri-wine hover:bg-colibri-wine/10"
              >
                <LogOut className="h-3 w-3 sm:h-4 sm:w-4 sm:mr-2" />
                <span className="hidden sm:inline">Cerrar</span>
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto p-2 sm:p-4">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList className="grid w-full grid-cols-5 bg-slate-900/80 backdrop-blur-xl border border-colibri-green/30 shadow-xl">
            <TabsTrigger value="venta" className="data-[state=active]:bg-colibri-wine data-[state=active]:text-white text-colibri-gold text-xs sm:text-sm">
              <ShoppingCart className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
              <span className="hidden sm:inline">Venta</span>
              <span className="sm:hidden">POS</span>
            </TabsTrigger>
            <TabsTrigger value="online" className="data-[state=active]:bg-colibri-wine data-[state=active]:text-white text-colibri-gold text-xs sm:text-sm">
              <Globe className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
              <span className="hidden sm:inline">Online</span>
              <span className="sm:hidden">Web</span>
              {onlineOrders.length > 0 && (
                <Badge className="ml-1 sm:ml-2 bg-colibri-gold text-white text-xs px-1 sm:px-2">
                  {onlineOrders.length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="comedor" className="data-[state=active]:bg-colibri-wine data-[state=active]:text-white text-colibri-gold text-xs sm:text-sm">
              <Package className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
              Comedor
              {comedorOrders.length > 0 && (
                <Badge className="ml-1 sm:ml-2 bg-colibri-gold text-white text-xs px-1 sm:px-2">
                  {comedorOrders.length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="kiosko" className="data-[state=active]:bg-colibri-wine data-[state=active]:text-white text-colibri-gold text-xs sm:text-sm">
              <Monitor className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
              Kiosko
              {pendingOrders.length > 0 && (
                <Badge className="ml-1 sm:ml-2 bg-colibri-green text-white text-xs px-1 sm:px-2">
                  {pendingOrders.length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="stats" className="data-[state=active]:bg-colibri-wine data-[state=active]:text-white text-colibri-gold text-xs sm:text-sm">
              <BarChart3 className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
              <span className="hidden sm:inline">Stats</span>
              <span className="sm:hidden">📊</span>
            </TabsTrigger>
          </TabsList>

          {/* Tab: Venta (POS) */}
          <TabsContent value="venta" className="space-y-4 m-0">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              {/* Products Section */}
              <div className="lg:col-span-2 space-y-4">
                {/* Search */}
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-colibri-gold" />
                  <Input
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Buscar productos..."
                    className="pl-10 bg-slate-950/90 border-colibri-green/30 text-white placeholder:text-slate-500"
                  />
                  {searchTerm && (
                    <button
                      onClick={() => setSearchTerm('')}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-colibri-gold hover:text-white"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  )}
                </div>

                {/* Categories */}
                <div className="flex flex-wrap gap-2 pb-2 px-1">
                  <Button
                    size="sm"
                    variant={selectedCategory === 'all' ? 'default' : 'outline'}
                    onClick={() => setSelectedCategory('all')}
                    className={selectedCategory === 'all' ? 'bg-colibri-wine text-white whitespace-nowrap px-4' : 'border-colibri-green text-colibri-green hover:bg-colibri-green/10 whitespace-nowrap px-4'}
                  >
                    Todos ({products.length})
                  </Button>
                  {categories.map(cat => {
                    const count = products.filter(p => p.category_id === cat.id).length
                    return (
                      <Button
                        key={cat.id}
                        size="sm"
                        variant={selectedCategory === cat.id.toString() ? 'default' : 'outline'}
                        onClick={() => setSelectedCategory(cat.id.toString())}
                        className={selectedCategory === cat.id.toString() ? 'bg-colibri-wine text-white whitespace-nowrap px-4' : 'border-colibri-green text-colibri-green hover:bg-colibri-green/10 whitespace-nowrap px-4'}
                      >
                        {cat.name} ({count})
                      </Button>
                    )
                  })}
                </div>

                {/* Products Grid */}
                <Card className="bg-slate-900/80 backdrop-blur-xl border-colibri-green/30 shadow-xl">
                  <CardContent className="p-3 sm:p-4">
                    {filteredProducts.length === 0 ? (
                      <div className="text-center py-12">
                        <Package className="h-16 w-16 mx-auto mb-4 text-colibri-green/60" />
                        <p className="text-slate-400">No se encontraron productos</p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 sm:gap-3">
                        {filteredProducts.map(product => (
                          <Card
                            key={product.id}
                            onClick={() => {
                              console.log('🖱️ Producto clickeado:', {
                                id: product.id,
                                name: product.name,
                                has_modifiers: product.has_modifiers,
                                modifiers: product.modifiers
                              })
                              
                              if (product.has_modifiers) {
                                console.log('✅ Abriendo modal de modificadores')
                                setSelectedProduct(product)
                                setShowModifierModal(true)
                              } else {
                                console.log('➕ Agregando directo al carrito')
                                addToCart(product)
                              }
                            }}
                            className="cursor-pointer bg-slate-950/90 backdrop-blur-md border-2 border-colibri-green/40 hover:border-colibri-gold hover:shadow-2xl hover:shadow-colibri-gold/20 transition-all hover:scale-105 group"
                          >
                            <CardContent className="p-2 sm:p-3">
                              {product.image_url && (
                                <div className="relative aspect-square mb-2 rounded-lg overflow-hidden bg-gradient-to-br from-slate-800/50 to-slate-950 shadow-inner">
                                  <Image
                                    src={product.image_url}
                                    alt={product.name}
                                    fill
                                    className="object-cover group-hover:scale-110 transition-transform duration-300"
                                    sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                                  />
                                </div>
                              )}
                              <h4 className="font-semibold text-white text-xs sm:text-sm mb-1 line-clamp-2 leading-tight">
                                {product.name}
                              </h4>
                              <div className="flex items-center justify-between">
                                <p className="text-colibri-gold font-bold text-sm sm:text-base">
                                  ${parseFloat(product.price).toFixed(2)}
                                </p>
                                {product.has_modifiers && (
                                  <Badge className="bg-colibri-green/20 text-colibri-gold border-colibri-green/30 text-xs px-1">
                                    +
                                  </Badge>
                                )}
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* Cart Section */}
              <div className="space-y-4">
                <Card className="bg-slate-900/90 backdrop-blur-xl border-2 border-colibri-green/30 shadow-xl sticky top-20">
                  <CardHeader className="pb-3 bg-gradient-to-r from-colibri-green/20 to-colibri-wine/20">
                    <CardTitle className="text-white flex items-center gap-2 text-base sm:text-lg">
                      <ShoppingCart className="h-4 w-4 sm:h-5 sm:w-5" />
                      Carrito
                      <Badge className="ml-auto bg-colibri-wine text-white">
                        {cart.reduce((sum, item) => sum + item.quantity, 0)} items
                      </Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3 sm:space-y-4">
                    {/* Customer Name */}
                    <div>
                      <Label className="text-colibri-gold font-semibold text-xs sm:text-sm">Cliente (opcional)</Label>
                      <Input
                        value={customerName}
                        onChange={(e) => setCustomerName(e.target.value)}
                        placeholder="Nombre del cliente"
                        className="bg-slate-950 border-colibri-green/30 text-white placeholder:text-slate-500 mt-1 focus:border-colibri-gold focus:ring-2 focus:ring-colibri-gold/20"
                      />
                    </div>

                    {/* Cart Items */}
                    <div className="max-h-48 sm:max-h-64 overflow-y-auto space-y-2">
                      {cart.length === 0 ? (
                        <div className="text-center py-8">
                          <ShoppingCart className="h-12 w-12 mx-auto mb-2 text-colibri-green/60" />
                          <p className="text-slate-400 text-sm font-medium">Carrito vacío</p>
                        </div>
                      ) : (
                        cart.map(item => (
                          <div
                            key={item.cartId}
                            className="flex items-start gap-2 p-2 bg-gradient-to-br from-slate-800/50 to-slate-950/50 rounded-lg border border-colibri-green/30 hover:border-colibri-gold transition-all"
                          >
                            <div className="flex-1 min-w-0">
                              <p className="text-white text-xs sm:text-sm font-semibold line-clamp-2">{item.name}</p>
                              {item.modifiers && item.modifiers.length > 0 && (
                                <p className="text-xs text-colibri-gold font-medium truncate mt-1">
                                  +{item.modifiers.map((m: any) => m.modifier || m.name).join(', ')}
                                </p>
                              )}
                              <p className="text-white font-bold text-sm mt-1.5">
                                ${item.price.toFixed(2)} <span className="text-colibri-gold">×{item.quantity}</span> = <span className="text-colibri-gold text-base">${(item.price * item.quantity).toFixed(2)}</span>
                              </p>
                            </div>
                            <div className="flex flex-col gap-1">
                              <div className="flex items-center bg-slate-800/80 rounded border border-colibri-gold/30">
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => updateQuantity(item.cartId, -1)}
                                  className="h-7 w-7 p-0 hover:bg-colibri-wine/30 text-colibri-wine"
                                >
                                  <Minus className="h-4 w-4" />
                                </Button>
                                <span className="w-8 text-center text-sm font-black text-white">{item.quantity}</span>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => updateQuantity(item.cartId, 1)}
                                  className="h-7 w-7 p-0 hover:bg-colibri-green/30 text-colibri-green"
                                >
                                  <Plus className="h-4 w-4" />
                                </Button>
                              </div>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => removeFromCart(item.cartId)}
                                className="h-6 w-full p-0 text-red-400 hover:text-red-300 hover:bg-red-500/20"
                              >
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </div>
                          </div>
                        ))
                      )}
                    </div>

                    {/* Payment Method */}
                    <div>
                      <Label className="text-colibri-gold mb-2 block text-xs sm:text-sm font-semibold">Método de Pago</Label>
                      <div className="grid grid-cols-2 gap-2">
                        <Button
                          variant={paymentMethod === 'efectivo' ? 'default' : 'outline'}
                          onClick={() => setPaymentMethod('efectivo')}
                          className={paymentMethod === 'efectivo' ? 'bg-colibri-green text-white h-9 sm:h-10' : 'border-colibri-green text-colibri-green hover:bg-colibri-green/10 h-9 sm:h-10'}
                        >
                          <DollarSign className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                          <span className="text-xs sm:text-sm">Efectivo</span>
                        </Button>
                        <Button
                          variant={paymentMethod === 'tarjeta' ? 'default' : 'outline'}
                          onClick={() => setPaymentMethod('tarjeta')}
                          className={paymentMethod === 'tarjeta' ? 'bg-colibri-wine text-white h-9 sm:h-10' : 'border-colibri-wine text-colibri-wine hover:bg-colibri-wine/10 h-9 sm:h-10'}
                        >
                          <CreditCard className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                          <span className="text-xs sm:text-sm">Tarjeta</span>
                        </Button>
                      </div>
                    </div>

                    {/* Cash Input */}
                    {paymentMethod === 'efectivo' && (
                      <div>
                        <Label className="text-white font-semibold text-sm">💵 Efectivo Recibido</Label>
                        <Input
                          type="number"
                          value={cashReceived}
                          onChange={(e) => setCashReceived(e.target.value)}
                          placeholder="0.00"
                          className="h-16 bg-slate-950 border-2 border-colibri-gold text-white text-4xl font-black text-center mt-1 placeholder:text-slate-600 focus:border-colibri-gold focus:ring-2 focus:ring-colibri-gold/30"
                        />
                        {cashReceived && parseFloat(cashReceived) >= calculateTotal() && (
                          <div className="mt-2 p-3 bg-green-500/20 border-2 border-green-400/50 rounded-lg">
                            <p className="text-green-300 font-black text-lg text-center">
                              Cambio: ${calculateChange().toFixed(2)}
                            </p>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Total */}
                    <div className="border-t border-colibri-green/30 pt-3 sm:pt-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-white text-lg font-semibold">Total:</span>
                        <span className="text-4xl font-black text-colibri-gold drop-shadow-[0_0_15px_rgba(171,153,118,0.5)]">
                          ${calculateTotal().toFixed(2)}
                        </span>
                      </div>

                      <Button
                        onClick={handleCheckout}
                        disabled={cart.length === 0 || (paymentMethod === 'efectivo' && parseFloat(cashReceived) < calculateTotal())}
                        className="w-full bg-gradient-to-r from-colibri-wine to-colibri-green hover:from-colibri-green hover:to-colibri-wine text-white py-5 sm:py-6 text-base sm:text-lg font-bold disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
                      >
                        <DollarSign className="h-4 w-4 sm:h-5 sm:w-5 mr-2" />
                        Cobrar ${calculateTotal().toFixed(2)}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          {/* Tab: Pedidos Online */}
          <TabsContent value="online" className="space-y-4 m-0">
            <Card className="bg-white/70 backdrop-blur-xl border-colibri-green/20 shadow-lg shadow-colibri-green/5">
              <CardHeader>
                <CardTitle className="text-slate-800 flex items-center gap-2">
                  <Globe className="h-5 w-5 text-cyan-400" />
                  Pedidos Online Pendientes
                  <Badge className="ml-auto bg-colibri-gold text-slate-800">
                    {onlineOrders.length}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {onlineOrders.length === 0 ? (
                  <div className="text-center py-12">
                    <Globe className="h-16 w-16 mx-auto mb-4 text-slate-700" />
                    <p className="text-gray-400">No hay pedidos online pendientes</p>
                  </div>
                ) : (
                  <div className="grid gap-4">
                    {onlineOrders.map(order => (
                      <Card key={order.id} className="bg-gradient-to-br from-cyan-900/20 to-white/20 border-cyan-700/30">
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between mb-3">
                            <div>
                              <h3 className="text-slate-800 font-bold text-lg">Pedido #{order.id}</h3>
                              <p className="text-slate-600 text-sm">{order.customer_name}</p>
                              <p className="text-gray-400 text-xs">{order.customer_email}</p>
                              {order.order_source && (
                                <Badge variant="outline" className="mt-1 text-xs border-colibri-gold/30 text-cyan-400">
                                  {order.order_source === 'menu' ? '🌐 Menú' : 
                                   order.order_source === 'online' || order.order_source === 'web' ? '💻 Online' : order.order_source}
                                </Badge>
                              )}
                            </div>
                            <div className="text-right">
                              <p className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-400">
                                ${parseFloat(order.total || 0).toFixed(2)}
                              </p>
                              <Badge className="bg-colibri-gold/20 text-cyan-400 border-colibri-gold/30 mt-1">
                                {order.payment_method === 'cash' || order.payment_method === 'efectivo' ? '💵 Efectivo' : '💳 Tarjeta'}
                              </Badge>
                            </div>
                          </div>
                          
                          <div className="space-y-1 mb-3">
                            {normalizeOrderItems(order.items).map((item: any, idx: number) => (
                              <div key={idx} className="flex justify-between text-sm">
                                <span className="text-slate-600">{item.quantity}x {item.name}</span>
                                <span className="text-colibri-wine">${parseFloat(item.price).toFixed(2)}</span>
                              </div>
                            ))}
                            {normalizeOrderItems(order.items).length === 0 && (
                              <p className="text-slate-600 text-xs italic">Sin items</p>
                            )}
                          </div>

                          <Button
                            onClick={() => handleCollectOrder(order)}
                            className="w-full bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700"
                          >
                            <DollarSign className="h-4 w-4 mr-2" />
                            Cobrar ${parseFloat(order.total || 0).toFixed(2)}
                          </Button>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tab: Pedidos Comedor (Mesas) */}
          <TabsContent value="comedor" className="space-y-4 m-0">
            <Card className="bg-white/70 backdrop-blur-xl border-colibri-green/20 shadow-lg shadow-colibri-green/5">
              <CardHeader>
                <CardTitle className="text-slate-800 flex items-center gap-2">
                  <Package className="h-5 w-5 text-colibri-wine" />
                  Pedidos de Comedor (Mesas)
                  <Badge className="ml-auto bg-colibri-gold text-slate-800">
                    {comedorOrders.length}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {comedorOrders.length === 0 ? (
                  <div className="text-center py-12">
                    <Package className="h-16 w-16 mx-auto mb-4 text-slate-700" />
                    <p className="text-gray-400">No hay pedidos de comedor pendientes</p>
                  </div>
                ) : (
                  <div className="grid gap-4 md:grid-cols-2">
                    {comedorOrders.map(order => (
                      <Card key={order.id} className="bg-gradient-to-br from-colibri-beige/20 to-white/20 border-colibri-green/20 shadow-lg shadow-colibri-green/5">
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between mb-3">
                            <div>
                              <h3 className="text-slate-800 font-bold text-lg">Pedido #{order.id}</h3>
                              <p className="text-slate-600 text-sm">{order.customer_name}</p>
                              {order.table && (
                                <Badge variant="outline" className="mt-1 text-xs border-colibri-gold/30 text-colibri-wine">
                                  🍽️ Mesa {order.table}
                                </Badge>
                              )}
                            </div>
                            <div className="text-right">
                              <p className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-colibri-wine to-colibri-gold">
                                ${parseFloat(order.total || 0).toFixed(2)}
                              </p>
                              <Badge className="bg-colibri-gold/20 text-colibri-wine border-colibri-gold/30 mt-1">
                                {order.payment_method === 'cash' || order.payment_method === 'efectivo' ? '💵 Efectivo' : '💳 Tarjeta'}
                              </Badge>
                            </div>
                          </div>
                          
                          <div className="space-y-1 mb-3">
                            {normalizeOrderItems(order.items).map((item: any, idx: number) => (
                              <div key={idx} className="flex justify-between text-sm">
                                <span className="text-slate-600">{item.quantity}x {item.name}</span>
                                <span className="text-colibri-wine">${parseFloat(item.price).toFixed(2)}</span>
                              </div>
                            ))}
                            {normalizeOrderItems(order.items).length === 0 && (
                              <p className="text-slate-600 text-xs italic">Sin items</p>
                            )}
                          </div>

                          <Button
                            onClick={() => handleCollectOrder(order)}
                            className="w-full bg-gradient-to-r from-colibri-wine to-colibri-green hover:from-colibri-green hover:to-colibri-wine"
                          >
                            <DollarSign className="h-4 w-4 mr-2" />
                            Cobrar ${parseFloat(order.total || 0).toFixed(2)}
                          </Button>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tab: Pedidos Kiosko */}
          <TabsContent value="kiosko" className="space-y-4 m-0">
            <Card className="bg-white/70 backdrop-blur-xl border-colibri-green/20 shadow-lg shadow-colibri-green/5">
              <CardHeader>
                <CardTitle className="text-slate-800 flex items-center gap-2">
                  <Monitor className="h-5 w-5 text-blue-400" />
                  Pedidos de Kiosko Pendientes
                  <Badge className="ml-auto bg-colibri-green text-slate-800">
                    {pendingOrders.length}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {pendingOrders.length === 0 ? (
                  <div className="text-center py-12">
                    <Monitor className="h-16 w-16 mx-auto mb-4 text-slate-700" />
                    <p className="text-gray-400">No hay pedidos de kiosko pendientes</p>
                  </div>
                ) : (
                  <div className="grid gap-4 md:grid-cols-2">
                    {pendingOrders.map(order => (
                      <Card key={order.id} className="bg-gradient-to-br from-blue-900/20 to-white/20 border-blue-700/30">
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between mb-3">
                            <div>
                              <h3 className="text-slate-800 font-bold text-lg">Pedido #{order.id}</h3>
                              <p className="text-slate-600 text-sm">{order.customer_name}</p>
                              {order.table && (
                                <Badge variant="outline" className="mt-1 text-xs border-colibri-green/20 shadow-lg shadow-colibri-green/5 text-blue-400">
                                  Mesa {order.table}
                                </Badge>
                              )}
                            </div>
                            <div className="text-right">
                              <p className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-400">
                                ${parseFloat(order.total_amount).toFixed(2)}
                              </p>
                              <Badge className="bg-colibri-green/20 text-blue-400 border-colibri-green/20 shadow-lg shadow-colibri-green/5 mt-1">
                                {order.payment_method === 'cash' || order.payment_method === 'efectivo' ? '💵 Efectivo' : '💳 Tarjeta'}
                              </Badge>
                            </div>
                          </div>
                          
                          <div className="space-y-1 mb-3">
                            {normalizeOrderItems(order.items).map((item: any, idx: number) => (
                              <div key={idx} className="flex justify-between text-sm">
                                <span className="text-slate-600">{item.quantity}x {item.name}</span>
                                <span className="text-colibri-wine">${parseFloat(item.price).toFixed(2)}</span>
                              </div>
                            ))}
                            {normalizeOrderItems(order.items).length === 0 && (
                              <p className="text-slate-600 text-xs italic">Sin items</p>
                            )}
                          </div>

                          <Button
                            onClick={() => handleCollectOrder(order)}
                            className="w-full bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700"
                          >
                            <DollarSign className="h-4 w-4 mr-2" />
                            Cobrar ${parseFloat(order.total || 0).toFixed(2)}
                          </Button>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tab: Estadísticas */}
          <TabsContent value="stats" className="space-y-4 m-0">
            {/* Stats principales */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <Card className="bg-gradient-to-br from-green-50/90 to-green-100/70 backdrop-blur-xl border-green-700/30">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm text-slate-600 flex items-center gap-2">
                    <DollarSign className="h-4 w-4 text-green-400" />
                    Total Vendido
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-emerald-400">
                    ${parseFloat(shiftStats?.total_sales || 0).toFixed(2)}
                  </p>
                  <p className="text-xs text-gray-400 mt-1">
                    {shiftStats?.total_orders || 0} pedidos totales
                  </p>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-blue-50/90 to-blue-100/70 backdrop-blur-xl border-blue-700/30">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm text-slate-600 flex items-center gap-2">
                    <CreditCard className="h-4 w-4 text-blue-400" />
                    Ventas Tarjeta
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-400">
                    ${parseFloat(shiftStats?.card_sales || 0).toFixed(2)}
                  </p>
                  <p className="text-xs text-gray-400 mt-1">
                    {shiftStats?.card_orders || 0} transacciones
                  </p>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-white/70 to-white/50 backdrop-blur-xl border-colibri-green/20 shadow-lg shadow-colibri-green/5">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm text-slate-600 flex items-center gap-2">
                    <DollarSign className="h-4 w-4 text-colibri-wine" />
                    Ventas Efectivo
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-colibri-wine to-colibri-gold">
                    ${parseFloat(shiftStats?.cash_sales || 0).toFixed(2)}
                  </p>
                  <p className="text-xs text-gray-400 mt-1">
                    {shiftStats?.cash_orders || 0} transacciones
                  </p>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-orange-50/90 to-orange-100/70 backdrop-blur-xl border-orange-700/30">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm text-slate-600 flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-colibri-wine" />
                    Ticket Promedio
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-colibri-wine to-amber-400">
                    ${(parseFloat(shiftStats?.total_sales || 0) / Math.max(1, shiftStats?.total_orders || 1)).toFixed(2)}
                  </p>
                  <p className="text-xs text-gray-400 mt-1">
                    Por pedido
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Ventas por origen */}
            <Card className="bg-white/70 backdrop-blur-xl border-colibri-green/20 shadow-lg">
              <CardHeader>
                <CardTitle className="text-slate-800 flex items-center gap-2">
                  <Package className="h-5 w-5 text-colibri-wine" />
                  Ventas por Origen
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-3 md:grid-cols-3">
                  <div className="p-4 rounded-lg bg-gradient-to-br from-purple-50 to-purple-100 border border-purple-200">
                    <div className="flex items-center gap-2 mb-2">
                      <Monitor className="h-5 w-5 text-purple-600" />
                      <span className="text-sm font-semibold text-purple-900">Kiosko</span>
                    </div>
                    <p className="text-2xl font-bold text-purple-700">
                      ${parseFloat(shiftStats?.kiosk_sales || 0).toFixed(2)}
                    </p>
                    <p className="text-xs text-purple-600 mt-1">
                      {shiftStats?.kiosk_orders || 0} pedidos
                    </p>
                  </div>

                  <div className="p-4 rounded-lg bg-gradient-to-br from-amber-50 to-amber-100 border border-amber-200">
                    <div className="flex items-center gap-2 mb-2">
                      <Package className="h-5 w-5 text-amber-600" />
                      <span className="text-sm font-semibold text-amber-900">Comedor</span>
                    </div>
                    <p className="text-2xl font-bold text-amber-700">
                      ${parseFloat(shiftStats?.dine_in_sales || 0).toFixed(2)}
                    </p>
                    <p className="text-xs text-amber-600 mt-1">
                      {shiftStats?.dine_in_orders || 0} pedidos
                    </p>
                  </div>

                  <div className="p-4 rounded-lg bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200">
                    <div className="flex items-center gap-2 mb-2">
                      <Globe className="h-5 w-5 text-blue-600" />
                      <span className="text-sm font-semibold text-blue-900">Online</span>
                    </div>
                    <p className="text-2xl font-bold text-blue-700">
                      ${parseFloat(shiftStats?.online_sales || 0).toFixed(2)}
                    </p>
                    <p className="text-xs text-blue-600 mt-1">
                      {shiftStats?.online_orders || 0} pedidos
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Movimientos de Efectivo */}
            <div className="grid gap-4 md:grid-cols-2">
              <Card className="bg-gradient-to-br from-green-50/90 to-green-100/70 backdrop-blur-xl border-green-500/30">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm text-slate-600 flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-green-500" />
                    Entradas de Efectivo
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold text-green-600">
                    +${parseFloat(shiftStats?.cash_in || 0).toFixed(2)}
                  </p>
                  <p className="text-xs text-gray-400 mt-1">
                    {shiftStats?.cash_in_count || 0} movimientos
                  </p>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-red-50/90 to-red-100/70 backdrop-blur-xl border-red-500/30">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm text-slate-600 flex items-center gap-2">
                    <TrendingDown className="h-4 w-4 text-red-500" />
                    Salidas de Efectivo
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold text-red-600">
                    -${parseFloat(shiftStats?.cash_out || 0).toFixed(2)}
                  </p>
                  <p className="text-xs text-gray-400 mt-1">
                    {shiftStats?.cash_out_count || 0} movimientos
                  </p>
                </CardContent>
              </Card>
            </div>

            <Card className="bg-white/70 backdrop-blur-xl border-colibri-green/20 shadow-lg shadow-colibri-green/5">
              <CardHeader>
                <CardTitle className="text-slate-800 flex items-center gap-2">
                  <Clock className="h-5 w-5 text-colibri-wine" />
                  Información del Turno
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between items-center py-2 border-b border-colibri-green/20">
                  <span className="text-slate-600">Cajero:</span>
                  <span className="text-slate-800 font-semibold">{currentShift.user_name}</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-colibri-green/20">
                  <span className="text-slate-600">Turno:</span>
                  <span className="text-slate-800 font-semibold capitalize">{currentShift.shift_type}</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-colibri-green/20">
                  <span className="text-slate-600">Apertura:</span>
                  <span className="text-slate-800 font-semibold">
                    {new Date(currentShift.opened_at).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-colibri-green/20">
                  <span className="text-slate-600">Efectivo inicial:</span>
                  <span className="text-green-600 font-bold">${parseFloat(currentShift.opening_cash).toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-colibri-green/20">
                  <span className="text-slate-600">Ventas efectivo:</span>
                  <span className="text-blue-600 font-bold">+${parseFloat(shiftStats?.cash_sales || 0).toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-colibri-green/20">
                  <span className="text-slate-600">Entradas efectivo:</span>
                  <span className="text-green-600 font-bold">+${parseFloat(shiftStats?.cash_in || 0).toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-colibri-green/20">
                  <span className="text-slate-600">Salidas efectivo:</span>
                  <span className="text-red-600 font-bold">-${parseFloat(shiftStats?.cash_out || 0).toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center py-2 bg-colibri-gold/10 rounded-lg px-3">
                  <span className="text-slate-800 font-semibold">Efectivo esperado:</span>
                  <span className="text-colibri-wine font-black text-lg">
                    ${(
                      parseFloat(currentShift.opening_cash) + 
                      parseFloat(shiftStats?.cash_sales || 0) + 
                      parseFloat(shiftStats?.cash_in || 0) - 
                      parseFloat(shiftStats?.cash_out || 0)
                    ).toFixed(2)}
                  </span>
                </div>
              </CardContent>
            </Card>

            {/* Detalle de Movimientos de Efectivo */}
            {shiftStats?.cash_movements && shiftStats.cash_movements.length > 0 && (
              <Card className="bg-white/70 backdrop-blur-xl border-colibri-green/20 shadow-lg">
                <CardHeader>
                  <CardTitle className="text-slate-800 flex items-center gap-2">
                    <Package className="h-5 w-5 text-colibri-wine" />
                    Historial de Movimientos
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 max-h-96 overflow-y-auto">
                    {shiftStats.cash_movements.map((movement: any) => (
                      <div 
                        key={movement.id}
                        className={`flex justify-between items-start p-3 rounded-lg border ${
                          movement.transaction_type === 'cash_in' 
                            ? 'bg-green-50/50 border-green-200' 
                            : 'bg-red-50/50 border-red-200'
                        }`}
                      >
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            {movement.transaction_type === 'cash_in' ? (
                              <TrendingUp className="h-4 w-4 text-green-600" />
                            ) : (
                              <TrendingDown className="h-4 w-4 text-red-600" />
                            )}
                            <span className={`font-semibold ${
                              movement.transaction_type === 'cash_in' ? 'text-green-700' : 'text-red-700'
                            }`}>
                              {movement.transaction_type === 'cash_in' ? 'Entrada' : 'Salida'}
                            </span>
                          </div>
                          <p className="text-xs text-slate-600 mt-1">{movement.notes}</p>
                          <p className="text-xs text-slate-400 mt-1">
                            {new Date(movement.created_at).toLocaleString('es-MX')}
                          </p>
                        </div>
                        <span className={`font-bold text-lg ${
                          movement.transaction_type === 'cash_in' ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {movement.transaction_type === 'cash_in' ? '+' : '-'}${parseFloat(movement.amount).toFixed(2)}
                        </span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
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
        onAddToCart={(product, modifiers, totalPrice) => {
          addToCart(product, modifiers)
          setShowModifierModal(false)
          setSelectedProduct(null)
        }}
      />

      <CollectPaymentModal
        isOpen={showCollectModal}
        onClose={() => {
          setShowCollectModal(false)
          setSelectedOrder(null)
        }}
        order={selectedOrder}
        onConfirm={handleConfirmCollect}
      />

      <CashMovementModal
        isOpen={showCashMovement}
        onClose={() => setShowCashMovement(false)}
        shiftId={currentShift?.id}
        type={cashMovementType}
        onSuccess={handleCashMovementSuccess}
      />
    </div>
  )
}






