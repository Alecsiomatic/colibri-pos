'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { CheckCircle, Package, Clock, MapPin, CreditCard, Truck, ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'
import dynamic from 'next/dynamic'

// Cargar Confetti dinámicamente solo en el cliente
const Confetti = dynamic(() => import('react-confetti'), { ssr: false })

interface OrderItem {
  id: number
  name: string
  price: number
  quantity: number
}

interface Order {
  id: number
  customer_info?: {
    name?: string
    email?: string
    phone?: string
  }
  delivery_address?: string | any
  total: number
  payment_method: string
  status: string
  items: OrderItem[]
  created_at: string
  estimated_delivery?: number
}

interface ThankYouClientProps {
  orderId?: string
  paymentMethod?: string
  status?: string
}

export default function ThankYouClient({ orderId, paymentMethod, status }: ThankYouClientProps) {
  const router = useRouter()
  
  const [order, setOrder] = useState<Order | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showConfetti, setShowConfetti] = useState(true)
  const [windowSize, setWindowSize] = useState({ width: 0, height: 0 })

  useEffect(() => {
    console.log('🎉 Thank You Client: Props recibidas:', { orderId, paymentMethod, status })
    
    // Configurar tamaño de ventana
    const updateSize = () => {
      setWindowSize({
        width: window.innerWidth,
        height: window.innerHeight,
      })
    }

    updateSize()
    window.addEventListener('resize', updateSize)

    // Ocultar confetti después de 6 segundos
    const confettiTimer = setTimeout(() => {
      setShowConfetti(false)
    }, 6000)

    // Validar orderId inmediatamente
    if (!orderId) {
      console.error('❌ No se encontró orderId en props')
      setError('No se encontró el ID del pedido')
      setLoading(false)
      
      // Redirigir al menú después de 3 segundos
      setTimeout(() => {
        console.log('🔄 Redirigiendo al menú por falta de orderId')
        router.push('/menu')
      }, 3000)
      return
    }

    // Fetch order data
    fetchOrder(orderId)

    return () => {
      window.removeEventListener('resize', updateSize)
      clearTimeout(confettiTimer)
    }
  }, [orderId, paymentMethod, status, router])

  const fetchOrder = async (orderId: string) => {
    try {
      console.log('📡 Fetching order:', orderId)
      const response = await fetch(`/api/orders-mysql/${orderId}`)
      
      if (!response.ok) {
        throw new Error(`Error HTTP: ${response.status}`)
      }
      
      const data = await response.json()
      
      if (data.success && data.order) {
        console.log('✅ Order data recibida:', data.order)
        console.log('🔢 Order total type:', typeof data.order.total, 'value:', data.order.total)
        console.log('📦 Order items:', data.order.items)
        
        // Parsear items si viene como string JSON
        if (data.order.items && typeof data.order.items === 'string') {
          try {
            data.order.items = JSON.parse(data.order.items)
          } catch (e) {
            console.error('Error parsing items:', e)
            data.order.items = []
          }
        }
        
        setOrder(data.order)
      } else {
        throw new Error(data.message || 'Error al obtener el pedido')
      }
    } catch (err) {
      console.error('❌ Error fetching order:', err)
      setError('Error al cargar los datos del pedido')
    } finally {
      setLoading(false)
    }
  }

  const getPaymentStatusInfo = () => {
    if (paymentMethod === 'mercadopago') {
      if (status === 'success') {
        return {
          color: 'bg-green-500',
          text: 'Pago Confirmado',
          icon: CheckCircle,
          description: 'Tu pago ha sido procesado exitosamente'
        }
      } else if (status === 'pending') {
        return {
          color: 'bg-yellow-500',
          text: 'Pago Pendiente',
          icon: Clock,
          description: 'Estamos verificando tu pago'
        }
      }
    }
    
    return {
      color: 'bg-blue-500',
      text: 'Pago en Efectivo',
      icon: Package,
      description: 'Pagarás al recibir tu pedido'
    }
  }

  // Función auxiliar para formatear moneda de manera segura
  const formatCurrency = (value: any): string => {
    const num = Number(value || 0);
    return isNaN(num) ? '$0.00' : `$${num.toFixed(2)}`;
  }

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-black flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-colibri-gold mx-auto mb-4"></div>
          <p className="text-colibri-beige text-lg">Cargando detalles de tu pedido...</p>
        </div>
      </div>
    )
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-black flex items-center justify-center p-4">
        <Card className="w-full max-w-md backdrop-blur-sm bg-white/10 border-red-500/20">
          <CardContent className="text-center p-6">
            <div className="text-red-400 text-6xl mb-4">⚠️</div>
            <h2 className="text-2xl font-bold text-white mb-3">Error</h2>
            <p className="text-red-200 mb-6">{error}</p>
            <div className="space-y-2">
              <p className="text-sm text-red-300">Redirigiendo al menú en 3 segundos...</p>
              <Button 
                onClick={() => router.push('/menu')} 
                className="w-full bg-red-600 hover:bg-red-700"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Ir al Menú Ahora
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  const paymentInfo = getPaymentStatusInfo()
  const PaymentIcon = paymentInfo.icon

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-black py-12">
      {/* Confetti */}
      <AnimatePresence>
        {showConfetti && windowSize.width > 0 && (
          <Confetti
            width={windowSize.width}
            height={windowSize.height}
            recycle={false}
            numberOfPieces={400}
            gravity={0.1}
          />
        )}
      </AnimatePresence>

      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Success Header */}
        <motion.div
          initial={{ opacity: 0, y: -50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-center mb-8"
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
            className="inline-flex items-center justify-center w-20 h-20 bg-green-500 rounded-full mb-4"
          >
            <CheckCircle className="w-12 h-12 text-white" />
          </motion.div>
          
          <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-green-400 via-emerald-400 to-teal-400 bg-clip-text text-transparent mb-3">
            ¡Pedido Confirmado!
          </h1>
          
          <p className="text-colibri-beige text-lg">
            Gracias por tu orden galáctica 🚀
          </p>
        </motion.div>

        {/* Order Info Card */}
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.6 }}
        >
          <Card className="backdrop-blur-sm bg-white/10 border-colibri-gold/30 mb-6">
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <CardTitle className="text-white text-xl">
                  Pedido #{orderId}
                </CardTitle>
                <Badge 
                  className={`${paymentInfo.color} text-white border-none`}
                >
                  <PaymentIcon className="w-4 h-4 mr-1" />
                  {paymentInfo.text}
                </Badge>
              </div>
              <p className="text-colibri-beige text-sm">{paymentInfo.description}</p>
            </CardHeader>
            
            <CardContent className="space-y-4">
              {order && (
                <>
                  {/* Customer Info */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <h3 className="text-white font-semibold flex items-center">
                        <Package className="w-4 h-4 mr-2" />
                        Información del Cliente
                      </h3>
                      <div className="text-colibri-beige text-sm space-y-1">
                        <p><strong>Nombre:</strong> {order.customer_info?.name || 'No especificado'}</p>
                        <p><strong>Email:</strong> {order.customer_info?.email || 'No especificado'}</p>
                        <p><strong>Teléfono:</strong> {order.customer_info?.phone || 'No especificado'}</p>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <h3 className="text-white font-semibold flex items-center">
                        <MapPin className="w-4 h-4 mr-2" />
                        Dirección de Entrega
                      </h3>
                      <p className="text-colibri-beige text-sm">
                        {(() => {
                          if (!order.delivery_address) return 'Recojo en tienda';
                          if (typeof order.delivery_address === 'string') {
                            try {
                              const parsed = JSON.parse(order.delivery_address);
                              return parsed.street || order.delivery_address;
                            } catch {
                              return order.delivery_address;
                            }
                          }
                          if (typeof order.delivery_address === 'object') {
                            return order.delivery_address.street || 'Dirección no especificada';
                          }
                          return 'Recojo en tienda';
                        })()}
                      </p>
                    </div>
                  </div>

                  <Separator className="bg-colibri-gold/30" />

                  {/* Order Items */}
                  <div>
                    <h3 className="text-white font-semibold mb-3 flex items-center">
                      <Truck className="w-4 h-4 mr-2" />
                      Detalles del Pedido
                    </h3>
                    <div className="space-y-2">
                      {order.items?.map((item, index) => {
                        const price = Number(item.price || 0);
                        const quantity = Number(item.quantity || 0);
                        const subtotal = price * quantity;
                        
                        return (
                          <div key={index} className="flex justify-between items-center text-colibri-beige text-sm">
                            <span>{quantity}x {item.name}</span>
                            <span>{formatCurrency(subtotal)}</span>
                          </div>
                        );
                      })}
                    </div>
                    
                    <Separator className="bg-colibri-gold/30 my-3" />
                    
                    <div className="flex justify-between items-center text-white font-bold text-lg">
                      <span>Total:</span>
                      <span>{formatCurrency(order.total)}</span>
                    </div>
                  </div>

                  {/* Delivery Info */}
                  <div className="bg-slate-800/60 rounded-lg p-4">
                    <h3 className="text-white font-semibold mb-2 flex items-center">
                      <Clock className="w-4 h-4 mr-2" />
                      Información de Entrega
                    </h3>
                    <div className="text-colibri-beige text-sm space-y-1">
                      <p><strong>Estado:</strong> {order.status}</p>
                      <p><strong>Tiempo estimado:</strong> {order.estimated_delivery || 30} minutos</p>
                      <p><strong>Método de pago:</strong> {order.payment_method === 'efectivo' ? 'Efectivo' : 'MercadoPago'}</p>
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Actions */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8, duration: 0.6 }}
          className="grid grid-cols-1 md:grid-cols-2 gap-4"
        >
          <Button
            onClick={() => router.push(`/orders/${orderId}/tracking`)}
            className="w-full bg-gradient-to-r from-colibri-green to-colibri-wine hover:from-colibri-green/90 hover:to-colibri-wine/90 text-white"
            size="lg"
          >
            <MapPin className="w-5 h-5 mr-2" />
            Rastrear Pedido
          </Button>
          
          <Button
            onClick={() => router.push('/menu')}
            variant="outline"
            className="w-full border-colibri-gold/50 text-colibri-beige hover:bg-slate-800/40"
            size="lg"
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
            Volver al Menú
          </Button>
        </motion.div>

        {/* Footer Message */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1, duration: 0.6 }}
          className="text-center mt-8"
        >
          <p className="text-colibri-gold text-sm">
            Te notificaremos cuando tu pedido esté en camino 📱
          </p>
        </motion.div>
      </div>
    </div>
  )
}