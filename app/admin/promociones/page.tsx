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
  Percent, Tag, Gift, Clock, Zap, Plus, Trash2, Edit, Power, PowerOff,
  Search, BarChart3, Ticket, ShoppingBag, Copy, Calendar, Users
} from "lucide-react"

function fmt(n: number | string): string {
  return Number(n || 0).toLocaleString('es-MX', { style: 'currency', currency: 'MXN', minimumFractionDigits: 0 })
}

const PROMO_TYPES: Record<string, { label: string; icon: any; color: string }> = {
  percentage: { label: '% Descuento', icon: Percent, color: 'text-blue-400' },
  fixed_amount: { label: '$ Descuento fijo', icon: Tag, color: 'text-green-400' },
  '2x1': { label: '2x1', icon: Gift, color: 'text-purple-400' },
  nxm: { label: 'NxM', icon: ShoppingBag, color: 'text-orange-400' },
  combo_price: { label: 'Precio combo', icon: Ticket, color: 'text-pink-400' },
  happy_hour: { label: 'Happy Hour', icon: Clock, color: 'text-yellow-400' },
}

const CHANNELS: Record<string, string> = {
  all: 'Todos', web: 'Web', kiosk: 'Kiosko', qr: 'QR Mesa',
  waiter: 'Mesero', delivery: 'Delivery', caja: 'Caja'
}

const DAYS = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb']

type Promotion = {
  id: number; name: string; description: string; type: string; value: number
  buy_quantity: number; get_quantity: number; min_purchase: number; max_discount: number
  applies_to: string; channel: string; start_date: string | null; end_date: string | null
  schedule_days: number[] | null; schedule_start_time: string | null; schedule_end_time: string | null
  is_active: boolean; is_coupon: boolean; coupon_code: string | null
  max_uses: number; current_uses: number; stackable: boolean; priority: number
  created_at: string; items?: { item_type: string; item_id: number; item_name?: string }[]
}

type PickerProduct = { id: number; name: string; price: number; category_name: string }
type PickerCategory = { id: number; name: string }
type Stats = { totalActive: number; totalUsesToday: number; totalDiscountToday: number; topPromos: any[] }

const EMPTY_PROMO: Partial<Promotion> & { items: any[] } = {
  name: '', description: '', type: 'percentage', value: 10,
  buy_quantity: 2, get_quantity: 1, min_purchase: 0, max_discount: 0,
  applies_to: 'all', channel: 'all', start_date: null, end_date: null,
  schedule_days: null, schedule_start_time: null, schedule_end_time: null,
  is_active: true, is_coupon: false, coupon_code: null,
  max_uses: 0, stackable: false, priority: 0, items: []
}

// ─── KPI Card ───
function KPI({ title, value, sub, icon: Icon }: { title: string; value: string | number; sub?: string; icon: any }) {
  return (
    <div className="bg-black/40 border border-colibri-gold/20 rounded-xl p-4">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs text-gray-400 font-medium">{title}</span>
        <Icon className="w-4 h-4 text-colibri-gold" />
      </div>
      <p className="text-xl sm:text-2xl font-bold text-white">{value}</p>
      {sub && <p className="text-xs text-colibri-beige mt-1">{sub}</p>}
    </div>
  )
}

export default function PromocionesPage() {
  const toast = useToast()
  const [promos, setPromos] = useState<Promotion[]>([])
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filterType, setFilterType] = useState('all')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<(Partial<Promotion> & { items: any[] }) | null>(null)
  const [saving, setSaving] = useState(false)
  const [products, setProducts] = useState<PickerProduct[]>([])
  const [categories, setCategories] = useState<PickerCategory[]>([])
  const [pickerSearch, setPickerSearch] = useState('')
  const [tab, setTab] = useState('list')

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const [promosRes, statsRes] = await Promise.all([
        fetch('/api/promotions?action=list').then(r => r.json()),
        fetch('/api/promotions?action=stats').then(r => r.json()),
      ])
      if (promosRes.success) setPromos(promosRes.promotions)
      if (statsRes.success) setStats(statsRes)
    } catch (e) {
      toast.error('Error cargando promociones')
    }
    setLoading(false)
  }, [toast])

  const fetchPickers = useCallback(async () => {
    const [pRes, cRes] = await Promise.all([
      fetch('/api/promotions?action=picker_products').then(r => r.json()),
      fetch('/api/promotions?action=picker_categories').then(r => r.json()),
    ])
    if (pRes.success) setProducts(pRes.products)
    if (cRes.success) setCategories(cRes.categories)
  }, [])

  useEffect(() => { fetchData() }, [fetchData])

  const handleCreate = async () => {
    await fetchPickers()
    setEditing({ ...EMPTY_PROMO })
    setDialogOpen(true)
  }

  const handleEdit = async (promo: Promotion) => {
    await fetchPickers()
    setEditing({
      ...promo,
      start_date: promo.start_date ? promo.start_date.split('T')[0] : null,
      end_date: promo.end_date ? promo.end_date.split('T')[0] : null,
      schedule_start_time: promo.schedule_start_time?.substring(0, 5) || null,
      schedule_end_time: promo.schedule_end_time?.substring(0, 5) || null,
      items: promo.items || [],
    })
    setDialogOpen(true)
  }

  const handleSave = async () => {
    if (!editing) return
    if (!editing.name?.trim()) { toast.error('El nombre es obligatorio'); return }
    setSaving(true)
    try {
      const isEdit = !!(editing as any).id
      const payload = {
        action: isEdit ? 'update' : 'create',
        ...editing,
        coupon_code: editing.is_coupon && editing.coupon_code ? editing.coupon_code.toUpperCase().trim() : null,
      }
      const res = await fetch('/api/promotions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      }).then(r => r.json())
      if (res.success) {
        toast.success(isEdit ? 'Promoción actualizada' : 'Promoción creada')
        setDialogOpen(false)
        fetchData()
      } else {
        toast.error(res.error || 'Error')
      }
    } catch {
      toast.error('Error de conexión')
    }
    setSaving(false)
  }

  const handleToggle = async (promo: Promotion) => {
    const res = await fetch('/api/promotions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'toggle', id: promo.id, is_active: !promo.is_active }),
    }).then(r => r.json())
    if (res.success) {
      toast.success(promo.is_active ? 'Promoción desactivada' : 'Promoción activada')
      fetchData()
    }
  }

  const handleDelete = async (promo: Promotion) => {
    if (!confirm(`¿Eliminar "${promo.name}"?`)) return
    const res = await fetch('/api/promotions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'delete', id: promo.id }),
    }).then(r => r.json())
    if (res.success) {
      toast.success('Promoción eliminada')
      fetchData()
    }
  }

  // Filter promos
  const filtered = promos.filter(p => {
    if (search && !p.name.toLowerCase().includes(search.toLowerCase())) return false
    if (filterType !== 'all' && p.type !== filterType) return false
    return true
  })

  // ─── Item picker helpers ───
  const toggleItem = (type: 'product' | 'category', id: number) => {
    if (!editing) return
    const items = editing.items || []
    const exists = items.find((i: any) => i.item_type === type && i.item_id === id)
    if (exists) {
      setEditing({ ...editing, items: items.filter((i: any) => !(i.item_type === type && i.item_id === id)) })
    } else {
      setEditing({ ...editing, items: [...items, { item_type: type, item_id: id }] })
    }
  }

  const isItemSelected = (type: string, id: number) =>
    editing?.items?.some((i: any) => i.item_type === type && i.item_id === id) || false

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-white flex items-center gap-2">
              <Zap className="w-7 h-7 text-colibri-gold" />
              Promociones y Descuentos
            </h1>
            <p className="text-colibri-beige text-sm mt-1">Gestiona ofertas, cupones y happy hours</p>
          </div>
          <Button onClick={handleCreate} className="bg-colibri-gold text-black hover:bg-colibri-gold/90">
            <Plus className="w-4 h-4 mr-2" /> Nueva Promoción
          </Button>
        </div>

        {/* KPIs */}
        {stats && (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <KPI title="Activas" value={stats.totalActive} icon={Zap} sub="promociones" />
            <KPI title="Usos hoy" value={stats.totalUsesToday} icon={Users} />
            <KPI title="Descuento hoy" value={fmt(stats.totalDiscountToday)} icon={Tag} />
            <KPI title="Top promo" value={stats.topPromos[0]?.name || '—'} icon={BarChart3}
              sub={stats.topPromos[0] ? `${stats.topPromos[0].uses} usos` : ''} />
          </div>
        )}

        <Tabs value={tab} onValueChange={setTab}>
          <TabsList className="bg-black/40 border border-colibri-gold/20">
            <TabsTrigger value="list">Promociones</TabsTrigger>
            <TabsTrigger value="coupons">Cupones</TabsTrigger>
          </TabsList>

          <TabsContent value="list" className="space-y-4">
            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input placeholder="Buscar promoción..." value={search} onChange={e => setSearch(e.target.value)}
                  className="pl-9 bg-black/40 border-colibri-gold/20 text-white" />
              </div>
              <select value={filterType} onChange={e => setFilterType(e.target.value)}
                className="bg-black/40 border border-colibri-gold/20 text-white rounded-lg px-3 py-2 text-sm">
                <option value="all">Todos los tipos</option>
                {Object.entries(PROMO_TYPES).map(([k, v]) => (
                  <option key={k} value={k}>{v.label}</option>
                ))}
              </select>
            </div>

            {/* Promo cards (non-coupon) */}
            {loading ? (
              <div className="text-center text-colibri-beige py-12">Cargando...</div>
            ) : filtered.filter(p => !p.is_coupon).length === 0 ? (
              <div className="text-center py-12">
                <Zap className="w-12 h-12 text-colibri-gold/30 mx-auto mb-3" />
                <p className="text-colibri-beige">No hay promociones. Crea la primera.</p>
              </div>
            ) : (
              <div className="grid gap-4">
                {filtered.filter(p => !p.is_coupon).map(promo => (
                  <PromoCard key={promo.id} promo={promo}
                    onEdit={() => handleEdit(promo)}
                    onToggle={() => handleToggle(promo)}
                    onDelete={() => handleDelete(promo)} />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="coupons" className="space-y-4">
            {/* Coupon cards */}
            {loading ? (
              <div className="text-center text-colibri-beige py-12">Cargando...</div>
            ) : filtered.filter(p => p.is_coupon).length === 0 ? (
              <div className="text-center py-12">
                <Ticket className="w-12 h-12 text-colibri-gold/30 mx-auto mb-3" />
                <p className="text-colibri-beige">No hay cupones. Crea uno desde &quot;Nueva Promoción&quot;.</p>
              </div>
            ) : (
              <div className="grid gap-4">
                {filtered.filter(p => p.is_coupon).map(promo => (
                  <PromoCard key={promo.id} promo={promo}
                    onEdit={() => handleEdit(promo)}
                    onToggle={() => handleToggle(promo)}
                    onDelete={() => handleDelete(promo)} />
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>

      {/* ─── Create / Edit Dialog ─── */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="bg-gray-950 border-colibri-gold/30 text-white max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-colibri-gold">
              {(editing as any)?.id ? 'Editar Promoción' : 'Nueva Promoción'}
            </DialogTitle>
            <DialogDescription className="text-gray-400">
              Configura los detalles de la promoción
            </DialogDescription>
          </DialogHeader>

          {editing && (
            <div className="space-y-5">
              {/* Basic info */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-gray-400 mb-1 block">Nombre *</label>
                  <Input value={editing.name || ''} onChange={e => setEditing({ ...editing, name: e.target.value })}
                    className="bg-black/40 border-colibri-gold/20 text-white" placeholder="Ej: Happy Hour Viernes" />
                </div>
                <div>
                  <label className="text-xs text-gray-400 mb-1 block">Tipo</label>
                  <select value={editing.type || 'percentage'}
                    onChange={e => setEditing({ ...editing, type: e.target.value })}
                    className="w-full bg-black/40 border border-colibri-gold/20 text-white rounded-lg px-3 py-2 text-sm">
                    {Object.entries(PROMO_TYPES).map(([k, v]) => (
                      <option key={k} value={k}>{v.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs text-gray-400 mb-1 block">Descripción</label>
                <Input value={editing.description || ''} onChange={e => setEditing({ ...editing, description: e.target.value })}
                  className="bg-black/40 border-colibri-gold/20 text-white" placeholder="Descripción visible al cliente" />
              </div>

              {/* Value fields */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {(editing.type === 'percentage' || editing.type === 'happy_hour') && (
                  <div>
                    <label className="text-xs text-gray-400 mb-1 block">% Descuento</label>
                    <Input type="number" value={editing.value || ''} min={1} max={100}
                      onChange={e => setEditing({ ...editing, value: Number(e.target.value) })}
                      className="bg-black/40 border-colibri-gold/20 text-white" />
                  </div>
                )}
                {editing.type === 'fixed_amount' && (
                  <div>
                    <label className="text-xs text-gray-400 mb-1 block">$ Descuento</label>
                    <Input type="number" value={editing.value || ''} min={1}
                      onChange={e => setEditing({ ...editing, value: Number(e.target.value) })}
                      className="bg-black/40 border-colibri-gold/20 text-white" />
                  </div>
                )}
                {editing.type === 'combo_price' && (
                  <div>
                    <label className="text-xs text-gray-400 mb-1 block">Precio combo</label>
                    <Input type="number" value={editing.value || ''} min={1}
                      onChange={e => setEditing({ ...editing, value: Number(e.target.value) })}
                      className="bg-black/40 border-colibri-gold/20 text-white" />
                  </div>
                )}
                {editing.type === 'nxm' && (
                  <>
                    <div>
                      <label className="text-xs text-gray-400 mb-1 block">Compra (N)</label>
                      <Input type="number" value={editing.buy_quantity || 3} min={2}
                        onChange={e => setEditing({ ...editing, buy_quantity: Number(e.target.value) })}
                        className="bg-black/40 border-colibri-gold/20 text-white" />
                    </div>
                    <div>
                      <label className="text-xs text-gray-400 mb-1 block">Paga (M)</label>
                      <Input type="number" value={editing.get_quantity || 2} min={1}
                        onChange={e => setEditing({ ...editing, get_quantity: Number(e.target.value) })}
                        className="bg-black/40 border-colibri-gold/20 text-white" />
                    </div>
                  </>
                )}
                <div>
                  <label className="text-xs text-gray-400 mb-1 block">Compra mínima</label>
                  <Input type="number" value={editing.min_purchase || ''} min={0}
                    onChange={e => setEditing({ ...editing, min_purchase: Number(e.target.value) })}
                    className="bg-black/40 border-colibri-gold/20 text-white" placeholder="$0" />
                </div>
                <div>
                  <label className="text-xs text-gray-400 mb-1 block">Desc. máximo</label>
                  <Input type="number" value={editing.max_discount || ''} min={0}
                    onChange={e => setEditing({ ...editing, max_discount: Number(e.target.value) })}
                    className="bg-black/40 border-colibri-gold/20 text-white" placeholder="Sin límite" />
                </div>
              </div>

              {/* Channel + Applies To */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-gray-400 mb-1 block">Canal</label>
                  <select value={editing.channel || 'all'}
                    onChange={e => setEditing({ ...editing, channel: e.target.value })}
                    className="w-full bg-black/40 border border-colibri-gold/20 text-white rounded-lg px-3 py-2 text-sm">
                    {Object.entries(CHANNELS).map(([k, v]) => (
                      <option key={k} value={k}>{v}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs text-gray-400 mb-1 block">Aplica a</label>
                  <select value={editing.applies_to || 'all'}
                    onChange={e => setEditing({ ...editing, applies_to: e.target.value, items: [] })}
                    className="w-full bg-black/40 border border-colibri-gold/20 text-white rounded-lg px-3 py-2 text-sm">
                    <option value="all">Todos los productos</option>
                    <option value="products">Productos específicos</option>
                    <option value="categories">Categorías específicas</option>
                  </select>
                </div>
              </div>

              {/* Product / Category picker */}
              {editing.applies_to === 'products' && (
                <div className="space-y-2">
                  <label className="text-xs text-gray-400 block">Seleccionar productos</label>
                  <Input placeholder="Buscar producto..." value={pickerSearch}
                    onChange={e => setPickerSearch(e.target.value)}
                    className="bg-black/40 border-colibri-gold/20 text-white text-sm" />
                  <div className="max-h-40 overflow-y-auto border border-colibri-gold/10 rounded-lg p-2 space-y-1">
                    {products
                      .filter(p => !pickerSearch || p.name.toLowerCase().includes(pickerSearch.toLowerCase()))
                      .map(p => (
                        <label key={p.id} className="flex items-center gap-2 text-sm cursor-pointer hover:bg-white/5 px-2 py-1 rounded">
                          <input type="checkbox" checked={isItemSelected('product', p.id)}
                            onChange={() => toggleItem('product', p.id)}
                            className="accent-colibri-gold" />
                          <span className="text-white">{p.name}</span>
                          <span className="text-gray-500 text-xs ml-auto">{p.category_name} · {fmt(p.price)}</span>
                        </label>
                      ))}
                  </div>
                  {editing.items.filter((i: any) => i.item_type === 'product').length > 0 && (
                    <p className="text-xs text-colibri-gold">{editing.items.filter((i: any) => i.item_type === 'product').length} producto(s) seleccionados</p>
                  )}
                </div>
              )}

              {editing.applies_to === 'categories' && (
                <div className="space-y-2">
                  <label className="text-xs text-gray-400 block">Seleccionar categorías</label>
                  <div className="flex flex-wrap gap-2">
                    {categories.map(c => (
                      <button key={c.id} type="button" onClick={() => toggleItem('category', c.id)}
                        className={`px-3 py-1.5 rounded-lg text-sm border transition ${
                          isItemSelected('category', c.id)
                            ? 'bg-colibri-gold/20 border-colibri-gold text-colibri-gold'
                            : 'bg-black/40 border-colibri-gold/10 text-gray-400 hover:border-colibri-gold/30'
                        }`}>
                        {c.name}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Date range */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-gray-400 mb-1 block">Fecha inicio</label>
                  <Input type="date" value={editing.start_date || ''}
                    onChange={e => setEditing({ ...editing, start_date: e.target.value || null })}
                    className="bg-black/40 border-colibri-gold/20 text-white" />
                </div>
                <div>
                  <label className="text-xs text-gray-400 mb-1 block">Fecha fin</label>
                  <Input type="date" value={editing.end_date || ''}
                    onChange={e => setEditing({ ...editing, end_date: e.target.value || null })}
                    className="bg-black/40 border-colibri-gold/20 text-white" />
                </div>
              </div>

              {/* Schedule (days + time) */}
              <div className="space-y-3">
                <label className="text-xs text-gray-400 block">Programación (opcional)</label>
                <div className="flex flex-wrap gap-2">
                  {DAYS.map((d, idx) => (
                    <button key={idx} type="button"
                      onClick={() => {
                        const days = editing.schedule_days || []
                        const newDays = days.includes(idx) ? days.filter((x: number) => x !== idx) : [...days, idx]
                        setEditing({ ...editing, schedule_days: newDays.length ? newDays : null })
                      }}
                      className={`w-10 h-10 rounded-lg text-xs font-bold border transition ${
                        editing.schedule_days?.includes(idx)
                          ? 'bg-colibri-gold/20 border-colibri-gold text-colibri-gold'
                          : 'bg-black/40 border-colibri-gold/10 text-gray-500 hover:border-colibri-gold/30'
                      }`}>
                      {d}
                    </button>
                  ))}
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs text-gray-400 mb-1 block">Hora inicio</label>
                    <Input type="time" value={editing.schedule_start_time || ''}
                      onChange={e => setEditing({ ...editing, schedule_start_time: e.target.value || null })}
                      className="bg-black/40 border-colibri-gold/20 text-white" />
                  </div>
                  <div>
                    <label className="text-xs text-gray-400 mb-1 block">Hora fin</label>
                    <Input type="time" value={editing.schedule_end_time || ''}
                      onChange={e => setEditing({ ...editing, schedule_end_time: e.target.value || null })}
                      className="bg-black/40 border-colibri-gold/20 text-white" />
                  </div>
                </div>
              </div>

              {/* Coupon toggle */}
              <div className="space-y-3 border-t border-colibri-gold/10 pt-4">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input type="checkbox" checked={!!editing.is_coupon}
                    onChange={e => setEditing({ ...editing, is_coupon: e.target.checked })}
                    className="accent-colibri-gold w-4 h-4" />
                  <span className="text-sm text-white">Es cupón (requiere código)</span>
                </label>
                {editing.is_coupon && (
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs text-gray-400 mb-1 block">Código del cupón</label>
                      <Input value={editing.coupon_code || ''} placeholder="PROMO2025"
                        onChange={e => setEditing({ ...editing, coupon_code: e.target.value.toUpperCase() })}
                        className="bg-black/40 border-colibri-gold/20 text-white uppercase tracking-wider" />
                    </div>
                    <div>
                      <label className="text-xs text-gray-400 mb-1 block">Máximo de usos (0 = ilimitado)</label>
                      <Input type="number" value={editing.max_uses || ''} min={0}
                        onChange={e => setEditing({ ...editing, max_uses: Number(e.target.value) })}
                        className="bg-black/40 border-colibri-gold/20 text-white" />
                    </div>
                  </div>
                )}
              </div>

              {/* Advanced options */}
              <div className="space-y-3 border-t border-colibri-gold/10 pt-4">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input type="checkbox" checked={!!editing.stackable}
                    onChange={e => setEditing({ ...editing, stackable: e.target.checked })}
                    className="accent-colibri-gold w-4 h-4" />
                  <span className="text-sm text-white">Acumulable con otras promociones</span>
                </label>
                <div className="w-32">
                  <label className="text-xs text-gray-400 mb-1 block">Prioridad</label>
                  <Input type="number" value={editing.priority || 0} min={0}
                    onChange={e => setEditing({ ...editing, priority: Number(e.target.value) })}
                    className="bg-black/40 border-colibri-gold/20 text-white" />
                </div>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}
              className="border-colibri-gold/30 text-colibri-beige hover:bg-white/5">
              Cancelar
            </Button>
            <Button onClick={handleSave} disabled={saving}
              className="bg-colibri-gold text-black hover:bg-colibri-gold/90">
              {saving ? 'Guardando...' : 'Guardar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  )
}

// ─── Promo Card Component ───
function PromoCard({ promo, onEdit, onToggle, onDelete }: {
  promo: Promotion; onEdit: () => void; onToggle: () => void; onDelete: () => void
}) {
  const typeInfo = PROMO_TYPES[promo.type] || PROMO_TYPES.percentage
  const Icon = typeInfo.icon

  const valueLabel = () => {
    switch (promo.type) {
      case 'percentage': case 'happy_hour': return `${promo.value}% OFF`
      case 'fixed_amount': return `${fmt(promo.value)} OFF`
      case '2x1': return '2×1'
      case 'nxm': return `${promo.buy_quantity}×${promo.get_quantity}`
      case 'combo_price': return `Combo ${fmt(promo.value)}`
      default: return ''
    }
  }

  return (
    <div className={`bg-black/40 border rounded-xl p-4 transition ${
      promo.is_active ? 'border-colibri-gold/20' : 'border-gray-700 opacity-60'
    }`}>
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3 flex-1 min-w-0">
          <div className={`p-2 rounded-lg bg-black/60 ${typeInfo.color}`}>
            <Icon className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="font-semibold text-white truncate">{promo.name}</h3>
              <Badge className={`text-xs ${promo.is_active ? 'bg-green-900/50 text-green-400' : 'bg-gray-800 text-gray-400'}`}>
                {promo.is_active ? 'Activa' : 'Inactiva'}
              </Badge>
              {promo.is_coupon && (
                <Badge className="bg-purple-900/50 text-purple-400 text-xs font-mono">
                  {promo.coupon_code}
                </Badge>
              )}
            </div>
            <p className="text-sm text-gray-400 mt-0.5">{promo.description || typeInfo.label}</p>

            <div className="flex items-center gap-3 mt-2 text-xs text-gray-500 flex-wrap">
              <span className={`font-bold text-lg ${typeInfo.color}`}>{valueLabel()}</span>
              <span>Canal: {CHANNELS[promo.channel] || promo.channel}</span>
              {promo.min_purchase > 0 && <span>Min: {fmt(promo.min_purchase)}</span>}
              {promo.max_uses > 0 && <span>Usos: {promo.current_uses}/{promo.max_uses}</span>}
              {promo.start_date && <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />{promo.start_date.split('T')[0]}</span>}
              {promo.schedule_days && promo.schedule_days.length > 0 && (
                <span>{promo.schedule_days.map(d => DAYS[d]).join(', ')}</span>
              )}
              {promo.schedule_start_time && (
                <span>{promo.schedule_start_time.substring(0,5)} - {promo.schedule_end_time?.substring(0,5)}</span>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1 flex-shrink-0">
          <Button variant="ghost" size="sm" onClick={onToggle}
            className="text-gray-400 hover:text-white h-8 w-8 p-0">
            {promo.is_active ? <PowerOff className="w-4 h-4" /> : <Power className="w-4 h-4" />}
          </Button>
          <Button variant="ghost" size="sm" onClick={onEdit}
            className="text-gray-400 hover:text-white h-8 w-8 p-0">
            <Edit className="w-4 h-4" />
          </Button>
          <Button variant="ghost" size="sm" onClick={onDelete}
            className="text-gray-400 hover:text-red-400 h-8 w-8 p-0">
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  )
}
