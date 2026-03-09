"use client"

import { useState, useEffect, useCallback } from "react"
import AdminLayout from "@/components/admin/admin-layout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import {
  Dialog, DialogContent, DialogHeader, DialogFooter, DialogTitle, DialogDescription
} from "@/components/ui/dialog"
import { useToast } from "@/hooks/use-notifications"
import {
  Package, AlertTriangle, TrendingDown, TrendingUp, DollarSign, RefreshCw,
  Search, Filter, Plus, Minus, RotateCcw, Trash2, ArrowUpDown, BarChart3,
  Warehouse, ShoppingCart, Clock, ChevronLeft, ChevronRight, FileText, Boxes
} from "lucide-react"
import {
  BarChart, Bar, AreaChart, Area, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from "recharts"

const CHART_COLORS = ['#D4A24E', '#7A2E3A', '#2D6A4F', '#3b82f6', '#8b5cf6', '#f59e0b', '#06b6d4', '#ec4899']

function fmt(n: number | string): string {
  return Number(n || 0).toLocaleString('es-MX', { style: 'currency', currency: 'MXN', minimumFractionDigits: 0 })
}

type Product = {
  id: number
  name: string
  stock: number
  price: number
  cost_price: number
  stock_threshold: number
  category_name: string
  status: string
}

type Summary = {
  products: Product[]
  totals: {
    total_products: number
    out_of_stock: number
    low_stock: number
    healthy: number
    total_units: number
    stock_value: number
    cost_value: number
    potential_profit: number
  }
}

type Movement = {
  id: number
  product_id: number
  product_name: string
  change_type: string
  quantity_change: number
  stock_before: number
  stock_after: number
  notes: string
  reference_id: number | null
  created_at: string
}

type ValuationRow = {
  category_name: string
  product_count: number
  total_units: number
  sale_value: number
  cost_value: number
  profit_margin: number
}

type Analytics = {
  byType: { change_type: string; count: number; total_units: number }[]
  byDay: { date: string; units_in: number; units_out: number }[]
  topMovers: { product_id: number; product_name: string; total_consumed: number }[]
}

// ─── KPI Card ───
function KPI({ title, value, sub, icon: Icon, accent = "colibri-gold" }: {
  title: string; value: string | number; sub?: string; icon: any; accent?: string
}) {
  return (
    <div className="bg-black/40 border border-colibri-gold/20 rounded-xl p-4">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs text-gray-400 font-medium">{title}</span>
        <Icon className={`w-4 h-4 text-${accent}`} />
      </div>
      <p className="text-xl sm:text-2xl font-bold text-white">{value}</p>
      {sub && <p className="text-xs text-colibri-beige mt-1">{sub}</p>}
    </div>
  )
}

// ─── Movement type labels & colors ───
const TYPE_LABELS: Record<string, string> = {
  sale: 'Venta', cancel_restore: 'Cancelación', manual_add: 'Entrada manual',
  manual_reduce: 'Salida manual', manual_set: 'Ajuste', waste: 'Merma',
  restock: 'Reabastecimiento', adjustment: 'Ajuste',
}
const TYPE_COLORS: Record<string, string> = {
  sale: 'bg-blue-500/20 text-blue-300', cancel_restore: 'bg-yellow-500/20 text-yellow-300',
  manual_add: 'bg-green-500/20 text-green-300', manual_reduce: 'bg-red-500/20 text-red-300',
  manual_set: 'bg-purple-500/20 text-purple-300', waste: 'bg-orange-500/20 text-orange-300',
  restock: 'bg-emerald-500/20 text-emerald-300', adjustment: 'bg-gray-500/20 text-gray-300',
}

export default function InventarioPage() {
  const toast = useToast()
  const [activeTab, setActiveTab] = useState("stock")
  const [loading, setLoading] = useState(true)

  // Summary state
  const [summary, setSummary] = useState<Summary | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [categoryFilter, setCategoryFilter] = useState("all")
  const [sortField, setSortField] = useState<"name" | "stock" | "price" | "cost_price">("name")
  const [sortAsc, setSortAsc] = useState(true)

  // Movements state
  const [movements, setMovements] = useState<Movement[]>([])
  const [movPage, setMovPage] = useState(1)
  const [movTotal, setMovTotal] = useState(0)
  const [movTypeFilter, setMovTypeFilter] = useState("")
  const [movLoading, setMovLoading] = useState(false)

  // Analytics state
  const [analytics, setAnalytics] = useState<Analytics | null>(null)
  const [valuation, setValuation] = useState<ValuationRow[]>([])
  const [analyticsDays, setAnalyticsDays] = useState(30)
  const [analyticsLoading, setAnalyticsLoading] = useState(false)

  // Adjustment dialog
  const [adjustDialog, setAdjustDialog] = useState(false)
  const [adjustProduct, setAdjustProduct] = useState<Product | null>(null)
  const [adjustAction, setAdjustAction] = useState<"add" | "reduce" | "set" | "waste">("add")
  const [adjustQty, setAdjustQty] = useState("")
  const [adjustNotes, setAdjustNotes] = useState("")
  const [adjusting, setAdjusting] = useState(false)

  // ─── Data fetching ───
  const fetchSummary = useCallback(async () => {
    try {
      const res = await fetch('/api/inventory?action=summary', { credentials: 'include' })
      const data = await res.json()
      if (data.success) setSummary(data.data)
    } catch { /* silent */ }
  }, [])

  const fetchMovements = useCallback(async () => {
    setMovLoading(true)
    try {
      const params = new URLSearchParams({ action: 'movements', page: String(movPage), limit: '25' })
      if (movTypeFilter) params.set('type', movTypeFilter)
      const res = await fetch(`/api/inventory?${params}`, { credentials: 'include' })
      const data = await res.json()
      if (data.success) {
        setMovements(data.data.movements)
        setMovTotal(data.data.total)
      }
    } catch { /* silent */ }
    setMovLoading(false)
  }, [movPage, movTypeFilter])

  const fetchAnalytics = useCallback(async () => {
    setAnalyticsLoading(true)
    try {
      const [aRes, vRes] = await Promise.all([
        fetch(`/api/inventory?action=analytics&days=${analyticsDays}`, { credentials: 'include' }),
        fetch('/api/inventory?action=valuation', { credentials: 'include' }),
      ])
      const aData = await aRes.json()
      const vData = await vRes.json()
      if (aData.success) setAnalytics(aData.data)
      if (vData.success) setValuation(vData.data)
    } catch { /* silent */ }
    setAnalyticsLoading(false)
  }, [analyticsDays])

  useEffect(() => { fetchSummary().then(() => setLoading(false)) }, [fetchSummary])
  useEffect(() => { if (activeTab === 'movimientos') fetchMovements() }, [activeTab, fetchMovements])
  useEffect(() => { if (activeTab === 'analytics') fetchAnalytics() }, [activeTab, fetchAnalytics])

  // ─── Stock adjustment ───
  async function handleAdjust() {
    if (!adjustProduct || !adjustQty) return
    setAdjusting(true)
    try {
      const res = await fetch('/api/inventory', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          product_id: adjustProduct.id,
          action: adjustAction,
          quantity: Number(adjustQty),
          notes: adjustNotes || undefined,
        }),
      })
      const data = await res.json()
      if (data.success) {
        toast.success('Stock actualizado', `${adjustProduct.name}: ${data.data.stock_before} → ${data.data.stock_after}`)
        setAdjustDialog(false)
        setAdjustQty("")
        setAdjustNotes("")
        fetchSummary()
      } else {
        toast.error('Error', data.error || 'No se pudo actualizar')
      }
    } catch {
      toast.error('Error', 'Error de conexión')
    }
    setAdjusting(false)
  }

  function openAdjust(product: Product, action: "add" | "reduce" | "set" | "waste") {
    setAdjustProduct(product)
    setAdjustAction(action)
    setAdjustQty("")
    setAdjustNotes("")
    setAdjustDialog(true)
  }

  // ─── Filtered & sorted products ───
  const filteredProducts = summary?.products
    .filter(p => {
      if (searchTerm && !p.name.toLowerCase().includes(searchTerm.toLowerCase())) return false
      if (statusFilter !== 'all' && p.status !== statusFilter) return false
      if (categoryFilter !== 'all' && p.category_name !== categoryFilter) return false
      return true
    })
    .sort((a, b) => {
      const m = sortAsc ? 1 : -1
      if (sortField === 'name') return a.name.localeCompare(b.name) * m
      return ((a[sortField] || 0) - (b[sortField] || 0)) * m
    }) || []

  const categories = [...new Set(summary?.products.map(p => p.category_name).filter(Boolean) || [])]

  function toggleSort(field: typeof sortField) {
    if (sortField === field) setSortAsc(!sortAsc)
    else { setSortField(field); setSortAsc(true) }
  }

  // ─── Loading ───
  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-96">
          <RefreshCw className="h-8 w-8 animate-spin text-colibri-gold" />
        </div>
      </AdminLayout>
    )
  }

  const t = summary?.totals

  return (
    <AdminLayout>
      <div className="space-y-6 p-4 sm:p-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div>
            <h1 className="text-3xl font-bold text-white flex items-center gap-3">
              <Warehouse className="h-8 w-8 text-colibri-gold" /> Inventario
            </h1>
            <p className="text-colibri-beige mt-1">Control de stock, movimientos y valuación</p>
          </div>
          <Button size="sm" onClick={() => { fetchSummary(); if (activeTab === 'movimientos') fetchMovements(); if (activeTab === 'analytics') fetchAnalytics() }}
            className="bg-colibri-green/50 hover:bg-colibri-green border-colibri-gold/30 text-white">
            <RefreshCw className="h-4 w-4 mr-2" /> Actualizar
          </Button>
        </div>

        {/* KPI Cards */}
        {t && (
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
            <KPI title="Productos" value={t.total_products} icon={Package} />
            <KPI title="Unidades totales" value={t.total_units.toLocaleString()} icon={Boxes} />
            <KPI title="Valor venta" value={fmt(t.stock_value)} icon={DollarSign} accent="colibri-wine" />
            <KPI title="Valor costo" value={fmt(t.cost_value)} icon={TrendingDown} />
            <KPI title="Utilidad potencial" value={fmt(t.potential_profit)}
              sub={t.cost_value > 0 ? `${((t.potential_profit / t.cost_value) * 100).toFixed(0)}% margen` : ''}
              icon={TrendingUp} accent="emerald-400" />
            <KPI title="Alertas"
              value={`${t.out_of_stock} agotados · ${t.low_stock} bajo`}
              icon={AlertTriangle} accent="red-400" />
          </div>
        )}

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="bg-black/50 border border-colibri-gold/30">
            <TabsTrigger value="stock" className="data-[state=active]:bg-colibri-green/50 data-[state=active]:text-white text-gray-400">
              <Package className="h-4 w-4 mr-2" /> Stock
            </TabsTrigger>
            <TabsTrigger value="movimientos" className="data-[state=active]:bg-colibri-green/50 data-[state=active]:text-white text-gray-400">
              <Clock className="h-4 w-4 mr-2" /> Movimientos
            </TabsTrigger>
            <TabsTrigger value="analytics" className="data-[state=active]:bg-colibri-green/50 data-[state=active]:text-white text-gray-400">
              <BarChart3 className="h-4 w-4 mr-2" /> Analítica
            </TabsTrigger>
          </TabsList>

          {/* ═══════════ STOCK TAB ═══════════ */}
          <TabsContent value="stock" className="space-y-4">
            {/* Filters */}
            <div className="flex flex-wrap gap-3">
              <div className="relative flex-1 min-w-[200px]">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
                <Input placeholder="Buscar producto..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
                  className="pl-10 bg-black/40 border-colibri-gold/20 text-white placeholder:text-gray-500" />
              </div>
              <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
                className="bg-black/40 border border-colibri-gold/20 rounded-md px-3 py-2 text-sm text-white">
                <option value="all">Todos los estados</option>
                <option value="out_of_stock">Agotados</option>
                <option value="low_stock">Stock bajo</option>
                <option value="healthy">Saludable</option>
              </select>
              <select value={categoryFilter} onChange={e => setCategoryFilter(e.target.value)}
                className="bg-black/40 border border-colibri-gold/20 rounded-md px-3 py-2 text-sm text-white">
                <option value="all">Todas las categorías</option>
                {categories.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>

            <p className="text-xs text-gray-500">{filteredProducts.length} productos</p>

            {/* Products Table */}
            <div className="overflow-x-auto rounded-xl border border-colibri-gold/20 bg-black/30">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-colibri-gold/20">
                    <th className="text-left p-3 text-colibri-gold cursor-pointer select-none" onClick={() => toggleSort('name')}>
                      <span className="flex items-center gap-1">Producto <ArrowUpDown className="h-3 w-3" /></span>
                    </th>
                    <th className="text-left p-3 text-colibri-gold">Categoría</th>
                    <th className="text-right p-3 text-colibri-gold cursor-pointer select-none" onClick={() => toggleSort('stock')}>
                      <span className="flex items-center justify-end gap-1">Stock <ArrowUpDown className="h-3 w-3" /></span>
                    </th>
                    <th className="text-right p-3 text-colibri-gold hidden sm:table-cell cursor-pointer select-none" onClick={() => toggleSort('price')}>
                      <span className="flex items-center justify-end gap-1">Precio <ArrowUpDown className="h-3 w-3" /></span>
                    </th>
                    <th className="text-right p-3 text-colibri-gold hidden md:table-cell cursor-pointer select-none" onClick={() => toggleSort('cost_price')}>
                      <span className="flex items-center justify-end gap-1">Costo <ArrowUpDown className="h-3 w-3" /></span>
                    </th>
                    <th className="text-center p-3 text-colibri-gold">Estado</th>
                    <th className="text-center p-3 text-colibri-gold">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredProducts.map(p => (
                    <tr key={p.id} className="border-b border-colibri-green/10 hover:bg-colibri-green/10 transition-colors">
                      <td className="p-3 text-white font-medium">{p.name}</td>
                      <td className="p-3 text-colibri-beige text-xs">{p.category_name || '—'}</td>
                      <td className="p-3 text-right font-mono text-white">{p.stock}</td>
                      <td className="p-3 text-right text-colibri-beige hidden sm:table-cell">{fmt(p.price)}</td>
                      <td className="p-3 text-right text-colibri-beige hidden md:table-cell">{p.cost_price ? fmt(p.cost_price) : '—'}</td>
                      <td className="p-3 text-center">
                        {p.status === 'out_of_stock' && <Badge variant="destructive" className="text-[10px]">Agotado</Badge>}
                        {p.status === 'low_stock' && <Badge className="bg-yellow-500/20 text-yellow-300 border-yellow-500/30 text-[10px]">Bajo</Badge>}
                        {p.status === 'healthy' && <Badge className="bg-green-500/20 text-green-300 border-green-500/30 text-[10px]">OK</Badge>}
                      </td>
                      <td className="p-3">
                        <div className="flex items-center justify-center gap-1">
                          <button onClick={() => openAdjust(p, 'add')} title="Entrada"
                            className="p-1.5 rounded-md hover:bg-green-500/20 text-green-400 transition-colors">
                            <Plus className="h-3.5 w-3.5" />
                          </button>
                          <button onClick={() => openAdjust(p, 'reduce')} title="Salida"
                            className="p-1.5 rounded-md hover:bg-red-500/20 text-red-400 transition-colors">
                            <Minus className="h-3.5 w-3.5" />
                          </button>
                          <button onClick={() => openAdjust(p, 'set')} title="Ajustar"
                            className="p-1.5 rounded-md hover:bg-purple-500/20 text-purple-400 transition-colors">
                            <RotateCcw className="h-3.5 w-3.5" />
                          </button>
                          <button onClick={() => openAdjust(p, 'waste')} title="Merma"
                            className="p-1.5 rounded-md hover:bg-orange-500/20 text-orange-400 transition-colors">
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {filteredProducts.length === 0 && (
                    <tr><td colSpan={7} className="p-8 text-center text-gray-500">No se encontraron productos</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </TabsContent>

          {/* ═══════════ MOVEMENTS TAB ═══════════ */}
          <TabsContent value="movimientos" className="space-y-4">
            <div className="flex flex-wrap gap-3 items-center">
              <select value={movTypeFilter} onChange={e => { setMovTypeFilter(e.target.value); setMovPage(1) }}
                className="bg-black/40 border border-colibri-gold/20 rounded-md px-3 py-2 text-sm text-white">
                <option value="">Todos los tipos</option>
                {Object.entries(TYPE_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>
              <span className="text-xs text-gray-500">{movTotal} movimientos</span>
            </div>

            {movLoading ? (
              <div className="flex justify-center py-12">
                <RefreshCw className="h-6 w-6 animate-spin text-colibri-gold" />
              </div>
            ) : (
              <>
                <div className="overflow-x-auto rounded-xl border border-colibri-gold/20 bg-black/30">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-colibri-gold/20">
                        <th className="text-left p-3 text-colibri-gold">Fecha</th>
                        <th className="text-left p-3 text-colibri-gold">Producto</th>
                        <th className="text-center p-3 text-colibri-gold">Tipo</th>
                        <th className="text-right p-3 text-colibri-gold">Cambio</th>
                        <th className="text-right p-3 text-colibri-gold hidden sm:table-cell">Antes</th>
                        <th className="text-right p-3 text-colibri-gold hidden sm:table-cell">Después</th>
                        <th className="text-left p-3 text-colibri-gold hidden md:table-cell">Notas</th>
                      </tr>
                    </thead>
                    <tbody>
                      {movements.map(m => (
                        <tr key={m.id} className="border-b border-colibri-green/10 hover:bg-colibri-green/10 transition-colors">
                          <td className="p-3 text-colibri-beige text-xs whitespace-nowrap">
                            {new Date(m.created_at).toLocaleString('es-MX', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                          </td>
                          <td className="p-3 text-white">{m.product_name}</td>
                          <td className="p-3 text-center">
                            <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-medium ${TYPE_COLORS[m.change_type] || 'bg-gray-500/20 text-gray-300'}`}>
                              {TYPE_LABELS[m.change_type] || m.change_type}
                            </span>
                          </td>
                          <td className={`p-3 text-right font-mono font-medium ${m.quantity_change > 0 ? 'text-green-400' : 'text-red-400'}`}>
                            {m.quantity_change > 0 ? '+' : ''}{m.quantity_change}
                          </td>
                          <td className="p-3 text-right text-gray-400 hidden sm:table-cell">{m.stock_before}</td>
                          <td className="p-3 text-right text-white hidden sm:table-cell">{m.stock_after}</td>
                          <td className="p-3 text-gray-400 text-xs hidden md:table-cell max-w-[200px] truncate">{m.notes || '—'}</td>
                        </tr>
                      ))}
                      {movements.length === 0 && (
                        <tr><td colSpan={7} className="p-8 text-center text-gray-500">No hay movimientos registrados</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Pagination */}
                {movTotal > 25 && (
                  <div className="flex items-center justify-center gap-4">
                    <Button size="sm" variant="outline" disabled={movPage <= 1} onClick={() => setMovPage(p => p - 1)}
                      className="border-colibri-gold/30 text-colibri-beige hover:bg-colibri-green/30">
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <span className="text-sm text-gray-400">Página {movPage} de {Math.ceil(movTotal / 25)}</span>
                    <Button size="sm" variant="outline" disabled={movPage >= Math.ceil(movTotal / 25)} onClick={() => setMovPage(p => p + 1)}
                      className="border-colibri-gold/30 text-colibri-beige hover:bg-colibri-green/30">
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </>
            )}
          </TabsContent>

          {/* ═══════════ ANALYTICS TAB ═══════════ */}
          <TabsContent value="analytics" className="space-y-6">
            <div className="flex items-center gap-3">
              <span className="text-sm text-gray-400">Período:</span>
              {[7, 14, 30, 90].map(d => (
                <button key={d} onClick={() => setAnalyticsDays(d)}
                  className={`px-3 py-1 rounded-md text-sm font-medium transition ${analyticsDays === d
                    ? 'bg-colibri-gold text-black' : 'text-gray-400 hover:text-white hover:bg-colibri-green/30'}`}>
                  {d}d
                </button>
              ))}
            </div>

            {analyticsLoading ? (
              <div className="flex justify-center py-12">
                <RefreshCw className="h-6 w-6 animate-spin text-colibri-gold" />
              </div>
            ) : analytics && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Stock Flow Chart */}
                <div className="bg-black/40 rounded-xl border border-colibri-gold/20 p-5">
                  <h3 className="text-sm font-semibold text-colibri-beige mb-4 flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-colibri-gold" /> Flujo de stock (últimos {analyticsDays} días)
                  </h3>
                  {analytics.byDay.length > 0 ? (
                    <div className="h-64">
                      <ResponsiveContainer>
                        <AreaChart data={analytics.byDay}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                          <XAxis dataKey="date" tick={{ fill: '#999', fontSize: 10 }}
                            tickFormatter={v => new Date(v).toLocaleDateString('es-MX', { day: '2-digit', month: 'short' })} />
                          <YAxis tick={{ fill: '#999', fontSize: 10 }} />
                          <Tooltip contentStyle={{ background: '#111', border: '1px solid #ab9976', borderRadius: 8 }}
                            labelFormatter={v => new Date(v).toLocaleDateString('es-MX')} />
                          <Area type="monotone" dataKey="units_in" stackId="1" stroke="#2D6A4F" fill="#2D6A4F" fillOpacity={0.4} name="Entradas" />
                          <Area type="monotone" dataKey="units_out" stackId="2" stroke="#7A2E3A" fill="#7A2E3A" fillOpacity={0.4} name="Salidas" />
                          <Legend />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  ) : (
                    <p className="text-center text-gray-500 py-12">Sin datos en este período</p>
                  )}
                </div>

                {/* Movements by Type */}
                <div className="bg-black/40 rounded-xl border border-colibri-gold/20 p-5">
                  <h3 className="text-sm font-semibold text-colibri-beige mb-4 flex items-center gap-2">
                    <BarChart3 className="h-4 w-4 text-colibri-gold" /> Movimientos por tipo
                  </h3>
                  {analytics.byType.length > 0 ? (
                    <div className="h-64">
                      <ResponsiveContainer>
                        <BarChart data={analytics.byType.map(r => ({ ...r, label: TYPE_LABELS[r.change_type] || r.change_type }))}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                          <XAxis dataKey="label" tick={{ fill: '#999', fontSize: 10 }} />
                          <YAxis tick={{ fill: '#999', fontSize: 10 }} />
                          <Tooltip contentStyle={{ background: '#111', border: '1px solid #ab9976', borderRadius: 8 }} />
                          <Bar dataKey="total_units" name="Unidades" radius={[4, 4, 0, 0]}>
                            {analytics.byType.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  ) : (
                    <p className="text-center text-gray-500 py-12">Sin datos</p>
                  )}
                </div>

                {/* Top Movers */}
                <div className="bg-black/40 rounded-xl border border-colibri-gold/20 p-5">
                  <h3 className="text-sm font-semibold text-colibri-beige mb-4 flex items-center gap-2">
                    <ShoppingCart className="h-4 w-4 text-colibri-gold" /> Productos más consumidos
                  </h3>
                  {analytics.topMovers.length > 0 ? (
                    <div className="space-y-3">
                      {analytics.topMovers.map((m, i) => {
                        const maxVal = analytics.topMovers[0]?.total_consumed || 1
                        return (
                          <div key={m.product_id}>
                            <div className="flex justify-between text-sm mb-1">
                              <span className="text-white truncate mr-2">{i + 1}. {m.product_name}</span>
                              <span className="text-colibri-gold font-mono">{m.total_consumed}</span>
                            </div>
                            <div className="h-2 bg-black/40 rounded-full overflow-hidden">
                              <div className="h-full rounded-full bg-gradient-to-r from-colibri-green to-colibri-gold transition-all"
                                style={{ width: `${(m.total_consumed / maxVal) * 100}%` }} />
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  ) : (
                    <p className="text-center text-gray-500 py-12">Sin datos</p>
                  )}
                </div>

                {/* Valuation by Category */}
                <div className="bg-black/40 rounded-xl border border-colibri-gold/20 p-5">
                  <h3 className="text-sm font-semibold text-colibri-beige mb-4 flex items-center gap-2">
                    <FileText className="h-4 w-4 text-colibri-gold" /> Valuación por categoría
                  </h3>
                  {valuation.length > 0 ? (
                    <div className="space-y-1">
                      <div className="grid grid-cols-5 gap-2 text-[10px] text-colibri-gold font-medium pb-2 border-b border-colibri-gold/20">
                        <span>Categoría</span><span className="text-right">Prods</span><span className="text-right">Unids</span>
                        <span className="text-right">Valor venta</span><span className="text-right">Margen</span>
                      </div>
                      {valuation.map(v => (
                        <div key={v.category_name} className="grid grid-cols-5 gap-2 text-xs py-1.5 border-b border-colibri-green/10">
                          <span className="text-white truncate">{v.category_name || 'Sin cat.'}</span>
                          <span className="text-right text-gray-400">{v.product_count}</span>
                          <span className="text-right text-gray-400">{v.total_units}</span>
                          <span className="text-right text-colibri-beige">{fmt(v.sale_value)}</span>
                          <span className={`text-right font-medium ${v.profit_margin >= 50 ? 'text-green-400' : v.profit_margin >= 30 ? 'text-yellow-400' : 'text-red-400'}`}>
                            {v.profit_margin.toFixed(0)}%
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-center text-gray-500 py-12">Sin datos de valuación</p>
                  )}
                </div>

                {/* Category Valuation Donut */}
                {valuation.length > 0 && (
                  <div className="bg-black/40 rounded-xl border border-colibri-gold/20 p-5 lg:col-span-2">
                    <h3 className="text-sm font-semibold text-colibri-beige mb-4 flex items-center gap-2">
                      <DollarSign className="h-4 w-4 text-colibri-gold" /> Distribución de valor por categoría
                    </h3>
                    <div className="h-72">
                      <ResponsiveContainer>
                        <PieChart>
                          <Pie data={valuation.map(v => ({ name: v.category_name || 'Sin cat.', value: Number(v.sale_value) }))}
                            cx="50%" cy="50%" outerRadius={100} innerRadius={50}
                            dataKey="value" label={(props: any) => `${props.name} ${((props.percent || 0) * 100).toFixed(0)}%`}
                            labelLine={{ stroke: '#666' }}>
                            {valuation.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
                          </Pie>
                          <Tooltip contentStyle={{ background: '#111', border: '1px solid #ab9976', borderRadius: 8 }}
                            formatter={(v: number) => fmt(v)} />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                )}
              </div>
            )}
          </TabsContent>
        </Tabs>

        {/* ═══════════ ADJUST DIALOG ═══════════ */}
        <Dialog open={adjustDialog} onOpenChange={setAdjustDialog}>
          <DialogContent className="bg-slate-950 border-colibri-gold/40 text-white max-w-md">
            <DialogHeader>
              <DialogTitle className="text-colibri-gold">
                {adjustAction === 'add' && '➕ Entrada de stock'}
                {adjustAction === 'reduce' && '➖ Salida de stock'}
                {adjustAction === 'set' && '🔄 Ajustar stock'}
                {adjustAction === 'waste' && '🗑️ Registrar merma'}
              </DialogTitle>
              <DialogDescription className="text-colibri-beige">
                {adjustProduct?.name} — Stock actual: <span className="font-mono text-white">{adjustProduct?.stock}</span>
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-2">
              {/* Action selector */}
              <div className="flex gap-2">
                {([['add', 'Entrada', 'bg-green-500/20 border-green-500/40 text-green-300'],
                   ['reduce', 'Salida', 'bg-red-500/20 border-red-500/40 text-red-300'],
                   ['set', 'Ajustar', 'bg-purple-500/20 border-purple-500/40 text-purple-300'],
                   ['waste', 'Merma', 'bg-orange-500/20 border-orange-500/40 text-orange-300']] as const).map(([key, label, cls]) => (
                  <button key={key} onClick={() => setAdjustAction(key as any)}
                    className={`flex-1 px-3 py-2 rounded-lg text-xs font-medium border transition ${adjustAction === key ? cls : 'border-gray-700 text-gray-500 hover:border-gray-500'}`}>
                    {label}
                  </button>
                ))}
              </div>

              <div>
                <label className="text-xs text-gray-400 mb-1 block">
                  {adjustAction === 'set' ? 'Nuevo stock' : 'Cantidad'}
                </label>
                <Input type="number" min="0" value={adjustQty} onChange={e => setAdjustQty(e.target.value)}
                  placeholder={adjustAction === 'set' ? 'Ej: 50' : 'Ej: 10'}
                  className="bg-black/40 border-colibri-gold/20 text-white text-lg font-mono" autoFocus />
              </div>

              <div>
                <label className="text-xs text-gray-400 mb-1 block">Notas (opcional)</label>
                <Input value={adjustNotes} onChange={e => setAdjustNotes(e.target.value)}
                  placeholder="Ej: Compra a proveedor X"
                  className="bg-black/40 border-colibri-gold/20 text-white" />
              </div>

              {adjustQty && adjustProduct && (
                <div className="bg-black/30 rounded-lg p-3 border border-colibri-gold/10">
                  <p className="text-xs text-gray-400">Resultado:</p>
                  <p className="text-lg font-mono text-white">
                    {adjustProduct.stock} → {' '}
                    <span className="text-colibri-gold font-bold">
                      {adjustAction === 'set' ? Number(adjustQty)
                        : adjustAction === 'add' ? adjustProduct.stock + Number(adjustQty)
                        : Math.max(0, adjustProduct.stock - Number(adjustQty))}
                    </span>
                  </p>
                </div>
              )}
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setAdjustDialog(false)}
                className="border-gray-700 text-gray-400 hover:bg-gray-800">Cancelar</Button>
              <Button onClick={handleAdjust} disabled={adjusting || !adjustQty}
                className="bg-colibri-green hover:bg-colibri-green/80 text-white">
                {adjusting && <RefreshCw className="h-4 w-4 mr-2 animate-spin" />}
                Confirmar
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  )
}
