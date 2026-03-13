"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import AdminLayout from "@/components/admin/admin-layout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import {
  Clock, CheckCircle, Truck, AlertCircle, Package, User, Phone, Mail,
  MapPin, ChefHat, RefreshCw, Loader2, Navigation, DollarSign, Eye,
  ArrowRight, Bike, Volume2, VolumeX
} from "lucide-react"

// ── Tipos ──────────────────────────────────────────────────────────────────────
type Order = {
  id: number
  items: any
  total: number
  status: string
  raw_status: string
  created_at: string
  customer_info: any
  delivery_address: any
  payment_method?: string
  notes?: string
  delivery_type?: string
  order_source?: string
}

type Driver = {
  id: number
  name: string
  phone?: string
  vehicle_type?: string
  is_available: boolean
  is_active: boolean
}

// ── Status config ──────────────────────────────────────────────────────────────
const STATUS_MAP: Record<string, string> = {
  pending: "pendiente", pendiente: "pendiente",
  confirmed: "confirmado", confirmado: "confirmado",
  preparing: "preparando", preparando: "preparando",
  processing: "preparando", procesando: "preparando",
  ready: "listo", listo: "listo",
  listo_para_recoger: "listo",
  asignado_repartidor: "asignado", assigned_to_driver: "asignado", asignado: "asignado",
  accepted_by_driver: "aceptado", aceptado: "aceptado",
  en_camino: "en_camino", in_delivery: "en_camino",
  delivered: "entregado", entregado: "entregado",
  cancelled: "cancelado", canceled: "cancelado", cancelado: "cancelado",
}

function normalizeStatus(s: string) {
  return STATUS_MAP[s?.toLowerCase()] || s
}

// Columnas del Kanban
const COLUMNS = [
  { key: "pendiente",   label: "Nuevos",      icon: Clock,      color: "border-amber-500",   bg: "bg-amber-500/10",  badge: "bg-amber-500" },
  { key: "confirmado",  label: "Confirmados",  icon: CheckCircle, color: "border-blue-500",    bg: "bg-blue-500/10",   badge: "bg-blue-500" },
  { key: "preparando",  label: "En Cocina",    icon: ChefHat,    color: "border-yellow-500",  bg: "bg-yellow-500/10", badge: "bg-yellow-500" },
  { key: "listo",       label: "Listos",       icon: Package,    color: "border-green-500",   bg: "bg-green-500/10",  badge: "bg-green-500" },
  { key: "asignado",    label: "Asignados",    icon: Bike,       color: "border-cyan-500",    bg: "bg-cyan-500/10",   badge: "bg-cyan-500" },
  { key: "en_camino",   label: "En Camino",    icon: Truck,      color: "border-purple-500",  bg: "bg-purple-500/10", badge: "bg-purple-500" },
  { key: "entregado",   label: "Entregados",   icon: CheckCircle, color: "border-emerald-500", bg: "bg-emerald-500/10", badge: "bg-emerald-500" },
]

const DELIVERY_STATUSES = ["pendiente", "confirmado", "preparando", "listo", "asignado", "aceptado", "en_camino", "entregado", "cancelado"]

// ── Helpers ────────────────────────────────────────────────────────────────────
function parseJSON(val: any) {
  if (!val) return null
  if (typeof val === "object") return val
  try { return JSON.parse(val) } catch { return null }
}

function formatTime(d: string) {
  return new Date(d).toLocaleTimeString("es-MX", { hour: "2-digit", minute: "2-digit" })
}

function formatCurrency(n: number) {
  return new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN" }).format(n)
}

function minutesAgo(d: string) {
  return Math.floor((Date.now() - new Date(d).getTime()) / 60000)
}

// ── Componente principal ───────────────────────────────────────────────────────
export default function PedidosOnlinePage() {
  const [orders, setOrders] = useState<Order[]>([])
  const [drivers, setDrivers] = useState<Driver[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)
  const [showModal, setShowModal] = useState(false)
  const [updatingStatus, setUpdatingStatus] = useState(false)
  const [selectedDriver, setSelectedDriver] = useState("")
  const [assigningDriver, setAssigningDriver] = useState(false)
  const [soundEnabled, setSoundEnabled] = useState(true)
  const [lastOrderCount, setLastOrderCount] = useState(0)
  const [autoRefresh, setAutoRefresh] = useState(true)
  const audioRef = useRef<AudioContext | null>(null)

  // ── Data fetching ──────────────────────────────────────────────────────────
  const fetchOrders = useCallback(async () => {
    try {
      const res = await fetch("/api/orders-mysql?source=online&limit=200", { credentials: "include" })
      if (!res.ok) return
      const data = await res.json()
      if (!data.success) return

      const normalized = (data.orders || []).map((o: any) => ({
        ...o,
        raw_status: o.status,
        status: normalizeStatus(o.status),
        items: parseJSON(o.items) || [],
        customer_info: parseJSON(o.customer_info) || {},
        delivery_address: o.delivery_address,
      }))

      // Solo pedidos activos de delivery (no cancelados, no de hace más de 24h)
      const oneDayAgo = Date.now() - 86400000
      const filtered = normalized.filter((o: Order) =>
        DELIVERY_STATUSES.includes(o.status) &&
        new Date(o.created_at).getTime() > oneDayAgo
      )

      setOrders(filtered)

      // Sonido para nuevos pedidos
      const pendingCount = filtered.filter((o: Order) => o.status === "pendiente").length
      if (pendingCount > lastOrderCount && soundEnabled && lastOrderCount > 0) {
        playNotificationSound()
      }
      setLastOrderCount(pendingCount)
    } catch (err) {
      console.error("Error fetching online orders:", err)
    } finally {
      setLoading(false)
    }
  }, [lastOrderCount, soundEnabled])

  const fetchDrivers = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/drivers", { credentials: "include" })
      if (!res.ok) return
      const data = await res.json()
      if (data.success) setDrivers(data.drivers || [])
    } catch (err) {
      console.error("Error fetching drivers:", err)
    }
  }, [])

  useEffect(() => {
    fetchOrders()
    fetchDrivers()
  }, [])

  // Auto-refresh cada 10 segundos
  useEffect(() => {
    if (!autoRefresh) return
    const interval = setInterval(() => {
      fetchOrders()
      fetchDrivers()
    }, 10000)
    return () => clearInterval(interval)
  }, [autoRefresh, fetchOrders, fetchDrivers])

  // ── Acciones ───────────────────────────────────────────────────────────────
  const updateStatus = async (orderId: number, newStatus: string) => {
    setUpdatingStatus(true)
    try {
      const res = await fetch(`/api/orders-mysql/${orderId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ status: newStatus }),
      })
      const data = await res.json()
      if (data.success) {
        await fetchOrders()
        if (selectedOrder?.id === orderId) {
          setSelectedOrder(prev => prev ? { ...prev, raw_status: newStatus, status: normalizeStatus(newStatus) } : null)
        }
      }
    } catch (err) {
      console.error("Error updating status:", err)
    } finally {
      setUpdatingStatus(false)
    }
  }

  const assignDriver = async (orderId: number, driverId: string) => {
    if (!driverId) return
    setAssigningDriver(true)
    try {
      const res = await fetch(`/api/orders-mysql/${orderId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ driverId }),
      })
      const data = await res.json()
      if (data.success) {
        setShowModal(false)
        setSelectedDriver("")
        await fetchOrders()
        await fetchDrivers()
      }
    } catch (err) {
      console.error("Error assigning driver:", err)
    } finally {
      setAssigningDriver(false)
    }
  }

  const playNotificationSound = () => {
    try {
      if (!audioRef.current) audioRef.current = new AudioContext()
      const ctx = audioRef.current
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.connect(gain)
      gain.connect(ctx.destination)
      osc.frequency.setValueAtTime(880, ctx.currentTime)
      osc.frequency.setValueAtTime(1100, ctx.currentTime + 0.1)
      gain.gain.setValueAtTime(0.3, ctx.currentTime)
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.5)
      osc.start(ctx.currentTime)
      osc.stop(ctx.currentTime + 0.5)
    } catch {}
  }

  // ── Siguiente estado lógico ────────────────────────────────────────────────
  const getNextAction = (order: Order) => {
    switch (order.status) {
      case "pendiente":
        return { label: "Confirmar", status: "confirmed", color: "bg-blue-600 hover:bg-blue-700" }
      case "confirmado":
        return { label: "A Cocina", status: "preparing", color: "bg-yellow-600 hover:bg-yellow-700" }
      case "preparando":
        return { label: "Listo", status: "ready", color: "bg-green-600 hover:bg-green-700" }
      case "listo":
        return { label: "Asignar Repartidor", status: null, color: "bg-cyan-600 hover:bg-cyan-700" }
      default:
        return null
    }
  }

  // ── Organizar por columnas ──────────────────────────────────────────────────
  const ordersByColumn = COLUMNS.map(col => ({
    ...col,
    orders: orders.filter(o => o.status === col.key || (col.key === "asignado" && o.status === "aceptado")),
  }))

  // ── Render ─────────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-colibri-gold" />
        </div>
      </AdminLayout>
    )
  }

  return (
    <AdminLayout>
      <div className="p-4 space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">Pedidos Online</h1>
            <p className="text-colibri-beige text-sm">
              {orders.length} pedidos activos &middot; Auto-refresh {autoRefresh ? "activo" : "pausado"}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSoundEnabled(!soundEnabled)}
              className="border-colibri-gold/30 text-colibri-beige hover:bg-colibri-green/30"
            >
              {soundEnabled ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setAutoRefresh(!autoRefresh)}
              className={`border-colibri-gold/30 text-colibri-beige hover:bg-colibri-green/30 ${autoRefresh ? "bg-colibri-green/20" : ""}`}
            >
              <RefreshCw className={`h-4 w-4 ${autoRefresh ? "animate-spin" : ""}`} />
            </Button>
            <Button
              size="sm"
              onClick={() => { fetchOrders(); fetchDrivers() }}
              className="bg-colibri-green hover:bg-colibri-green/90 text-white"
            >
              <RefreshCw className="h-4 w-4 mr-1" /> Actualizar
            </Button>
          </div>
        </div>

        {/* Columnas Kanban - scroll horizontal */}
        <div className="flex gap-4 overflow-x-auto pb-4" style={{ minHeight: "calc(100vh - 200px)" }}>
          {ordersByColumn.map(col => (
            <div key={col.key} className="flex-shrink-0 w-72">
              {/* Column header */}
              <div className={`rounded-t-lg border-t-4 ${col.color} bg-slate-900/80 backdrop-blur-xl px-3 py-3 flex items-center justify-between`}>
                <div className="flex items-center gap-2">
                  <col.icon className="h-4 w-4 text-white" />
                  <span className="text-white font-semibold text-sm">{col.label}</span>
                </div>
                <Badge className={`${col.badge} text-white text-xs`}>
                  {col.orders.length}
                </Badge>
              </div>

              {/* Pedidos de esta columna */}
              <div className={`${col.bg} backdrop-blur-xl rounded-b-lg border border-t-0 border-slate-700/50 min-h-[200px] p-2 space-y-2`}>
                {col.orders.length === 0 ? (
                  <p className="text-slate-500 text-xs text-center py-8">Sin pedidos</p>
                ) : (
                  col.orders.map(order => (
                    <OrderCard
                      key={order.id}
                      order={order}
                      onView={() => { setSelectedOrder(order); setShowModal(true) }}
                      onNextAction={(status) => {
                        if (status === null) {
                          // Abrir modal para asignar repartidor
                          setSelectedOrder(order)
                          setShowModal(true)
                        } else {
                          updateStatus(order.id, status)
                        }
                      }}
                      nextAction={getNextAction(order)}
                      updatingStatus={updatingStatus}
                    />
                  ))
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Modal de detalle */}
      <OrderDetailModal
        open={showModal}
        onClose={() => { setShowModal(false); setSelectedOrder(null); setSelectedDriver("") }}
        order={selectedOrder}
        drivers={drivers}
        selectedDriver={selectedDriver}
        setSelectedDriver={setSelectedDriver}
        assigningDriver={assigningDriver}
        assignDriver={assignDriver}
        updateStatus={updateStatus}
        updatingStatus={updatingStatus}
      />
    </AdminLayout>
  )
}

// ── Order Card (dentro de cada columna) ──────────────────────────────────────
function OrderCard({
  order,
  onView,
  onNextAction,
  nextAction,
  updatingStatus,
}: {
  order: Order
  onView: () => void
  onNextAction: (status: string | null) => void
  nextAction: { label: string; status: string | null; color: string } | null
  updatingStatus: boolean
}) {
  const info = order.customer_info || {}
  const items = Array.isArray(order.items) ? order.items : []
  const mins = minutesAgo(order.created_at)

  return (
    <div className="bg-slate-900/90 rounded-lg border border-slate-700/50 p-3 space-y-2 hover:border-colibri-gold/40 transition-colors">
      {/* Header del pedido */}
      <div className="flex items-center justify-between">
        <span className="text-white font-bold text-sm">#{order.id}</span>
        <div className="flex items-center gap-1">
          <Clock className="h-3 w-3 text-slate-400" />
          <span className={`text-xs ${mins > 30 ? "text-red-400 font-bold" : mins > 15 ? "text-yellow-400" : "text-slate-400"}`}>
            {mins}m
          </span>
        </div>
      </div>

      {/* Cliente */}
      <div className="flex items-center gap-2">
        <User className="h-3 w-3 text-colibri-gold" />
        <span className="text-colibri-beige text-xs truncate">
          {info.name || info.nombre || "Cliente"}
        </span>
      </div>

      {/* Items preview */}
      <div className="text-xs text-slate-400">
        {items.slice(0, 2).map((item: any, i: number) => (
          <p key={i} className="truncate">{item.quantity}x {item.name}</p>
        ))}
        {items.length > 2 && <p className="text-slate-500">+{items.length - 2} más</p>}
      </div>

      {/* Total */}
      <div className="flex items-center justify-between">
        <span className="text-colibri-gold font-bold text-sm">{formatCurrency(Number(order.total))}</span>
        <span className="text-xs text-slate-500">
          {order.delivery_type === "pickup" ? "🏪 Recoger" : "🚚 Delivery"}
        </span>
      </div>

      {/* Acciones */}
      <div className="flex gap-1 pt-1">
        <button
          onClick={onView}
          className="flex-1 text-xs bg-slate-800 hover:bg-slate-700 text-colibri-beige py-1.5 rounded flex items-center justify-center gap-1 transition-colors"
        >
          <Eye className="h-3 w-3" /> Ver
        </button>
        {nextAction && (
          <button
            onClick={() => onNextAction(nextAction.status)}
            disabled={updatingStatus}
            className={`flex-1 text-xs ${nextAction.color} text-white py-1.5 rounded flex items-center justify-center gap-1 transition-colors disabled:opacity-50`}
          >
            <ArrowRight className="h-3 w-3" /> {nextAction.label}
          </button>
        )}
      </div>
    </div>
  )
}

// ── Modal de detalle del pedido ──────────────────────────────────────────────
function OrderDetailModal({
  open,
  onClose,
  order,
  drivers,
  selectedDriver,
  setSelectedDriver,
  assigningDriver,
  assignDriver,
  updateStatus,
  updatingStatus,
}: {
  open: boolean
  onClose: () => void
  order: Order | null
  drivers: Driver[]
  selectedDriver: string
  setSelectedDriver: (v: string) => void
  assigningDriver: boolean
  assignDriver: (orderId: number, driverId: string) => void
  updateStatus: (orderId: number, status: string) => void
  updatingStatus: boolean
}) {
  if (!order) return null

  const info = order.customer_info || {}
  const items = Array.isArray(order.items) ? order.items : []

  let addressDisplay = "Sin dirección"
  if (order.delivery_address) {
    try {
      const addr = typeof order.delivery_address === "string" ? JSON.parse(order.delivery_address) : order.delivery_address
      addressDisplay = addr.street || addr.address || addr.direccion || JSON.stringify(addr)
    } catch {
      addressDisplay = order.delivery_address
    }
  }

  const showAssignDriver = ["listo", "asignado", "aceptado"].includes(order.status)
  const statusActions = [
    { label: "Confirmar", status: "confirmed", show: order.status === "pendiente", color: "bg-blue-600 hover:bg-blue-700" },
    { label: "A Cocina", status: "preparing", show: order.status === "confirmado", color: "bg-yellow-600 hover:bg-yellow-700" },
    { label: "Listo", status: "ready", show: order.status === "preparando", color: "bg-green-600 hover:bg-green-700" },
    { label: "Entregado", status: "delivered", show: order.status === "en_camino", color: "bg-emerald-600 hover:bg-emerald-700" },
    { label: "Cancelar", status: "cancelled", show: !["entregado", "cancelado"].includes(order.status), color: "bg-red-600 hover:bg-red-700" },
  ]

  return (
    <Dialog open={open} onOpenChange={() => onClose()}>
      <DialogContent className="max-w-lg bg-slate-900 border-colibri-gold/30 max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-white flex items-center justify-between">
            <span>Pedido #{order.id}</span>
            <Badge className="bg-colibri-wine text-white">{order.status}</Badge>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Tiempo */}
          <div className="flex items-center gap-2 text-colibri-beige text-sm">
            <Clock className="h-4 w-4" />
            {formatTime(order.created_at)} &middot; hace {minutesAgo(order.created_at)} min
          </div>

          {/* Cliente */}
          <div className="bg-slate-800/60 rounded-lg p-3 border border-slate-700/50 space-y-1">
            <h3 className="text-white font-semibold text-sm flex items-center gap-2">
              <User className="h-4 w-4 text-colibri-gold" /> Cliente
            </h3>
            <p className="text-colibri-beige">{info.name || info.nombre || "N/A"}</p>
            {(info.phone || info.telefono) && (
              <p className="text-colibri-beige text-sm flex items-center gap-1">
                <Phone className="h-3 w-3" /> {info.phone || info.telefono}
              </p>
            )}
            {(info.email) && (
              <p className="text-colibri-beige text-sm flex items-center gap-1">
                <Mail className="h-3 w-3" /> {info.email}
              </p>
            )}
          </div>

          {/* Dirección */}
          {order.delivery_type !== "pickup" && (
            <div className="bg-slate-800/60 rounded-lg p-3 border border-slate-700/50">
              <h3 className="text-white font-semibold text-sm flex items-center gap-2">
                <MapPin className="h-4 w-4 text-red-400" /> Dirección de Entrega
              </h3>
              <p className="text-colibri-beige text-sm mt-1">{addressDisplay}</p>
              {order.notes && <p className="text-slate-400 text-xs mt-1">Notas: {order.notes}</p>}
            </div>
          )}

          {/* Productos */}
          <div className="bg-slate-800/60 rounded-lg p-3 border border-slate-700/50">
            <h3 className="text-white font-semibold text-sm flex items-center gap-2 mb-2">
              <Package className="h-4 w-4 text-colibri-gold" /> Productos
            </h3>
            {items.length > 0 ? items.map((item: any, i: number) => (
              <div key={i} className="flex justify-between text-colibri-beige text-sm py-1 border-b border-slate-700/30 last:border-0">
                <span>{item.quantity}x {item.name}</span>
                <span className="text-colibri-gold font-semibold">{formatCurrency(Number(item.price) * item.quantity)}</span>
              </div>
            )) : (
              <p className="text-slate-500 text-sm">Sin productos</p>
            )}
            <div className="flex justify-between font-bold text-white mt-2 pt-2 border-t border-colibri-gold/30">
              <span>Total</span>
              <span className="text-colibri-gold text-lg">{formatCurrency(Number(order.total))}</span>
            </div>
          </div>

          {/* Método de pago */}
          <div className="flex items-center gap-2 text-sm text-colibri-beige">
            <DollarSign className="h-4 w-4 text-colibri-gold" />
            {order.payment_method === "mercadopago" ? "💳 Tarjeta (Mercado Pago)" : "💵 Efectivo"}
          </div>

          {/* Cambiar estado */}
          <div className="space-y-2">
            <h3 className="text-white font-semibold text-sm">Cambiar Estado</h3>
            <div className="flex flex-wrap gap-2">
              {statusActions.filter(a => a.show).map(action => (
                <button
                  key={action.status}
                  onClick={() => {
                    if (action.status === "cancelled" && !confirm("¿Cancelar este pedido?")) return
                    updateStatus(order.id, action.status)
                  }}
                  disabled={updatingStatus}
                  className={`${action.color} text-white text-xs font-medium py-2 px-3 rounded-lg transition-colors disabled:opacity-50`}
                >
                  {action.label}
                </button>
              ))}
            </div>
          </div>

          {/* Asignar repartidor */}
          {showAssignDriver && (
            <div className="bg-gradient-to-r from-colibri-green/20 to-colibri-wine/20 rounded-lg p-3 border border-colibri-gold/30 space-y-3">
              <h3 className="text-white font-semibold text-sm flex items-center gap-2">
                <Truck className="h-4 w-4 text-colibri-gold" /> Asignar Repartidor
              </h3>
              <select
                value={selectedDriver}
                onChange={e => setSelectedDriver(e.target.value)}
                disabled={assigningDriver}
                className="w-full bg-slate-900/80 border border-colibri-gold/30 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-colibri-gold disabled:opacity-50"
              >
                <option value="">Seleccionar repartidor...</option>
                {drivers.map(d => (
                  <option key={d.id} value={d.id}>
                    {d.name} {d.phone ? `(${d.phone})` : ""}
                    {d.vehicle_type ? ` - ${d.vehicle_type}` : ""}
                    {!d.is_available ? " ⛔" : " ✅"}
                  </option>
                ))}
              </select>
              <Button
                onClick={() => assignDriver(order.id, selectedDriver)}
                disabled={assigningDriver || !selectedDriver}
                className="w-full bg-colibri-green hover:bg-colibri-green/90 text-white"
              >
                {assigningDriver ? (
                  <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Asignando...</>
                ) : (
                  <><Truck className="h-4 w-4 mr-2" /> Asignar Repartidor</>
                )}
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
