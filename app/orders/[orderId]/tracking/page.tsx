'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import dynamic from 'next/dynamic'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { 
  MapPin, 
  Clock, 
  Package, 
  CheckCircle, 
  Truck,
  Phone,
  ArrowLeft,
  Navigation,
  Loader2
} from 'lucide-react'

// Cargar mapa dinámicamente
const DeliveryMap = dynamic(() => import('@/components/DeliveryMap'), {
  ssr: false,
  loading: () => (
    <div className="h-96 bg-slate-800/60 animate-pulse rounded-lg flex items-center justify-center">
      <Loader2 className="w-8 h-8 text-colibri-gold animate-spin" />
    </div>
  )
})

interface Order {
  id: number
  customer_info: any
  delivery_address: string | any
  total: number
  status: string
  payment_method: string
  created_at: string
  driver?: {
    id: number
    username: string
    phone: string
  }
  driver_location?: {
    lat: number
    lng: number
  }
  restaurant_location?: {
    lat: number
    lng: number
  }
  delivery_location?: {
    lat: number
    lng: number
  }
}

export default function OrderTrackingPage() {
  const params = useParams()
  const router = useRouter()
  const orderId = params.orderId as string
  
  const [order, setOrder] = useState<Order | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [refreshing, setRefreshing] = useState(false)

  useEffect(() => {
    fetchOrder()
    
    // Auto-refresh cada 10 segundos si el pedido está en delivery
    const interval = setInterval(() => {
      if (order && order.status !== 'delivered' && order.status !== 'cancelled') {
        fetchOrder(true)
      }
    }, 10000)
    
    return () => clearInterval(interval)
  }, [orderId])

  const fetchOrder = async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true)
    else setLoading(true)
    
    try {
      const response = await fetch(`/api/orders-mysql/${orderId}`)
      const data = await response.json()
      
      if (data.success && data.order) {
        // Convertir total a número si viene como string
        if (data.order.total && typeof data.order.total === 'string') {
          data.order.total = parseFloat(data.order.total)
        }
        
        setOrder(data.order)
        setError(null)
      } else {
        setError('Pedido no encontrado')
      }
    } catch (err) {
      setError('Error al cargar el pedido')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  const getStatusInfo = (status: string) => {
    const statusMap: any = {
      pending: { label: 'Pendiente', color: 'bg-yellow-500', icon: Clock },
      confirmed: { label: 'Confirmado', color: 'bg-blue-500', icon: Package },
      preparing: { label: 'Preparando', color: 'bg-orange-500', icon: Package },
      ready: { label: 'Listo', color: 'bg-green-500', icon: CheckCircle },
      'on-route': { label: 'En camino', color: 'bg-purple-500', icon: Truck },
      delivered: { label: 'Entregado', color: 'bg-green-600', icon: CheckCircle },
      cancelled: { label: 'Cancelado', color: 'bg-red-500', icon: Clock }
    }
    
    return statusMap[status] || statusMap.pending
  }

  const parseAddress = (address: any) => {
    if (!address) return 'No especificada'
    if (typeof address === 'string') {
      try {
        const parsed = JSON.parse(address)
        return parsed.street || address
      } catch {
        return address
      }
    }
    return address.street || 'No especificada'
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-black flex items-center justify-center">
        <Loader2 className="w-12 h-12 text-colibri-gold animate-spin" />
      </div>
    )
  }

  if (error || !order) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-black flex items-center justify-center p-4">
        <Card className="bg-slate-900/90 backdrop-blur-xl border-colibri-wine/30 max-w-md">
          <CardContent className="p-8 text-center">
            <div className="text-colibri-wine text-6xl mb-4">⚠️</div>
            <h2 className="text-2xl font-bold text-white mb-3">Error</h2>
            <p className="text-colibri-beige mb-6">{error}</p>
            <Button 
              onClick={() => router.push('/menu')}
              className="bg-gradient-to-r from-colibri-green to-colibri-wine"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Volver al Menú
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  const statusInfo = getStatusInfo(order.status)
  const StatusIcon = statusInfo.icon

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-black py-8 px-4">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <Button
            variant="ghost"
            onClick={() => router.push('/menu')}
            className="text-colibri-gold hover:text-colibri-gold/80"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Volver
          </Button>
          
          {refreshing && (
            <div className="flex items-center gap-2 text-colibri-beige text-sm">
              <Loader2 className="w-4 h-4 animate-spin" />
              Actualizando...
            </div>
          )}
        </div>

        {/* Status Card */}
        <Card className="bg-slate-900/90 backdrop-blur-xl border-colibri-gold/30">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-2xl text-white mb-2">
                  Pedido #{orderId}
                </CardTitle>
                <p className="text-colibri-beige text-sm">
                  {new Date(order.created_at).toLocaleString('es-MX')}
                </p>
              </div>
              <Badge className={`${statusInfo.color} text-white border-none text-lg px-4 py-2`}>
                <StatusIcon className="w-5 h-5 mr-2" />
                {statusInfo.label}
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            {/* Timeline */}
            <div className="space-y-4">
              <TimelineStep 
                completed={true}
                label="Pedido Recibido"
                time={new Date(order.created_at).toLocaleTimeString('es-MX')}
              />
              <TimelineStep 
                completed={['confirmed', 'preparing', 'ready', 'on-route', 'delivered'].includes(order.status)}
                label="Confirmado"
                time={order.status !== 'pending' ? 'Confirmado' : ''}
              />
              <TimelineStep 
                completed={['preparing', 'ready', 'on-route', 'delivered'].includes(order.status)}
                label="Preparando"
              />
              <TimelineStep 
                completed={['ready', 'on-route', 'delivered'].includes(order.status)}
                label="Listo para Entregar"
              />
              <TimelineStep 
                completed={['on-route', 'delivered'].includes(order.status)}
                label="En Camino"
                icon={Truck}
              />
              <TimelineStep 
                completed={order.status === 'delivered'}
                label="Entregado"
                icon={CheckCircle}
              />
            </div>
          </CardContent>
        </Card>

        {/* Mapa con ubicaciones */}
        {order.delivery_location && (
          <Card className="bg-slate-900/90 backdrop-blur-xl border-colibri-gold/30">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <MapPin className="text-colibri-gold" />
                Seguimiento en Tiempo Real
              </CardTitle>
            </CardHeader>
            <CardContent>
              <DeliveryMap
                driverLocation={order.driver_location ? {
                  lat: order.driver_location.lat,
                  lng: order.driver_location.lng,
                  label: order.driver?.username || 'Repartidor'
                } : undefined}
                restaurantLocation={order.restaurant_location ? {
                  lat: order.restaurant_location.lat,
                  lng: order.restaurant_location.lng,
                  label: 'Supernova Restaurant'
                } : undefined}
                deliveryLocation={{
                  lat: order.delivery_location.lat,
                  lng: order.delivery_location.lng,
                  label: parseAddress(order.delivery_address)
                }}
                height="500px"
              />
              
              {order.driver && (
                <div className="mt-4 p-4 bg-slate-800/60 rounded-lg border border-colibri-gold/20">
                  <h3 className="text-white font-semibold mb-2 flex items-center gap-2">
                    <Truck className="text-colibri-gold" />
                    Tu Repartidor
                  </h3>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-colibri-beige font-medium">{order.driver.username}</p>
                      <p className="text-slate-400 text-sm flex items-center gap-1">
                        <Phone className="w-3 h-3" />
                        {order.driver.phone || 'No disponible'}
                      </p>
                    </div>
                    {order.driver?.phone && (
                      <Button
                        onClick={() => window.open(`tel:${order.driver?.phone}`)}
                        className="bg-colibri-green hover:bg-colibri-green/90"
                      >
                        <Phone className="w-4 h-4 mr-2" />
                        Llamar
                      </Button>
                    )}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Detalles del Pedido */}
        <Card className="bg-slate-900/90 backdrop-blur-xl border-colibri-gold/30">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Package className="text-colibri-gold" />
              Detalles del Pedido
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-colibri-beige">Total</span>
                <span className="text-white font-bold text-xl">${order.total.toFixed(2)}</span>
              </div>
              
              <Separator className="bg-colibri-gold/20" />
              
              <div>
                <h4 className="text-white font-semibold mb-2">Dirección de Entrega</h4>
                <p className="text-colibri-beige flex items-start gap-2">
                  <MapPin className="w-4 h-4 mt-1 text-colibri-gold flex-shrink-0" />
                  {parseAddress(order.delivery_address)}
                </p>
              </div>
              
              <div>
                <h4 className="text-white font-semibold mb-2">Método de Pago</h4>
                <p className="text-colibri-beige capitalize">
                  {order.payment_method === 'efectivo' ? '💵 Efectivo' : '💳 Tarjeta'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

function TimelineStep({ 
  completed, 
  label, 
  time, 
  icon: Icon = Clock 
}: { 
  completed: boolean
  label: string
  time?: string
  icon?: any
}) {
  return (
    <div className="flex items-center gap-4">
      <div className={`
        w-10 h-10 rounded-full flex items-center justify-center border-2
        ${completed 
          ? 'bg-colibri-green border-colibri-green' 
          : 'bg-slate-800 border-slate-600'
        }
      `}>
        <Icon className={`w-5 h-5 ${completed ? 'text-white' : 'text-slate-400'}`} />
      </div>
      <div className="flex-1">
        <p className={`font-medium ${completed ? 'text-white' : 'text-slate-400'}`}>
          {label}
        </p>
        {time && <p className="text-sm text-slate-500">{time}</p>}
      </div>
      {completed && (
        <CheckCircle className="w-5 h-5 text-colibri-green" />
      )}
    </div>
  )
}
