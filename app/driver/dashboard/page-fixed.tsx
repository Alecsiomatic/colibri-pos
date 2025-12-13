'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { MapPin, Phone, Clock, Package, CheckCircle, Navigation, DollarSign, User, AlertCircle, ChevronRight, Loader2 } from 'lucide-react'

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
  order: Order
}

export default function DriverDashboard() {
  const router = useRouter()
  const [driver, setDriver] = useState<any>(null)
  const [assignments, setAssignments] = useState<Assignment[]>([])
  const [activeDelivery, setActiveDelivery] = useState<Assignment | null>(null)
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState<number | null>(null)

  useEffect(() => { checkAuth() }, [])
  useEffect(() => {
    if (driver) {
      loadAssignments()
      const interval = setInterval(loadAssignments, 15000)
      return () => clearInterval(interval)
    }
  }, [driver])

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
      console.error('Error:', error)
      router.push('/login')
    } finally {
      setLoading(false)
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
      }
    } catch (error) {
      console.error('Error:', error)
    }
  }

  const handleAccept = async (assignmentId: number) => {
    setActionLoading(assignmentId)
    try {
      const response = await fetch(`/api/driver/assignments/${assignmentId}/accept`, { method: 'POST', credentials: 'include' })
      if (response.ok) await loadAssignments()
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

  const openMaps = (address: string) => window.open(`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(address)}`, '_blank')
  const callCustomer = (phone: string) => window.open(`tel:${phone}`)
  const formatCurrency = (amount: number) => new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(amount)
  const formatTime = (dateString: string) => new Date(dateString).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })

  if (loading) return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-purple-800 to-pink-800 flex items-center justify-center">
      <Loader2 className="h-12 w-12 text-white animate-spin" />
    </div>
  )

  const pendingAssignments = assignments.filter(a => a.status === 'pending')

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-purple-800 to-pink-800 pb-20">
      {/* Header */}
      <div className="bg-white/10 backdrop-blur-md border-b border-white/20 sticky top-0 z-50">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-gradient-to-br from-purple-400 to-pink-400 rounded-full flex items-center justify-center">
                <User className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-white">{driver?.name || 'Driver'}</h1>
                <p className="text-sm text-purple-200">Repartidor</p>
              </div>
            </div>
            <Badge className="bg-green-500 text-white">En línea</Badge>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
        {/* Active Delivery */}
        {activeDelivery && (
          <Card className="backdrop-blur-sm bg-white/10 border-purple-500/20 border-2">
            <CardHeader className="bg-gradient-to-r from-orange-500/20 to-pink-500/20">
              <div className="flex items-center justify-between">
                <CardTitle className="text-white flex items-center space-x-2">
                  <Navigation className="h-5 w-5 animate-pulse" />
                  <span>Entrega en Curso</span>
                </CardTitle>
                <Badge className="bg-orange-500 text-white">Activa</Badge>
              </div>
            </CardHeader>
            <CardContent className="pt-6 space-y-4">
              {/* Customer Info */}
              <div className="flex items-start space-x-3 p-4 bg-white/5 rounded-lg">
                <User className="h-5 w-5 text-purple-400 mt-1" />
                <div className="flex-1">
                  <p className="text-sm text-purple-200">Cliente</p>
                  <p className="text-lg font-bold text-white">
                    {activeDelivery.order?.customer_name || activeDelivery.customer_name || 'Cliente no disponible'}
                  </p>
                </div>
                <Button 
                  onClick={() => callCustomer(activeDelivery.order?.customer_phone || activeDelivery.customer_phone || '')} 
                  size="sm" 
                  className="bg-green-500 hover:bg-green-600"
                  disabled={!activeDelivery.order?.customer_phone && !activeDelivery.customer_phone}
                >
                  <Phone className="h-4 w-4 mr-2" />Llamar
                </Button>
              </div>

              {/* Address Info */}
              <div className="flex items-start space-x-3 p-4 bg-white/5 rounded-lg">
                <MapPin className="h-5 w-5 text-red-400 mt-1" />
                <div className="flex-1">
                  <p className="text-sm text-purple-200">Dirección de entrega</p>
                  <p className="text-white font-medium">
                    {activeDelivery.order?.delivery_address || activeDelivery.delivery_address || 'Dirección no disponible'}
                  </p>
                  {(activeDelivery.order?.delivery_notes || activeDelivery.delivery_notes) && (
                    <p className="text-sm text-purple-300 mt-1">
                      {activeDelivery.order?.delivery_notes || activeDelivery.delivery_notes}
                    </p>
                  )}
                </div>
                <Button 
                  onClick={() => openMaps(activeDelivery.order?.delivery_address || activeDelivery.delivery_address || '')} 
                  size="sm" 
                  className="bg-blue-500 hover:bg-blue-600"
                  disabled={!activeDelivery.order?.delivery_address && !activeDelivery.delivery_address}
                >
                  <Navigation className="h-4 w-4 mr-2" />Abrir
                </Button>
              </div>

              {/* Items */}
              <div className="p-4 bg-white/5 rounded-lg space-y-2">
                <div className="flex items-center space-x-2 mb-3">
                  <Package className="h-5 w-5 text-purple-400" />
                  <p className="text-sm text-purple-200 font-medium">Productos a entregar</p>
                </div>
                {activeDelivery.order?.items?.length > 0 ? (
                  activeDelivery.order.items.map((item, idx) => (
                    <div key={idx} className="flex justify-between text-white">
                      <span>{item.quantity}x {item.name}</span>
                      <span className="text-purple-300">{formatCurrency(item.price * item.quantity)}</span>
                    </div>
                  ))
                ) : (
                  <p className="text-purple-300">No hay productos disponibles</p>
                )}
                <div className="pt-2 mt-2 border-t border-white/10 flex justify-between font-bold">
                  <span className="text-white">Total</span>
                  <span className="text-orange-400">
                    {formatCurrency(activeDelivery.order?.total || activeDelivery.total || 0)}
                  </span>
                </div>
              </div>

              {/* Complete Button */}
              <Button 
                onClick={() => handleComplete(activeDelivery.id)} 
                disabled={actionLoading === activeDelivery.id} 
                className="w-full h-16 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white text-lg font-bold"
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
        )}

        {/* Available Orders */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-white flex items-center space-x-2">
              <Clock className="h-5 w-5" />
              <span>Pedidos Disponibles</span>
            </h2>
            <Badge className="bg-purple-500 text-white">{pendingAssignments.length}</Badge>
          </div>

          {pendingAssignments.length === 0 ? (
            <Card className="backdrop-blur-sm bg-white/10 border-purple-500/20">
              <CardContent className="py-12 text-center">
                <Package className="h-16 w-16 text-purple-400 mx-auto mb-4 opacity-50" />
                <p className="text-white text-lg font-medium mb-2">
                  {activeDelivery ? '¡Enfócate en tu entrega actual!' : 'No hay pedidos pendientes'}
                </p>
                <p className="text-purple-300">
                  {activeDelivery ? 'Completa la entrega en curso para ver nuevos pedidos' : 'Espera a que se asignen nuevos pedidos'}
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {pendingAssignments.map(assignment => (
                <Card key={assignment.id} className="backdrop-blur-sm bg-white/10 border-purple-500/20 hover:border-purple-400/40 transition-colors">
                  <CardContent className="pt-6">
                    <div className="space-y-4">
                      {/* Order Header */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className="w-12 h-12 bg-gradient-to-br from-purple-400 to-pink-400 rounded-full flex items-center justify-center">
                            <Package className="h-6 w-6 text-white" />
                          </div>
                          <div>
                            <p className="text-white font-bold text-lg">Pedido #{assignment.order_id}</p>
                            <p className="text-purple-300 text-sm">Asignado {formatTime(assignment.assigned_at)}</p>
                          </div>
                        </div>
                        <Badge className="bg-yellow-500 text-white">Nuevo</Badge>
                      </div>

                      {/* Customer */}
                      <div className="flex items-center space-x-3 p-3 bg-white/5 rounded-lg">
                        <User className="h-5 w-5 text-purple-400" />
                        <div className="flex-1">
                          <p className="text-white font-medium">
                            {assignment.order?.customer_name || assignment.customer_name || 'Cliente no disponible'}
                          </p>
                          <p className="text-purple-300 text-sm">
                            {assignment.order?.customer_phone || assignment.customer_phone || 'Teléfono no disponible'}
                          </p>
                        </div>
                      </div>

                      {/* Address */}
                      <div className="flex items-center space-x-3 p-3 bg-white/5 rounded-lg">
                        <MapPin className="h-5 w-5 text-red-400" />
                        <div className="flex-1">
                          <p className="text-white">
                            {assignment.order?.delivery_address || assignment.delivery_address || 'Dirección no disponible'}
                          </p>
                        </div>
                        <ChevronRight className="h-5 w-5 text-purple-400" />
                      </div>

                      {/* Total */}
                      <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                        <div className="flex items-center space-x-2">
                          <DollarSign className="h-5 w-5 text-green-400" />
                          <span className="text-purple-200">Monto a cobrar</span>
                        </div>
                        <span className="text-orange-400 font-bold text-xl">
                          {formatCurrency(assignment.order?.total || assignment.total || 0)}
                        </span>
                      </div>

                      {/* Items Preview */}
                      <div className="p-3 bg-white/5 rounded-lg">
                        <p className="text-purple-200 text-sm mb-2">
                          {assignment.order?.items?.length || 0} productos
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {assignment.order?.items?.slice(0,3).map((item,idx) => (
                            <Badge key={idx} variant="outline" className="text-white border-purple-400">
                              {item.quantity}x {item.name}
                            </Badge>
                          ))}
                          {assignment.order?.items?.length > 3 && (
                            <Badge variant="outline" className="text-purple-300 border-purple-400">
                              +{assignment.order.items.length - 3} más
                            </Badge>
                          )}
                        </div>
                      </div>

                      {/* Accept Button */}
                      <Button 
                        onClick={() => handleAccept(assignment.id)} 
                        disabled={actionLoading === assignment.id || !!activeDelivery} 
                        className="w-full h-14 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white text-lg font-bold"
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
        <Card className="backdrop-blur-sm bg-white/10 border-purple-500/20">
          <CardHeader>
            <CardTitle className="text-white text-lg">Estadísticas de Hoy</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-white/5 rounded-lg text-center">
                <p className="text-purple-200 text-sm mb-1">Entregas completadas</p>
                <p className="text-white text-3xl font-bold">
                  {assignments.filter(a => a.status === 'completed').length}
                </p>
              </div>
              <div className="p-4 bg-white/5 rounded-lg text-center">
                <p className="text-purple-200 text-sm mb-1">Pedidos pendientes</p>
                <p className="text-white text-3xl font-bold">{pendingAssignments.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}