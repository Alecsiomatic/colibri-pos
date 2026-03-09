'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart
} from 'recharts'
import {
  DollarSign, ShoppingCart, TrendingUp, CreditCard, Clock, Package,
  Users, Truck, RefreshCw, MapPin, ArrowUpRight, ArrowDownRight,
  ChevronRight, Bot, Receipt, CalendarDays, LayoutGrid
} from 'lucide-react'
import { useAuth } from '@/hooks/use-auth'
import { useToast } from '@/hooks/use-notifications'
import AdminLayout from '@/components/admin/admin-layout'
import Link from 'next/link'

// ─── Types ─────────────────────────────────
interface Analytics {
  summary: { total_orders: number; total_revenue: number; avg_ticket: number; max_ticket: number; active_days: number }
  prev_summary: { total_orders: number; total_revenue: number; avg_ticket: number }
  sales_by_day: { date: string; orders: number; revenue: number }[]
  sales_by_hour: { hour: number; orders: number; revenue: number }[]
  sales_by_day_of_week: { day_num: number; day_name: string; orders: number; revenue: number }[]
  sales_by_channel: { channel: string; orders: number; revenue: number }[]
  sales_by_payment: { method: string; orders: number; revenue: number }[]
  top_products: { product_name: string; quantity: number; revenue: number }[]
}

interface OrderPipeline {
  pending: number; preparing: number; ready: number; in_delivery: number; delivered: number
  todayOrders: number; todayRevenue: number
}

const COLORS = ['#D4A24E', '#7A2E3A', '#2D6A4F', '#3b82f6', '#8b5cf6', '#f59e0b', '#06b6d4', '#ec4899']
const DAY_NAMES_ES: Record<string, string> = {
  Sunday: 'Dom', Monday: 'Lun', Tuesday: 'Mar', Wednesday: 'Mié',
  Thursday: 'Jue', Friday: 'Vie', Saturday: 'Sáb'
}

function fmt(n: number | string): string {
  return Number(n || 0).toLocaleString('es-MX', { style: 'currency', currency: 'MXN', minimumFractionDigits: 0 })
}

function pct(current: number, previous: number): { value: number; positive: boolean } {
  if (!previous) return { value: current > 0 ? 100 : 0, positive: true }
  const v = Math.round(((current - previous) / previous) * 100)
  return { value: Math.abs(v), positive: v >= 0 }
}

function fillHours(data: { hour: number; orders: number; revenue: number }[]) {
  const map = new Map(data.map(d => [d.hour, d]))
  return Array.from({ length: 24 }, (_, i) => map.get(i) || { hour: i, orders: 0, revenue: 0 })
}

// ─── Main Component ────────────────────────
export default function AdminDashboard() {
  const { user, isLoading: authLoading } = useAuth()
  const toast = useToast()

  const [analytics, setAnalytics] = useState<Analytics | null>(null)
  const [pipeline, setPipeline] = useState<OrderPipeline>({ pending: 0, preparing: 0, ready: 0, in_delivery: 0, delivered: 0, todayOrders: 0, todayRevenue: 0 })
  const [days, setDays] = useState(30)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [useVisualTables, setUseVisualTables] = useState(false)
  const [savingTableMode, setSavingTableMode] = useState(false)

  const loadAll = useCallback(async () => {
    setRefreshing(true)
    try {
      const [analyticsRes, ordersRes, bizRes] = await Promise.all([
        fetch(`/api/reports/analytics?days=${days}`),
        fetch('/api/orders-mysql?limit=500', { credentials: 'include' }),
        fetch('/api/admin/business-info', { credentials: 'include' }),
      ])

      const analyticsJson = await analyticsRes.json()
      if (analyticsJson.success) setAnalytics(analyticsJson)

      const ordersJson = await ordersRes.json()
      const orders = ordersJson.orders || []
      const today = new Date(); today.setHours(0, 0, 0, 0)
      const todayOrders = orders.filter((o: any) => new Date(o.created_at) >= today)
      setPipeline({
        pending: orders.filter((o: any) => ['pending', 'pendiente'].includes(o.status?.toLowerCase())).length,
        preparing: orders.filter((o: any) => ['preparing', 'preparando', 'confirmed', 'confirmado'].includes(o.status?.toLowerCase())).length,
        ready: orders.filter((o: any) => ['ready', 'listo'].includes(o.status?.toLowerCase())).length,
        in_delivery: orders.filter((o: any) => ['in_delivery', 'en_camino', 'assigned_to_driver', 'accepted_by_driver'].includes(o.status?.toLowerCase())).length,
        delivered: orders.filter((o: any) => ['delivered', 'entregado', 'completed', 'paid'].includes(o.status?.toLowerCase())).length,
        todayOrders: todayOrders.length,
        todayRevenue: todayOrders.reduce((s: number, o: any) => s + Number(o.total || 0), 0),
      })

      const bizJson = await bizRes.json()
      if (bizJson.success && bizJson.businessInfo) setUseVisualTables(!!bizJson.businessInfo.use_visual_tables)
    } catch (err) {
      console.error('Error loading dashboard:', err)
      toast.error('Error al cargar datos')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [days])

  useEffect(() => { if (user?.is_admin) loadAll() }, [user, loadAll])

  const toggleTableMode = async () => {
    setSavingTableMode(true)
    try {
      const res = await fetch('/api/admin/business-info', { credentials: 'include' })
      const data = await res.json()
      const current = data.success ? data.businessInfo : {}
      const newValue = !useVisualTables
      await fetch('/api/admin/business-info', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, credentials: 'include',
        body: JSON.stringify({ businessInfo: { ...current, use_visual_tables: newValue } })
      })
      setUseVisualTables(newValue)
      toast.success(newValue ? 'Modo mapa visual activado' : 'Modo clásico activado')
    } catch { toast.error('Error al cambiar modo') } finally { setSavingTableMode(false) }
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
        <div className="text-center py-12"><p className="text-xl text-red-400">No tienes permisos</p></div>
      </AdminLayout>
    )
  }

  const s = analytics?.summary
  const ps = analytics?.prev_summary
  const revChange = s && ps ? pct(Number(s.total_revenue), Number(ps.total_revenue)) : null
  const ordChange = s && ps ? pct(s.total_orders, ps.total_orders) : null
  const tickChange = s && ps ? pct(Number(s.avg_ticket), Number(ps.avg_ticket)) : null

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div>
            <h1 className="text-3xl font-bold text-white">Dashboard</h1>
            <p className="text-colibri-gold/80 text-sm">Centro de control de tu restaurante</p>
          </div>
          <div className="flex items-center gap-3">
            <select value={days} onChange={(e) => setDays(Number(e.target.value))}
              className="bg-black/50 text-white rounded-lg px-3 py-2 text-sm border border-colibri-gold/30 focus:border-colibri-gold">
              <option value={7}>7 días</option>
              <option value={15}>15 días</option>
              <option value={30}>30 días</option>
              <option value={60}>60 días</option>
              <option value={90}>90 días</option>
            </select>
            <button onClick={loadAll} disabled={refreshing}
              className="bg-colibri-green hover:bg-colibri-green/80 text-white rounded-lg px-4 py-2 text-sm font-medium flex items-center gap-2 transition">
              <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />Actualizar
            </button>
          </div>
        </div>

        {/* ─── KPI Cards ─── */}
        {s && (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <KpiCard title="Ingresos" value={fmt(s.total_revenue)} icon={DollarSign} change={revChange} accent="colibri-gold"
              sub={`Hoy: ${fmt(pipeline.todayRevenue)}`} />
            <KpiCard title="Pedidos" value={s.total_orders.toString()} icon={ShoppingCart} change={ordChange} accent="blue-400"
              sub={`Hoy: ${pipeline.todayOrders}`} />
            <KpiCard title="Ticket Promedio" value={fmt(s.avg_ticket)} icon={CreditCard} change={tickChange} accent="emerald-400" />
            <KpiCard title="Ticket Máximo" value={fmt(s.max_ticket)} icon={TrendingUp} accent="purple-400"
              sub={`${s.active_days} días activos`} />
          </div>
        )}

        {/* ─── Order Pipeline (live) ─── */}
        <div className="bg-black/40 rounded-xl border border-colibri-gold/20 p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-colibri-beige flex items-center gap-2">
              <ShoppingCart className="h-4 w-4 text-colibri-gold" /> Pipeline de Pedidos
            </h3>
            <Link href="/admin/orders" className="text-xs text-colibri-gold hover:underline flex items-center gap-1">
              Ver todos <ChevronRight className="h-3 w-3" />
            </Link>
          </div>
          <div className="grid grid-cols-5 gap-2">
            {[
              { label: 'Pendientes', count: pipeline.pending, color: 'bg-amber-500/20 text-amber-400 border-amber-500/30' },
              { label: 'Preparando', count: pipeline.preparing, color: 'bg-blue-500/20 text-blue-400 border-blue-500/30' },
              { label: 'Listos', count: pipeline.ready, color: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30' },
              { label: 'En camino', count: pipeline.in_delivery, color: 'bg-colibri-gold/20 text-colibri-gold border-colibri-gold/30' },
              { label: 'Entregados', count: pipeline.delivered, color: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' },
            ].map(p => (
              <div key={p.label} className={`rounded-lg border p-3 text-center ${p.color}`}>
                <div className="text-2xl font-bold">{p.count}</div>
                <div className="text-[10px] sm:text-xs font-medium mt-0.5">{p.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* ─── Revenue Chart ─── */}
        {analytics && analytics.sales_by_day.length > 0 && (
          <div className="bg-black/40 rounded-xl border border-colibri-gold/20 p-5">
            <h3 className="text-sm font-semibold text-colibri-beige mb-4 flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-colibri-gold" /> Ingresos por Día
            </h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={analytics.sales_by_day}>
                  <defs>
                    <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#D4A24E" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#D4A24E" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                  <XAxis dataKey="date" stroke="#888" fontSize={11}
                    tickFormatter={(v) => { const d = new Date(v + 'T12:00:00'); return `${d.getDate()}/${d.getMonth() + 1}` }} />
                  <YAxis stroke="#888" fontSize={11} tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} />
                  <Tooltip contentStyle={{ backgroundColor: '#1a1a1a', border: '1px solid #D4A24E33', borderRadius: '8px', color: '#fff' }}
                    formatter={(value: number) => [fmt(value), 'Ingreso']}
                    labelFormatter={(v) => new Date(v + 'T12:00:00').toLocaleDateString('es-MX', { weekday: 'long', day: 'numeric', month: 'short' })} />
                  <Area type="monotone" dataKey="revenue" stroke="#D4A24E" strokeWidth={2} fill="url(#revGrad)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* ─── Two columns: Peak Hours + Day of Week ─── */}
        {analytics && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Peak Hours */}
            <div className="bg-black/40 rounded-xl border border-colibri-gold/20 p-5">
              <h3 className="text-sm font-semibold text-colibri-beige mb-4 flex items-center gap-2">
                <Clock className="h-4 w-4 text-blue-400" /> Horas Pico
              </h3>
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={fillHours(analytics.sales_by_hour)}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                    <XAxis dataKey="hour" stroke="#888" fontSize={10} tickFormatter={(v) => `${v}h`} />
                    <YAxis stroke="#888" fontSize={10} />
                    <Tooltip contentStyle={{ backgroundColor: '#1a1a1a', border: '1px solid #3b82f633', borderRadius: '8px', color: '#fff' }}
                      formatter={(value: number) => [value, 'Pedidos']} labelFormatter={(v) => `${v}:00 - ${v}:59`} />
                    <Bar dataKey="orders" fill="#3b82f6" radius={[3, 3, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Day of Week */}
            <div className="bg-black/40 rounded-xl border border-colibri-gold/20 p-5">
              <h3 className="text-sm font-semibold text-colibri-beige mb-4 flex items-center gap-2">
                <CalendarDays className="h-4 w-4 text-emerald-400" /> Ventas por Día
              </h3>
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={analytics.sales_by_day_of_week.map(d => ({ ...d, day: DAY_NAMES_ES[d.day_name] || d.day_name }))}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                    <XAxis dataKey="day" stroke="#888" fontSize={11} />
                    <YAxis stroke="#888" fontSize={10} tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} />
                    <Tooltip contentStyle={{ backgroundColor: '#1a1a1a', border: '1px solid #2D6A4F33', borderRadius: '8px', color: '#fff' }}
                      formatter={(value: number) => [fmt(value), 'Ingreso']} />
                    <Bar dataKey="revenue" fill="#2D6A4F" radius={[3, 3, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        )}

        {/* ─── Two columns: Channel + Payment Donuts ─── */}
        {analytics && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* By Channel */}
            <div className="bg-black/40 rounded-xl border border-colibri-gold/20 p-5">
              <h3 className="text-sm font-semibold text-colibri-beige mb-3 flex items-center gap-2">
                <Users className="h-4 w-4 text-purple-400" /> Ventas por Canal
              </h3>
              <div className="flex items-center gap-4">
                <div className="h-40 w-40 shrink-0">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={analytics.sales_by_channel} dataKey="revenue" nameKey="channel" cx="50%" cy="50%" innerRadius={35} outerRadius={60} paddingAngle={3}>
                        {analytics.sales_by_channel.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                      </Pie>
                      <Tooltip contentStyle={{ backgroundColor: '#1a1a1a', border: '1px solid #333', borderRadius: '8px', color: '#fff' }}
                        formatter={(value: number) => [fmt(value), 'Ingreso']} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="space-y-2 flex-1 min-w-0">
                  {analytics.sales_by_channel.map((ch, i) => (
                    <div key={ch.channel} className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2 min-w-0">
                        <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                        <span className="text-gray-300 truncate">{ch.channel}</span>
                      </div>
                      <span className="font-medium text-white shrink-0 ml-2">{fmt(ch.revenue)}</span>
                    </div>
                  ))}
                  {analytics.sales_by_channel.length === 0 && <p className="text-gray-500 text-xs">Sin datos</p>}
                </div>
              </div>
            </div>

            {/* By Payment */}
            <div className="bg-black/40 rounded-xl border border-colibri-gold/20 p-5">
              <h3 className="text-sm font-semibold text-colibri-beige mb-3 flex items-center gap-2">
                <CreditCard className="h-4 w-4 text-colibri-gold" /> Método de Pago
              </h3>
              <div className="flex items-center gap-4">
                <div className="h-40 w-40 shrink-0">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={analytics.sales_by_payment} dataKey="revenue" nameKey="method" cx="50%" cy="50%" innerRadius={35} outerRadius={60} paddingAngle={3}>
                        {analytics.sales_by_payment.map((_, i) => <Cell key={i} fill={COLORS[(i + 3) % COLORS.length]} />)}
                      </Pie>
                      <Tooltip contentStyle={{ backgroundColor: '#1a1a1a', border: '1px solid #333', borderRadius: '8px', color: '#fff' }}
                        formatter={(value: number) => [fmt(value), 'Ingreso']} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="space-y-2 flex-1 min-w-0">
                  {analytics.sales_by_payment.map((pm, i) => (
                    <div key={pm.method} className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2 min-w-0">
                        <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: COLORS[(i + 3) % COLORS.length] }} />
                        <span className="text-gray-300 truncate">{pm.method}</span>
                      </div>
                      <span className="font-medium text-white shrink-0 ml-2">{fmt(pm.revenue)}</span>
                    </div>
                  ))}
                  {analytics.sales_by_payment.length === 0 && <p className="text-gray-500 text-xs">Sin datos</p>}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ─── Top Products ─── */}
        {analytics && analytics.top_products.length > 0 && (
          <div className="bg-black/40 rounded-xl border border-colibri-gold/20 p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-colibri-beige flex items-center gap-2">
                <Package className="h-4 w-4 text-colibri-gold" /> Top Productos
              </h3>
              <Link href="/admin/reportes" className="text-xs text-colibri-gold hover:underline flex items-center gap-1">
                Ver reporte completo <ChevronRight className="h-3 w-3" />
              </Link>
            </div>
            <div className="space-y-2.5">
              {analytics.top_products.slice(0, 8).map((p, i) => {
                const maxRev = Number(analytics.top_products[0]?.revenue) || 1
                const pctW = (Number(p.revenue) / maxRev) * 100
                return (
                  <div key={p.product_name} className="flex items-center gap-3">
                    <span className="text-xs font-bold text-gray-500 w-5 text-right">{i + 1}</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-medium text-white truncate">{p.product_name}</span>
                        <div className="flex items-center gap-3 text-sm shrink-0 ml-2">
                          <span className="text-gray-400">{p.quantity} uds</span>
                          <span className="font-semibold text-colibri-gold">{fmt(p.revenue)}</span>
                        </div>
                      </div>
                      <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                        <div className="h-full rounded-full bg-gradient-to-r from-colibri-gold to-colibri-wine transition-all" style={{ width: `${pctW}%` }} />
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* ─── Report Navigation Cards ─── */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <Link href="/admin/reportes" className="group bg-gradient-to-br from-colibri-gold/10 to-colibri-gold/5 border border-colibri-gold/20 hover:border-colibri-gold/50 rounded-xl p-5 transition-all">
            <div className="flex items-center gap-3 mb-2">
              <div className="bg-colibri-gold/20 rounded-lg p-2"><Bot className="h-5 w-5 text-colibri-gold" /></div>
              <h4 className="font-semibold text-white group-hover:text-colibri-gold transition">Reportes + IA</h4>
            </div>
            <p className="text-xs text-gray-400">Analytics avanzados, gráficas detalladas y consultor IA de negocio</p>
          </Link>
          <Link href="/admin/cortes" className="group bg-gradient-to-br from-emerald-500/10 to-emerald-500/5 border border-emerald-500/20 hover:border-emerald-500/50 rounded-xl p-5 transition-all">
            <div className="flex items-center gap-3 mb-2">
              <div className="bg-emerald-500/20 rounded-lg p-2"><Receipt className="h-5 w-5 text-emerald-400" /></div>
              <h4 className="font-semibold text-white group-hover:text-emerald-400 transition">Cortes de Caja</h4>
            </div>
            <p className="text-xs text-gray-400">Historial de turnos, Reporte Z, rendimiento y alertas de faltante</p>
          </Link>
          <Link href="/admin/driver-stats" className="group bg-gradient-to-br from-blue-500/10 to-blue-500/5 border border-blue-500/20 hover:border-blue-500/50 rounded-xl p-5 transition-all">
            <div className="flex items-center gap-3 mb-2">
              <div className="bg-blue-500/20 rounded-lg p-2"><Truck className="h-5 w-5 text-blue-400" /></div>
              <h4 className="font-semibold text-white group-hover:text-blue-400 transition">Drivers / Delivery</h4>
            </div>
            <p className="text-xs text-gray-400">Estadísticas de repartidores, entregas y tiempos</p>
          </Link>
        </div>

        {/* ─── Config: Table Mode ─── */}
        <div className="bg-black/40 rounded-xl border border-colibri-gold/20 p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <MapPin className="h-5 w-5 text-colibri-gold" />
              <div>
                <p className="text-white font-medium">{useVisualTables ? 'Mapa Visual' : 'Mesas Clásico'}</p>
                <p className="text-xs text-gray-400">{useVisualTables ? 'Mapa interactivo de mesas' : 'Texto libre para mesas'}</p>
              </div>
            </div>
            <button onClick={toggleTableMode} disabled={savingTableMode}
              className={`text-sm font-medium px-4 py-2 rounded-lg transition ${useVisualTables
                ? 'bg-colibri-wine/50 hover:bg-colibri-wine/70 text-white border border-colibri-wine/30'
                : 'bg-colibri-green/50 hover:bg-colibri-green/70 text-white border border-colibri-green/30'}`}>
              {savingTableMode ? <RefreshCw className="h-4 w-4 animate-spin" /> : useVisualTables ? 'Cambiar a Clásico' : 'Activar Mapa'}
            </button>
          </div>
        </div>

        {/* ─── Quick Actions ─── */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {[
            { label: 'Pedidos', href: '/admin/orders', icon: ShoppingCart, color: 'bg-colibri-green/30 hover:bg-colibri-green/50 border-colibri-green/20' },
            { label: 'Productos', href: '/admin/products', icon: Package, color: 'bg-blue-500/20 hover:bg-blue-500/40 border-blue-500/20' },
            { label: 'Delivery', href: '/admin/delivery', icon: Truck, color: 'bg-purple-500/20 hover:bg-purple-500/40 border-purple-500/20' },
            { label: 'Diseño Mesas', href: '/admin/mesas', icon: LayoutGrid, color: 'bg-colibri-wine/30 hover:bg-colibri-wine/50 border-colibri-wine/20' },
          ].map(a => (
            <Link key={a.label} href={a.href}
              className={`flex items-center gap-2 px-4 py-3 rounded-lg border text-sm font-medium text-white transition ${a.color}`}>
              <a.icon className="h-4 w-4" />{a.label}
            </Link>
          ))}
        </div>
      </div>
    </AdminLayout>
  )
}

// ─── KPI Card ──────────────────────────────
function KpiCard({ title, value, icon: Icon, change, accent, sub }: {
  title: string; value: string; icon: React.ComponentType<{ className?: string }>; accent: string
  change?: { value: number; positive: boolean } | null; sub?: string
}) {
  return (
    <div className="bg-black/40 border border-colibri-gold/20 rounded-xl p-4">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs text-gray-400 font-medium">{title}</span>
        <Icon className={`w-4 h-4 text-${accent}`} />
      </div>
      <p className="text-xl sm:text-2xl font-bold text-white">{value}</p>
      <div className="flex items-center justify-between mt-1">
        {change && (
          <span className={`flex items-center gap-0.5 text-[10px] font-medium ${change.positive ? 'text-emerald-400' : 'text-red-400'}`}>
            {change.positive ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
            {change.value}%
          </span>
        )}
        {sub && <span className="text-[10px] text-gray-500">{sub}</span>}
      </div>
    </div>
  )
}