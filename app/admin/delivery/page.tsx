"use client"

import { ChangeEvent, FormEvent, useEffect, useMemo, useState } from "react"
import Link from "next/link"
import AdminLayout from "@/components/admin/admin-layout"
import { useToast } from "@/hooks/use-notifications"
import {
  User,
  Phone,
  Mail,
  Star,
  CheckCircle,
  Loader2,
  RefreshCw,
  XCircle,
  Eye,
} from "lucide-react"

interface DeliveryDriver {
  id: number
  name: string
  phone: string
  email?: string | null
  is_active: number | boolean
  is_available: number | boolean
  current_order_id?: number | null
  updated_at?: string | null
  rating?: number | null
}

interface DeliveryAssignment {
  id: number
  order_id: number
  driver_id: number
  status: string
  assigned_at: string
  estimated_distance?: number | null
  estimated_duration?: number | null
  driver_name?: string | null
  driver_phone?: string | null
  total: number
  customer_info?: Record<string, any> | null
  delivery_address?: Record<string, any> | null
  start_location?: Record<string, any> | null
  delivery_location?: Record<string, any> | null
  order_status?: string | null
  completed_at?: string | null
}

interface OrderReady {
  id: number
  status: string
  customer_info?: Record<string, any> | null
  delivery_address?: Record<string, any> | null
  delivery_type?: string | null
  created_at: string
}

export default function AdminDeliveryPage() {
  const [drivers, setDrivers] = useState<DeliveryDriver[]>([])
  const [assignments, setAssignments] = useState<DeliveryAssignment[]>([])
  const [ordersReady, setOrdersReady] = useState<OrderReady[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string>("")
  const [showNewDriverForm, setShowNewDriverForm] = useState(false)
  const [refreshing, setRefreshing] = useState(false)
  const [newDriver, setNewDriver] = useState({ name: "", phone: "", email: "" })
  const toast = useToast()

  useEffect(() => {
    void loadData()
  }, [])

  const loadData = async () => {
    try {
      setLoading(true)
      setError("")

      const [driversRes, assignmentsRes, ordersRes] = await Promise.all([
        fetch(`/api/delivery/drivers`, { credentials: "include" }),
        fetch(`/api/delivery/assignments`, { credentials: "include" }),
        fetch(`/api/orders-mysql?status=listo_para_recoger`, { credentials: "include" }),
      ])

      if (!driversRes.ok) {
        throw new Error("No se pudieron obtener los repartidores")
      }
      const driversData = await driversRes.json()
      if (!driversData.success) {
        throw new Error(driversData.message || "Error al cargar repartidores")
      }

      if (!assignmentsRes.ok) {
        throw new Error("No se pudieron obtener las asignaciones")
      }
      const assignmentsData = await assignmentsRes.json()
      if (!assignmentsData.success) {
        throw new Error(assignmentsData.message || "Error al cargar asignaciones")
      }

      if (!ordersRes.ok) {
        throw new Error("No se pudieron obtener los pedidos listos para asignar")
      }
      const ordersData = await ordersRes.json()
      if (!ordersData.success) {
        throw new Error(ordersData.error || "Error al cargar pedidos listos para asignar")
      }

      setDrivers(driversData.drivers || [])
      setAssignments(assignmentsData.assignments || [])
      setOrdersReady(ordersData.orders || [])
    } catch (err: any) {
      console.error("Error al cargar datos de delivery:", err)
      setError(err.message || "Error al cargar datos de delivery")
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  const handleRefresh = async () => {
    try {
      setRefreshing(true)
      await loadData()
    } finally {
      setRefreshing(false)
    }
  }

  const handleNewDriverChange = (event: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = event.target
    setNewDriver((prev) => ({ ...prev, [name]: value }))
  }

  const handleNewDriverSubmit = async (event: FormEvent) => {
    event.preventDefault()
    try {
      const response = await fetch(`/api/delivery/drivers`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          name: newDriver.name,
          phone: newDriver.phone,
          email: newDriver.email,
        }),
      })

      const data = await response.json()

      if (!response.ok || !data.success) {
        throw new Error(data.message || data.error || "No se pudo crear el repartidor")
      }

      toast.success("Repartidor creado", "El repartidor se creó correctamente")
      setNewDriver({ name: "", phone: "", email: "" })
      setShowNewDriverForm(false)
      await loadData()
    } catch (err: any) {
      console.error("Error al crear repartidor:", err)
      toast.error("Error", err.message || "No se pudo crear el repartidor")
    }
  }

  const toggleDriverStatus = async (driverId: number, isActive: boolean) => {
    try {
      const response = await fetch(`/api/delivery/drivers`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          driverId,
          isActive: !isActive,
        }),
      })

      const data = await response.json()

      if (!response.ok || !data.success) {
        throw new Error(data.message || data.error || "No se pudo actualizar el repartidor")
      }

      toast.success("Repartidor actualizado", data.message || "Estado actualizado")
      await loadData()
    } catch (err: any) {
      console.error("Error al actualizar repartidor:", err)
      toast.error("Error", err.message || "No se pudo actualizar el repartidor")
    }
  }

  const assignDriverToOrder = async (order: OrderReady, driverId: number) => {
    try {
      const customerInfo = (order.customer_info ?? {}) as Record<string, any>
      const deliveryAddress = (order.delivery_address ?? {}) as Record<string, any>
      const deliveryLocation =
        deliveryAddress.coordinates || customerInfo.deliveryLocation || customerInfo.coordinates || null

      const response = await fetch(`/api/delivery/assignments`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          order_id: order.id,
          driver_id: driverId,
          delivery_location: deliveryLocation,
        }),
      })

      const data = await response.json()

      if (!response.ok || !data.success) {
        throw new Error(data.message || data.error || "No se pudo asignar el repartidor")
      }

      toast.success("Repartidor asignado", data.message || "El repartidor fue asignado correctamente")
      await loadData()
    } catch (err: any) {
      console.error("Error al asignar repartidor:", err)
      toast.error("Error", err.message || "No se pudo asignar el repartidor")
    }
  }

  const cancelAssignment = async (assignmentId: number) => {
    try {
      const response = await fetch(`/api/delivery/assignments`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({ assignmentId, action: "cancel" }),
      })

      const data = await response.json()

      if (!response.ok || !data.success) {
        throw new Error(data.message || data.error || "No se pudo cancelar la asignación")
      }

      toast.success("Asignación cancelada", data.message || "La asignación fue cancelada")
      await loadData()
    } catch (err: any) {
      console.error("Error al cancelar asignación:", err)
      toast.error("Error", err.message || "No se pudo cancelar la asignación")
    }
  }

  const completeAssignment = async (assignmentId: number) => {
    try {
      const response = await fetch(`/api/delivery/assignments`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({ assignmentId, action: "complete" }),
      })

      const data = await response.json()

      if (!response.ok || !data.success) {
        throw new Error(data.message || data.error || "No se pudo completar la asignación")
      }

      toast.success("Entrega completada", data.message || "La entrega fue marcada como completada")
      await loadData()
    } catch (err: any) {
      console.error("Error al completar asignación:", err)
      toast.error("Error", err.message || "No se pudo completar la asignación")
    }
  }

  const activeAssignments = useMemo(
    () => assignments.filter((assignment) => !["completed", "cancelled"].includes(assignment.status)),
    [assignments],
  )

  const completedAssignments = useMemo(
    () => assignments.filter((assignment) => assignment.status === "completed"),
    [assignments],
  )

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex h-64 items-center justify-center">
          <div className="flex items-center gap-3 text-purple-200">
            <Loader2 className="h-6 w-6 animate-spin" />
            <span>Cargando datos de delivery…</span>
          </div>
        </div>
      </AdminLayout>
    )
  }

  return (
    <AdminLayout>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-white">Gestión de Reparto</h1>
          <p className="text-purple-300">Administra repartidores, asignaciones y pedidos listos para entrega.</p>
        </div>
        <button
          onClick={handleRefresh}
          disabled={refreshing}
          className="inline-flex items-center gap-2 rounded-md border border-purple-500 px-4 py-2 text-sm font-medium text-purple-100 transition-colors hover:bg-purple-600/40 disabled:opacity-50"
        >
          <RefreshCw className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
          Actualizar
        </button>
      </div>

      {error && <div className="mb-6 rounded-lg border border-red-500/60 bg-red-500/10 px-4 py-3 text-red-200">{error}</div>}

      {/* Panel de repartidores */}
      <section className="mb-8 rounded-2xl border border-purple-500/40 bg-gradient-to-br from-purple-900/70 to-purple-800/40 text-white shadow-xl backdrop-blur">
        <header className="flex items-center justify-between border-b border-purple-600/40 px-6 py-5">
          <h2 className="text-xl font-semibold">Repartidores Activos</h2>
          <button
            onClick={() => setShowNewDriverForm((prev) => !prev)}
            className="rounded-md bg-purple-500 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-purple-600"
          >
            {showNewDriverForm ? "Cancelar" : "Nuevo Repartidor"}
          </button>
        </header>

        {showNewDriverForm && (
          <div className="border-b border-purple-600/40 px-6 py-5">
            <form onSubmit={handleNewDriverSubmit} className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <label className="text-sm">
                <span className="mb-2 block text-purple-200">Nombre completo</span>
                <input
                  type="text"
                  name="name"
                  value={newDriver.name}
                  onChange={handleNewDriverChange}
                  required
                  className="w-full rounded-md border border-purple-400/60 bg-white/90 px-3 py-2 text-sm text-gray-900 focus:border-purple-500 focus:outline-none"
                />
              </label>
              <label className="text-sm">
                <span className="mb-2 block text-purple-200">Teléfono</span>
                <input
                  type="tel"
                  name="phone"
                  value={newDriver.phone}
                  onChange={handleNewDriverChange}
                  required
                  className="w-full rounded-md border border-purple-400/60 bg-white/90 px-3 py-2 text-sm text-gray-900 focus:border-purple-500 focus:outline-none"
                />
              </label>
              <label className="text-sm">
                <span className="mb-2 block text-purple-200">Correo electrónico</span>
                <input
                  type="email"
                  name="email"
                  value={newDriver.email}
                  onChange={handleNewDriverChange}
                  required
                  className="w-full rounded-md border border-purple-400/60 bg-white/90 px-3 py-2 text-sm text-gray-900 focus:border-purple-500 focus:outline-none"
                />
              </label>
              <div className="flex items-end">
                <button
                  type="submit"
                  className="w-full rounded-md bg-green-500 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-green-600"
                >
                  Guardar repartidor
                </button>
              </div>
            </form>
          </div>
        )}

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-purple-500/40 text-sm">
            <thead className="bg-purple-900/60">
              <tr>
                <th className="px-6 py-3 text-left font-medium uppercase tracking-wide text-purple-200">Repartidor</th>
                <th className="px-6 py-3 text-left font-medium uppercase tracking-wide text-purple-200">Contacto</th>
                <th className="px-6 py-3 text-left font-medium uppercase tracking-wide text-purple-200">Estado</th>
                <th className="px-6 py-3 text-left font-medium uppercase tracking-wide text-purple-200">Actualización</th>
                <th className="px-6 py-3 text-left font-medium uppercase tracking-wide text-purple-200">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-purple-500/30 bg-purple-950/30">
              {drivers.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-6 text-center text-purple-200">
                    No hay repartidores registrados todavía.
                  </td>
                </tr>
              ) : (
                drivers.map((driver) => (
                  <tr key={driver.id} className="hover:bg-purple-800/40">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-purple-200 text-purple-700">
                          <User className="h-5 w-5" />
                        </div>
                        <div>
                          <p className="font-medium text-white">{driver.name}</p>
                          <p className="text-xs text-purple-200">
                            {driver.rating ? (
                              <span className="inline-flex items-center gap-1">
                                <Star className="h-3 w-3 text-yellow-300" />
                                {Number(driver.rating).toFixed(1)}
                              </span>
                            ) : (
                              "Sin calificación"
                            )}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2 text-purple-200">
                        <Phone className="h-4 w-4" />
                        {driver.phone}
                      </div>
                      {driver.email && (
                        <div className="mt-1 flex items-center gap-2 text-purple-200">
                          <Mail className="h-4 w-4" />
                          {driver.email}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col gap-1">
                        <span
                          className={`inline-flex w-fit items-center rounded-full px-3 py-1 text-xs font-semibold ${
                            driver.is_active
                              ? "bg-green-500/20 text-green-200"
                              : "bg-gray-500/30 text-gray-200"
                          }`}
                        >
                          {driver.is_active ? "Activo" : "Inactivo"}
                        </span>
                        <span
                          className={`inline-flex w-fit items-center rounded-full px-3 py-1 text-xs font-semibold ${
                            driver.is_available
                              ? "bg-sky-500/20 text-sky-200"
                              : "bg-amber-500/20 text-amber-200"
                          }`}
                        >
                          {driver.is_available ? "Disponible" : "Ocupado"}
                        </span>
                        {driver.current_order_id && (
                          <span className="text-xs text-purple-200/80">
                            Pedido actual: #{driver.current_order_id}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-purple-200/80">
                      {driver.updated_at ? new Date(driver.updated_at).toLocaleString() : "--"}
                    </td>
                    <td className="px-6 py-4">
                      <button
                        onClick={() => toggleDriverStatus(driver.id, Boolean(driver.is_active))}
                        className={`rounded-md px-3 py-1 text-xs font-semibold transition-colors ${
                          driver.is_active
                            ? "bg-red-500/20 text-red-200 hover:bg-red-500/30"
                            : "bg-green-500/20 text-green-200 hover:bg-green-500/30"
                        }`}
                      >
                        {driver.is_active ? "Desactivar" : "Activar"}
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* Asignaciones activas */}
      <section className="mb-8 rounded-2xl border border-purple-500/40 bg-gradient-to-br from-purple-950/60 to-purple-900/30 text-white shadow-xl backdrop-blur">
        <header className="border-b border-purple-600/40 px-6 py-5">
          <h2 className="text-xl font-semibold">Asignaciones Activas</h2>
          <p className="text-sm text-purple-200/80">Pedidos asignados que aún están en curso.</p>
        </header>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-purple-500/30 text-sm">
            <thead className="bg-purple-900/60">
              <tr>
                <th className="px-6 py-3 text-left font-medium uppercase tracking-wide text-purple-200">Pedido</th>
                <th className="px-6 py-3 text-left font-medium uppercase tracking-wide text-purple-200">Repartidor</th>
                <th className="px-6 py-3 text-left font-medium uppercase tracking-wide text-purple-200">Estado</th>
                <th className="px-6 py-3 text-left font-medium uppercase tracking-wide text-purple-200">Asignado</th>
                <th className="px-6 py-3 text-left font-medium uppercase tracking-wide text-purple-200">Distancia</th>
                <th className="px-6 py-3 text-left font-medium uppercase tracking-wide text-purple-200">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-purple-500/20 bg-purple-950/30">
              {activeAssignments.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-6 text-center text-purple-200">
                    No hay asignaciones activas actualmente.
                  </td>
                </tr>
              ) : (
                activeAssignments.map((assignment) => (
                  <tr key={assignment.id} className="hover:bg-purple-800/30">
                    <td className="px-6 py-4">
                      <div className="font-semibold text-white">Pedido #{assignment.order_id}</div>
                      <div className="text-xs text-purple-200/80">
                        {assignment.customer_info?.name || "Cliente sin nombre"}
                      </div>
                      <div className="text-xs text-purple-200/60">
                        {assignment.customer_info?.phone || "Sin teléfono"}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-medium text-white">{assignment.driver_name || "Sin asignar"}</div>
                      <div className="text-xs text-purple-200/80">{assignment.driver_phone || "Sin contacto"}</div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center rounded-full bg-blue-500/20 px-3 py-1 text-xs font-semibold text-blue-200">
                        {assignment.order_status === "en_camino" ? "En camino" : "Asignado"}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-purple-200/80">
                      {new Date(assignment.assigned_at).toLocaleString()}
                    </td>
                    <td className="px-6 py-4 text-purple-200/80">
                      {assignment.estimated_distance ? `${Number(assignment.estimated_distance).toFixed(1)} km` : "--"}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-wrap gap-2">
                        <Link
                          href={`/admin/orders/${assignment.order_id}`}
                          className="inline-flex items-center gap-2 rounded-md bg-purple-500/30 px-3 py-1 text-xs font-semibold text-purple-100 transition-colors hover:bg-purple-500/40"
                        >
                          <Eye className="h-3.5 w-3.5" /> Ver pedido
                        </Link>
                        <button
                          onClick={() => completeAssignment(assignment.id)}
                          className="inline-flex items-center gap-2 rounded-md bg-green-500/20 px-3 py-1 text-xs font-semibold text-green-200 transition-colors hover:bg-green-500/30"
                        >
                          <CheckCircle className="h-3.5 w-3.5" /> Completar
                        </button>
                        <button
                          onClick={() => cancelAssignment(assignment.id)}
                          className="inline-flex items-center gap-2 rounded-md bg-red-500/20 px-3 py-1 text-xs font-semibold text-red-200 transition-colors hover:bg-red-500/30"
                        >
                          <XCircle className="h-3.5 w-3.5" /> Cancelar
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* Historial de asignaciones */}
      <section className="mb-8 rounded-2xl border border-purple-500/30 bg-purple-950/30 text-white shadow-lg backdrop-blur">
        <header className="border-b border-purple-600/30 px-6 py-5">
          <h2 className="text-xl font-semibold">Historial reciente</h2>
          <p className="text-sm text-purple-200/80">Entregas completadas recientemente.</p>
        </header>
        <ul className="divide-y divide-purple-500/20">
          {completedAssignments.length === 0 ? (
            <li className="px-6 py-4 text-sm text-purple-200">Aún no hay entregas completadas.</li>
          ) : (
            completedAssignments.slice(0, 10).map((assignment) => (
              <li key={assignment.id} className="flex items-center justify-between px-6 py-4 text-sm text-purple-100">
                <div>
                  <p className="font-medium">Pedido #{assignment.order_id}</p>
                  <p className="text-xs text-purple-200/70">
                    Entregado por {assignment.driver_name || "Repartidor"} el {" "}
                    {assignment.completed_at ? new Date(assignment.completed_at).toLocaleString() : "registro pendiente"}
                  </p>
                </div>
                <span className="rounded-full bg-green-500/20 px-3 py-1 text-xs font-semibold text-green-200">Entregado</span>
              </li>
            ))
          )}
        </ul>
      </section>

      {/* Pedidos listos para asignar */}
      <section className="rounded-2xl border border-purple-500/40 bg-gradient-to-br from-purple-950/60 to-purple-900/30 text-white shadow-xl backdrop-blur">
        <header className="border-b border-purple-600/40 px-6 py-5">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold">Pedidos listos para asignar</h2>
              <p className="text-sm text-purple-200/80">Selecciona un repartidor disponible o usa auto-asignación.</p>
            </div>
            {ordersReady.length > 0 && (
              <button
                onClick={async () => {
                  if (!confirm('¿Asignar automáticamente todos los pedidos listos?')) return
                  
                  let successCount = 0
                  let errorCount = 0
                  
                  for (const order of ordersReady) {
                    try {
                      const response = await fetch(`/api/orders-mysql/${order.id}/auto-assign`, {
                        method: 'POST',
                        credentials: 'include'
                      })
                      
                      const data = await response.json()
                      if (data.success) {
                        successCount++
                      } else {
                        errorCount++
                      }
                    } catch (error) {
                      errorCount++
                    }
                  }
                  
                  alert(`✅ ${successCount} pedidos asignados\n❌ ${errorCount} errores`)
                  loadData()
                }}
                className="bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 text-white font-semibold py-2 px-4 rounded-lg transition-all"
              >
                🚚 Auto-Asignar Todos
              </button>
            )}
          </div>
        </header>
        <div className="space-y-4 px-6 py-5">
          {ordersReady.length === 0 ? (
            <p className="text-sm text-purple-200">No hay pedidos listos para asignar en este momento.</p>
          ) : (
            ordersReady.map((order) => (
              <article
                key={order.id}
                className="rounded-xl border border-purple-500/30 bg-black/20 p-5 shadow-inner backdrop-blur"
              >
                <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                  <div>
                    <h3 className="text-lg font-semibold text-white">Pedido #{order.id}</h3>
                    <p className="text-sm text-purple-200/80">
                      Cliente: {order.customer_info?.name || "Cliente"}
                    </p>
                    <p className="text-sm text-purple-200/70">
                      Direccion: {order.customer_info?.address || order.delivery_address?.address || "No disponible"}
                    </p>
                  </div>
                  <span className="inline-flex w-fit items-center rounded-full bg-purple-500/20 px-3 py-1 text-xs font-semibold text-purple-100">
                    Listo para asignar
                  </span>
                </div>
                <div className="mt-4 border-t border-purple-500/20 pt-4">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm font-medium text-purple-100">Elige un repartidor:</p>
                    <button
                      onClick={async () => {
                        try {
                          const response = await fetch(`/api/orders-mysql/${order.id}/auto-assign`, {
                            method: 'POST',
                            credentials: 'include'
                          })
                          
                          const data = await response.json()
                          
                          if (data.success) {
                            showToast(`✅ Asignado a ${data.driver.name}`, 'success')
                            loadData()
                          } else {
                            showToast(`❌ ${data.error}`, 'error')
                          }
                        } catch (error) {
                          showToast('❌ Error al asignar', 'error')
                        }
                      }}
                      className="text-sm bg-green-600 hover:bg-green-700 text-white font-medium py-1 px-3 rounded transition-colors"
                    >
                      Auto-Asignar
                    </button>
                  </div>
                  <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
                    {drivers.filter((driver) => Boolean(driver.is_active) && Boolean(driver.is_available)).length === 0 ? (
                      <span className="col-span-full text-sm text-purple-200">
                        No hay repartidores disponibles en este momento.
                      </span>
                    ) : (
                      drivers
                        .filter((driver) => Boolean(driver.is_active) && Boolean(driver.is_available))
                        .map((driver) => (
                          <button
                            key={`${order.id}-${driver.id}`}
                            onClick={() => assignDriverToOrder(order, driver.id)}
                            className="flex items-center justify-between rounded-lg border border-purple-400/40 bg-white/95 px-3 py-2 text-sm font-medium text-purple-900 transition-transform hover:scale-[1.01] hover:bg-purple-50"
                          >
                            <span>{driver.name}</span>
                            <CheckCircle className="h-4 w-4 text-purple-600" />
                          </button>
                        ))
                    )}
                  </div>
                </div>
              </article>
            ))
          )}
        </div>
      </section>
    </AdminLayout>
  )
}
