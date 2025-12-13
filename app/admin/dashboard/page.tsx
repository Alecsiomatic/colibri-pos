'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { 
  BarChart3,
  Users,
  ShoppingCart,
  Package,
  TrendingUp,
  DollarSign,
  Clock,
  Truck,
  RefreshCw
} from 'lucide-react'
import { useAuth } from '@/hooks/use-auth'
import { useToast } from '@/hooks/use-notifications'
import AdminLayout from '@/components/admin/admin-layout'

interface DashboardStats {
  orders: {
    total: number
    today: number
    week: number
    pending: number
    confirmed: number
    preparing: number
    ready: number
    in_delivery: number
    delivered: number
    cancelled: number
  }
  revenue: {
    total: number
    today: number
    week: number
    average: number
  }
  products: {
    total: number
    active: number
    lowStock: number
  }
  users: {
    total: number
  }
}

export default function AdminDashboard() {
  const { user, isLoading: authLoading } = useAuth()
  const toast = useToast()

  const [stats, setStats] = useState<DashboardStats>({
    orders: { total: 0, today: 0, week: 0, pending: 0, confirmed: 0, preparing: 0, ready: 0, in_delivery: 0, delivered: 0, cancelled: 0 },
    revenue: { total: 0, today: 0, week: 0, average: 0 },
    products: { total: 0, active: 0, lowStock: 0 },
    users: { total: 0 }
  })

  const [refreshing, setRefreshing] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (user?.is_admin) {
      loadDashboardData()
    }
  }, [user])

  const loadDashboardData = async () => {
    setRefreshing(true)
    setLoading(true)
    try {
      const ordersResponse = await fetch('/api/orders-mysql?limit=1000', { credentials: 'include' })
      if (!ordersResponse.ok) throw new Error('Error al cargar órdenes')
      const ordersData = await ordersResponse.json()
      const orders = ordersData.orders || []

      const productsResponse = await fetch('/api/products-mysql', { credentials: 'include' })
      const productsData = await productsResponse.json()
      const products = productsData.products || []

      const usersResponse = await fetch('/api/admin/users-stats', { credentials: 'include' })
      let totalUsers = 0
      if (usersResponse.ok) {
        const usersData = await usersResponse.json()
        totalUsers = usersData.total || 0
      }

      calculateStats(orders, products, totalUsers)
    } catch (error) {
      console.error('Error loading dashboard data:', error)
      toast({ title: "Error", description: "No se pudieron cargar los datos del dashboard", variant: "destructive" })
    } finally {
      setRefreshing(false)
      setLoading(false)
    }
  }

  const calculateStats = (orders: any[], products: any[], totalUsers: number) => {
    const now = new Date()
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000)

    const todayOrders = orders.filter((order: any) => new Date(order.created_at) >= today)
    const weekOrders = orders.filter((order: any) => new Date(order.created_at) >= weekAgo)

    const totalRevenue = orders.reduce((sum: number, order: any) => sum + Number(order.total || 0), 0)
    const todayRevenue = todayOrders.reduce((sum: number, order: any) => sum + Number(order.total || 0), 0)
    const weekRevenue = weekOrders.reduce((sum: number, order: any) => sum + Number(order.total || 0), 0)

    const activeProducts = products.filter((p: any) => p.available).length
    const lowStockProducts = products.filter((p: any) => (p.stock ?? 0) < 10).length

    setStats({
      orders: {
        total: orders.length,
        today: todayOrders.length,
        week: weekOrders.length,
        pending: orders.filter((o: any) => ['pending', 'pendiente'].includes(o.status?.toLowerCase())).length,
        confirmed: orders.filter((o: any) => ['confirmed', 'confirmado'].includes(o.status?.toLowerCase())).length,
        preparing: orders.filter((o: any) => ['preparing', 'preparando'].includes(o.status?.toLowerCase())).length,
        ready: orders.filter((o: any) => ['ready', 'listo'].includes(o.status?.toLowerCase())).length,
        in_delivery: orders.filter((o: any) => ['in_delivery', 'en_camino', 'assigned_to_driver', 'accepted_by_driver'].includes(o.status?.toLowerCase())).length,
        delivered: orders.filter((o: any) => ['delivered', 'entregado'].includes(o.status?.toLowerCase())).length,
        cancelled: orders.filter((o: any) => ['cancelled', 'cancelado'].includes(o.status?.toLowerCase())).length,
      },
      revenue: {
        total: totalRevenue,
        today: todayRevenue,
        week: weekRevenue,
        average: orders.length > 0 ? totalRevenue / orders.length : 0
      },
      products: {
        total: products.length,
        active: activeProducts,
        lowStock: lowStockProducts
      },
      users: {
        total: totalUsers
      }
    })
  }

  if (authLoading || loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-96">
          <RefreshCw className="h-8 w-8 animate-spin text-colibri-gold" />
        </div>
      </AdminLayout>
    )
  }

  if (!user?.is_admin) {
    return (
      <AdminLayout>
        <div className="text-center py-12">
          <p className="text-xl text-red-400">No tienes permisos para acceder a esta página</p>
        </div>
      </AdminLayout>
    )
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP' }).format(amount)
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white">Dashboard</h1>
            <p className="text-colibri-gold">Resumen general del negocio</p>
          </div>
          <Button onClick={loadDashboardData} disabled={refreshing} className="bg-colibri-green hover:bg-colibri-green/90">
            <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            Actualizar
          </Button>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card className="bg-gradient-to-br from-colibri-green/50 to-colibri-wine/30 border-colibri-gold/50">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-colibri-beige">Ingresos Totales</CardTitle>
              <DollarSign className="h-4 w-4 text-colibri-gold" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">{formatCurrency(stats.revenue.total)}</div>
              <p className="text-xs text-colibri-gold">Hoy: {formatCurrency(stats.revenue.today)}</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-blue-900/50 to-blue-800/30 border-blue-500/50">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-blue-100">Total Pedidos</CardTitle>
              <ShoppingCart className="h-4 w-4 text-blue-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">{stats.orders.total}</div>
              <p className="text-xs text-blue-300">Hoy: {stats.orders.today} | Semana: {stats.orders.week}</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-green-900/50 to-green-800/30 border-green-500/50">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-green-100">Productos</CardTitle>
              <Package className="h-4 w-4 text-green-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">{stats.products.total}</div>
              <p className="text-xs text-green-300">Activos: {stats.products.active} | Stock bajo: {stats.products.lowStock}</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-orange-900/50 to-orange-800/30 border-orange-500/50">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-orange-100">Usuarios</CardTitle>
              <Users className="h-4 w-4 text-orange-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">{stats.users.total}</div>
              <p className="text-xs text-orange-300">Clientes registrados</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card className="bg-black/50 border-amber-500/50">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-amber-100 flex items-center">
                <Clock className="h-4 w-4 mr-2" />Pendientes
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">{stats.orders.pending}</div>
            </CardContent>
          </Card>

          <Card className="bg-black/50 border-blue-500/50">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-blue-100 flex items-center">
                <Package className="h-4 w-4 mr-2" />Preparando
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">{stats.orders.preparing + stats.orders.ready}</div>
            </CardContent>
          </Card>

          <Card className="bg-black/50 border-colibri-gold/50">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-colibri-beige flex items-center">
                <Truck className="h-4 w-4 mr-2" />En Camino
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">{stats.orders.in_delivery}</div>
            </CardContent>
          </Card>

          <Card className="bg-black/50 border-green-500/50">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-green-100 flex items-center">
                <TrendingUp className="h-4 w-4 mr-2" />Entregados
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">{stats.orders.delivered}</div>
            </CardContent>
          </Card>
        </div>

        <Card className="bg-black/50 border-colibri-gold/50">
          <CardHeader>
            <CardTitle className="text-white">Acciones Rápidas</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-4">
            <Button onClick={() => window.location.href = '/admin/orders'} className="bg-colibri-green hover:bg-colibri-green/90">
              <ShoppingCart className="mr-2 h-4 w-4" />Ver Pedidos
            </Button>
            <Button onClick={() => window.location.href = '/admin/products'} className="bg-blue-600 hover:bg-blue-700">
              <Package className="mr-2 h-4 w-4" />Gestionar Productos
            </Button>
            <Button onClick={() => window.location.href = '/admin/delivery'} className="bg-green-600 hover:bg-green-700">
              <Truck className="mr-2 h-4 w-4" />Delivery
            </Button>
            <Button onClick={() => window.location.href = '/admin/driver-stats'} className="bg-orange-600 hover:bg-orange-700">
              <BarChart3 className="mr-2 h-4 w-4" />Estadísticas
            </Button>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  )
}