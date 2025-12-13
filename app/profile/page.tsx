'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Separator } from '@/components/ui/separator'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { 
  User, 
  Mail, 
  Shield, 
  ShoppingCart, 
  ArrowLeft, 
  Loader2,
  Settings,
  History,
  MapPin,
  Phone,
  Calendar,
  Truck,
  Store,
  Clock,
  CreditCard,
  CheckCircle2,
  XCircle,
  Package
} from 'lucide-react'
import { useAuth } from '@/hooks/use-auth'
import { useOrders } from '@/hooks/use-orders'
import { useToast } from '@/hooks/use-notifications'

export default function ProfilePage() {
  const { user, updatePassword, logout } = useAuth()
  const { orders, loading: ordersLoading } = useOrders()
  const toast = useToast()
  const router = useRouter()

  // Form states
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false)
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  })
  const [passwordErrors, setPasswordErrors] = useState<{ [key: string]: string }>({})

  // Redirect if not logged in
  useEffect(() => {
    if (!user) {
      router.push('/login')
    }
  }, [user, router])

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault()
    setPasswordErrors({})

    // Validate passwords
    const newErrors: { [key: string]: string } = {}

    if (!passwordData.currentPassword) {
      newErrors.currentPassword = 'La contraseña actual es requerida'
    }

    if (!passwordData.newPassword) {
      newErrors.newPassword = 'La nueva contraseña es requerida'
    } else if (passwordData.newPassword.length < 6) {
      newErrors.newPassword = 'La nueva contraseña debe tener al menos 6 caracteres'
    }

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      newErrors.confirmPassword = 'Las contraseñas no coinciden'
    }

    if (Object.keys(newErrors).length > 0) {
      setPasswordErrors(newErrors)
      return
    }

    setIsUpdatingPassword(true)

    try {
      const result = await updatePassword(passwordData.currentPassword, passwordData.newPassword)
      
      if (result.success) {
        toast.success('Contraseña actualizada', 'Tu contraseña ha sido cambiada exitosamente')
        setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' })
      } else {
        toast.error('Error al cambiar contraseña', result.message || 'Intenta de nuevo')
      }
    } catch (error) {
      console.error('Error updating password:', error)
      toast.error('Error', 'Error de conexión. Intenta de nuevo.')
    } finally {
      setIsUpdatingPassword(false)
    }
  }

  const handleLogout = async () => {
    try {
      await logout()
      router.push('/login')
    } catch (error) {
      console.error('Error logging out:', error)
      toast.error('Error', 'Error al cerrar sesión')
    }
  }

  const getOrderStatusBadge = (status: string) => {
    const statusConfig = {
      pending: { label: 'Pendiente', color: 'bg-yellow-500' },
      confirmed: { label: 'Confirmado', color: 'bg-blue-500' },
      preparing: { label: 'Preparando', color: 'bg-purple-500' },
      ready: { label: 'Listo', color: 'bg-green-500' },
      in_delivery: { label: 'En Camino', color: 'bg-orange-500' },
      delivered: { label: 'Entregado', color: 'bg-green-600' },
      cancelled: { label: 'Cancelado', color: 'bg-red-500' }
    }

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending
    return <Badge className={`${config.color} text-white`}>{config.label}</Badge>
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-MX', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-black to-blue-900 flex items-center justify-center">
        <Card className="backdrop-blur-sm bg-white/10 border-purple-500/20">
          <CardContent className="p-8 flex items-center space-x-4">
            <Loader2 className="h-6 w-6 animate-spin text-purple-400" />
            <span className="text-white">Verificando acceso...</span>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-black to-blue-900 py-12">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <Button 
            variant="ghost" 
            onClick={() => router.back()} 
            className="mb-4 text-purple-400 hover:text-purple-300"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Volver
          </Button>
          
          <div className="text-center">
            <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-400 via-pink-400 to-orange-400 bg-clip-text text-transparent mb-2">
              Mi Perfil Galáctico
            </h1>
            <p className="text-purple-200">Gestiona tu cuenta y revisa tu historial</p>
          </div>
        </div>

        <Tabs defaultValue="profile" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3 bg-white/10 backdrop-blur-sm">
            <TabsTrigger value="profile" className="text-white data-[state=active]:bg-purple-600">
              <User className="h-4 w-4 mr-2" />
              Perfil
            </TabsTrigger>
            <TabsTrigger value="orders" className="text-white data-[state=active]:bg-purple-600">
              <ShoppingCart className="h-4 w-4 mr-2" />
              Mis Pedidos
            </TabsTrigger>
            <TabsTrigger value="settings" className="text-white data-[state=active]:bg-purple-600">
              <Settings className="h-4 w-4 mr-2" />
              Configuración
            </TabsTrigger>
          </TabsList>

          {/* Profile Tab */}
          <TabsContent value="profile" className="space-y-6">
            <Card className="backdrop-blur-sm bg-white/10 border-purple-500/20">
              <CardHeader>
                <CardTitle className="text-white flex items-center">
                  <User className="h-5 w-5 mr-2" />
                  Información Personal
                </CardTitle>
                <CardDescription className="text-purple-200">
                  Datos de tu cuenta galáctica
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label className="text-white">Nombre de usuario</Label>
                    <div className="p-3 bg-white/5 rounded-lg border border-purple-300/20">
                      <span className="text-purple-200">{user.username}</span>
                    </div>
                  </div>
                  
                  <div>
                    <Label className="text-white">Email</Label>
                    <div className="p-3 bg-white/5 rounded-lg border border-purple-300/20">
                      <span className="text-purple-200">{user.email}</span>
                    </div>
                  </div>

                  <div>
                    <Label className="text-white">Fecha de registro</Label>
                    <div className="p-3 bg-white/5 rounded-lg border border-purple-300/20">
                      <span className="text-purple-200">
                        {formatDate(user.created_at)}
                      </span>
                    </div>
                  </div>

                  <div>
                    <Label className="text-white">Pedidos realizados</Label>
                    <div className="p-3 bg-white/5 rounded-lg border border-purple-300/20">
                      <span className="text-purple-200">{orders.length}</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Orders Tab */}
          <TabsContent value="orders" className="space-y-6">
            <Card className="backdrop-blur-sm bg-white/10 border-purple-500/20">
              <CardHeader>
                <CardTitle className="text-white flex items-center">
                  <History className="h-5 w-5 mr-2" />
                  Historial de Pedidos
                </CardTitle>
                <CardDescription className="text-purple-200">
                  Todos tus viajes culinarios galácticos
                </CardDescription>
              </CardHeader>
              <CardContent>
                {ordersLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin text-purple-400 mr-2" />
                    <span className="text-white">Cargando pedidos...</span>
                  </div>
                ) : orders.length === 0 ? (
                  <div className="text-center py-8">
                    <Package className="h-16 w-16 text-purple-400 mx-auto mb-4" />
                    <h3 className="text-xl font-semibold text-white mb-2">Sin pedidos aún</h3>
                    <p className="text-purple-200 mb-4">¡Comienza tu aventura galáctica!</p>
                    <Button 
                      onClick={() => router.push('/menu')}
                      className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
                    >
                      Explorar Menú
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {orders.map((order) => (
                      <div key={order.id} className="p-4 bg-white/5 rounded-lg border border-purple-300/20">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center space-x-3">
                            <h3 className="text-white font-medium">Pedido #{order.id}</h3>
                            {getOrderStatusBadge(order.status)}
                          </div>
                          <div className="text-right">
                            <p className="text-orange-400 font-bold">${order.total.toFixed(2)}</p>
                            <p className="text-purple-300 text-sm">{formatDate(order.created_at)}</p>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-3">
                          <div>
                            <p className="text-purple-200 text-sm">
                              <span className="flex items-center">
                                {order.delivery_type === 'delivery' ? (
                                  <Truck className="h-4 w-4 mr-1" />
                                ) : (
                                  <Store className="h-4 w-4 mr-1" />
                                )}
                                {order.delivery_type === 'delivery' ? 'Delivery' : 'Pickup'}
                              </span>
                            </p>
                          </div>
                          <div>
                            <p className="text-purple-200 text-sm">
                              <CreditCard className="h-4 w-4 inline mr-1" />
                              {order.payment_method === 'efectivo' ? 'Efectivo' : order.payment_method}
                            </p>
                          </div>
                        </div>

                        <div className="space-y-2">
                          <h4 className="text-white text-sm font-medium">Items:</h4>
                          {order.items && order.items.map((item: any, index: number) => (
                            <div key={index} className="flex justify-between text-sm">
                              <span className="text-purple-200">
                                {item.quantity}x {item.name}
                              </span>
                              <span className="text-orange-400">
                                ${(item.price * item.quantity).toFixed(2)}
                              </span>
                            </div>
                          ))}
                        </div>

                        <div className="flex justify-end mt-3">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => router.push(`/orders/${order.id}`)}
                            className="border-purple-400 text-purple-300 hover:bg-purple-600"
                          >
                            Ver Detalles
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Settings Tab */}
          <TabsContent value="settings" className="space-y-6">
            <Card className="backdrop-blur-sm bg-white/10 border-purple-500/20">
              <CardHeader>
                <CardTitle className="text-white flex items-center">
                  <Shield className="h-5 w-5 mr-2" />
                  Cambiar Contraseña
                </CardTitle>
                <CardDescription className="text-purple-200">
                  Actualiza tu contraseña de seguridad galáctica
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handlePasswordChange} className="space-y-4">
                  <div>
                    <Label htmlFor="currentPassword" className="text-white">Contraseña actual *</Label>
                    <Input
                      id="currentPassword"
                      type="password"
                      value={passwordData.currentPassword}
                      onChange={(e) => setPasswordData(prev => ({ ...prev, currentPassword: e.target.value }))}
                      className="bg-white/10 border-purple-300/30 text-white placeholder:text-purple-300"
                      placeholder="Tu contraseña actual"
                    />
                    {passwordErrors.currentPassword && (
                      <p className="text-red-400 text-sm mt-1">{passwordErrors.currentPassword}</p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="newPassword" className="text-white">Nueva contraseña *</Label>
                    <Input
                      id="newPassword"
                      type="password"
                      value={passwordData.newPassword}
                      onChange={(e) => setPasswordData(prev => ({ ...prev, newPassword: e.target.value }))}
                      className="bg-white/10 border-purple-300/30 text-white placeholder:text-purple-300"
                      placeholder="Mínimo 6 caracteres"
                    />
                    {passwordErrors.newPassword && (
                      <p className="text-red-400 text-sm mt-1">{passwordErrors.newPassword}</p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="confirmPassword" className="text-white">Confirmar nueva contraseña *</Label>
                    <Input
                      id="confirmPassword"
                      type="password"
                      value={passwordData.confirmPassword}
                      onChange={(e) => setPasswordData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                      className="bg-white/10 border-purple-300/30 text-white placeholder:text-purple-300"
                      placeholder="Repite la nueva contraseña"
                    />
                    {passwordErrors.confirmPassword && (
                      <p className="text-red-400 text-sm mt-1">{passwordErrors.confirmPassword}</p>
                    )}
                  </div>

                  <Button
                    type="submit"
                    disabled={isUpdatingPassword}
                    className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white"
                  >
                    {isUpdatingPassword ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Actualizando...
                      </>
                    ) : (
                      'Cambiar Contraseña'
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>

            <Card className="backdrop-blur-sm bg-white/10 border-purple-500/20">
              <CardHeader>
                <CardTitle className="text-white text-red-400 flex items-center">
                  <XCircle className="h-5 w-5 mr-2" />
                  Zona de Peligro
                </CardTitle>
                <CardDescription className="text-purple-200">
                  Acciones irreversibles de tu cuenta
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-lg">
                    <h3 className="text-red-400 font-medium mb-2">Cerrar Sesión</h3>
                    <p className="text-purple-200 text-sm mb-3">
                      Cerrar tu sesión actual en este dispositivo
                    </p>
                    <Button
                      onClick={handleLogout}
                      variant="destructive"
                      className="bg-red-600 hover:bg-red-700"
                    >
                      Cerrar Sesión
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}