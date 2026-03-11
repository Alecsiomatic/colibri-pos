'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import dynamic from 'next/dynamic'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Separator } from '@/components/ui/separator'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { 
  ShoppingCart, 
  Trash2, 
  Plus, 
  Minus, 
  CreditCard, 
  Truck, 
  Store,
  User,
  Phone,
  Mail,
  MapPin,
  Clock,
  CheckCircle,
  AlertCircle,
  Loader2,
  UserCheck,
  Tag,
  Ticket,
  Crown
} from 'lucide-react'
import { useCart } from '@/hooks/use-cart'
import { useAuth } from '@/hooks/use-auth'
import { useToast } from '@/hooks/use-notifications'

const DeliveryMap = dynamic(() => import('@/components/DeliveryMap'), {
  ssr: false,
  loading: () => (
    <div className="h-64 bg-slate-800/60 animate-pulse rounded-lg flex items-center justify-center">
      <Loader2 className="w-8 h-8 text-colibri-gold animate-spin" />
    </div>
  )
})

export default function CheckoutPage() {
  const router = useRouter()
  const { items, updateQuantity, removeItem, total, itemCount, createOrder, clearCart, hydrated } = useCart()
  const { user } = useAuth()
  const toast = useToast()

  // Helper function to determine if user should use mesero checkout
  const shouldUseMeseroCheckout = (user: any) => {
    return user?.is_waiter && !user?.is_admin && !user?.is_driver
  }

  // Redirect meseros to specialized checkout
  useEffect(() => {
    if (user && shouldUseMeseroCheckout(user)) {
      router.push('/checkout/mesero')
    }
  }, [user, router])

  // Form states
  const [customerInfo, setCustomerInfo] = useState({
    name: '',
    phone: '',
    email: user?.email || '',
  })
  
  const [tableInfo, setTableInfo] = useState({
    table: '',
    notes: '',
  })
  const [mesasAbiertas, setMesasAbiertas] = useState<any[]>([]);
  const [mesaSeleccionada, setMesaSeleccionada] = useState<string>('');
  const [loadingMesas, setLoadingMesas] = useState(false);
  
  const [deliveryInfo, setDeliveryInfo] = useState({
    address: '',
    notes: '',
  })
  const [orderType, setOrderType] = useState<'delivery' | 'pickup'>('pickup')
  const [paymentMethod, setPaymentMethod] = useState('efectivo')
  const [isProcessing, setIsProcessing] = useState(false)
  const [checkoutSuccess, setCheckoutSuccess] = useState(false)
  const [errors, setErrors] = useState<{ [key: string]: string }>({})
  
  // Delivery cost calculation
  const [deliveryCost, setDeliveryCost] = useState(25)
  const [calculatingCost, setCalculatingCost] = useState(false)
  const [deliveryData, setDeliveryData] = useState<any>(null)
  const [costError, setCostError] = useState<string | null>(null)
  const [restaurantLocation, setRestaurantLocation] = useState<{lat: number, lng: number} | null>(null)
  const [deliveryLocation, setDeliveryLocation] = useState<{lat: number, lng: number} | null>(null)

  // Promotions & Coupons
  const [couponCode, setCouponCode] = useState('')
  const [couponLoading, setCouponLoading] = useState(false)
  const [couponError, setCouponError] = useState<string | null>(null)
  const [appliedDiscounts, setAppliedDiscounts] = useState<{ promotion_id: number; promotion_name: string; type: string; discount_amount: number; coupon_code?: string }[]>([])
  const [totalDiscount, setTotalDiscount] = useState(0)
  
  // Loyalty
  const [loyaltyInfo, setLoyaltyInfo] = useState<{ total_points: number; tier_label: string; tier_multiplier: number } | null>(null)
  const [loyaltyConfig, setLoyaltyConfig] = useState<{ redemption_value: number; min_redeem: number; is_active: boolean } | null>(null)
  const [pointsToRedeem, setPointsToRedeem] = useState(0)
  const [loyaltyDiscount, setLoyaltyDiscount] = useState(0)
  const [loyaltyLoading, setLoyaltyLoading] = useState(false)

  // Autocompletado de direcciones con Nominatim
  const [addressSuggestions, setAddressSuggestions] = useState<any[]>([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [searchingAddress, setSearchingAddress] = useState(false)
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  // Buscar sugerencias de direcciones con Nominatim
  const searchAddressSuggestions = async (query: string) => {
    if (query.length < 5) {
      setAddressSuggestions([])
      return
    }

    setSearchingAddress(true)
    
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?` +
        `format=json&q=${encodeURIComponent(query)}&` +
        `countrycodes=mx&limit=5&addressdetails=1`,
        {
          headers: {
            'Accept-Language': 'es'
          }
        }
      )
      
      const data = await response.json()
      setAddressSuggestions(data)
      setShowSuggestions(data.length > 0)
    } catch (error) {
      console.error('Error searching address:', error)
      setAddressSuggestions([])
    } finally {
      setSearchingAddress(false)
    }
  }

  // Manejar cambio en input de dirección con debounce
  const handleAddressInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setDeliveryInfo(prev => ({ ...prev, address: value }))
    
    // Limpiar timeout anterior
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current)
    }
    
    // Buscar después de 500ms de inactividad
    searchTimeoutRef.current = setTimeout(() => {
      searchAddressSuggestions(value)
    }, 500)
  }

  // Seleccionar una sugerencia
  const selectAddressSuggestion = (suggestion: any) => {
    const address = suggestion.display_name
    setDeliveryInfo(prev => ({ ...prev, address }))
    setDeliveryLocation({
      lat: parseFloat(suggestion.lat),
      lng: parseFloat(suggestion.lon)
    })
    setShowSuggestions(false)
    setAddressSuggestions([])
  }

  // Limpiar timeout al desmontar
  useEffect(() => {
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current)
      }
    }
  }, [])

  // Cerrar sugerencias al hacer click fuera
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement
      if (!target.closest('#address') && !target.closest('.address-suggestions')) {
        setShowSuggestions(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Fetch mesas abiertas para mesero
  useEffect(() => {
    if (shouldUseMeseroCheckout(user)) {
      setLoadingMesas(true);
      fetch('/api/mesero/open-tables', { credentials: 'include' })
        .then(res => res.json())
        .then(data => {
          if (data.success) setMesasAbiertas(data.tables || []);
        })
        .finally(() => setLoadingMesas(false));
    }
  }, [user]);

  // Redirect if cart is empty (but not if checkout was successful)
  useEffect(() => {
    if (itemCount === 0 && !checkoutSuccess && !isProcessing) {
      console.log('🔄 Carrito vacío, redirigiendo al menú...')
      router.push('/menu')
    }
  }, [itemCount, router, checkoutSuccess, isProcessing])

  // Pre-fill user email if logged in
  useEffect(() => {
    if (user?.email) {
      setCustomerInfo(prev => ({ ...prev, email: user.email }))
    }
  }, [user])

  // Limpiar carrito después de redirección exitosa
  useEffect(() => {
    if (checkoutSuccess) {
      // Dar tiempo para que la redirección se procese
      const timer = setTimeout(() => {
        clearCart()
      }, 100)
      
      return () => clearTimeout(timer)
    }
  }, [checkoutSuccess, clearCart])

  const validateForm = () => {
    let newErrors: { [key: string]: string } = {}
    
    if (shouldUseMeseroCheckout(user)) {
      if (!mesaSeleccionada && !tableInfo.table.trim()) {
        newErrors.table = 'Selecciona una mesa o crea una nueva'
      }
    } else {
      if (!customerInfo.name.trim()) {
        newErrors.name = 'El nombre es requerido'
      }
      if (!customerInfo.phone.trim()) {
        newErrors.phone = 'El teléfono es requerido'
      } else if (!/^[\d\s\-\+\(\)]+$/.test(customerInfo.phone)) {
        newErrors.phone = 'Formato de teléfono inválido'
      }
      if (!customerInfo.email.trim()) {
        newErrors.email = 'El email es requerido'
      } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(customerInfo.email)) {
        newErrors.email = 'Formato de email inválido'
      }
      
      if (orderType === 'delivery') {
        if (!deliveryInfo.address.trim()) {
          newErrors.address = 'La dirección es requerida'
        }
        // Validar que no esté fuera de rango
        if (costError && costError.includes('fuera')) {
          newErrors.address = 'Esta dirección está fuera de nuestra zona de entrega'
        }
      }
    }
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validateForm()) {
      toast.error('Formulario incompleto', 'Por favor completa todos los campos requeridos')
      return
    }
    setIsProcessing(true)

    try {
      // Si es delivery y no tenemos coordenadas, calcular antes de crear orden
      if (orderType === 'delivery' && !deliveryLocation && deliveryInfo.address) {
        await calculateDeliveryCost()
      }
      
      let orderData: any
      if (shouldUseMeseroCheckout(user)) {
        orderData = {
          customer_info: customerInfo,
          table: mesaSeleccionada ? mesaSeleccionada : tableInfo.table,
          notes: tableInfo.notes,
          delivery_type: 'dine_in'
        }
      } else {
        orderData = {
          customer_info: customerInfo,
          delivery_address: orderType === 'delivery' ? JSON.stringify({
            street: deliveryInfo.address,
            lat: deliveryLocation?.lat || null,
            lng: deliveryLocation?.lng || null
          }) : null,
          payment_method: paymentMethod,
          notes: deliveryInfo.notes,
          delivery_type: orderType,
          discount_amount: totalDiscount + loyaltyDiscount,
          discount_detail: appliedDiscounts.length > 0 ? appliedDiscounts : undefined,
          coupon_code: appliedDiscounts.find(d => d.coupon_code)?.coupon_code || undefined,
          loyalty_points_redeemed: pointsToRedeem > 0 ? pointsToRedeem : undefined,
          loyalty_discount: loyaltyDiscount > 0 ? loyaltyDiscount : undefined,
        }
      }
      
      const result = await createOrder(orderData)
      console.log('🔍 Resultado de createOrder:', result)
      
      if (result.success) {
        console.log('✅ Pedido creado exitosamente, orderId:', result.orderId)
        
        if (shouldUseMeseroCheckout(user)) {
          clearCart()
          router.push('/mesero/mesas-abiertas')
          return
        }
        
        if (paymentMethod === 'mercadopago') {
          console.log('💳 Procesando pago con MercadoPago...')
          const mpResponse = await fetch('/api/mercadopago/create-preference', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              items: items.map(item => ({
                id: item.id,
                name: item.name,
                description: item.name,
                price: Number(item.price),
                quantity: item.quantity
              })),
              orderId: result.orderId,
              customerInfo: {
                name: customerInfo.name,
                email: customerInfo.email,
                phone: customerInfo.phone,
                address: deliveryInfo.address
              }
            })
          })

          const mpData = await mpResponse.json()
          if (mpData.success) {
            console.log('✅ Preferencia de MercadoPago creada, redirigiendo...')
            setCheckoutSuccess(true)
            window.location.href = mpData.initPoint
          } else {
            console.error('❌ Error en MercadoPago:', mpData)
            toast.error('Error', 'No se pudo procesar el pago')
          }
        } else {
          console.log('💰 Pago en efectivo, redirigiendo a thank you...')
          console.log('📋 OrderId recibido:', result.orderId)
          console.log('💳 Payment method:', paymentMethod)
          
          if (!result.orderId) {
            console.error('❌ Error: orderId es undefined o null')
            toast.error('Error', 'No se pudo obtener el ID del pedido')
            return
          }
          
          // Marcar checkout como exitoso ANTES de limpiar carrito
          setCheckoutSuccess(true)
          
          const thankYouUrl = `/orders/thank-you?orderId=${result.orderId}&payment=${paymentMethod}&status=success`
          console.log('🔗 Redirigiendo a:', thankYouUrl)
          
          // Usar window.location.href para navegación forzada
          window.location.href = thankYouUrl
        }
      } else {
        toast.error('Error', result.message || 'No se pudo crear el pedido')
      }
    } catch (error) {
      console.error('Error creating order:', error)
      toast.error('Error', 'No se pudo procesar el pedido')
    } finally {
      setIsProcessing(false)
    }
  }

  // Calculate delivery cost dynamically
  useEffect(() => {
    if (orderType === 'delivery' && deliveryInfo.address.trim().length > 10) {
      const timeoutId = setTimeout(() => {
        calculateDeliveryCost()
      }, 1000) // Debounce 1 segundo
      
      return () => clearTimeout(timeoutId)
    } else {
      setDeliveryData(null)
      setCostError(null)
    }
  }, [deliveryInfo.address, orderType, total])
  
  const calculateDeliveryCost = async () => {
    setCalculatingCost(true)
    setCostError(null)
    
    try {
      const response = await fetch('/api/delivery/calculate-cost', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          deliveryAddress: deliveryInfo.address,
          orderTotal: total
        })
      })
      
      const data = await response.json()
      
      if (data.success) {
        setDeliveryCost(data.cost)
        setDeliveryData(data)
        setCostError(null)
        
        // Actualizar ubicaciones para el mapa
        if (data.locations) {
          setRestaurantLocation(data.locations.restaurant)
          setDeliveryLocation(data.locations.delivery)
        }
      } else if (data.outOfRange) {
        // Dirección fuera del radio de entrega
        setCostError(data.error || `Dirección fuera de nuestro radio de entrega (máx: ${data.maxRadius} km)`)
        setDeliveryCost(0)
        setDeliveryData(null)
        
        // Aún así mostrar ubicaciones en el mapa para referencia
        if (data.locations) {
          setRestaurantLocation(data.locations.restaurant)
          setDeliveryLocation(data.locations.delivery)
        }
      } else {
        setCostError(data.error || 'No se pudo calcular el costo')
        setDeliveryCost(25) // Fallback
      }
    } catch (error) {
      console.error('Error calculating delivery cost:', error)
      setCostError('Error al calcular costo de envío')
      setDeliveryCost(25) // Fallback
    } finally {
      setCalculatingCost(false)
    }
  }

  // Fetch promotions when cart changes
  useEffect(() => {
    const fetchPromotions = async () => {
      try {
        const promoItems = items.map(item => ({
          id: item.id, name: item.name, price: item.price,
          quantity: item.quantity, category_name: item.category_name || ''
        }))
        const res = await fetch('/api/promotions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'apply',
            items: promoItems,
            channel: 'web',
            coupon_code: appliedDiscounts.find(d => d.coupon_code)?.coupon_code || undefined
          })
        }).then(r => r.json())
        if (res.success) {
          setAppliedDiscounts(res.discounts || [])
          setTotalDiscount(res.totalDiscount || 0)
        }
      } catch (e) { /* silent */ }
    }
    if (items.length > 0) fetchPromotions()
    else { setAppliedDiscounts([]); setTotalDiscount(0) }
  }, [items])

  // Fetch loyalty balance
  useEffect(() => {
    if (!user) return
    async function fetchLoyalty() {
      try {
        const [balRes, cfgRes] = await Promise.all([
          fetch('/api/loyalty?action=balance').then(r => r.json()),
          fetch('/api/loyalty?action=config').then(r => r.json()),
        ])
        if (balRes.success && balRes.loyalty) setLoyaltyInfo(balRes.loyalty)
        if (cfgRes.success && cfgRes.config) setLoyaltyConfig(cfgRes.config)
      } catch {}
    }
    fetchLoyalty()
  }, [user])

  // Update loyalty discount when points change
  useEffect(() => {
    if (loyaltyConfig && pointsToRedeem > 0) {
      setLoyaltyDiscount(Math.round(pointsToRedeem * loyaltyConfig.redemption_value * 100) / 100)
    } else {
      setLoyaltyDiscount(0)
    }
  }, [pointsToRedeem, loyaltyConfig])

  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) return
    setCouponLoading(true)
    setCouponError(null)
    try {
      const promoItems = items.map(item => ({
        id: item.id, name: item.name, price: item.price,
        quantity: item.quantity, category_name: item.category_name || ''
      }))
      const res = await fetch('/api/promotions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'apply',
          items: promoItems,
          channel: 'web',
          coupon_code: couponCode.trim().toUpperCase()
        })
      }).then(r => r.json())
      if (res.success && res.totalDiscount > 0) {
        setAppliedDiscounts(res.discounts || [])
        setTotalDiscount(res.totalDiscount || 0)
        toast.success('¡Cupón aplicado!')
      } else {
        setCouponError('Cupón no válido o no aplica a tu pedido')
      }
    } catch {
      setCouponError('Error al verificar cupón')
    }
    setCouponLoading(false)
  }

  const handleRemoveCoupon = () => {
    setCouponCode('')
    setCouponError(null)
    // Re-fetch promotions without coupon
    const fetchPromos = async () => {
      const promoItems = items.map(item => ({
        id: item.id, name: item.name, price: item.price,
        quantity: item.quantity, category_name: item.category_name || ''
      }))
      const res = await fetch('/api/promotions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'apply', items: promoItems, channel: 'web' })
      }).then(r => r.json())
      if (res.success) {
        setAppliedDiscounts(res.discounts || [])
        setTotalDiscount(res.totalDiscount || 0)
      }
    }
    fetchPromos()
  }

  const deliveryTotal = Math.max(0, (orderType === 'delivery' ? total + deliveryCost : total) - totalDiscount - loyaltyDiscount)

  if (!hydrated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-black flex items-center justify-center">
        <Loader2 className="w-10 h-10 text-colibri-gold animate-spin" />
      </div>
    )
  }

  if (itemCount === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-black flex items-center justify-center">
        <Card className="backdrop-blur-sm bg-slate-800/60 border-colibri-gold/20 p-8">
          <div className="text-center">
            <ShoppingCart className="h-16 w-16 mx-auto mb-4 text-colibri-gold" />
            <h2 className="text-2xl font-bold text-white mb-2">Carrito vacío</h2>
            <p className="text-colibri-beige mb-4">No tienes productos en tu carrito</p>
            <Button 
              onClick={() => router.push('/menu')}
              className="bg-gradient-to-r from-colibri-green to-colibri-wine hover:from-colibri-green/90 hover:to-colibri-wine/90 text-white"
            >
              Ver Menú
            </Button>
          </div>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-black py-8 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">Finalizar Pedido</h1>
          <p className="text-colibri-gold">Completa tu información para continuar</p>
        </div>

        <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Customer Info */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Mesa selection for mesero */}
            {shouldUseMeseroCheckout(user) ? (
              <Card className="backdrop-blur-sm bg-white/10 border-purple-500/20">
                <CardHeader>
                  <CardTitle className="text-white flex items-center">
                    <UserCheck className="h-5 w-5 mr-2" />
                    Selección de Mesa
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {loadingMesas ? (
                    <div className="flex items-center justify-center py-4">
                      <Loader2 className="h-6 w-6 animate-spin text-purple-400" />
                      <span className="ml-2 text-purple-300">Cargando mesas...</span>
                    </div>
                  ) : (
                    <>
                      {mesasAbiertas.length > 0 && (
                        <div>
                          <Label className="text-white">Mesas Abiertas</Label>
                          <div className="grid grid-cols-2 gap-2 mt-2">
                            {mesasAbiertas.map((mesa) => (
                              <Button
                                key={mesa.table_name}
                                type="button"
                                variant={mesaSeleccionada === mesa.table_name ? "default" : "outline"}
                                onClick={() => setMesaSeleccionada(mesa.table_name)}
                                className="text-sm"
                              >
                                {mesa.table_name}
                              </Button>
                            ))}
                          </div>
                        </div>
                      )}
                      
                      <div>
                        <Label htmlFor="table" className="text-white">Nueva Mesa</Label>
                        <Input
                          id="table"
                          value={tableInfo.table}
                          onChange={(e) => {
                            setTableInfo(prev => ({ ...prev, table: e.target.value }))
                            setMesaSeleccionada('')
                          }}
                          className="bg-white/10 border-purple-300/30 text-white placeholder:text-purple-300"
                          placeholder="Número o nombre de mesa"
                        />
                        {errors.table && (
                          <p className="text-red-400 text-sm mt-1">{errors.table}</p>
                        )}
                      </div>
                      
                      <div>
                        <Label htmlFor="table-notes" className="text-white">Notas (opcional)</Label>
                        <Textarea
                          id="table-notes"
                          value={tableInfo.notes}
                          onChange={(e) => setTableInfo(prev => ({ ...prev, notes: e.target.value }))}
                          className="bg-white/10 border-purple-300/30 text-white placeholder:text-purple-300"
                          placeholder="Notas sobre la mesa o pedido..."
                          rows={2}
                        />
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
            ) : (
              /* Customer info for regular users */
              <Card className="backdrop-blur-sm bg-white/10 border-purple-500/20">
                <CardHeader>
                  <CardTitle className="text-white flex items-center">
                    <User className="h-5 w-5 mr-2" />
                    Información del Cliente
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="name" className="text-white">Nombre completo *</Label>
                    <Input
                      id="name"
                      value={customerInfo.name}
                      onChange={(e) => setCustomerInfo(prev => ({ ...prev, name: e.target.value }))}
                      className="bg-white/10 border-purple-300/30 text-white placeholder:text-purple-300"
                      placeholder="Tu nombre completo"
                    />
                    {errors.name && (
                      <p className="text-red-400 text-sm mt-1">{errors.name}</p>
                    )}
                  </div>
                  <div>
                    <Label htmlFor="phone" className="text-white">Teléfono *</Label>
                    <Input
                      id="phone"
                      value={customerInfo.phone}
                      onChange={(e) => setCustomerInfo(prev => ({ ...prev, phone: e.target.value }))}
                      className="bg-white/10 border-purple-300/30 text-white placeholder:text-purple-300"
                      placeholder="Tu número de teléfono"
                    />
                    {errors.phone && (
                      <p className="text-red-400 text-sm mt-1">{errors.phone}</p>
                    )}
                  </div>
                  <div>
                    <Label htmlFor="email" className="text-white">Email *</Label>
                    <Input
                      id="email"
                      type="email"
                      value={customerInfo.email}
                      onChange={(e) => setCustomerInfo(prev => ({ ...prev, email: e.target.value }))}
                      className="bg-white/10 border-purple-300/30 text-white placeholder:text-purple-300"
                      placeholder="tu@email.com"
                    />
                    {errors.email && (
                      <p className="text-red-400 text-sm mt-1">{errors.email}</p>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Delivery Options - Only for non-mesero users */}
            {!shouldUseMeseroCheckout(user) && (
              <>
                <Card className="backdrop-blur-sm bg-slate-900/80 border-colibri-gold/30">
                  <CardHeader>
                    <CardTitle className="text-white flex items-center">
                      <Truck className="h-5 w-5 mr-2 text-colibri-gold" />
                      Opciones de Entrega
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <RadioGroup 
                      value={orderType} 
                      onValueChange={(value: 'delivery' | 'pickup') => setOrderType(value)}
                    >
                      <div className="flex items-center space-x-2 p-3 rounded-lg bg-slate-800/60 border border-colibri-green/40 hover:border-colibri-green transition-colors">
                        <RadioGroupItem value="delivery" id="delivery" />
                        <Label htmlFor="delivery" className="text-white flex-1 cursor-pointer">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center">
                              <Truck className="h-4 w-4 mr-2 text-colibri-green" />
                              <span>Delivery a domicilio</span>
                            </div>
                            <Badge className="bg-colibri-gold text-black font-bold">+${deliveryCost.toFixed(2)}</Badge>
                          </div>
                          <p className="text-colibri-beige text-sm mt-1">Entrega en 30-45 minutos</p>
                        </Label>
                      </div>
                      <div className="flex items-center space-x-2 p-3 rounded-lg bg-slate-800/60 border border-colibri-wine/40 hover:border-colibri-wine transition-colors">
                        <RadioGroupItem value="pickup" id="pickup" />
                        <Label htmlFor="pickup" className="text-white flex-1 cursor-pointer">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center">
                              <Store className="h-4 w-4 mr-2 text-colibri-wine" />
                              <span>Recoger en tienda</span>
                            </div>
                            <Badge className="bg-colibri-green text-white">Gratis</Badge>
                          </div>
                          <p className="text-colibri-beige text-sm mt-1">Listo en 15-20 minutos</p>
                        </Label>
                      </div>
                    </RadioGroup>

                    {orderType === 'delivery' && (
                      <div className="space-y-4">
                        <div className="relative">
                          <Label htmlFor="address" className="text-white flex items-center justify-between">
                            <div className="flex items-center">
                              <MapPin className="h-4 w-4 mr-2" />
                              Dirección de entrega *
                            </div>
                            {searchingAddress && (
                              <span className="text-purple-300 text-xs flex items-center gap-1">
                                <Loader2 className="w-3 h-3 animate-spin" />
                                Buscando...
                              </span>
                            )}
                          </Label>
                          <Input
                            id="address"
                            value={deliveryInfo.address}
                            onChange={handleAddressInputChange}
                            onFocus={() => addressSuggestions.length > 0 && setShowSuggestions(true)}
                            className="bg-white/10 border-purple-300/30 text-white placeholder:text-purple-300"
                            placeholder="Ej: Calle Ejemplo 123, San Luis Potosí, SLP"
                            autoComplete="off"
                          />
                          
                          {/* Sugerencias de direcciones */}
                          {showSuggestions && addressSuggestions.length > 0 && (
                            <div className="address-suggestions absolute z-50 w-full mt-1 bg-slate-800 border border-colibri-gold/30 rounded-lg shadow-xl max-h-60 overflow-y-auto">
                              {addressSuggestions.map((suggestion, index) => (
                                <button
                                  key={index}
                                  type="button"
                                  onClick={() => selectAddressSuggestion(suggestion)}
                                  className="w-full px-4 py-3 text-left hover:bg-colibri-green/20 transition-colors border-b border-slate-700 last:border-0"
                                >
                                  <div className="flex items-start gap-2">
                                    <MapPin className="w-4 h-4 mt-1 text-colibri-gold flex-shrink-0" />
                                    <div className="flex-1">
                                      <p className="text-white text-sm font-medium">
                                        {suggestion.display_name}
                                      </p>
                                      {suggestion.address && (
                                        <p className="text-colibri-beige text-xs mt-0.5">
                                          {suggestion.address.city || suggestion.address.town || suggestion.address.state}
                                        </p>
                                      )}
                                    </div>
                                  </div>
                                </button>
                              ))}
                            </div>
                          )}
                          
                          {errors.address && (
                            <p className="text-red-400 text-sm mt-1">{errors.address}</p>
                          )}
                          
                          {/* Indicador de sugerencias */}
                          {deliveryInfo.address.length >= 5 && !searchingAddress && addressSuggestions.length === 0 && (
                            <p className="text-yellow-400 text-xs mt-1 flex items-center gap-1">
                              <AlertCircle className="w-3 h-3" />
                              No se encontraron sugerencias. Escribe una dirección más específica o continúa manualmente.
                            </p>
                          )}
                          
                          {deliveryLocation && (
                            <div className="flex items-center text-green-400 text-sm mt-2">
                              <CheckCircle className="h-4 w-4 mr-2" />
                              Dirección validada con coordenadas GPS
                            </div>
                          )}
                          
                          {/* Información sobre búsqueda */}
                          <div className="mt-2 p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                            <p className="text-blue-300 text-sm">
                              💡 <strong>Tip:</strong> Empieza a escribir y aparecerán sugerencias automáticamente. También puedes escribir la dirección manualmente.
                            </p>
                          </div>
                        </div>
                        
                        <div>
                          <Label htmlFor="notes" className="text-white">Notas adicionales (opcional)</Label>
                          <Textarea
                            id="notes"
                            value={deliveryInfo.notes}
                            onChange={(e) => setDeliveryInfo(prev => ({ ...prev, notes: e.target.value }))}
                            className="bg-white/10 border-purple-300/30 text-white placeholder:text-purple-300"
                            placeholder="Instrucciones especiales, preferencias..."
                            rows={2}
                          />
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Payment Method */}
                <Card className="backdrop-blur-sm bg-white/10 border-purple-500/20">
                  <CardHeader>
                    <CardTitle className="text-white flex items-center">
                      <CreditCard className="h-5 w-5 mr-2" />
                      Método de Pago
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <RadioGroup value={paymentMethod} onValueChange={setPaymentMethod}>
                      <div className="flex items-center space-x-2 p-3 rounded-lg bg-white/5 border border-purple-300/20">
                        <RadioGroupItem value="efectivo" id="efectivo" />
                        <Label htmlFor="efectivo" className="text-white flex-1 cursor-pointer">
                          <div className="flex items-center">
                            <span className="text-lg mr-2">$</span>
                            <span>Efectivo</span>
                          </div>
                          <p className="text-purple-300 text-sm mt-1">Pago al recibir</p>
                        </Label>
                      </div>
                      <div className="flex items-center space-x-2 p-3 rounded-lg bg-white/5 border border-purple-300/20">
                        <RadioGroupItem value="mercadopago" id="mercadopago" />
                        <Label htmlFor="mercadopago" className="text-white flex-1 cursor-pointer">
                          <div className="flex items-center">
                            <CreditCard className="h-4 w-4 mr-2" />
                            <span>Tarjeta de crédito/débito</span>
                          </div>
                          <p className="text-purple-300 text-sm mt-1">Paga con Mercado Pago</p>
                        </Label>
                      </div>
                    </RadioGroup>
                  </CardContent>
                </Card>
              </>
            )}
          </div>

          {/* Right Column - Order Summary */}
          <div className="space-y-6">
            <Card className="backdrop-blur-sm bg-white/10 border-purple-500/20">
              <CardHeader>
                <CardTitle className="text-white flex items-center">
                  <ShoppingCart className="h-5 w-5 mr-2" />
                  Resumen del Pedido
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {items.map((item) => (
                  <div key={item.id} className="flex items-center space-x-3 p-3 rounded-lg bg-white/5">
                    <div className="flex-1">
                      <h4 className="font-medium text-white">{item.name}</h4>
                      <p className="text-sm text-purple-300">${Number(item.price).toFixed(2)} c/u</p>
                      
                      {/* Mostrar modificadores */}
                      {item.modifiers && item.modifiers.length > 0 && (
                        <div className="mt-1 space-y-0.5">
                          {item.modifiers.map((mod: any, idx: number) => (
                            <p key={idx} className="text-xs text-gray-400">
                              • {mod.group}: <span className="text-cyan-300">{mod.modifier}</span>
                              {mod.price !== 0 && <span className="text-green-400"> (+${mod.price.toFixed(2)})</span>}
                            </p>
                          ))}
                        </div>
                      )}
                    </div>
                    <div className="flex items-center space-x-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => updateQuantity(item.id, item.quantity - 1, item.modifiers)}
                        className="h-8 w-8 p-0 border-purple-500/50 hover:bg-purple-500/20"
                      >
                        <Minus className="h-3 w-3" />
                      </Button>
                      <span className="text-white font-medium w-8 text-center">{item.quantity}</span>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => updateQuantity(item.id, item.quantity + 1, item.modifiers)}
                        className="h-8 w-8 p-0 border-purple-500/50 hover:bg-purple-500/20"
                      >
                        <Plus className="h-3 w-3" />
                      </Button>
                    </div>
                    <div className="text-right">
                      <p className="text-white font-medium">${(Number(item.price) * item.quantity).toFixed(2)}</p>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeItem(item.id, item.modifiers)}
                        className="text-red-400 hover:text-red-300 p-1"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}

                <Separator className="bg-purple-500/30" />

                {/* Coupon Input */}
                <div className="space-y-2">
                  <label className="text-sm text-purple-300 flex items-center gap-2">
                    <Ticket className="w-4 h-4" /> ¿Tienes un cupón?
                  </label>
                  <div className="flex gap-2">
                    <Input
                      value={couponCode}
                      onChange={e => { setCouponCode(e.target.value.toUpperCase()); setCouponError(null) }}
                      placeholder="CÓDIGO"
                      className="bg-purple-900/30 border-purple-500/30 text-white uppercase tracking-wider text-sm flex-1"
                    />
                    <Button type="button" onClick={handleApplyCoupon} disabled={couponLoading || !couponCode.trim()}
                      variant="outline" className="border-purple-500/30 text-purple-300 hover:bg-purple-900/30 text-sm px-3">
                      {couponLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Aplicar'}
                    </Button>
                  </div>
                  {couponError && <p className="text-xs text-red-400">{couponError}</p>}
                </div>

                {/* Loyalty Points Redemption */}
                {loyaltyConfig?.is_active && loyaltyInfo && loyaltyInfo.total_points > 0 && (
                  <div className="space-y-2 p-3 rounded-lg bg-amber-900/20 border border-amber-500/20">
                    <label className="text-sm text-amber-300 flex items-center gap-2">
                      <Crown className="w-4 h-4" /> Canjear Puntos
                      <Badge variant="outline" className="ml-auto text-xs border-amber-500/30 text-amber-300">
                        {loyaltyInfo.total_points.toLocaleString()} pts disponibles
                      </Badge>
                    </label>
                    <div className="flex gap-2 items-center">
                      <Input
                        type="number"
                        min={0}
                        max={loyaltyInfo.total_points}
                        value={pointsToRedeem || ''}
                        onChange={e => {
                          const v = Math.min(Number(e.target.value) || 0, loyaltyInfo.total_points)
                          setPointsToRedeem(v)
                        }}
                        placeholder={`Mín. ${loyaltyConfig.min_redeem}`}
                        className="bg-amber-900/20 border-amber-500/30 text-white text-sm flex-1"
                      />
                      <Button type="button" variant="outline" size="sm"
                        className="border-amber-500/30 text-amber-300 hover:bg-amber-900/30 text-xs"
                        onClick={() => setPointsToRedeem(loyaltyInfo.total_points)}>
                        Máximo
                      </Button>
                      {pointsToRedeem > 0 && (
                        <Button type="button" variant="ghost" size="sm"
                          className="text-red-400 hover:text-red-300 text-xs px-2"
                          onClick={() => setPointsToRedeem(0)}>
                          ✕
                        </Button>
                      )}
                    </div>
                    {pointsToRedeem > 0 && pointsToRedeem < loyaltyConfig.min_redeem && (
                      <p className="text-xs text-amber-400">Mínimo {loyaltyConfig.min_redeem} puntos para canjear</p>
                    )}
                    {loyaltyDiscount > 0 && (
                      <p className="text-xs text-green-400">Descuento: -${loyaltyDiscount.toFixed(2)}</p>
                    )}
                  </div>
                )}

                {/* Applied Discounts */}
                {appliedDiscounts.length > 0 && (
                  <div className="space-y-1.5">
                    {appliedDiscounts.map((d, idx) => (
                      <div key={idx} className="flex justify-between items-center text-sm">
                        <span className="text-green-400 flex items-center gap-1.5">
                          <Tag className="w-3.5 h-3.5" />
                          {d.promotion_name}
                          {d.coupon_code && (
                            <button type="button" onClick={handleRemoveCoupon}
                              className="text-red-400 hover:text-red-300 text-xs ml-1">✕</button>
                          )}
                        </span>
                        <span className="text-green-400 font-medium">-${d.discount_amount.toFixed(2)}</span>
                      </div>
                    ))}
                  </div>
                )}

                <div className="space-y-2">
                  <div className="flex justify-between text-purple-300">
                    <span>Subtotal</span>
                    <span>${total.toFixed(2)}</span>
                  </div>
                  {orderType === 'delivery' && (
                    <div className="space-y-1">
                      <div className="flex justify-between text-purple-300">
                        <span className="flex items-center gap-2">
                          Envío
                          {calculatingCost && (
                            <Loader2 className="w-3 h-3 animate-spin" />
                          )}
                        </span>
                        <span>
                          {deliveryData?.isFreeDelivery ? (
                            <span className="text-green-400 font-semibold">¡GRATIS!</span>
                          ) : (
                            `$${deliveryCost.toFixed(2)}`
                          )}
                        </span>
                      </div>
                      {deliveryData && (
                        <div className="text-xs text-purple-400 space-y-0.5">
                          <div className="flex justify-between">
                            <span>📍 Distancia:</span>
                            <span>{deliveryData.distance} km</span>
                          </div>
                          <div className="flex justify-between">
                            <span>⏱️ Tiempo estimado:</span>
                            <span>{deliveryData.estimatedDeliveryTime}</span>
                          </div>
                          {deliveryData.isFreeDelivery && (
                            <div className="text-green-400 font-medium text-center mt-1">
                              🎁 Envío gratis por compra mayor a ${deliveryData.breakdown.baseFee}
                            </div>
                          )}
                        </div>
                      )}
                      {costError && (
                        <div className={`p-3 rounded-lg border ${
                          costError.includes('fuera') 
                            ? 'bg-red-500/10 border-red-500/30 text-red-400' 
                            : 'bg-orange-500/10 border-orange-500/30 text-orange-400'
                        }`}>
                          <div className="flex items-start gap-2">
                            <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                            <div className="flex-1 text-sm">
                              <p className="font-semibold mb-1">
                                {costError.includes('fuera') ? '⚠️ Fuera de zona de entrega' : 'Error'}
                              </p>
                              <p>{costError}</p>
                              {costError.includes('fuera') && (
                                <p className="mt-2 text-xs opacity-80">
                                  💡 Intenta con una dirección más cercana o selecciona "Recoger en tienda"
                                </p>
                              )}
                            </div>
                          </div>
                        </div>
                      )}
                      
                      {/* Mapa de delivery */}
                      {restaurantLocation && deliveryLocation && deliveryData?.route && (
                        <div className="mt-4 pt-4 border-t border-purple-500/20">
                          <p className="text-sm text-purple-300 mb-2 flex items-center gap-2">
                            <MapPin className="w-4 h-4" />
                            Vista previa de la ruta
                          </p>
                          <DeliveryMap
                            restaurantLocation={{
                              ...restaurantLocation,
                              label: 'Restaurante'
                            }}
                            deliveryLocation={{
                              ...deliveryLocation,
                              label: 'Tu dirección'
                            }}
                            route={deliveryData.route}
                            height="200px"
                          />
                        </div>
                      )}
                    </div>
                  )}
                  {totalDiscount > 0 && (
                    <div className="flex justify-between text-green-400 font-medium">
                      <span>Descuento</span>
                      <span>-${totalDiscount.toFixed(2)}</span>
                    </div>
                  )}
                  {loyaltyDiscount > 0 && (
                    <div className="flex justify-between text-amber-400 font-medium">
                      <span className="flex items-center gap-1"><Crown className="w-3.5 h-3.5" /> Puntos ({pointsToRedeem})</span>
                      <span>-${loyaltyDiscount.toFixed(2)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-white font-bold text-lg">
                    <span>Total</span>
                    <span>${deliveryTotal.toFixed(2)}</span>
                  </div>
                </div>

                <Button
                  type="submit"
                  disabled={isProcessing}
                  className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 disabled:opacity-50"
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Procesando...
                    </>
                  ) : (
                    <>
                      Confirmar Pedido
                      <Clock className="ml-2 h-4 w-4" />
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          </div>
        </form>
      </div>
    </div>
  )
}