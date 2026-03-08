'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { Clock, ChefHat, CheckCircle, Flame, UtensilsCrossed, Truck, Monitor, QrCode, Users, Volume2, VolumeX, Maximize, Minimize } from 'lucide-react'

interface OrderItem {
  id: number
  name: string
  quantity: number
  price: number
  modifiers?: Array<{ group: string; modifier: string; price: number }>
}

interface KitchenOrder {
  id: number
  status: string
  items: OrderItem[]
  notes: string | null
  order_source: string | null
  waiter_order: number | boolean
  created_at: string
  updated_at: string
  table_name: string | null
  customer_name: string
  delivery_type: string | null
}

type FilterType = 'all' | 'dine-in' | 'delivery' | 'kiosk' | 'online'

const STATUS_FLOW: Record<string, string> = {
  pending: 'confirmed',
  pendiente: 'confirmed',
  confirmed: 'preparing',
  confirmado: 'preparing',
  preparing: 'ready',
  preparando: 'ready',
}

const STATUS_LABELS: Record<string, string> = {
  pending: 'Nuevo',
  pendiente: 'Nuevo',
  confirmed: 'Confirmado',
  confirmado: 'Confirmado',
  preparing: 'Preparando',
  preparando: 'Preparando',
}

function getOrderAge(createdAt: string): number {
  return Math.floor((Date.now() - new Date(createdAt).getTime()) / 60000)
}

function getTimerColor(minutes: number): string {
  if (minutes < 10) return 'text-green-400'
  if (minutes < 20) return 'text-yellow-400'
  return 'text-red-400'
}

function getCardBorder(minutes: number): string {
  if (minutes < 10) return 'border-green-500/40'
  if (minutes < 20) return 'border-yellow-500/40'
  return 'border-red-500/60'
}

function getSourceIcon(order: KitchenOrder) {
  if (order.waiter_order) return <Users className="w-4 h-4" />
  if (order.delivery_type === 'delivery') return <Truck className="w-4 h-4" />
  switch (order.order_source) {
    case 'kiosk': return <Monitor className="w-4 h-4" />
    case 'qr': return <QrCode className="w-4 h-4" />
    default: return <UtensilsCrossed className="w-4 h-4" />
  }
}

function getSourceLabel(order: KitchenOrder): string {
  if (order.waiter_order) return order.table_name || 'Mesa'
  if (order.delivery_type === 'delivery') return 'Delivery'
  switch (order.order_source) {
    case 'kiosk': return 'Kiosko'
    case 'qr': return 'QR'
    case 'caja': return 'Caja'
    default: return 'Online'
  }
}

function normalizeStatus(status: string): string {
  const map: Record<string, string> = {
    pendiente: 'pending',
    confirmado: 'confirmed',
    preparando: 'preparing',
  }
  return map[status] || status
}

export default function KitchenPage() {
  const [orders, setOrders] = useState<KitchenOrder[]>([])
  const [filter, setFilter] = useState<FilterType>('all')
  const [loading, setLoading] = useState(true)
  const [soundEnabled, setSoundEnabled] = useState(true)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [updatingId, setUpdatingId] = useState<number | null>(null)
  const [, setTick] = useState(0) // Forces re-render every minute for timers
  const prevOrderIdsRef = useRef<Set<number>>(new Set())
  const prevDataRef = useRef<string>('')
  const initialLoadRef = useRef(true)
  const busyRef = useRef(false)

  const fetchOrders = useCallback(async () => {
    // No re-fetchar si estamos en medio de un update
    if (busyRef.current) return
    try {
      const res = await fetch('/api/kitchen/orders')
      const data = await res.json()
      if (data.success) {
        const newOrders: KitchenOrder[] = data.orders

        // Solo actualizar state si los datos cambiaron (evita re-renders innecesarios)
        const fingerprint = newOrders.map(o => `${o.id}:${o.status}`).join(',')
        if (fingerprint === prevDataRef.current) return
        prevDataRef.current = fingerprint

        // Detectar pedidos nuevos para sonido
        if (!initialLoadRef.current && soundEnabled) {
          const prevIds = prevOrderIdsRef.current
          const hasNew = newOrders.some(o => !prevIds.has(o.id))
          if (hasNew) playAlert()
        }
        initialLoadRef.current = false
        prevOrderIdsRef.current = new Set(newOrders.map(o => o.id))
        setOrders(newOrders)
      }
    } catch (err) {
      console.error('Error fetching kitchen orders:', err)
    } finally {
      setLoading(false)
    }
  }, [soundEnabled])

  useEffect(() => {
    fetchOrders()
    const interval = setInterval(fetchOrders, 5000)
    return () => clearInterval(interval)
  }, [fetchOrders])

  // Timer tick every 30s to update time displays
  useEffect(() => {
    const timer = setInterval(() => setTick(t => t + 1), 30000)
    return () => clearInterval(timer)
  }, [])

  function playAlert() {
    try {
      // Use Web Audio API to generate a bell sound
      const ctx = new AudioContext()
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.connect(gain)
      gain.connect(ctx.destination)
      osc.type = 'sine'
      osc.frequency.setValueAtTime(830, ctx.currentTime) // Bell tone
      osc.frequency.setValueAtTime(660, ctx.currentTime + 0.15)
      osc.frequency.setValueAtTime(830, ctx.currentTime + 0.3)
      gain.gain.setValueAtTime(0.5, ctx.currentTime)
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.6)
      osc.start(ctx.currentTime)
      osc.stop(ctx.currentTime + 0.6)
    } catch {}
  }

  async function updateStatus(orderId: number, newStatus: string) {
    if (busyRef.current) return // Evitar doble click
    busyRef.current = true
    setUpdatingId(orderId)
    try {
      const res = await fetch(`/api/kitchen/orders/${orderId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      })
      const data = await res.json()
      if (res.ok && data.success) {
        // Actualizar localmente primero para feedback instantáneo
        if (newStatus === 'ready') {
          setOrders(prev => prev.filter(o => o.id !== orderId))
          prevDataRef.current = '' // Forzar sync en próximo poll
        } else {
          setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: newStatus } : o))
          prevDataRef.current = '' // Forzar sync en próximo poll
        }
      }
    } catch (err) {
      console.error('Error updating order:', err)
    } finally {
      busyRef.current = false
      setUpdatingId(null)
    }
  }

  function toggleFullscreen() {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {})
      setIsFullscreen(true)
    } else {
      document.exitFullscreen().catch(() => {})
      setIsFullscreen(false)
    }
  }

  // Apply filter
  const filteredOrders = orders.filter(order => {
    if (filter === 'all') return true
    if (filter === 'dine-in') return !!order.waiter_order
    if (filter === 'delivery') return order.delivery_type === 'delivery'
    if (filter === 'kiosk') return order.order_source === 'kiosk'
    if (filter === 'online') return order.order_source === 'online' && !order.waiter_order && order.delivery_type !== 'delivery'
    return true
  })

  // Group by normalized status
  const grouped = {
    pending: filteredOrders.filter(o => normalizeStatus(o.status) === 'pending'),
    confirmed: filteredOrders.filter(o => normalizeStatus(o.status) === 'confirmed'),
    preparing: filteredOrders.filter(o => normalizeStatus(o.status) === 'preparing'),
  }

  const filterButtons: { key: FilterType; label: string; icon: React.ReactNode }[] = [
    { key: 'all', label: 'Todos', icon: <ChefHat className="w-4 h-4" /> },
    { key: 'dine-in', label: 'Mesa', icon: <Users className="w-4 h-4" /> },
    { key: 'delivery', label: 'Delivery', icon: <Truck className="w-4 h-4" /> },
    { key: 'kiosk', label: 'Kiosko', icon: <Monitor className="w-4 h-4" /> },
    { key: 'online', label: 'Online', icon: <UtensilsCrossed className="w-4 h-4" /> },
  ]

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="text-center">
          <ChefHat className="w-16 h-16 text-orange-500 animate-bounce mx-auto mb-4" />
          <p className="text-white text-xl">Cargando cocina...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      {/* Header */}
      <header className="bg-gray-900 border-b border-gray-800 px-4 py-3 flex items-center justify-between sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <Flame className="w-8 h-8 text-orange-500" />
          <h1 className="text-2xl font-bold">Cocina</h1>
          <span className="bg-orange-500/20 text-orange-400 px-3 py-1 rounded-full text-sm font-medium">
            {filteredOrders.length} pedido{filteredOrders.length !== 1 ? 's' : ''}
          </span>
        </div>

        <div className="flex items-center gap-2">
          {/* Filters */}
          <div className="hidden md:flex items-center gap-1 bg-gray-800 rounded-lg p-1">
            {filterButtons.map(fb => (
              <button
                key={fb.key}
                onClick={() => setFilter(fb.key)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                  filter === fb.key
                    ? 'bg-orange-500 text-white'
                    : 'text-gray-400 hover:text-white hover:bg-gray-700'
                }`}
              >
                {fb.icon}
                {fb.label}
              </button>
            ))}
          </div>

          {/* Sound toggle */}
          <button
            onClick={() => setSoundEnabled(!soundEnabled)}
            className={`p-2 rounded-lg transition-colors ${soundEnabled ? 'bg-green-500/20 text-green-400' : 'bg-gray-800 text-gray-500'}`}
            title={soundEnabled ? 'Sonido activado' : 'Sonido desactivado'}
          >
            {soundEnabled ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
          </button>

          {/* Fullscreen */}
          <button
            onClick={toggleFullscreen}
            className="p-2 rounded-lg bg-gray-800 text-gray-400 hover:text-white transition-colors"
            title={isFullscreen ? 'Salir de pantalla completa' : 'Pantalla completa'}
          >
            {isFullscreen ? <Minimize className="w-5 h-5" /> : <Maximize className="w-5 h-5" />}
          </button>
        </div>
      </header>

      {/* Mobile filters */}
      <div className="md:hidden flex items-center gap-1 bg-gray-900 px-4 py-2 overflow-x-auto">
        {filterButtons.map(fb => (
          <button
            key={fb.key}
            onClick={() => setFilter(fb.key)}
            className={`flex items-center gap-1 px-3 py-1.5 rounded-md text-sm whitespace-nowrap ${
              filter === fb.key
                ? 'bg-orange-500 text-white'
                : 'bg-gray-800 text-gray-400'
            }`}
          >
            {fb.icon}
            {fb.label}
          </button>
        ))}
      </div>

      {/* Columns */}
      {filteredOrders.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-[70vh] text-gray-500">
          <ChefHat className="w-24 h-24 mb-4 opacity-30" />
          <p className="text-2xl font-medium">Sin pedidos pendientes</p>
          <p className="text-sm mt-2">Los nuevos pedidos aparecerán aquí automáticamente</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-0 h-[calc(100vh-64px)]">
          {/* Column: Nuevos */}
          <KitchenColumn
            title="Nuevos"
            count={grouped.pending.length}
            color="blue"
            orders={grouped.pending}
            actionLabel="Confirmar"
            onAction={(id) => updateStatus(id, 'confirmed')}
            updatingId={updatingId}
          />
          {/* Column: Confirmados */}
          <KitchenColumn
            title="Confirmados"
            count={grouped.confirmed.length}
            color="yellow"
            orders={grouped.confirmed}
            actionLabel="Preparar"
            onAction={(id) => updateStatus(id, 'preparing')}
            updatingId={updatingId}
          />
          {/* Column: Preparando */}
          <KitchenColumn
            title="Preparando"
            count={grouped.preparing.length}
            color="orange"
            orders={grouped.preparing}
            actionLabel="¡Listo!"
            onAction={(id) => updateStatus(id, 'ready')}
            updatingId={updatingId}
            isReady
          />
        </div>
      )}
    </div>
  )
}

// ─── Column Component ──────────────────────────────────

interface KitchenColumnProps {
  title: string
  count: number
  color: 'blue' | 'yellow' | 'orange'
  orders: KitchenOrder[]
  actionLabel: string
  onAction: (orderId: number) => void
  updatingId: number | null
  isReady?: boolean
}

const COLUMN_COLORS = {
  blue: { bg: 'bg-blue-500/10', header: 'bg-blue-500/20 text-blue-400', badge: 'bg-blue-500' },
  yellow: { bg: 'bg-yellow-500/10', header: 'bg-yellow-500/20 text-yellow-400', badge: 'bg-yellow-500' },
  orange: { bg: 'bg-orange-500/10', header: 'bg-orange-500/20 text-orange-400', badge: 'bg-orange-500' },
}

function KitchenColumn({ title, count, color, orders, actionLabel, onAction, updatingId, isReady }: KitchenColumnProps) {
  const colors = COLUMN_COLORS[color]

  return (
    <div className={`${colors.bg} border-r border-gray-800 flex flex-col`}>
      <div className={`${colors.header} px-4 py-3 flex items-center justify-between`}>
        <h2 className="text-lg font-bold">{title}</h2>
        <span className={`${colors.badge} text-white text-sm font-bold px-2.5 py-0.5 rounded-full`}>
          {count}
        </span>
      </div>
      <div className="flex-1 overflow-y-auto p-3 space-y-3">
        {orders.map(order => (
          <OrderCard
            key={order.id}
            order={order}
            actionLabel={actionLabel}
            onAction={() => onAction(order.id)}
            isUpdating={updatingId === order.id}
            isReady={isReady}
          />
        ))}
      </div>
    </div>
  )
}

// ─── Order Card Component ──────────────────────────────

interface OrderCardProps {
  order: KitchenOrder
  actionLabel: string
  onAction: () => void
  isUpdating?: boolean
  isReady?: boolean
}

function OrderCard({ order, actionLabel, onAction, isUpdating, isReady }: OrderCardProps) {
  const age = getOrderAge(order.created_at)
  const timerColor = getTimerColor(age)
  const borderColor = getCardBorder(age)

  return (
    <div className={`bg-gray-900 rounded-xl border-2 ${borderColor} overflow-hidden transition-all`}>
      {/* Card Header */}
      <div className="flex items-center justify-between px-4 py-2.5 bg-gray-800/50">
        <div className="flex items-center gap-2">
          <span className="text-lg font-bold text-white">#{order.id}</span>
          <span className="flex items-center gap-1 bg-gray-700 text-gray-300 px-2 py-0.5 rounded text-xs font-medium">
            {getSourceIcon(order)}
            {getSourceLabel(order)}
          </span>
        </div>
        <div className={`flex items-center gap-1 ${timerColor} font-mono font-bold text-sm`}>
          <Clock className="w-3.5 h-3.5" />
          {age}m
        </div>
      </div>

      {/* Items */}
      <div className="px-4 py-3 space-y-1.5">
        {order.items.map((item, idx) => (
          <div key={idx} className="flex items-start gap-2">
            <span className="bg-gray-700 text-white font-bold text-sm min-w-[28px] h-7 flex items-center justify-center rounded">
              {item.quantity}x
            </span>
            <div className="flex-1">
              <span className="text-white text-sm font-medium">{item.name}</span>
              {item.modifiers && item.modifiers.length > 0 && (
                <div className="mt-0.5">
                  {item.modifiers.map((mod, midx) => (
                    <span key={midx} className="text-xs text-orange-400 block">
                      + {mod.modifier}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Notes */}
      {order.notes && (
        <div className="px-4 pb-2">
          <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg px-3 py-1.5 text-yellow-300 text-xs">
            📝 {order.notes}
          </div>
        </div>
      )}

      {/* Customer */}
      {order.customer_name && order.customer_name !== 'Cliente' && (
        <div className="px-4 pb-2">
          <span className="text-xs text-gray-500">👤 {order.customer_name}</span>
        </div>
      )}

      {/* Action Button */}
      <div className="px-4 pb-4 pt-1">
        <button
          onClick={onAction}
          disabled={isUpdating}
          className={`w-full py-3 rounded-lg font-bold text-sm transition-all active:scale-95 disabled:opacity-50 disabled:cursor-wait ${
            isReady
              ? 'bg-green-500 hover:bg-green-400 text-white shadow-lg shadow-green-500/30'
              : 'bg-gray-700 hover:bg-gray-600 text-white'
          }`}
        >
          {isUpdating ? 'Actualizando...' : <>{isReady && <CheckCircle className="w-4 h-4 inline mr-2" />}{actionLabel}</>}
        </button>
      </div>
    </div>
  )
}
