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
  Package,
  Crown,
  Coins,
  TrendingUp,
  Gift,
  Star
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

  // Loyalty
  const [loyalty, setLoyalty] = useState<any>(null)
  const [loyaltyTransactions, setLoyaltyTransactions] = useState<any[]>([])
  const [loyaltyLoading, setLoyaltyLoading] = useState(true)

  // Redirect if not logged in
  useEffect(() => {
    if (!user) {
      router.push('/login')
    }
  }, [user, router])

  // Fetch loyalty data
  useEffect(() => {
    if (!user) return
    async function fetchLoyalty() {
      try {
        const res = await fetch('/api/loyalty?action=history&limit=20')
        const data = await res.json()
        if (data.success) {
          setLoyalty(data.loyalty)
          setLoyaltyTransactions(data.transactions || [])
        }
      } catch (e) { /* silent */ }
      setLoyaltyLoading(false)
    }
    fetchLoyalty()
  }, [user])

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
      preparing: { label: 'Preparando', color: 'bg-colibri-wine' },
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
      <div className="min-h-screen bg-gradient-to-br from-colibri-green/20 via-black to-colibri-wine/20 flex items-center justify-center">
        <Card className="backdrop-blur-sm bg-white/10 border-colibri-gold/20">
          <CardContent className="p-8 flex items-center space-x-4">
            <Loader2 className="h-6 w-6 animate-spin text-colibri-gold" />
            <span className="text-white">Verificando acceso...</span>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-colibri-green/20 via-black to-colibri-wine/20 py-12">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
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
            <h1 className="text-4xl font-bold bg-gradient-to-r from-colibri-gold via-colibri-wine to-colibri-green bg-clip-text text-transparent mb-2">
              Mi Perfil Galáctico
            </h1>
            <p className="text-colibri-beige">Gestiona tu cuenta y revisa tu historial</p>
          </div>
        </div>

        <Tabs defaultValue="profile" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4 bg-white/10 backdrop-blur-sm">
            <TabsTrigger value="profile" className="text-white data-[state=active]:bg-colibri-green">
              <User className="h-4 w-4 mr-2" />
              Perfil
            </TabsTrigger>
            <TabsTrigger value="orders" className="text-white data-[state=active]:bg-colibri-green">
              <ShoppingCart className="h-4 w-4 mr-2" />
              Mis Pedidos
            </TabsTrigger>
            <TabsTrigger value="loyalty" className="text-white data-[state=active]:bg-colibri-green">
              <Crown className="h-4 w-4 mr-2" />
              Mis Puntos
            </TabsTrigger>
            <TabsTrigger value="settings" className="text-white data-[state=active]:bg-colibri-green">
              <Settings className="h-4 w-4 mr-2" />
              Configuración
            </TabsTrigger>
          </TabsList>

          {/* Profile Tab */}
          <TabsContent value="profile" className="space-y-6">
            <Card className="backdrop-blur-sm bg-white/10 border-colibri-gold/20">
              <CardHeader>
                <CardTitle className="text-white flex items-center">
                  <User className="h-5 w-5 mr-2" />
                  Información Personal
                </CardTitle>
                <CardDescription className="text-colibri-beige">
                  Datos de tu cuenta galáctica
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label className="text-white">Nombre de usuario</Label>
                    <div className="p-3 bg-white/5 rounded-lg border border-colibri-gold/20">
                      <span className="text-colibri-beige">{user.username}</span>
                    </div>
                  </div>
                  
                  <div>
                    <Label className="text-white">Email</Label>
                    <div className="p-3 bg-white/5 rounded-lg border border-colibri-gold/20">
                      <span className="text-colibri-beige">{user.email}</span>
                    </div>
                  </div>

                  <div>
                    <Label className="text-white">Fecha de registro</Label>
                    <div className="p-3 bg-white/5 rounded-lg border border-colibri-gold/20">
                      <span className="text-colibri-beige">
                        {formatDate(user.created_at)}
                      </span>
                    </div>
                  </div>

                  <div>
                    <Label className="text-white">Pedidos realizados</Label>
                    <div className="p-3 bg-white/5 rounded-lg border border-colibri-gold/20">
                      <span className="text-colibri-beige">{orders.length}</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Orders Tab */}
          <TabsContent value="orders" className="space-y-6">
            <Card className="backdrop-blur-sm bg-white/10 border-colibri-gold/20">
              <CardHeader>
                <CardTitle className="text-white flex items-center">
                  <History className="h-5 w-5 mr-2" />
                  Historial de Pedidos
                </CardTitle>
                <CardDescription className="text-colibri-beige">
                  Todos tus viajes culinarios galácticos
                </CardDescription>
              </CardHeader>
              <CardContent>
                {ordersLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin text-colibri-gold mr-2" />
                    <span className="text-white">Cargando pedidos...</span>
                  </div>
                ) : orders.length === 0 ? (
                  <div className="text-center py-8">
                    <Package className="h-16 w-16 text-colibri-gold mx-auto mb-4" />
                    <h3 className="text-xl font-semibold text-white mb-2">Sin pedidos aún</h3>
                    <p className="text-colibri-beige mb-4">¡Comienza tu aventura galáctica!</p>
                    <Button 
                      onClick={() => router.push('/menu')}
                      className="bg-gradient-to-r from-colibri-green to-colibri-wine hover:from-colibri-green/90 hover:to-colibri-wine/90"
                    >
                      Explorar Menú
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {orders.map((order) => (
                      <div key={order.id} className="p-4 bg-white/5 rounded-lg border border-colibri-gold/20">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center space-x-3">
                            <h3 className="text-white font-medium">Pedido #{order.id}</h3>
                            {getOrderStatusBadge(order.status)}
                          </div>
                          <div className="text-right">
                            <p className="text-orange-400 font-bold">${order.total.toFixed(2)}</p>
                            <p className="text-colibri-beige text-sm">{formatDate(order.created_at)}</p>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-3">
                          <div>
                            <p className="text-colibri-beige text-sm">
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
                            <p className="text-colibri-beige text-sm">
                              <CreditCard className="h-4 w-4 inline mr-1" />
                              {order.payment_method === 'efectivo' ? 'Efectivo' : order.payment_method}
                            </p>
                          </div>
                        </div>

                        <div className="space-y-2">
                          <h4 className="text-white text-sm font-medium">Items:</h4>
                          {order.items && order.items.map((item: any, index: number) => (
                            <div key={index} className="flex justify-between text-sm">
                              <span className="text-colibri-beige">
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
                            className="border-colibri-gold text-colibri-beige hover:bg-colibri-green"
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

          {/* Loyalty Tab */}
          <TabsContent value="loyalty" className="space-y-6">
            {loyaltyLoading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-colibri-gold" />
              </div>
            ) : loyalty ? (
              <>
                {/* Points Card */}
                <Card className="backdrop-blur-sm bg-gradient-to-br from-colibri-wine/30 to-colibri-green/30 border-colibri-gold/20">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-colibri-gold text-sm uppercase tracking-wide">Tus Puntos</p>
                        <p className="text-4xl font-bold text-white">{(loyalty.total_points || 0).toLocaleString()}</p>
                        <p className="text-colibri-beige text-sm mt-1">
                          Acumulados: {(loyalty.lifetime_points || 0).toLocaleString()} pts
                        </p>
                      </div>
                      <div className="text-center">
                        <span className="text-5xl">
                          {loyalty.tier === 'diamante' ? '💎' : loyalty.tier === 'oro' ? '🥇' : loyalty.tier === 'plata' ? '🥈' : '🥉'}
                        </span>
                        <p className="text-white font-bold mt-1">{loyalty.tier_label}</p>
                        <p className="text-xs text-colibri-beige">Multiplicador {loyalty.tier_multiplier}x</p>
                      </div>
                    </div>
                    {loyalty.next_tier && loyalty.points_to_next > 0 && (
                      <div className="mt-4">
                        <div className="flex justify-between text-xs text-colibri-beige mb-1">
                          <span>Progreso al siguiente nivel</span>
                          <span>{loyalty.points_to_next.toLocaleString()} pts más</span>
                        </div>
                        <div className="w-full bg-white/10 rounded-full h-2">
                          <div
                            className="h-2 rounded-full bg-gradient-to-r from-colibri-gold to-colibri-wine transition-all"
                            style={{ width: `${Math.min(100, Math.max(5, 100 - (loyalty.points_to_next / (loyalty.lifetime_points + loyalty.points_to_next)) * 100))}%` }}
                          />
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Transactions */}
                <Card className="backdrop-blur-sm bg-white/10 border-colibri-gold/20">
                  <CardHeader>
                    <CardTitle className="text-white flex items-center">
                      <History className="h-5 w-5 mr-2" />
                      Historial de Puntos
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {loyaltyTransactions.length > 0 ? (
                      <div className="space-y-2">
                        {loyaltyTransactions.map((t: any) => (
                          <div key={t.id} className="flex justify-between items-center py-2 border-b border-white/5 last:border-0">
                            <div>
                              <p className="text-white text-sm">{t.description}</p>
                              <p className="text-xs text-colibri-beige">
                                {new Date(t.created_at).toLocaleDateString('es-MX', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                              </p>
                            </div>
                            <span className={`font-mono font-bold text-sm ${t.points > 0 ? 'text-green-400' : 'text-red-400'}`}>
                              {t.points > 0 ? '+' : ''}{t.points}
                            </span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <Coins className="h-12 w-12 mx-auto text-colibri-gold/40 mb-3" />
                        <p className="text-colibri-beige">Aún no tienes movimientos</p>
                        <p className="text-colibri-gold/60 text-sm">¡Haz tu primera compra para ganar puntos!</p>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* How it works */}
                <Card className="backdrop-blur-sm bg-white/10 border-colibri-gold/20">
                  <CardHeader>
                    <CardTitle className="text-white flex items-center">
                      <Star className="h-5 w-5 mr-2 text-amber-400" />
                      ¿Cómo funciona?
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3 text-colibri-beige text-sm">
                    <div className="flex gap-3 items-start">
                      <TrendingUp className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                      <p>Cada compra te da puntos automáticamente. Tu nivel te otorga un multiplicador para ganar más rápido.</p>
                    </div>
                    <div className="flex gap-3 items-start">
                      <Gift className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
                      <p>Canjea tus puntos por descuentos en tu próximo pedido directamente en el checkout.</p>
                    </div>
                    <div className="grid grid-cols-4 gap-2 mt-3">
                      {[
                        { icon: '🥉', name: 'Bronce', mult: '1x' },
                        { icon: '🥈', name: 'Plata', mult: '1.25x' },
                        { icon: '🥇', name: 'Oro', mult: '1.5x' },
                        { icon: '💎', name: 'Diamante', mult: '2x' },
                      ].map(t => (
                        <div key={t.name} className="text-center p-2 rounded-lg bg-white/5">
                          <span className="text-xl">{t.icon}</span>
                          <p className="text-xs text-white font-medium">{t.name}</p>
                          <p className="text-xs text-colibri-gold">{t.mult}</p>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </>
            ) : (
              <Card className="backdrop-blur-sm bg-white/10 border-colibri-gold/20">
                <CardContent className="text-center py-12">
                  <Crown className="h-12 w-12 mx-auto text-colibri-gold/40 mb-3" />
                  <p className="text-colibri-beige">El programa de lealtad no está disponible</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Settings Tab */}
          <TabsContent value="settings" className="space-y-6">
            <Card className="backdrop-blur-sm bg-white/10 border-colibri-gold/20">
              <CardHeader>
                <CardTitle className="text-white flex items-center">
                  <Shield className="h-5 w-5 mr-2" />
                  Cambiar Contraseña
                </CardTitle>
                <CardDescription className="text-colibri-beige">
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
                      className="bg-white/10 border-colibri-gold/30 text-white placeholder:text-colibri-beige/50"
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
                      className="bg-white/10 border-colibri-gold/30 text-white placeholder:text-colibri-beige/50"
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
                      className="bg-white/10 border-colibri-gold/30 text-white placeholder:text-colibri-beige/50"
                      placeholder="Repite la nueva contraseña"
                    />
                    {passwordErrors.confirmPassword && (
                      <p className="text-red-400 text-sm mt-1">{passwordErrors.confirmPassword}</p>
                    )}
                  </div>

                  <Button
                    type="submit"
                    disabled={isUpdatingPassword}
                    className="bg-gradient-to-r from-colibri-green to-colibri-wine hover:from-colibri-green/90 hover:to-colibri-wine/90 text-white"
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

            <Card className="backdrop-blur-sm bg-white/10 border-colibri-gold/20">
              <CardHeader>
                <CardTitle className="text-white text-red-400 flex items-center">
                  <XCircle className="h-5 w-5 mr-2" />
                  Zona de Peligro
                </CardTitle>
                <CardDescription className="text-colibri-beige">
                  Acciones irreversibles de tu cuenta
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-lg">
                    <h3 className="text-red-400 font-medium mb-2">Cerrar Sesión</h3>
                    <p className="text-colibri-beige text-sm mb-3">
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