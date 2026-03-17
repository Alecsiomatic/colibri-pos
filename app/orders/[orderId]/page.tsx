'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import {
  ArrowLeft,
  Loader2,
  Package,
  Clock,
  Truck,
  CheckCircle,
  MapPin,
  Phone,
  CreditCard,
  DollarSign,
  Navigation
} from 'lucide-react'

export default function OrderDetailPage() {
  const params = useParams()
  const router = useRouter()
  const orderId = params.orderId as string

  const [order, setOrder] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchOrder()
  }, [orderId])

  const fetchOrder = async () => {
    setLoading(true)
    try {
      const response = await fetch(`/api/orders-mysql/${orderId}`)
      const data = await response.json()
      if (data.success && data.order) {
        data.order.total = Number(data.order.total) || 0
        // Parse items if string
        if (data.order.items && typeof data.order.items === 'string') {
          try { data.order.items = JSON.parse(data.order.items) } catch { data.order.items = [] }
        }
        setOrder(data.order)
      } else {
        setError('Pedido no encontrado')
      }
    } catch {
      setError('Error al cargar el pedido')
    } finally {
      setLoading(false)
    }
  }

  const getStatusInfo = (status: string) => {
    const map: Record<string, { label: string; color: string; icon: any }> = {
      pending: { label: 'Pendiente', color: 'bg-yellow-500', icon: Clock },
      confirmed: { label: 'Confirmado', color: 'bg-blue-500', icon: Package },
      preparing: { label: 'Preparando', color: 'bg-orange-500', icon: Package },
      ready: { label: 'Listo', color: 'bg-green-500', icon: CheckCircle },
      'on-route': { label: 'En camino', color: 'bg-purple-500', icon: Truck },
      en_camino: { label: 'En camino', color: 'bg-purple-500', icon: Truck },
      delivered: { label: 'Entregado', color: 'bg-green-600', icon: CheckCircle },
      entregado: { label: 'Entregado', color: 'bg-green-600', icon: CheckCircle },
      cancelled: { label: 'Cancelado', color: 'bg-red-500', icon: Clock },
      cancelado: { label: 'Cancelado', color: 'bg-red-500', icon: Clock },
    }
    return map[status] || map.pending
  }

  const parseAddress = (addr: any): string => {
    if (!addr) return 'No especificada'
    if (typeof addr === 'object') return addr.street || addr.address || 'No especificada'
    if (typeof addr === 'string') {
      try {
        const p = JSON.parse(addr)
        return p.street || p.address || addr
      } catch { return addr }
    }
    return String(addr)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-colibri-green to-slate-950 flex items-center justify-center">
        <Loader2 className="w-12 h-12 text-colibri-gold animate-spin" />
      </div>
    )
  }

  if (error || !order) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-colibri-green to-slate-950 flex items-center justify-center p-4">
        <Card className="bg-slate-900/90 backdrop-blur-xl border-colibri-wine/30 max-w-md">
          <CardContent className="p-8 text-center">
            <div className="text-colibri-wine text-6xl mb-4">⚠️</div>
            <h2 className="text-2xl font-bold text-white mb-3">Error</h2>
            <p className="text-colibri-beige mb-6">{error}</p>
            <Button onClick={() => router.push('/orders')} className="bg-colibri-gold text-black hover:bg-colibri-gold/80">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Volver a Pedidos
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  const statusInfo = getStatusInfo(order.status)
  const StatusIcon = statusInfo.icon
  const items = order.items || []

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-colibri-green to-slate-950 py-8 px-4">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <Button variant="ghost" onClick={() => router.push('/orders')} className="text-colibri-gold hover:text-colibri-gold/80">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Mis Pedidos
          </Button>
          {order.delivery_type === 'delivery' && (
            <Button onClick={() => router.push(`/orders/${orderId}/tracking`)} className="bg-colibri-gold text-black hover:bg-colibri-gold/80">
              <Navigation className="w-4 h-4 mr-2" />
              Ver Tracking
            </Button>
          )}
        </div>

        {/* Status */}
        <Card className="bg-slate-900/90 backdrop-blur-xl border-colibri-gold/30">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-2xl text-white mb-1">Pedido #{orderId}</CardTitle>
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
        </Card>

        {/* Items */}
        <Card className="bg-slate-900/90 backdrop-blur-xl border-colibri-gold/30">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Package className="text-colibri-gold" />
              Productos ({items.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {items.map((item: any, idx: number) => (
                <div key={idx} className="flex justify-between items-center p-3 bg-white/5 rounded-lg">
                  <div>
                    <p className="text-white font-medium">{item.quantity}x {item.name}</p>
                    {item.modifiers && item.modifiers.length > 0 && (
                      <p className="text-colibri-beige text-xs mt-1">
                        {item.modifiers.map((m: any) => m.name || m).join(', ')}
                      </p>
                    )}
                  </div>
                  <p className="text-colibri-gold font-bold">${(Number(item.price) * item.quantity).toFixed(2)}</p>
                </div>
              ))}
            </div>
            <Separator className="bg-colibri-gold/20 my-4" />
            <div className="flex justify-between items-center">
              <span className="text-white font-semibold text-lg">Total</span>
              <span className="text-colibri-gold font-black text-2xl">${order.total.toFixed(2)}</span>
            </div>
          </CardContent>
        </Card>

        {/* Delivery / Order Info */}
        <Card className="bg-slate-900/90 backdrop-blur-xl border-colibri-gold/30">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <MapPin className="text-colibri-gold" />
              Información del Pedido
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-3">
              {order.delivery_type === 'delivery' ? (
                <Truck className="w-5 h-5 text-colibri-gold" />
              ) : (
                <Package className="w-5 h-5 text-colibri-gold" />
              )}
              <div>
                <p className="text-colibri-beige text-sm">Tipo</p>
                <p className="text-white font-medium">{order.delivery_type === 'delivery' ? 'Delivery' : 'Pickup (Recoger)'}</p>
              </div>
            </div>

            {order.delivery_type === 'delivery' && (
              <div className="flex items-start gap-3">
                <MapPin className="w-5 h-5 text-red-400 mt-0.5" />
                <div>
                  <p className="text-colibri-beige text-sm">Dirección de Entrega</p>
                  <p className="text-white font-medium">{parseAddress(order.delivery_address)}</p>
                </div>
              </div>
            )}

            <div className="flex items-center gap-3">
              <CreditCard className="w-5 h-5 text-colibri-gold" />
              <div>
                <p className="text-colibri-beige text-sm">Método de Pago</p>
                <p className="text-white font-medium capitalize">
                  {order.payment_method === 'efectivo' ? '💵 Efectivo' : '💳 Tarjeta'}
                </p>
              </div>
            </div>

            {order.driver && (
              <>
                <Separator className="bg-colibri-gold/20" />
                <div className="flex items-center gap-3">
                  <Truck className="w-5 h-5 text-colibri-green" />
                  <div>
                    <p className="text-colibri-beige text-sm">Repartidor</p>
                    <p className="text-white font-medium">{order.driver.username}</p>
                  </div>
                </div>
                {order.driver.phone && (
                  <div className="flex items-center gap-3">
                    <Phone className="w-5 h-5 text-colibri-green" />
                    <div>
                      <p className="text-colibri-beige text-sm">Teléfono</p>
                      <p className="text-white font-medium">{order.driver.phone}</p>
                    </div>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
