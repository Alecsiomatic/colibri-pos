'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart
} from 'recharts'
import {
  TrendingUp, DollarSign, ShoppingCart, Clock, Users,
  Calendar, BarChart3, PieChart as PieIcon, ChevronDown,
  ArrowUpRight, ArrowDownRight, Package, CreditCard, Bot, Send, Loader2
} from 'lucide-react'
import AdminLayout from '@/components/admin/admin-layout'

// ─── Types ─────────────────────────────────
interface Analytics {
  summary: { total_orders: number; total_revenue: number; avg_ticket: number; max_ticket: number; active_days: number }
  prev_summary: { total_orders: number; total_revenue: number; avg_ticket: number }
  sales_by_day: { date: string; orders: number; revenue: number; avg_ticket: number }[]
  sales_by_hour: { hour: number; orders: number; revenue: number }[]
  sales_by_day_of_week: { day_num: number; day_name: string; orders: number; revenue: number; avg_ticket: number }[]
  sales_by_channel: { channel: string; orders: number; revenue: number }[]
  sales_by_payment: { method: string; orders: number; revenue: number }[]
  top_products: { product_name: string; quantity: number; revenue: number }[]
  recent_orders: { id: number; total: number; status: string; order_source: string; payment_method: string; created_at: string }[]
}

interface AiMessage {
  role: 'user' | 'assistant'
  content: string
}

const COLORS = ['#f97316', '#3b82f6', '#10b981', '#8b5cf6', '#ef4444', '#f59e0b', '#06b6d4', '#ec4899']
const DAY_NAMES_ES: Record<string, string> = {
  Sunday: 'Dom', Monday: 'Lun', Tuesday: 'Mar', Wednesday: 'Mié',
  Thursday: 'Jue', Friday: 'Vie', Saturday: 'Sáb'
}

function fmt(n: number | string): string {
  return Number(n || 0).toLocaleString('es-MX', { style: 'currency', currency: 'MXN', minimumFractionDigits: 0 })
}

function pct(current: number, previous: number): { value: number; positive: boolean } {
  if (!previous) return { value: current > 0 ? 100 : 0, positive: true }
  const value = Math.round(((current - previous) / previous) * 100)
  return { value: Math.abs(value), positive: value >= 0 }
}

// ─── Main Component ────────────────────────
export default function ReportesPage() {
  const [data, setData] = useState<Analytics | null>(null)
  const [loading, setLoading] = useState(true)
  const [days, setDays] = useState(30)
  const [activeTab, setActiveTab] = useState<'dashboard' | 'ai'>('dashboard')

  // AI Chat State
  const [messages, setMessages] = useState<AiMessage[]>([])
  const [input, setInput] = useState('')
  const [aiLoading, setAiLoading] = useState(false)
  const chatEndRef = useRef<HTMLDivElement>(null)

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/reports/analytics?days=${days}`)
      const json = await res.json()
      if (json.success) setData(json)
    } catch (err) {
      console.error('Error loading analytics:', err)
    } finally {
      setLoading(false)
    }
  }, [days])

  useEffect(() => { fetchData() }, [fetchData])

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, aiLoading])

  async function sendAiMessage(text?: string) {
    const msg = text || input.trim()
    if (!msg || aiLoading) return
    const userMsg: AiMessage = { role: 'user', content: msg }
    setMessages(prev => [...prev, userMsg])
    setInput('')
    setAiLoading(true)
    try {
      const res = await fetch('/api/reports/ai-insights', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: userMsg.content,
          context: data ? {
            days,
            total_orders: data.summary.total_orders,
            total_revenue: Number(data.summary.total_revenue),
            avg_ticket: Number(data.summary.avg_ticket),
            top_products: data.top_products.slice(0, 5).map(p => ({ name: p.product_name, qty: p.quantity, rev: Number(p.revenue) })),
            channels: data.sales_by_channel.map(c => ({ channel: c.channel, orders: c.orders, rev: Number(c.revenue) })),
            peak_hours: data.sales_by_hour.sort((a, b) => b.orders - a.orders).slice(0, 3).map(h => ({ hour: h.hour, orders: h.orders })),
            best_days: data.sales_by_day_of_week.sort((a, b) => Number(b.revenue) - Number(a.revenue)).slice(0, 3).map(d => ({ day: d.day_name, rev: Number(d.revenue) })),
          } : null,
          history: messages.slice(-6),
        }),
      })
      const json = await res.json()
      if (json.success) {
        setMessages(prev => [...prev, { role: 'assistant', content: json.message }])
      } else {
        setMessages(prev => [...prev, { role: 'assistant', content: 'Error al obtener respuesta. Verifica la configuración de OpenAI.' }])
      }
    } catch {
      setMessages(prev => [...prev, { role: 'assistant', content: 'Error de conexión.' }])
    } finally {
      setAiLoading(false)
    }
  }

  if (loading && !data) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-96">
          <BarChart3 className="w-16 h-16 text-colibri-gold animate-pulse mx-auto mb-4" />
        </div>
      </AdminLayout>
    )
  }

  if (!data) return <AdminLayout><div className="text-white text-center py-12">Error cargando datos</div></AdminLayout>

  const s = data.summary
  const ps = data.prev_summary
  const revChange = pct(Number(s.total_revenue), Number(ps.total_revenue))
  const ordChange = pct(s.total_orders, ps.total_orders)
  const tickChange = pct(Number(s.avg_ticket), Number(ps.avg_ticket))

  return (
    <AdminLayout>
    <div className="text-white">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-6">
        <div>
          <h1 className="text-3xl font-bold text-white">Reportes Avanzados</h1>
          <p className="text-colibri-gold/80 text-sm">Analytics detallados y consultor IA</p>
        </div>
        <div className="flex items-center gap-3">
          {/* Tab switch */}
          <div className="flex bg-black/50 rounded-lg p-1 border border-colibri-gold/20">
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`px-4 py-1.5 rounded-md text-sm font-medium transition ${activeTab === 'dashboard' ? 'bg-colibri-gold text-black' : 'text-gray-400 hover:text-white'}`}
            >
              <PieIcon className="w-4 h-4 inline mr-1.5" />Gráficas
            </button>
            <button
              onClick={() => setActiveTab('ai')}
              className={`px-4 py-1.5 rounded-md text-sm font-medium transition ${activeTab === 'ai' ? 'bg-colibri-gold text-black' : 'text-gray-400 hover:text-white'}`}
            >
              <Bot className="w-4 h-4 inline mr-1.5" />IA
            </button>
          </div>
          {/* Period selector */}
          <select
            value={days}
            onChange={(e) => setDays(Number(e.target.value))}
            className="bg-black/50 text-white rounded-lg px-3 py-2 text-sm border border-colibri-gold/30 focus:border-colibri-gold"
          >
            <option value={7}>7 días</option>
            <option value={15}>15 días</option>
            <option value={30}>30 días</option>
            <option value={60}>60 días</option>
            <option value={90}>90 días</option>
          </select>
        </div>
      </div>

      {activeTab === 'dashboard' ? (
        <div className="p-6 space-y-6 max-w-7xl mx-auto">
          {/* KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <KpiCard title="Ingresos" value={fmt(s.total_revenue)} icon={DollarSign} change={revChange} color="orange" />
            <KpiCard title="Pedidos" value={s.total_orders.toString()} icon={ShoppingCart} change={ordChange} color="blue" />
            <KpiCard title="Ticket Promedio" value={fmt(s.avg_ticket)} icon={CreditCard} change={tickChange} color="green" />
            <KpiCard title="Ticket Máximo" value={fmt(s.max_ticket)} icon={TrendingUp} color="purple" subtitle={`${s.active_days} días activos`} />
          </div>

          {/* Revenue Chart */}
          <div className="bg-gray-900 rounded-xl border border-gray-800 p-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-orange-500" /> Ingresos por Día
            </h3>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data.sales_by_day}>
                  <defs>
                    <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#f97316" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#f97316" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis dataKey="date" stroke="#9ca3af" fontSize={12}
                    tickFormatter={(v) => { const d = new Date(v + 'T12:00:00'); return `${d.getDate()}/${d.getMonth() + 1}` }} />
                  <YAxis stroke="#9ca3af" fontSize={12} tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151', borderRadius: '8px', color: '#fff' }}
                    formatter={(value: number) => [fmt(value), 'Ingreso']}
                    labelFormatter={(v) => new Date(v + 'T12:00:00').toLocaleDateString('es-MX', { weekday: 'long', day: 'numeric', month: 'short' })}
                  />
                  <Area type="monotone" dataKey="revenue" stroke="#f97316" strokeWidth={2} fill="url(#colorRevenue)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Two columns: Hours + Day of Week */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Peak Hours */}
            <div className="bg-gray-900 rounded-xl border border-gray-800 p-6">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Clock className="w-5 h-5 text-blue-500" /> Horas Pico
              </h3>
              <div className="h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={fillHours(data.sales_by_hour)}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                    <XAxis dataKey="hour" stroke="#9ca3af" fontSize={11} tickFormatter={(v) => `${v}h`} />
                    <YAxis stroke="#9ca3af" fontSize={11} />
                    <Tooltip
                      contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151', borderRadius: '8px', color: '#fff' }}
                      formatter={(value: number) => [value, 'Pedidos']}
                      labelFormatter={(v) => `${v}:00 - ${v}:59`}
                    />
                    <Bar dataKey="orders" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Day of Week */}
            <div className="bg-gray-900 rounded-xl border border-gray-800 p-6">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Calendar className="w-5 h-5 text-green-500" /> Ventas por Día de la Semana
              </h3>
              <div className="h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={data.sales_by_day_of_week.map(d => ({ ...d, day: DAY_NAMES_ES[d.day_name] || d.day_name }))}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                    <XAxis dataKey="day" stroke="#9ca3af" fontSize={12} />
                    <YAxis stroke="#9ca3af" fontSize={11} tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} />
                    <Tooltip
                      contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151', borderRadius: '8px', color: '#fff' }}
                      formatter={(value: number) => [fmt(value), 'Ingreso']}
                    />
                    <Bar dataKey="revenue" fill="#10b981" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Two columns: Channel + Payment */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* By Channel */}
            <div className="bg-gray-900 rounded-xl border border-gray-800 p-6">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Users className="w-5 h-5 text-purple-500" /> Por Canal
              </h3>
              <div className="flex items-center gap-6">
                <div className="h-48 w-48 shrink-0">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={data.sales_by_channel} dataKey="revenue" nameKey="channel" cx="50%" cy="50%" innerRadius={40} outerRadius={70} paddingAngle={3}>
                        {data.sales_by_channel.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                      </Pie>
                      <Tooltip contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151', borderRadius: '8px', color: '#fff' }}
                        formatter={(value: number) => [fmt(value), 'Ingreso']} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="space-y-2 flex-1">
                  {data.sales_by_channel.map((ch, i) => (
                    <div key={ch.channel} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                        <span className="text-sm text-gray-300">{ch.channel}</span>
                      </div>
                      <div className="text-right">
                        <span className="text-sm font-medium">{fmt(ch.revenue)}</span>
                        <span className="text-xs text-gray-500 ml-2">({ch.orders})</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* By Payment */}
            <div className="bg-gray-900 rounded-xl border border-gray-800 p-6">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-yellow-500" /> Método de Pago
              </h3>
              <div className="flex items-center gap-6">
                <div className="h-48 w-48 shrink-0">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={data.sales_by_payment} dataKey="revenue" nameKey="method" cx="50%" cy="50%" innerRadius={40} outerRadius={70} paddingAngle={3}>
                        {data.sales_by_payment.map((_, i) => <Cell key={i} fill={COLORS[(i + 3) % COLORS.length]} />)}
                      </Pie>
                      <Tooltip contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151', borderRadius: '8px', color: '#fff' }}
                        formatter={(value: number) => [fmt(value), 'Ingreso']} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="space-y-2 flex-1">
                  {data.sales_by_payment.map((pm, i) => (
                    <div key={pm.method} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[(i + 3) % COLORS.length] }} />
                        <span className="text-sm text-gray-300">{pm.method}</span>
                      </div>
                      <div className="text-right">
                        <span className="text-sm font-medium">{fmt(pm.revenue)}</span>
                        <span className="text-xs text-gray-500 ml-2">({pm.orders})</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Top Products */}
          <div className="bg-gray-900 rounded-xl border border-gray-800 p-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Package className="w-5 h-5 text-orange-500" /> Productos Más Vendidos
            </h3>
            <div className="space-y-3">
              {data.top_products.map((p, i) => {
                const maxRev = Number(data.top_products[0]?.revenue) || 1
                const pctWidth = (Number(p.revenue) / maxRev) * 100
                return (
                  <div key={p.product_name} className="flex items-center gap-3">
                    <span className="text-sm font-bold text-gray-500 w-6 text-right">{i + 1}</span>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-medium">{p.product_name}</span>
                        <div className="flex items-center gap-3 text-sm">
                          <span className="text-gray-400">{p.quantity} uds</span>
                          <span className="font-semibold text-orange-400">{fmt(p.revenue)}</span>
                        </div>
                      </div>
                      <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
                        <div className="h-full rounded-full bg-gradient-to-r from-orange-500 to-amber-500 transition-all" style={{ width: `${pctWidth}%` }} />
                      </div>
                    </div>
                  </div>
                )
              })}
              {data.top_products.length === 0 && (
                <p className="text-gray-500 text-center py-8">Sin datos de productos para este periodo</p>
              )}
            </div>
          </div>
        </div>
      ) : (
        /* ─── AI TAB ────────────────────── */
        <div className="max-w-3xl mx-auto p-6 flex flex-col h-[calc(100vh-64px)]">
          <div className="bg-gray-900 rounded-xl border border-gray-800 flex-1 flex flex-col overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-800 flex items-center gap-3">
              <Bot className="w-6 h-6 text-orange-500" />
              <div>
                <h3 className="font-semibold">Asistente de Negocio IA</h3>
                <p className="text-xs text-gray-400">Pregúntame sobre ventas, tendencias, productos y estrategias</p>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {messages.length === 0 && (
                <div className="text-center text-gray-500 mt-12">
                  <Bot className="w-16 h-16 mx-auto mb-4 opacity-30" />
                  <p className="text-lg font-medium mb-4">¿Qué quieres saber de tu negocio?</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-w-md mx-auto">
                    {[
                      '¿Cuáles son mis horas pico?',
                      '¿Qué producto debo promocionar?',
                      'Dame un análisis de mis ventas',
                      '¿Cómo puedo aumentar el ticket promedio?',
                    ].map((q) => (
                      <button key={q} onClick={() => sendAiMessage(q)}
                        className="text-sm text-left px-3 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg text-gray-300 transition">
                        {q}
                      </button>
                    ))}
                  </div>
                </div>
              )}
              {messages.map((msg, i) => (
                <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[80%] rounded-xl px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap ${
                    msg.role === 'user'
                      ? 'bg-orange-500 text-white'
                      : 'bg-gray-800 text-gray-200'
                  }`}>
                    {msg.content}
                  </div>
                </div>
              ))}
              {aiLoading && (
                <div className="flex justify-start">
                  <div className="bg-gray-800 rounded-xl px-4 py-3 flex items-center gap-2 text-sm text-gray-400">
                    <Loader2 className="w-4 h-4 animate-spin" /> Analizando datos...
                  </div>
                </div>
              )}
              <div ref={chatEndRef} />
            </div>

            <div className="px-4 py-3 border-t border-gray-800">
              <form onSubmit={(e) => { e.preventDefault(); sendAiMessage() }} className="flex gap-2">
                <input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Pregunta sobre tu negocio..."
                  className="flex-1 bg-gray-800 text-white rounded-lg px-4 py-2.5 text-sm border border-gray-700 focus:border-orange-500 focus:outline-none"
                />
                <button type="submit" disabled={aiLoading || !input.trim()}
                  className="bg-orange-500 hover:bg-orange-400 disabled:opacity-50 text-white rounded-lg px-4 py-2.5 transition">
                  <Send className="w-4 h-4" />
                </button>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
    </AdminLayout>
  )
}

// ─── KPI Card ──────────────────────────────
function KpiCard({ title, value, icon: Icon, change, color, subtitle }: {
  title: string; value: string; icon: React.ComponentType<{ className?: string }>; color: string
  change?: { value: number; positive: boolean }; subtitle?: string
}) {
  const colorMap: Record<string, string> = {
    orange: 'from-orange-500/20 to-orange-500/5 border-orange-500/30',
    blue: 'from-blue-500/20 to-blue-500/5 border-blue-500/30',
    green: 'from-green-500/20 to-green-500/5 border-green-500/30',
    purple: 'from-purple-500/20 to-purple-500/5 border-purple-500/30',
  }
  const iconColor: Record<string, string> = {
    orange: 'text-orange-500', blue: 'text-blue-500', green: 'text-green-500', purple: 'text-purple-500',
  }

  return (
    <div className={`bg-gradient-to-br ${colorMap[color]} border rounded-xl p-5`}>
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm text-gray-400">{title}</span>
        <Icon className={`w-5 h-5 ${iconColor[color]}`} />
      </div>
      <p className="text-2xl font-bold">{value}</p>
      {change && (
        <div className={`flex items-center gap-1 mt-1 text-xs ${change.positive ? 'text-green-400' : 'text-red-400'}`}>
          {change.positive ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
          {change.value}% vs periodo anterior
        </div>
      )}
      {subtitle && <p className="text-xs text-gray-500 mt-1">{subtitle}</p>}
    </div>
  )
}

// ─── Helpers ───────────────────────────────
function fillHours(data: { hour: number; orders: number; revenue: number }[]) {
  const map = new Map(data.map(d => [d.hour, d]))
  return Array.from({ length: 24 }, (_, i) => map.get(i) || { hour: i, orders: 0, revenue: 0 })
}
