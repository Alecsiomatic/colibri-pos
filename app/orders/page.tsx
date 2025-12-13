'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { 
  ShoppingCart, 
  ArrowLeft, 
  Loader2,
  Search,
  Filter,
  Calendar,
  Truck,
  Store,
  Clock,
  CreditCard,
  Package,
  Eye,
  MapPin,
  Phone,
  Mail,
  ChevronRight
} from 'lucide-react'
import { useAuth } from '@/hooks/use-auth'
import { useOrders } from '@/hooks/use-orders'
import { useToast } from '@/hooks/use-notifications'

export default function OrdersPage() {
  const { user } = useAuth()
  const { orders, userOrders, loading, refetch } = useOrders()
  const toast = useToast()
  const router = useRouter()

  // Filter states
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [dateFilter, setDateFilter] = useState('all')

  // Redirect if not logged in
  useEffect(() => {
    if (!user) {
      router.push('/login')
    }
  }, [user, router])
  
  // Usar orders si es admin, userOrders si es cliente
  const displayOrders = user?.is_admin ? orders : userOrders

  // Filter orders based on search and filters
  const filteredOrders = displayOrders.filter(order => {
    const matchesSearch = 
      order.id.toString().includes(searchTerm) ||
      (order.items || []).some(item => item.name.toLowerCase().includes(searchTerm.toLowerCase()))

    const matchesStatus = statusFilter === 'all' || order.status === statusFilter

    const matchesDate = (() => {
      if (dateFilter === 'all') return true
      
      const orderDate = new Date(order.created_at)
      const now = new Date()
      
      switch (dateFilter) {
        case 'today':
          return orderDate.toDateString() === now.toDateString()
        case 'week':
          const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
          return orderDate >= weekAgo
        case 'month':
          const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
          return orderDate >= monthAgo
        default:
          return true
      }
    })()

    return matchesSearch && matchesStatus && matchesDate
  })

  const getOrderStatusBadge = (status: string) => {
    const statusConfig = {
      pending: { label: 'Pendiente', color: 'bg-yellow-500', icon: Clock },
      confirmed: { label: 'Confirmado', color: 'bg-blue-500', icon: Package },
      preparing: { label: 'Preparando', color: 'bg-purple-500', icon: Package },
      ready: { label: 'Listo', color: 'bg-green-500', icon: Package },
      in_delivery: { label: 'En Camino', color: 'bg-orange-500', icon: Truck },
      delivered: { label: 'Entregado', color: 'bg-green-600', icon: Package },
      cancelled: { label: 'Cancelado', color: 'bg-red-500', icon: Package }
    }

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending
    const IconComponent = config.icon

    return (
      <Badge className={`${config.color} text-white flex items-center gap-1`}>
        <IconComponent className="h-3 w-3" />
        {config.label}
      </Badge>
    )
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-MX', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const calculateTotal = (order: any) => {
    const itemsTotal = (order.items || []).reduce((sum: number, item: any) => 
      sum + (item.price * item.quantity), 0
    )
    const deliveryFee = order.delivery_type === 'delivery' ? 25 : 0
    return itemsTotal + deliveryFee
  }

  const getItemsCount = (order: any) => {
    return (order.items || []).reduce((sum: number, item: any) => sum + item.quantity, 0)
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-black flex items-center justify-center">
        <Card className="backdrop-blur-sm bg-slate-800/60 border-colibri-gold/20">
          <CardContent className="p-8 flex items-center space-x-4">
            <Loader2 className="h-6 w-6 animate-spin text-colibri-gold" />
            <span className="text-white">Verificando acceso...</span>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-black py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <Button 
            variant="ghost" 
            onClick={() => router.back()} 
            className="mb-4 text-colibri-gold hover:text-colibri-gold/80"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Volver
          </Button>
          
          <div className="text-center">
            <h1 className="text-4xl font-bold text-colibri-gold mb-2">
              Mis Pedidos
            </h1>
            <p className="text-colibri-beige">Historial completo de tus órdenes</p>
          </div>
        </div>

        {/* Filters and Search */}
        <Card className="backdrop-blur-sm bg-slate-800/60 border-colibri-gold/20 mb-6">
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-colibri-gold h-4 w-4" />
                  <Input
                    placeholder="Buscar por ID o producto..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 bg-slate-700/50 border-colibri-gold/30 text-white placeholder:text-colibri-beige/50"
                  />
                </div>
              </div>
              
              <div className="flex gap-2">
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-40 bg-slate-700/50 border-colibri-gold/30 text-white">
                    <SelectValue placeholder="Estado" />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-800 border-colibri-gold/30">
                    <SelectItem value="all" className="text-white hover:bg-slate-700 focus:bg-slate-700 focus:text-white">Todos los estados</SelectItem>
                    <SelectItem value="pending" className="text-white hover:bg-slate-700 focus:bg-slate-700 focus:text-white">Pendiente</SelectItem>
                    <SelectItem value="confirmed" className="text-white hover:bg-slate-700 focus:bg-slate-700 focus:text-white">Confirmado</SelectItem>
                    <SelectItem value="preparing" className="text-white hover:bg-slate-700 focus:bg-slate-700 focus:text-white">Preparando</SelectItem>
                    <SelectItem value="ready" className="text-white hover:bg-slate-700 focus:bg-slate-700 focus:text-white">Listo</SelectItem>
                    <SelectItem value="in_delivery" className="text-white hover:bg-slate-700 focus:bg-slate-700 focus:text-white">En Camino</SelectItem>
                    <SelectItem value="delivered" className="text-white hover:bg-slate-700 focus:bg-slate-700 focus:text-white">Entregado</SelectItem>
                    <SelectItem value="cancelled" className="text-white hover:bg-slate-700 focus:bg-slate-700 focus:text-white">Cancelado</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={dateFilter} onValueChange={setDateFilter}>
                  <SelectTrigger className="w-40 bg-slate-700/50 border-colibri-gold/30 text-white">
                    <SelectValue placeholder="Fecha" />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-800 border-colibri-gold/30">
                    <SelectItem value="all" className="text-white hover:bg-slate-700 focus:bg-slate-700 focus:text-white">Todas las fechas</SelectItem>
                    <SelectItem value="today" className="text-white hover:bg-slate-700 focus:bg-slate-700 focus:text-white">Hoy</SelectItem>
                    <SelectItem value="week" className="text-white hover:bg-slate-700 focus:bg-slate-700 focus:text-white">Última semana</SelectItem>
                    <SelectItem value="month" className="text-white hover:bg-slate-700 focus:bg-slate-700 focus:text-white">Último mes</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Orders List */}
        <Card className="backdrop-blur-sm bg-slate-800/60 border-colibri-gold/20">
          <CardHeader>
            <CardTitle className="text-white flex items-center justify-between">
              <div className="flex items-center">
                <ShoppingCart className="h-5 w-5 mr-2 text-colibri-gold" />
                Pedidos ({filteredOrders.length})
              </div>
              <Button
                onClick={() => refetch()}
                disabled={loading}
                variant="outline"
                size="sm"
                className="border-colibri-gold text-colibri-gold hover:bg-colibri-gold hover:text-black"
              >
                {loading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  'Actualizar'
                )}
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-colibri-gold mr-3" />
                <span className="text-white text-lg">Cargando pedidos...</span>
              </div>
            ) : filteredOrders.length === 0 ? (
              <div className="text-center py-12">
                {orders.length === 0 ? (
                  <>
                    <Package className="h-16 w-16 text-colibri-gold mx-auto mb-4" />
                    <h3 className="text-xl font-semibold text-white mb-2">Sin pedidos aún</h3>
                    <p className="text-colibri-beige mb-6">¡Comienza tu aventura culinaria!</p>
                    <Button 
                      onClick={() => router.push('/menu')}
                      className="bg-colibri-gold text-black hover:bg-colibri-gold/80"
                    >
                      Explorar Menú
                    </Button>
                  </>
                ) : (
                  <>
                    <Search className="h-16 w-16 text-colibri-gold mx-auto mb-4" />
                    <h3 className="text-xl font-semibold text-white mb-2">Sin resultados</h3>
                    <p className="text-colibri-beige mb-6">No se encontraron pedidos con los filtros aplicados</p>
                    <Button 
                      onClick={() => {
                        setSearchTerm('')
                        setStatusFilter('all')
                        setDateFilter('all')
                      }}
                      variant="outline"
                      className="border-colibri-gold text-colibri-gold hover:bg-colibri-gold hover:text-black"
                    >
                      Limpiar Filtros
                    </Button>
                  </>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                {filteredOrders.map((order) => (
                  <div 
                    key={order.id} 
                    className="p-6 bg-slate-700/30 rounded-lg border border-colibri-gold/20 hover:bg-slate-700/50 hover:border-colibri-gold/40 transition-all"
                  >
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center space-x-3">
                        <h3 className="text-white font-bold text-lg">Pedido #{order.id}</h3>
                        {getOrderStatusBadge(order.status)}
                      </div>
                      <div className="text-right">
                        <p className="text-colibri-gold font-bold text-xl">${calculateTotal(order).toFixed(2)}</p>
                        <p className="text-colibri-beige text-sm">{formatDate(order.created_at)}</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                      <div className="flex items-center text-colibri-beige text-sm">
                        {order.delivery_type === 'delivery' ? (
                          <Truck className="h-4 w-4 mr-2 text-colibri-gold" />
                        ) : (
                          <Store className="h-4 w-4 mr-2 text-colibri-gold" />
                        )}
                        {order.delivery_type === 'delivery' ? 'Delivery' : 'Pickup'}
                      </div>
                      
                      <div className="flex items-center text-colibri-beige text-sm">
                        <CreditCard className="h-4 w-4 mr-2 text-colibri-gold" />
                        {order.payment_method === 'efectivo' ? 'Efectivo' : order.payment_method}
                      </div>
                      
                      <div className="flex items-center text-colibri-beige text-sm">
                        <Package className="h-4 w-4 mr-2 text-colibri-gold" />
                        {getItemsCount(order)} {getItemsCount(order) === 1 ? 'item' : 'items'}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <h4 className="text-white text-sm font-medium">Items del pedido:</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                        {(order.items || []).slice(0, 4).map((item: any, index: number) => (
                          <div key={index} className="flex justify-between text-sm bg-slate-800/40 p-2 rounded">
                            <span className="text-colibri-beige">
                              {item.quantity}x {item.name}
                            </span>
                            <span className="text-colibri-gold font-medium">
                              ${(item.price * item.quantity).toFixed(2)}
                            </span>
                          </div>
                        ))}
                      </div>
                      {(order.items || []).length > 4 && (
                        <p className="text-colibri-beige/70 text-xs">
                          +{(order.items || []).length - 4} items más...
                        </p>
                      )}
                    </div>

                    <div className="flex justify-end mt-4 space-x-2">
                      {/* Botón de tracking para pedidos delivery */}
                      {order.delivery_type === 'delivery' && (
                        <Button
                          size="sm"
                          className="bg-colibri-gold text-black hover:bg-colibri-gold/80 flex items-center font-semibold"
                          onClick={(e) => {
                            e.stopPropagation()
                            router.push(`/orders/${order.id}/tracking`)
                          }}
                        >
                          <MapPin className="h-4 w-4 mr-1" />
                          Tracking
                          {(order.status === 'on-route' || order.status === 'en_camino') && (
                            <div className="w-2 h-2 bg-green-500 rounded-full ml-2 animate-pulse"></div>
                          )}
                        </Button>
                      )}
                      
                      <Button
                        variant="outline"
                        size="sm"
                        className="border-colibri-gold bg-slate-800/80 text-white hover:bg-colibri-gold hover:text-black flex items-center"
                        onClick={(e) => {
                          e.stopPropagation()
                          router.push(`/orders/${order.id}`)
                        }}
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        Ver Detalles
                        <ChevronRight className="h-4 w-4 ml-1" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}