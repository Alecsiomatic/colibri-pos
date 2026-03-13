'use client'

import { useState, useEffect, Component, ReactNode } from 'react'
import { useRouter } from 'next/navigation'
import dynamic from 'next/dynamic'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { MapPin, Phone, Clock, Package, CheckCircle, Navigation, DollarSign, User, AlertCircle, ChevronRight, Loader2, Home, List } from 'lucide-react'

const DeliveryMap = dynamic(
  () => import('@/components/DeliveryMap').catch(() => {
    return { default: () => (
      <div className="h-[500px] bg-slate-800/60 rounded-lg flex items-center justify-center">
        <p className="text-colibri-beige text-sm">No se pudo cargar el mapa. Recarga la página.</p>
      </div>
    )}
  }),
  {
    ssr: false,
    loading: () => (
      <div className="h-[500px] bg-slate-800/60 animate-pulse rounded-lg flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-colibri-gold animate-spin" />
      </div>
    )
  }
)

// Error boundary local para el mapa — evita que un crash de Leaflet tire toda la página
class MapErrorBoundary extends Component<{children: ReactNode}, {hasError: boolean}> {
  constructor(props: {children: ReactNode}) {
    super(props)
    this.state = { hasError: false }
  }
  static getDerivedStateFromError() { return { hasError: true } }
  componentDidCatch(error: Error) { console.error('MapErrorBoundary:', error) }
  render() {
    if (this.state.hasError) {
      return (
        <div className="h-[500px] bg-slate-800/60 rounded-lg flex flex-col items-center justify-center gap-3">
          <AlertCircle className="h-8 w-8 text-colibri-gold" />
          <p className="text-colibri-beige text-sm">Error al cargar el mapa</p>
          <button onClick={() => this.setState({ hasError: false })} className="text-xs text-colibri-gold underline">
            Reintentar
          </button>
        </div>
      )
    }
    return this.props.children
  }
}

interface Order {
  id: number
  customer_name: string
  customer_phone: string
  delivery_address: string
  delivery_notes?: string
  items: Array<{name: string; quantity: number; price: number}>
  total: number
  created_at: string
}

interface Assignment {
  id: number
  order_id: number
  status: 'pending' | 'accepted' | 'completed'
  assigned_at: string
  accepted_at?: string
  order?: Order
  // Campos adicionales que pueden venir directamente del assignment
  customer_name?: string
  customer_phone?: string
  delivery_address?: string
  delivery_notes?: string
  total?: number
}

export default function DriverDashboard() {
  const router = useRouter()
  const [driver, setDriver] = useState<any>(null)
  const [assignments, setAssignments] = useState<Assignment[]>([])
  const [activeDelivery, setActiveDelivery] = useState<Assignment | null>(null)
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState<number | null>(null)
  
  // Estados para tracking de ubicación
  const [isTrackingLocation, setIsTrackingLocation] = useState(false)
  const [locationError, setLocationError] = useState<string | null>(null)
  const [watchId, setWatchId] = useState<number | null>(null)
  const [driverLocation, setDriverLocation] = useState<{lat: number, lng: number} | null>(null)
  const [selectedAssignment, setSelectedAssignment] = useState<Assignment | null>(null)
  const [restaurantLocation, setRestaurantLocation] = useState<{lat: number, lng: number} | null>(null)
  const [route, setRoute] = useState<Array<[number, number]> | null>(null)
  const [routeInfo, setRouteInfo] = useState<{distance: number, duration: number} | null>(null)

  useEffect(() => { checkAuth() }, [])
  useEffect(() => {
    if (driver) {
      loadAssignments()
      fetchRestaurantConfig()
      const interval = setInterval(loadAssignments, 15000)
      return () => clearInterval(interval)
    }
  }, [driver])

  const fetchRestaurantConfig = async () => {
    try {
      const res = await fetch('/api/restaurant-config')
      const data = await res.json()
      if (data.success && data.config) {
        setRestaurantLocation({
          lat: data.config.latitude,
          lng: data.config.longitude
        })
      }
    } catch (error) {
      console.error('Error fetching restaurant config:', error)
    }
  }

  // Iniciar tracking cuando hay entrega activa
  useEffect(() => {
    if (activeDelivery && !isTrackingLocation) {
      startLocationTracking()
    } else if (!activeDelivery && isTrackingLocation) {
      stopLocationTracking()
    }
  }, [activeDelivery])

  // Calcular ruta cuando hay entrega activa y ubicación del driver
  useEffect(() => {
    const calculateDeliveryRoute = async () => {
      if (!activeDelivery || !driverLocation) {
        setRoute(null)
        setRouteInfo(null)
        return
      }

      try {
        // Obtener dirección de entrega (puede estar en JSON o como string)
        let deliveryLat, deliveryLng
        const deliveryAddress = activeDelivery.order?.delivery_address || activeDelivery.delivery_address
        
        if (deliveryAddress) {
          try {
            const parsed = JSON.parse(deliveryAddress)
            deliveryLat = parsed.lat
            deliveryLng = parsed.lng
          } catch {
            // Si no es JSON, usar coordenadas de ejemplo cerca del restaurante
            deliveryLat = restaurantLocation?.lat
            deliveryLng = restaurantLocation?.lng
            if (!deliveryLat || !deliveryLng) return
          }
        } else {
          console.warn('No hay dirección de entrega disponible')
          return
        }



        // Llamar a la API para calcular la ruta
        const response = await fetch('/api/calculate-route', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            origin: driverLocation,
            destination: { lat: deliveryLat, lng: deliveryLng }
          })
        })

        if (!response.ok) {
          throw new Error('Error al calcular ruta')
        }

        const routeData = await response.json()

        if (routeData && routeData.route) {
          setRoute(routeData.route)
          setRouteInfo({
            distance: routeData.distance,
            duration: routeData.duration
          })

        }
      } catch (error) {
        console.error('Error calculando ruta:', error)
        setRoute(null)
        setRouteInfo(null)
      }
    }

    calculateDeliveryRoute()
  }, [activeDelivery, driverLocation, restaurantLocation])

  // Cleanup al desmontar
  useEffect(() => {
    return () => {
      if (watchId) {
        navigator.geolocation.clearWatch(watchId)
      }
    }
  }, [watchId])

  const checkAuth = async () => {
    try {
      const response = await fetch('/api/driver/me', { credentials: 'include' })
      if (!response.ok) {
        router.push('/login?redirect=/driver/dashboard')
        return
      }
      const data = await response.json()
      setDriver(data.driver)
    } catch (error) {
      console.error('Error en auth:', error)
      router.push('/login')
    } finally {
      setLoading(false)
    }
  }

  // Funciones para tracking de ubicación
  const startLocationTracking = () => {
    if (!navigator.geolocation) {
      setLocationError('Geolocalización no soportada')
      return
    }

    setLocationError(null)
    setIsTrackingLocation(true)

    const options = {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 30000 // Cache por 30 segundos
    }

    const id = navigator.geolocation.watchPosition(
      (position) => {
        const { latitude, longitude } = position.coords
        updateDriverLocation(latitude, longitude)
      },
      (error) => {
        console.error('Error de geolocalización:', error)
        setLocationError(`Error de ubicación: ${error.message}`)
      },
      options
    )

    setWatchId(id)
  }

  const stopLocationTracking = () => {
    if (watchId) {
      navigator.geolocation.clearWatch(watchId)
      setWatchId(null)
    }
    setIsTrackingLocation(false)
    setLocationError(null)
  }

  const updateDriverLocation = async (latitude: number, longitude: number) => {
    setDriverLocation({ lat: latitude, lng: longitude })
    try {
      const response = await fetch('/api/driver/location/update', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ latitude, longitude })
      })

      if (!response.ok) {
        console.error('Error actualizando ubicación:', response.status)
      }
    } catch (error) {
      console.error('Error enviando ubicación:', error)
    }
  }

  const loadAssignments = async () => {
    try {
      const response = await fetch('/api/driver/assignments', { credentials: 'include' })
      if (response.ok) {
        const data = await response.json()
        setAssignments(data.assignments || [])
        const active = data.assignments?.find((a: Assignment) => a.status === 'accepted')
        setActiveDelivery(active || null)
      } else {
        console.error('Error cargando assignments:', response.status)
      }
    } catch (error) {
      console.error('Error:', error)
    }
  }

  const handleAccept = async (assignmentId: number) => {
    setActionLoading(assignmentId)
    try {
      const response = await fetch(`/api/driver/assignments/${assignmentId}/accept`, { 
        method: 'POST', 
        credentials: 'include' 
      })
      if (response.ok) {
        await loadAssignments()
        // Iniciar tracking automáticamente después de aceptar
        startLocationTracking()
      }
    } catch (error) {
      console.error('Error:', error)
    } finally {
      setActionLoading(null)
    }
  }

  const handleComplete = async (assignmentId: number) => {
    setActionLoading(assignmentId)
    try {
      const response = await fetch(`/api/driver/assignments/${assignmentId}/complete`, { method: 'POST', credentials: 'include' })
      if (response.ok) await loadAssignments()
    } catch (error) {
      console.error('Error:', error)
    } finally {
      setActionLoading(null)
    }
  }

  const openMaps = (address: string) => {
    if (address) window.open(`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(address)}`, '_blank')
  }
  const callCustomer = (phone: string) => {
    if (phone) window.open(`tel:${phone}`)
  }
  const formatCurrency = (amount: number) => new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(amount)
  const formatTime = (dateString: string) => new Date(dateString).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })

  if (loading) return (
    <div className="min-h-screen bg-gradient-to-br from-colibri-green via-slate-900 to-slate-950 flex items-center justify-center">
      <Loader2 className="h-12 w-12 text-colibri-gold animate-spin" />
    </div>
  )

  const pendingAssignments = assignments.filter(a => a.status === 'pending')

  return (
    <div className="min-h-screen bg-gradient-to-br from-colibri-green via-slate-900 to-slate-950 pb-20">
      {/* Header */}
      <div className="bg-slate-900/80 backdrop-blur-xl border-b border-colibri-gold/30 sticky top-0 z-50">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-gradient-to-br from-colibri-gold to-colibri-wine rounded-full flex items-center justify-center">
                <User className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-white">{driver?.name || 'Driver'}</h1>
                <p className="text-sm text-colibri-gold">Repartidor</p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              {isTrackingLocation && (
                <Badge className="bg-colibri-green text-white flex items-center space-x-1">
                  <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                  <span>Compartiendo ubicación</span>
                </Badge>
              )}
              {locationError && (
                <Badge className="bg-red-500 text-white">
                  Error GPS
                </Badge>
              )}
              <Badge className="bg-colibri-green text-white">En línea</Badge>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
        {/* Active Delivery */}
        {activeDelivery && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Mapa */}
            <div className="lg:col-span-2">
              <Card className="bg-slate-900/90 backdrop-blur-xl border-colibri-gold/30">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <MapPin className="text-colibri-gold" />
                    Mapa de Entrega
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <MapErrorBoundary>
                  <DeliveryMap
                    driverLocation={driverLocation ? {
                      ...driverLocation,
                      label: 'Tu ubicación'
                    } : undefined}
                    restaurantLocation={restaurantLocation ? {
                      ...restaurantLocation,
                      label: 'Restaurante'
                    } : undefined}
                    deliveryLocation={(() => {
                      const addr = activeDelivery.order?.delivery_address || activeDelivery.delivery_address
                      let lat = restaurantLocation?.lat || 0, lng = restaurantLocation?.lng || 0
                      if (addr) {
                        try { const p = JSON.parse(addr); if (p.lat && p.lng) { lat = Number(p.lat); lng = Number(p.lng) } } catch {}
                      }
                      return { lat: lat || 0, lng: lng || 0, label: (typeof addr === 'string' ? addr : 'Destino') }
                    })()}
                    route={route || undefined}
                    height="500px"
                  />
                  </MapErrorBoundary>
                  
                  {/* Información de la ruta */}
                  {routeInfo && (
                    <div className="mt-4 grid grid-cols-2 gap-3">
                      <div className="p-3 bg-gradient-to-br from-colibri-gold/20 to-colibri-wine/10 rounded-lg border border-colibri-gold/30">
                        <p className="text-colibri-gold text-xs font-semibold mb-1">Distancia</p>
                        <p className="text-white text-lg font-bold">{routeInfo.distance.toFixed(1)} km</p>
                      </div>
                      <div className="p-3 bg-gradient-to-br from-colibri-wine/20 to-colibri-gold/10 rounded-lg border border-colibri-wine/30">
                        <p className="text-colibri-gold text-xs font-semibold mb-1">Tiempo estimado</p>
                        <p className="text-white text-lg font-bold">{routeInfo.duration} min</p>
                      </div>
                    </div>
                  )}
                  
                  {driverLocation && (
                    <div className="mt-4 p-3 bg-slate-800/60 rounded-lg border border-colibri-green/20">
                      <p className="text-colibri-green text-sm flex items-center gap-2">
                        <Navigation className="w-4 h-4" />
                        GPS Activo - Actualizando automáticamente
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Detalles del pedido */}
            <Card className="bg-slate-900/90 backdrop-blur-xl border-colibri-gold/40 border-2 shadow-2xl">
            <CardHeader className="bg-gradient-to-r from-colibri-wine/30 to-colibri-gold/30">
              <div className="flex items-center justify-between">
                <CardTitle className="text-white flex items-center space-x-2">
                  <Navigation className="h-5 w-5 animate-pulse text-colibri-gold" />
                  <span>Entrega en Curso</span>
                </CardTitle>
                <Badge className="bg-colibri-wine text-white font-bold">Activa</Badge>
              </div>
            </CardHeader>
            <CardContent className="pt-6 space-y-4">
              {/* Customer Info */}
              <div className="flex items-start space-x-3 p-4 bg-slate-800/80 backdrop-blur-xl rounded-lg border border-colibri-green/30">
                <User className="h-5 w-5 text-colibri-gold mt-1" />
                <div className="flex-1">
                  <p className="text-sm text-white font-semibold">Cliente</p>
                  <p className="text-lg font-bold text-white">
                    {activeDelivery.order?.customer_name || activeDelivery.customer_name || 'Cliente no disponible'}
                  </p>
                </div>
                <Button 
                  onClick={() => callCustomer(activeDelivery.order?.customer_phone || activeDelivery.customer_phone || '')} 
                  size="sm" 
                  className="bg-colibri-green hover:bg-colibri-green/90"
                  disabled={!activeDelivery.order?.customer_phone && !activeDelivery.customer_phone}
                >
                  <Phone className="h-4 w-4 mr-2" />Llamar
                </Button>
              </div>

              {/* Address Info */}
              <div className="flex items-start space-x-3 p-4 bg-slate-800/80 backdrop-blur-xl rounded-lg border border-colibri-green/30">
                <MapPin className="h-5 w-5 text-red-400 mt-1" />
                <div className="flex-1">
                  <p className="text-sm text-white font-semibold">Dirección de entrega</p>
                  <p className="text-white font-medium">
                    {activeDelivery.order?.delivery_address || activeDelivery.delivery_address || 'Dirección no disponible'}
                  </p>
                  {(activeDelivery.order?.delivery_notes || activeDelivery.delivery_notes) && (
                    <p className="text-sm text-colibri-beige mt-1">
                      {activeDelivery.order?.delivery_notes || activeDelivery.delivery_notes}
                    </p>
                  )}
                </div>
                <Button 
                  onClick={() => openMaps(activeDelivery.order?.delivery_address || activeDelivery.delivery_address || '')} 
                  size="sm" 
                  className="bg-colibri-wine hover:bg-colibri-wine/90"
                  disabled={!activeDelivery.order?.delivery_address && !activeDelivery.delivery_address}
                >
                  <Navigation className="h-4 w-4 mr-2" />Abrir
                </Button>
              </div>

              {/* Items */}
              <div className="p-4 bg-slate-800/80 backdrop-blur-xl rounded-lg border border-colibri-green/30 space-y-2">
                <div className="flex items-center space-x-2 mb-3">
                  <Package className="h-5 w-5 text-colibri-gold" />
                  <p className="text-sm text-white font-semibold">Productos a entregar</p>
                </div>
                {activeDelivery.order?.items && activeDelivery.order.items.length > 0 ? (
                  activeDelivery.order.items.map((item, idx) => (
                    <div key={idx} className="flex justify-between text-white">
                      <span>{item.quantity}x {item.name}</span>
                      <span className="text-colibri-gold font-bold">{formatCurrency(item.price * item.quantity)}</span>
                    </div>
                  ))
                ) : (
                  <p className="text-white">No hay productos disponibles</p>
                )}
                <div className="pt-2 mt-2 border-t border-colibri-green/40 flex justify-between font-bold">
                  <span className="text-white">Total</span>
                  <span className="text-colibri-gold text-xl drop-shadow-[0_0_10px_rgba(171,153,118,0.5)]">
                    {formatCurrency(activeDelivery.order?.total || activeDelivery.total || 0)}
                  </span>
                </div>
              </div>

              {/* Complete Button */}
              <Button 
                onClick={() => handleComplete(activeDelivery.id)} 
                disabled={actionLoading === activeDelivery.id} 
                className="w-full h-16 bg-gradient-to-r from-colibri-green to-colibri-wine hover:from-colibri-green/90 hover:to-colibri-wine/90 text-white text-lg font-bold shadow-xl"
              >
                {actionLoading === activeDelivery.id ? (
                  <Loader2 className="h-6 w-6 animate-spin" />
                ) : (
                  <>
                    <CheckCircle className="h-6 w-6 mr-2" />
                    MARCAR COMO ENTREGADO
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
          </div>
        )}

        {/* Available Orders */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-white flex items-center space-x-2">
              <Clock className="h-5 w-5 text-colibri-gold" />
              <span>Pedidos Disponibles</span>
            </h2>
            <Badge className="bg-colibri-wine text-white font-bold">{pendingAssignments.length}</Badge>
          </div>

          {pendingAssignments.length === 0 ? (
            <Card className="bg-slate-900/80 backdrop-blur-xl border-colibri-green/30">
              <CardContent className="py-12 text-center">
                <Package className="h-16 w-16 text-colibri-gold mx-auto mb-4 opacity-50" />
                <p className="text-white text-lg font-medium mb-2">
                  {activeDelivery ? '¡Enfócate en tu entrega actual!' : 'No hay pedidos pendientes'}
                </p>
                <p className="text-white">
                  {activeDelivery ? 'Completa la entrega en curso para ver nuevos pedidos' : 'Espera a que se asignen nuevos pedidos'}
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {pendingAssignments.map(assignment => (
                <Card key={assignment.id} className="bg-slate-900/90 backdrop-blur-xl border-colibri-green/40 hover:border-colibri-gold/60 transition-colors shadow-xl">
                  <CardContent className="pt-6">
                    <div className="space-y-4">
                      {/* Order Header */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className="w-12 h-12 bg-gradient-to-br from-colibri-gold to-colibri-wine rounded-full flex items-center justify-center">
                            <Package className="h-6 w-6 text-white" />
                          </div>
                          <div>
                            <p className="text-white font-bold text-lg">Pedido #{assignment.order_id}</p>
                            <p className="text-white text-sm">Asignado {formatTime(assignment.assigned_at)}</p>
                          </div>
                        </div>
                        <Badge className="bg-yellow-500 text-white font-bold">Nuevo</Badge>
                      </div>

                      {/* Customer */}
                      <div className="flex items-center space-x-3 p-3 bg-slate-800/80 backdrop-blur-xl rounded-lg border border-colibri-green/30">
                        <User className="h-5 w-5 text-colibri-gold" />
                        <div className="flex-1">
                          <p className="text-white font-medium">
                            {assignment.order?.customer_name || assignment.customer_name || 'Cliente no disponible'}
                          </p>
                          <p className="text-white text-sm">
                            {assignment.order?.customer_phone || assignment.customer_phone || 'Teléfono no disponible'}
                          </p>
                        </div>
                      </div>

                      {/* Address */}
                      <div className="flex items-center space-x-3 p-3 bg-slate-800/80 backdrop-blur-xl rounded-lg border border-colibri-green/30">
                        <MapPin className="h-5 w-5 text-red-400" />
                        <div className="flex-1">
                          <p className="text-white">
                            {assignment.order?.delivery_address || assignment.delivery_address || 'Dirección no disponible'}
                          </p>
                        </div>
                        <ChevronRight className="h-5 w-5 text-colibri-gold" />
                      </div>

                      {/* Total */}
                      <div className="flex items-center justify-between p-3 bg-slate-800/80 backdrop-blur-xl rounded-lg border border-colibri-green/30">
                        <div className="flex items-center space-x-2">
                          <DollarSign className="h-5 w-5 text-colibri-green" />
                          <span className="text-white font-semibold">Monto a cobrar</span>
                        </div>
                        <span className="text-colibri-gold font-black text-xl drop-shadow-[0_0_10px_rgba(171,153,118,0.5)]">
                          {formatCurrency(assignment.order?.total || assignment.total || 0)}
                        </span>
                      </div>

                      {/* Items Preview */}
                      <div className="p-3 bg-slate-800/80 backdrop-blur-xl rounded-lg border border-colibri-green/30">
                        <p className="text-white text-sm mb-2 font-semibold">
                          {assignment.order?.items?.length || 0} productos
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {assignment.order?.items?.slice(0,3).map((item,idx) => (
                            <Badge key={idx} variant="outline" className="text-white border-colibri-gold bg-colibri-wine/30">
                              {item.quantity}x {item.name}
                            </Badge>
                          ))}
                          {assignment.order?.items && assignment.order.items.length > 3 && (
                            <Badge variant="outline" className="text-white border-colibri-gold bg-colibri-green/30">
                              +{assignment.order.items.length - 3} más
                            </Badge>
                          )}
                        </div>
                      </div>

                      {/* Accept Button */}
                      <Button 
                        onClick={() => handleAccept(assignment.id)} 
                        disabled={actionLoading === assignment.id || !!activeDelivery} 
                        className="w-full h-14 bg-gradient-to-r from-colibri-wine to-colibri-green hover:from-colibri-wine/90 hover:to-colibri-green/90 text-white text-lg font-bold shadow-xl"
                      >
                        {actionLoading === assignment.id ? (
                          <Loader2 className="h-5 w-5 animate-spin" />
                        ) : activeDelivery ? (
                          <>
                            <AlertCircle className="h-5 w-5 mr-2" />
                            Completa la entrega actual primero
                          </>
                        ) : (
                          <>
                            <CheckCircle className="h-5 w-5 mr-2" />
                            ACEPTAR PEDIDO
                          </>
                        )}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* Stats */}
        <Card className="bg-slate-900/90 backdrop-blur-xl border-colibri-green/40 shadow-xl">
          <CardHeader>
            <CardTitle className="text-white text-lg font-bold">Estadísticas de Hoy</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-slate-800/80 backdrop-blur-xl rounded-lg text-center border border-colibri-green/30">
                <p className="text-white text-sm mb-1 font-semibold">Entregas completadas</p>
                <p className="text-colibri-gold text-3xl font-black drop-shadow-[0_0_10px_rgba(171,153,118,0.5)]">
                  {assignments.filter(a => a.status === 'completed').length}
                </p>
              </div>
              <div className="p-4 bg-slate-800/80 backdrop-blur-xl rounded-lg text-center border border-colibri-green/30">
                <p className="text-white text-sm mb-1 font-semibold">Pedidos pendientes</p>
                <p className="text-colibri-wine text-3xl font-black">{pendingAssignments.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}