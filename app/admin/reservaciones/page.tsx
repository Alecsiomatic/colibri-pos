'use client'

import { useState, useEffect, useCallback } from 'react'
import AdminLayout from '@/components/admin/admin-layout'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Switch } from '@/components/ui/switch'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import {
  CalendarDays, Clock, Users, Plus, Search, CheckCircle2,
  XCircle, Phone, Mail, ChevronLeft, ChevronRight,
  LoaderCircle, Settings, Armchair, AlertTriangle, Eye, Pencil, Trash2,
  UserCheck, Ban, PartyPopper
} from 'lucide-react'
import { useToast } from '@/hooks/use-notifications'

// ─── Types ───────────────────────────────────────────────────
interface Reservation {
  id: number
  customer_name: string
  customer_phone: string
  customer_email: string | null
  party_size: number
  reservation_date: string
  reservation_time: string
  duration_minutes: number
  table_id: number | null
  table_name: string | null
  status: string
  notes: string | null
  special_requests: string | null
  source: string
  confirmation_code: string
  created_at: string
}

interface RTable {
  id: number
  name: string
  capacity: number
  zone: string
  is_reservable: number | boolean
  is_active: number | boolean
}

interface Config {
  is_active: boolean
  min_party_size: number
  max_party_size: number
  slot_duration_minutes: number
  advance_days: number
  opening_time: string
  closing_time: string
  slot_interval_minutes: number
  auto_confirm: boolean
  reminder_hours_before: number
  blocked_dates: string | null
  max_reservations_per_slot: number
}

interface Stats {
  todayCount: number
  pendingCount: number
  confirmedToday: number
  thisWeekCount: number
  upcoming: Reservation[]
  byStatus: { status: string; count: number }[]
}

const STATUS_LABELS: Record<string, { label: string; color: string; icon: any }> = {
  pending: { label: 'Pendiente', color: 'bg-yellow-900/50 text-yellow-400 border-yellow-500/30', icon: Clock },
  confirmed: { label: 'Confirmada', color: 'bg-green-900/50 text-green-400 border-green-500/30', icon: CheckCircle2 },
  seated: { label: 'Sentados', color: 'bg-blue-900/50 text-blue-400 border-blue-500/30', icon: Armchair },
  completed: { label: 'Completada', color: 'bg-gray-800/50 text-gray-400 border-gray-500/30', icon: CheckCircle2 },
  cancelled: { label: 'Cancelada', color: 'bg-red-900/50 text-red-400 border-red-500/30', icon: XCircle },
  no_show: { label: 'No Show', color: 'bg-orange-900/50 text-orange-400 border-orange-500/30', icon: AlertTriangle },
}

function formatTime(t: string) {
  if (!t) return ''
  const [h, m] = t.split(':')
  const hour = parseInt(h)
  const ampm = hour >= 12 ? 'PM' : 'AM'
  const h12 = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour
  return `${h12}:${m} ${ampm}`
}

function formatDate(d: string) {
  if (!d) return ''
  const date = new Date(d + 'T12:00:00')
  return date.toLocaleDateString('es-MX', { weekday: 'short', day: 'numeric', month: 'short' })
}

// ─── Component ───────────────────────────────────────────────
export default function ReservacionesPage() {
  const toast = useToast()
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState<Stats | null>(null)
  const [config, setConfig] = useState<Config | null>(null)
  const [reservations, setReservations] = useState<Reservation[]>([])
  const [tables, setTables] = useState<RTable[]>([])

  // Filters
  const [filterDate, setFilterDate] = useState(new Date().toISOString().split('T')[0])
  const [filterStatus, setFilterStatus] = useState('')
  const [searchTerm, setSearchTerm] = useState('')

  // Dialogs
  const [showCreate, setShowCreate] = useState(false)
  const [showDetail, setShowDetail] = useState<Reservation | null>(null)
  const [showTableDialog, setShowTableDialog] = useState(false)
  const [saving, setSaving] = useState(false)

  // New reservation form
  const [newRes, setNewRes] = useState({
    customer_name: '', customer_phone: '', customer_email: '',
    party_size: 2, reservation_date: '', reservation_time: '',
    notes: '', special_requests: '', table_id: '',
  })

  // New table form
  const [newTable, setNewTable] = useState({ name: '', capacity: 4, zone: 'General' })

  // ─── Data Loading ────────────────────────────────────────
  const loadStats = useCallback(async () => {
    try {
      const res = await fetch('/api/reservations?action=stats')
      const data = await res.json()
      if (data.success) {
        setStats(data.stats)
        setConfig(data.config)
      }
    } catch { toast.error('Error cargando estadísticas') }
  }, [toast])

  const loadReservations = useCallback(async () => {
    try {
      let url = '/api/reservations?action=list'
      if (filterDate) url += `&date=${filterDate}`
      if (filterStatus) url += `&status=${filterStatus}`
      if (searchTerm) url += `&search=${encodeURIComponent(searchTerm)}`
      const res = await fetch(url)
      const data = await res.json()
      if (data.success) setReservations(data.reservations)
    } catch { toast.error('Error cargando reservaciones') }
  }, [filterDate, filterStatus, searchTerm, toast])

  const loadTables = useCallback(async () => {
    try {
      const res = await fetch('/api/reservations?action=tables')
      const data = await res.json()
      if (data.success) setTables(data.tables)
    } catch {}
  }, [])

  useEffect(() => {
    Promise.all([loadStats(), loadReservations(), loadTables()])
      .finally(() => setLoading(false))
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => { loadReservations() }, [filterDate, filterStatus, searchTerm]) // eslint-disable-line react-hooks/exhaustive-deps

  // ─── Actions ─────────────────────────────────────────────
  const handleCreateReservation = async () => {
    if (!newRes.customer_name || !newRes.customer_phone || !newRes.reservation_date || !newRes.reservation_time) {
      toast.error('Completa los campos obligatorios')
      return
    }
    setSaving(true)
    try {
      const res = await fetch('/api/reservations', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          action: 'admin-create', ...newRes,
          party_size: Number(newRes.party_size),
          table_id: newRes.table_id ? Number(newRes.table_id) : null,
        }),
      })
      const data = await res.json()
      if (data.success) {
        toast.success(`Reservación creada. Código: ${data.confirmation_code}`)
        setShowCreate(false)
        setNewRes({ customer_name: '', customer_phone: '', customer_email: '', party_size: 2, reservation_date: '', reservation_time: '', notes: '', special_requests: '', table_id: '' })
        loadReservations()
        loadStats()
      } else toast.error(data.error || 'Error')
    } catch { toast.error('Error de red') }
    setSaving(false)
  }

  const handleStatusChange = async (id: number, status: string) => {
    try {
      const res = await fetch('/api/reservations', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ action: 'update-status', id, status }),
      })
      const data = await res.json()
      if (data.success) {
        toast.success('Estado actualizado')
        loadReservations()
        loadStats()
        if (showDetail) setShowDetail(null)
      } else toast.error(data.error || 'Error')
    } catch { toast.error('Error de red') }
  }

  const handleDeleteReservation = async (id: number) => {
    if (!confirm('¿Eliminar esta reservación?')) return
    try {
      const res = await fetch('/api/reservations', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ action: 'delete', id }),
      })
      const data = await res.json()
      if (data.success) {
        toast.success('Reservación eliminada')
        loadReservations()
        loadStats()
        setShowDetail(null)
      }
    } catch { toast.error('Error') }
  }

  const handleCreateTable = async () => {
    if (!newTable.name) { toast.error('Nombre requerido'); return }
    setSaving(true)
    try {
      const res = await fetch('/api/reservations', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ action: 'create-table', ...newTable }),
      })
      const data = await res.json()
      if (data.success) {
        toast.success('Mesa creada')
        setNewTable({ name: '', capacity: 4, zone: 'General' })
        loadTables()
      } else toast.error(data.error || 'Error')
    } catch { toast.error('Error') }
    setSaving(false)
  }

  const handleToggleTable = async (t: RTable) => {
    await fetch('/api/reservations', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ action: 'update-table', id: t.id, is_active: !t.is_active }),
    })
    loadTables()
  }

  const handleDeleteTable = async (id: number) => {
    if (!confirm('¿Eliminar esta mesa?')) return
    await fetch('/api/reservations', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ action: 'delete-table', id }),
    })
    loadTables()
  }

  const handleSaveConfig = async () => {
    if (!config) return
    setSaving(true)
    try {
      const res = await fetch('/api/reservations', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ action: 'update-config', config }),
      })
      const data = await res.json()
      if (data.success) toast.success('Configuración guardada')
      else toast.error(data.error || 'Error')
    } catch { toast.error('Error') }
    setSaving(false)
  }

  // ─── Date Navigation ────────────────────────────────────
  const changeDate = (days: number) => {
    const d = new Date(filterDate + 'T12:00:00')
    d.setDate(d.getDate() + days)
    setFilterDate(d.toISOString().split('T')[0])
  }

  // ─── Render ──────────────────────────────────────────────
  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <LoaderCircle className="w-8 h-8 animate-spin text-colibri-gold" />
        </div>
      </AdminLayout>
    )
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white flex items-center gap-2">
              <CalendarDays className="w-7 h-7 text-colibri-gold" /> Reservaciones
            </h1>
            <p className="text-colibri-beige mt-1">Gestiona reservas, mesas y horarios</p>
          </div>
          <Button onClick={() => setShowCreate(true)} className="bg-colibri-gold text-black hover:bg-colibri-gold/90">
            <Plus className="w-4 h-4 mr-2" /> Nueva Reservación
          </Button>
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="bg-gradient-to-br from-blue-900/50 to-blue-800/30 border-blue-500/30">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-blue-300 uppercase tracking-wide">Hoy</p>
                  <p className="text-2xl font-bold text-white">{stats?.todayCount || 0}</p>
                </div>
                <CalendarDays className="w-8 h-8 text-blue-400" />
              </div>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-yellow-900/50 to-yellow-800/30 border-yellow-500/30">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-yellow-300 uppercase tracking-wide">Pendientes</p>
                  <p className="text-2xl font-bold text-white">{stats?.pendingCount || 0}</p>
                </div>
                <Clock className="w-8 h-8 text-yellow-400" />
              </div>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-green-900/50 to-green-800/30 border-green-500/30">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-green-300 uppercase tracking-wide">Confirmadas Hoy</p>
                  <p className="text-2xl font-bold text-white">{stats?.confirmedToday || 0}</p>
                </div>
                <CheckCircle2 className="w-8 h-8 text-green-400" />
              </div>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-purple-900/50 to-purple-800/30 border-purple-500/30">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-purple-300 uppercase tracking-wide">Esta Semana</p>
                  <p className="text-2xl font-bold text-white">{stats?.thisWeekCount || 0}</p>
                </div>
                <Users className="w-8 h-8 text-purple-400" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="reservations" className="space-y-4">
          <TabsList className="bg-white/10 border-0">
            <TabsTrigger value="reservations" className="data-[state=active]:bg-colibri-green/50 data-[state=active]:text-white text-colibri-beige">
              Reservaciones
            </TabsTrigger>
            <TabsTrigger value="upcoming" className="data-[state=active]:bg-colibri-green/50 data-[state=active]:text-white text-colibri-beige">
              Próximas
            </TabsTrigger>
            <TabsTrigger value="tables" className="data-[state=active]:bg-colibri-green/50 data-[state=active]:text-white text-colibri-beige">
              Mesas
            </TabsTrigger>
            <TabsTrigger value="config" className="data-[state=active]:bg-colibri-green/50 data-[state=active]:text-white text-colibri-beige">
              Configuración
            </TabsTrigger>
          </TabsList>

          {/* ─── Reservations Tab ────────────────────────── */}
          <TabsContent value="reservations" className="space-y-4">
            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={() => changeDate(-1)} className="border-white/20 text-colibri-beige hover:bg-white/5 h-9 w-9 p-0">
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <Input
                  type="date" value={filterDate}
                  onChange={e => setFilterDate(e.target.value)}
                  className="bg-white/5 border-white/10 text-white w-44"
                />
                <Button variant="outline" size="sm" onClick={() => changeDate(1)} className="border-white/20 text-colibri-beige hover:bg-white/5 h-9 w-9 p-0">
                  <ChevronRight className="w-4 h-4" />
                </Button>
                <Button variant="ghost" size="sm" onClick={() => setFilterDate(new Date().toISOString().split('T')[0])} className="text-colibri-gold hover:bg-colibri-gold/10 text-xs">
                  Hoy
                </Button>
              </div>
              <select
                value={filterStatus}
                onChange={e => setFilterStatus(e.target.value)}
                className="bg-white/5 border border-white/10 text-white rounded-lg px-3 py-2 text-sm"
              >
                <option value="">Todos los estados</option>
                {Object.entries(STATUS_LABELS).map(([k, v]) => (
                  <option key={k} value={k}>{v.label}</option>
                ))}
              </select>
              <div className="relative flex-1 max-w-xs">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-colibri-beige/50" />
                <Input
                  placeholder="Buscar nombre, teléfono, código..."
                  value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
                  className="pl-9 bg-white/5 border-white/10 text-white placeholder:text-colibri-beige/30"
                />
              </div>
            </div>

            {/* Reservation List */}
            {reservations.length === 0 ? (
              <div className="text-center py-12">
                <CalendarDays className="w-12 h-12 text-colibri-gold/30 mx-auto mb-3" />
                <p className="text-colibri-beige">No hay reservaciones para esta fecha</p>
              </div>
            ) : (
              <div className="space-y-3">
                {reservations.map(r => {
                  const st = STATUS_LABELS[r.status] || STATUS_LABELS.pending
                  const Icon = st.icon
                  return (
                    <Card key={r.id} className="bg-white/5 border-white/10 hover:bg-white/[0.07] transition-colors">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between gap-4">
                          <div className="flex items-center gap-4 flex-1 min-w-0">
                            <div className={`p-2 rounded-lg ${st.color}`}>
                              <Icon className="w-5 h-5" />
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="font-semibold text-white">{r.customer_name}</span>
                                <Badge variant="outline" className="text-xs border-colibri-gold/30 text-colibri-gold font-mono">
                                  {r.confirmation_code}
                                </Badge>
                                <Badge className={`text-xs ${st.color} border`}>
                                  {st.label}
                                </Badge>
                              </div>
                              <div className="flex items-center gap-4 mt-1 text-sm text-colibri-beige/70">
                                <span className="flex items-center gap-1">
                                  <Clock className="w-3 h-3" /> {formatTime(r.reservation_time)}
                                </span>
                                <span className="flex items-center gap-1">
                                  <Users className="w-3 h-3" /> {r.party_size} personas
                                </span>
                                {r.table_name && (
                                  <span className="flex items-center gap-1">
                                    <Armchair className="w-3 h-3" /> {r.table_name}
                                  </span>
                                )}
                                <span className="flex items-center gap-1">
                                  <Phone className="w-3 h-3" /> {r.customer_phone}
                                </span>
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-1 flex-shrink-0">
                            {r.status === 'pending' && (
                              <Button size="sm" variant="ghost" onClick={() => handleStatusChange(r.id, 'confirmed')}
                                className="text-green-400 hover:bg-green-900/30 h-8 w-8 p-0" title="Confirmar">
                                <CheckCircle2 className="w-4 h-4" />
                              </Button>
                            )}
                            {r.status === 'confirmed' && (
                              <Button size="sm" variant="ghost" onClick={() => handleStatusChange(r.id, 'seated')}
                                className="text-blue-400 hover:bg-blue-900/30 h-8 w-8 p-0" title="Sentar">
                                <Armchair className="w-4 h-4" />
                              </Button>
                            )}
                            {r.status === 'seated' && (
                              <Button size="sm" variant="ghost" onClick={() => handleStatusChange(r.id, 'completed')}
                                className="text-gray-400 hover:bg-gray-800/50 h-8 w-8 p-0" title="Completar">
                                <CheckCircle2 className="w-4 h-4" />
                              </Button>
                            )}
                            {!['cancelled', 'completed', 'no_show'].includes(r.status) && (
                              <>
                                <Button size="sm" variant="ghost" onClick={() => handleStatusChange(r.id, 'no_show')}
                                  className="text-orange-400 hover:bg-orange-900/30 h-8 w-8 p-0" title="No Show">
                                  <AlertTriangle className="w-4 h-4" />
                                </Button>
                                <Button size="sm" variant="ghost" onClick={() => handleStatusChange(r.id, 'cancelled')}
                                  className="text-red-400 hover:bg-red-900/30 h-8 w-8 p-0" title="Cancelar">
                                  <Ban className="w-4 h-4" />
                                </Button>
                              </>
                            )}
                            <Button size="sm" variant="ghost" onClick={() => setShowDetail(r)}
                              className="text-colibri-beige hover:bg-white/10 h-8 w-8 p-0" title="Ver detalles">
                              <Eye className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )
                })}
              </div>
            )}
          </TabsContent>

          {/* ─── Upcoming Tab ────────────────────────────── */}
          <TabsContent value="upcoming" className="space-y-4">
            <Card className="bg-white/5 border-white/10">
              <CardHeader>
                <CardTitle className="text-white text-lg">Próximas Reservaciones</CardTitle>
                <CardDescription className="text-colibri-beige/60">
                  Reservaciones pendientes y confirmadas
                </CardDescription>
              </CardHeader>
              <CardContent>
                {!stats?.upcoming?.length ? (
                  <p className="text-sm text-colibri-beige/50 text-center py-8">Sin reservaciones próximas</p>
                ) : (
                  <div className="space-y-2">
                    {stats.upcoming.map(r => {
                      const st = STATUS_LABELS[r.status] || STATUS_LABELS.pending
                      return (
                        <div key={r.id} className="flex items-center justify-between p-3 rounded-lg bg-white/5 hover:bg-white/[0.07]">
                          <div className="flex items-center gap-3">
                            <div className="text-center min-w-[60px]">
                              <p className="text-xs text-colibri-beige/60">{formatDate(r.reservation_date)}</p>
                              <p className="text-sm font-bold text-white">{formatTime(r.reservation_time)}</p>
                            </div>
                            <Separator orientation="vertical" className="h-8 bg-white/10" />
                            <div>
                              <p className="text-white font-medium">{r.customer_name}</p>
                              <p className="text-xs text-colibri-beige/60">{r.party_size} personas · {r.table_name || 'Sin mesa'}</p>
                            </div>
                          </div>
                          <Badge className={`text-xs ${st.color} border`}>{st.label}</Badge>
                        </div>
                      )
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* ─── Tables Tab ──────────────────────────────── */}
          <TabsContent value="tables" className="space-y-4">
            <Card className="bg-white/5 border-white/10">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-white text-lg">Mesas para Reservación</CardTitle>
                  <Button size="sm" onClick={() => setShowTableDialog(true)} className="bg-colibri-gold text-black hover:bg-colibri-gold/90">
                    <Plus className="w-4 h-4 mr-1" /> Agregar Mesa
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {tables.length === 0 ? (
                  <p className="text-sm text-colibri-beige/50 text-center py-8">
                    No hay mesas configuradas. Agrega mesas para que los clientes puedan reservar.
                  </p>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {tables.map(t => (
                      <div key={t.id} className={`rounded-lg border p-4 transition ${t.is_active ? 'bg-white/5 border-white/10' : 'bg-white/[0.02] border-white/5 opacity-50'}`}>
                        <div className="flex items-center justify-between mb-2">
                          <h3 className="font-semibold text-white">{t.name}</h3>
                          <div className="flex gap-1">
                            <Button size="sm" variant="ghost" onClick={() => handleToggleTable(t)} className="h-7 w-7 p-0 text-colibri-beige">
                              {t.is_active ? <Ban className="w-3.5 h-3.5" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                            </Button>
                            <Button size="sm" variant="ghost" onClick={() => handleDeleteTable(t.id)} className="h-7 w-7 p-0 text-red-400">
                              <Trash2 className="w-3.5 h-3.5" />
                            </Button>
                          </div>
                        </div>
                        <div className="flex items-center gap-3 text-sm text-colibri-beige/60">
                          <span className="flex items-center gap-1"><Users className="w-3 h-3" /> {t.capacity} personas</span>
                          <span>{t.zone}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* ─── Config Tab ──────────────────────────────── */}
          <TabsContent value="config" className="space-y-4">
            {config && (
              <Card className="bg-white/5 border-white/10">
                <CardHeader>
                  <CardTitle className="text-white text-lg flex items-center gap-2">
                    <Settings className="w-5 h-5" /> Configuración de Reservaciones
                  </CardTitle>
                  <CardDescription className="text-colibri-beige/60">
                    Define horarios, reglas y comportamiento del sistema de reservas
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Active Toggle */}
                  <div className="flex items-center justify-between p-4 rounded-lg bg-white/5">
                    <div>
                      <p className="text-white font-medium">Reservaciones Activas</p>
                      <p className="text-sm text-colibri-beige/60">Permitir que clientes hagan reservaciones online</p>
                    </div>
                    <Switch checked={config.is_active} onCheckedChange={v => setConfig({ ...config, is_active: v })} />
                  </div>

                  <Separator className="bg-white/10" />

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Schedule */}
                    <div className="space-y-4">
                      <h3 className="text-colibri-gold font-medium flex items-center gap-2">
                        <Clock className="w-4 h-4" /> Horarios
                      </h3>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <Label className="text-colibri-beige text-sm">Hora apertura</Label>
                          <Input type="time" value={config.opening_time?.slice(0, 5)} onChange={e => setConfig({ ...config, opening_time: e.target.value })}
                            className="bg-white/5 border-white/10 text-white" />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-colibri-beige text-sm">Hora cierre</Label>
                          <Input type="time" value={config.closing_time?.slice(0, 5)} onChange={e => setConfig({ ...config, closing_time: e.target.value })}
                            className="bg-white/5 border-white/10 text-white" />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <Label className="text-colibri-beige text-sm">Duración reserva (min)</Label>
                          <Input type="number" min={30} step={15} value={config.slot_duration_minutes}
                            onChange={e => setConfig({ ...config, slot_duration_minutes: Number(e.target.value) || 90 })}
                            className="bg-white/5 border-white/10 text-white" />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-colibri-beige text-sm">Intervalo slots (min)</Label>
                          <Input type="number" min={15} step={15} value={config.slot_interval_minutes}
                            onChange={e => setConfig({ ...config, slot_interval_minutes: Number(e.target.value) || 30 })}
                            className="bg-white/5 border-white/10 text-white" />
                        </div>
                      </div>
                    </div>

                    {/* Rules */}
                    <div className="space-y-4">
                      <h3 className="text-colibri-gold font-medium flex items-center gap-2">
                        <Users className="w-4 h-4" /> Reglas
                      </h3>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <Label className="text-colibri-beige text-sm">Mín. personas</Label>
                          <Input type="number" min={1} value={config.min_party_size}
                            onChange={e => setConfig({ ...config, min_party_size: Number(e.target.value) || 1 })}
                            className="bg-white/5 border-white/10 text-white" />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-colibri-beige text-sm">Máx. personas</Label>
                          <Input type="number" min={1} value={config.max_party_size}
                            onChange={e => setConfig({ ...config, max_party_size: Number(e.target.value) || 20 })}
                            className="bg-white/5 border-white/10 text-white" />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <Label className="text-colibri-beige text-sm">Días anticipación máx.</Label>
                          <Input type="number" min={1} value={config.advance_days}
                            onChange={e => setConfig({ ...config, advance_days: Number(e.target.value) || 30 })}
                            className="bg-white/5 border-white/10 text-white" />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-colibri-beige text-sm">Máx. reservas por slot</Label>
                          <Input type="number" min={1} value={config.max_reservations_per_slot}
                            onChange={e => setConfig({ ...config, max_reservations_per_slot: Number(e.target.value) || 5 })}
                            className="bg-white/5 border-white/10 text-white" />
                        </div>
                      </div>
                    </div>
                  </div>

                  <Separator className="bg-white/10" />

                  <div className="flex items-center justify-between p-4 rounded-lg bg-white/5">
                    <div>
                      <p className="text-white font-medium">Auto-Confirmar</p>
                      <p className="text-sm text-colibri-beige/60">Confirmar reservaciones automáticamente sin revisión manual</p>
                    </div>
                    <Switch checked={config.auto_confirm} onCheckedChange={v => setConfig({ ...config, auto_confirm: v })} />
                  </div>

                  <div className="flex justify-end">
                    <Button onClick={handleSaveConfig} disabled={saving} className="bg-colibri-green hover:bg-colibri-green/80">
                      {saving ? <LoaderCircle className="w-4 h-4 mr-2 animate-spin" /> : <Settings className="w-4 h-4 mr-2" />}
                      Guardar Configuración
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>

        {/* ─── Create Dialog ─────────────────────────────── */}
        <Dialog open={showCreate} onOpenChange={setShowCreate}>
          <DialogContent className="bg-gray-900 border-white/10 text-white max-w-lg">
            <DialogHeader>
              <DialogTitle className="text-colibri-gold">Nueva Reservación</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 max-h-[65vh] overflow-y-auto pr-1">
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2 space-y-1">
                  <Label className="text-colibri-beige text-sm">Nombre *</Label>
                  <Input value={newRes.customer_name} onChange={e => setNewRes({ ...newRes, customer_name: e.target.value })}
                    className="bg-white/5 border-white/10 text-white" placeholder="Nombre del cliente" />
                </div>
                <div className="space-y-1">
                  <Label className="text-colibri-beige text-sm">Teléfono *</Label>
                  <Input value={newRes.customer_phone} onChange={e => setNewRes({ ...newRes, customer_phone: e.target.value })}
                    className="bg-white/5 border-white/10 text-white" placeholder="Teléfono" />
                </div>
                <div className="space-y-1">
                  <Label className="text-colibri-beige text-sm">Email</Label>
                  <Input value={newRes.customer_email} onChange={e => setNewRes({ ...newRes, customer_email: e.target.value })}
                    className="bg-white/5 border-white/10 text-white" placeholder="email@ejemplo.com" />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1">
                  <Label className="text-colibri-beige text-sm">Fecha *</Label>
                  <Input type="date" value={newRes.reservation_date} onChange={e => setNewRes({ ...newRes, reservation_date: e.target.value })}
                    className="bg-white/5 border-white/10 text-white" />
                </div>
                <div className="space-y-1">
                  <Label className="text-colibri-beige text-sm">Hora *</Label>
                  <Input type="time" value={newRes.reservation_time} onChange={e => setNewRes({ ...newRes, reservation_time: e.target.value })}
                    className="bg-white/5 border-white/10 text-white" />
                </div>
                <div className="space-y-1">
                  <Label className="text-colibri-beige text-sm">Personas *</Label>
                  <Input type="number" min={1} value={newRes.party_size} onChange={e => setNewRes({ ...newRes, party_size: Number(e.target.value) || 2 })}
                    className="bg-white/5 border-white/10 text-white" />
                </div>
              </div>
              {tables.length > 0 && (
                <div className="space-y-1">
                  <Label className="text-colibri-beige text-sm">Mesa (opcional)</Label>
                  <select value={newRes.table_id} onChange={e => setNewRes({ ...newRes, table_id: e.target.value })}
                    className="w-full bg-white/5 border border-white/10 text-white rounded-lg px-3 py-2 text-sm">
                    <option value="">Auto-asignar</option>
                    {tables.filter(t => t.is_active).map(t => (
                      <option key={t.id} value={t.id}>{t.name} ({t.capacity} pers.)</option>
                    ))}
                  </select>
                </div>
              )}
              <div className="space-y-1">
                <Label className="text-colibri-beige text-sm">Notas</Label>
                <Textarea value={newRes.notes} onChange={e => setNewRes({ ...newRes, notes: e.target.value })}
                  className="bg-white/5 border-white/10 text-white" rows={2} placeholder="Notas internas..." />
              </div>
              <div className="space-y-1">
                <Label className="text-colibri-beige text-sm">Peticiones especiales</Label>
                <Textarea value={newRes.special_requests} onChange={e => setNewRes({ ...newRes, special_requests: e.target.value })}
                  className="bg-white/5 border-white/10 text-white" rows={2} placeholder="Cumpleaños, silla alta, etc..." />
              </div>
            </div>
            <DialogFooter>
              <Button variant="ghost" onClick={() => setShowCreate(false)} className="text-colibri-beige">Cancelar</Button>
              <Button onClick={handleCreateReservation} disabled={saving} className="bg-colibri-gold text-black hover:bg-colibri-gold/90">
                {saving ? <LoaderCircle className="w-4 h-4 mr-2 animate-spin" /> : <Plus className="w-4 h-4 mr-2" />}
                Crear Reservación
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* ─── Detail Dialog ─────────────────────────────── */}
        <Dialog open={!!showDetail} onOpenChange={() => setShowDetail(null)}>
          <DialogContent className="bg-gray-900 border-white/10 text-white max-w-lg">
            <DialogHeader>
              <DialogTitle className="text-colibri-gold flex items-center gap-2">
                Reservación #{showDetail?.id}
                <Badge variant="outline" className="font-mono text-colibri-gold border-colibri-gold/30">{showDetail?.confirmation_code}</Badge>
              </DialogTitle>
            </DialogHeader>
            {showDetail && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-colibri-beige/60 uppercase">Cliente</p>
                    <p className="text-white font-medium">{showDetail.customer_name}</p>
                  </div>
                  <div>
                    <p className="text-xs text-colibri-beige/60 uppercase">Estado</p>
                    <Badge className={`${STATUS_LABELS[showDetail.status]?.color || ''} border`}>
                      {STATUS_LABELS[showDetail.status]?.label || showDetail.status}
                    </Badge>
                  </div>
                  <div>
                    <p className="text-xs text-colibri-beige/60 uppercase">Teléfono</p>
                    <p className="text-white flex items-center gap-1"><Phone className="w-3 h-3" /> {showDetail.customer_phone}</p>
                  </div>
                  {showDetail.customer_email && (
                    <div>
                      <p className="text-xs text-colibri-beige/60 uppercase">Email</p>
                      <p className="text-white flex items-center gap-1"><Mail className="w-3 h-3" /> {showDetail.customer_email}</p>
                    </div>
                  )}
                  <div>
                    <p className="text-xs text-colibri-beige/60 uppercase">Fecha y Hora</p>
                    <p className="text-white">{formatDate(showDetail.reservation_date)} · {formatTime(showDetail.reservation_time)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-colibri-beige/60 uppercase">Personas</p>
                    <p className="text-white">{showDetail.party_size}</p>
                  </div>
                  <div>
                    <p className="text-xs text-colibri-beige/60 uppercase">Mesa</p>
                    <p className="text-white">{showDetail.table_name || 'Sin asignar'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-colibri-beige/60 uppercase">Fuente</p>
                    <p className="text-white capitalize">{showDetail.source}</p>
                  </div>
                </div>
                {showDetail.notes && (
                  <div>
                    <p className="text-xs text-colibri-beige/60 uppercase">Notas</p>
                    <p className="text-colibri-beige text-sm">{showDetail.notes}</p>
                  </div>
                )}
                {showDetail.special_requests && (
                  <div>
                    <p className="text-xs text-colibri-beige/60 uppercase">Peticiones Especiales</p>
                    <p className="text-colibri-beige text-sm">{showDetail.special_requests}</p>
                  </div>
                )}
                <Separator className="bg-white/10" />
                <div className="flex items-center gap-2 flex-wrap">
                  {showDetail.status === 'pending' && (
                    <Button size="sm" onClick={() => handleStatusChange(showDetail.id, 'confirmed')} className="bg-green-600 hover:bg-green-700 text-white">
                      <CheckCircle2 className="w-4 h-4 mr-1" /> Confirmar
                    </Button>
                  )}
                  {showDetail.status === 'confirmed' && (
                    <Button size="sm" onClick={() => handleStatusChange(showDetail.id, 'seated')} className="bg-blue-600 hover:bg-blue-700 text-white">
                      <Armchair className="w-4 h-4 mr-1" /> Sentar
                    </Button>
                  )}
                  {showDetail.status === 'seated' && (
                    <Button size="sm" onClick={() => handleStatusChange(showDetail.id, 'completed')} className="bg-gray-600 hover:bg-gray-700 text-white">
                      <CheckCircle2 className="w-4 h-4 mr-1" /> Completar
                    </Button>
                  )}
                  {!['cancelled', 'completed', 'no_show'].includes(showDetail.status) && (
                    <>
                      <Button size="sm" variant="outline" onClick={() => handleStatusChange(showDetail.id, 'no_show')} className="border-orange-500/30 text-orange-400 hover:bg-orange-900/20">
                        <AlertTriangle className="w-4 h-4 mr-1" /> No Show
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => handleStatusChange(showDetail.id, 'cancelled')} className="border-red-500/30 text-red-400 hover:bg-red-900/20">
                        <Ban className="w-4 h-4 mr-1" /> Cancelar
                      </Button>
                    </>
                  )}
                  <Button size="sm" variant="ghost" onClick={() => handleDeleteReservation(showDetail.id)} className="text-red-400 hover:text-red-300 ml-auto">
                    <Trash2 className="w-4 h-4 mr-1" /> Eliminar
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* ─── Table Dialog ──────────────────────────────── */}
        <Dialog open={showTableDialog} onOpenChange={setShowTableDialog}>
          <DialogContent className="bg-gray-900 border-white/10 text-white max-w-sm">
            <DialogHeader>
              <DialogTitle className="text-colibri-gold">Agregar Mesa</DialogTitle>
            </DialogHeader>
            <div className="space-y-3">
              <div className="space-y-1">
                <Label className="text-colibri-beige text-sm">Nombre *</Label>
                <Input value={newTable.name} onChange={e => setNewTable({ ...newTable, name: e.target.value })}
                  className="bg-white/5 border-white/10 text-white" placeholder="Ej: Mesa 1, Terraza 3" />
              </div>
              <div className="space-y-1">
                <Label className="text-colibri-beige text-sm">Capacidad</Label>
                <Input type="number" min={1} value={newTable.capacity} onChange={e => setNewTable({ ...newTable, capacity: Number(e.target.value) || 4 })}
                  className="bg-white/5 border-white/10 text-white" />
              </div>
              <div className="space-y-1">
                <Label className="text-colibri-beige text-sm">Zona</Label>
                <Input value={newTable.zone} onChange={e => setNewTable({ ...newTable, zone: e.target.value })}
                  className="bg-white/5 border-white/10 text-white" placeholder="General, Terraza, VIP..." />
              </div>
            </div>
            <DialogFooter>
              <Button variant="ghost" onClick={() => setShowTableDialog(false)} className="text-colibri-beige">Cancelar</Button>
              <Button onClick={handleCreateTable} disabled={saving} className="bg-colibri-gold text-black hover:bg-colibri-gold/90">
                {saving ? <LoaderCircle className="w-4 h-4 mr-2 animate-spin" /> : <Plus className="w-4 h-4 mr-2" />}
                Crear Mesa
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  )
}
