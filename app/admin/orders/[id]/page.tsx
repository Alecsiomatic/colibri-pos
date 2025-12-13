"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import Link from "next/link"
import { useParams, useRouter } from "next/navigation"
import {
  AlertCircle,
  Calendar,
  CheckCircle,
  Clock,
  MapPin,
  MessageSquare,
  Package,
  Phone,
  Truck,
  User,
} from "lucide-react"

import AdminLayout from "@/components/admin/admin-layout"
import { useAuth } from "@/hooks/use-auth"
import { useToast } from "@/hooks/use-notifications"

const REFRESH_INTERVAL_MS = 10_000
const ACTION_COOLDOWN_MS = 2_000

type OrderItem = {
  id: string
  name: string
  price: number
  quantity: number
  category?: string
  unit?: "kg" | "pieza"
}

type CustomerInfo = {
  name?: string
  phone?: string
  deliveryType?: "delivery" | "pickup"
  address?: string
  pickupTime?: string
  notes?: string
  source?: string
}

type Order = {
  id: number
  user_id: string
  items: OrderItem[] | string
  total: number
  status: string
  created_at: string
  customer_info: CustomerInfo | string | null
  username?: string
  created_from?: string
}

const STATUS_MAP: Record<string, string> = {
  pending: "pendiente",
  pendiente: "pendiente",
  confirmed: "confirmado",
  confirmado: "confirmado",
  processing: "preparando",
  preparing: "preparando",
  listo: "listo_para_recoger",
  ready: "listo_para_recoger",
  in_delivery: "en_camino",
  en_camino: "en_camino",
  delivered: "entregado",
  entregado: "entregado",
  cancelled: "cancelado",
  canceled: "cancelado",
  cancelado: "cancelado",
}

function normalizeStatus(status: string) {
  if (!status) return "pendiente"
  const key = status.toLowerCase()
  return STATUS_MAP[key] || status
}

export default function OrderDetailsPage() {
  const params = useParams()
  const router = useRouter()
  const { user, isLoading } = useAuth()
  const toast = useToast()

  const orderId = useMemo(() => params?.id, [params])

  const [order, setOrder] = useState<Order | null>(null)
  const [items, setItems] = useState<OrderItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [failureCount, setFailureCount] = useState(0)
  const [pausePollingUntil, setPausePollingUntil] = useState<number | null>(null)
  const [statusUpdating, setStatusUpdating] = useState(false)
  const [actionCooldown, setActionCooldown] = useState(false)
  const actionCooldownTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const fetchOrderDetails = useCallback(
    async (options?: { silent?: boolean }) => {
      if (!orderId || !user?.is_admin) {
        return
      }

      if (options?.silent) {
        // silent refresh avoids blinking loader
      } else {
        setLoading(true)
        setError("")
      }

      try {
        const response = await fetch(`/api/orders-mysql/${orderId}`, {
          credentials: "include",
        })

        if (!response.ok) {
          throw new Error("Error al cargar los detalles del pedido")
        }

        const payload = await response.json()

        if (!payload?.success || !payload?.order) {
          throw new Error(payload?.error || "Pedido no encontrado")
        }

        const fetchedOrder: Order = payload.order

        let parsedItems: OrderItem[] = []
        if (Array.isArray(fetchedOrder.items)) {
          parsedItems = fetchedOrder.items as OrderItem[]
        } else if (typeof fetchedOrder.items === "string") {
          try {
            const data = JSON.parse(fetchedOrder.items)
            if (Array.isArray(data)) {
              parsedItems = data
            }
          } catch (parseError) {
            console.error("Error al parsear items de pedido", parseError)
          }
        }

        let parsedCustomerInfo: CustomerInfo | null = null
        if (!fetchedOrder.customer_info) {
          parsedCustomerInfo = null
        } else if (typeof fetchedOrder.customer_info === "string") {
          try {
            parsedCustomerInfo = JSON.parse(fetchedOrder.customer_info)
          } catch (parseError) {
            console.error("Error al parsear customer_info", parseError)
            parsedCustomerInfo = null
          }
        } else {
          parsedCustomerInfo = fetchedOrder.customer_info as CustomerInfo
        }

        setOrder({ ...fetchedOrder, customer_info: parsedCustomerInfo })
        setItems(parsedItems)
        // Reset failure tracking on success
        if (failureCount > 0) {
          console.log('Order fetch succeeded, resetting failure count')
          setFailureCount(0)
          setPausePollingUntil(null)
        }
      } catch (err: any) {
        console.error("Error al cargar detalles del pedido:", err)
        if (!options?.silent) {
          setError(err.message || "Error al cargar los detalles del pedido")
        } else {
          // silent refresh failed: increase failureCount and pause polling exponentially
          setFailureCount((c) => {
            const next = (c || 0) + 1
            const pauseMs = Math.min(60_000, 5_000 * next) // cap pause at 60s
            setPausePollingUntil(Date.now() + pauseMs)
            console.warn(`Silent fetch failed, failureCount=${next}, pausing polling for ${pauseMs}ms`)
            return next
          })
        }
      } finally {
        if (!options?.silent) {
          setLoading(false)
        }
      }
    },
    [orderId, user?.is_admin]
  )

  useEffect(() => {
    if (!isLoading && (!user || !user.is_admin)) {
      router.push("/admin/dashboard")
    }
  }, [isLoading, user, router])

  useEffect(() => {
    if (!isLoading) {
      fetchOrderDetails()
    }
  }, [fetchOrderDetails, isLoading])

  useEffect(() => {
    if (isLoading || !user?.is_admin || !orderId) {
      return
    }

    const interval = setInterval(() => {
      // Skip poll if currently paused due to failures
      if (pausePollingUntil && Date.now() < pausePollingUntil) {
        return
      }

      // If pause expired, reset counters
      if (pausePollingUntil && Date.now() >= pausePollingUntil) {
        setFailureCount(0)
        setPausePollingUntil(null)
      }

      fetchOrderDetails({ silent: true })
    }, REFRESH_INTERVAL_MS)

    return () => clearInterval(interval)
  }, [fetchOrderDetails, isLoading, orderId, user?.is_admin])

  useEffect(() => {
    return () => {
      if (actionCooldownTimer.current) {
        clearTimeout(actionCooldownTimer.current)
      }
    }
  }, [])

  const updateOrderStatus = async (status: string) => {
    if (!order || !user?.is_admin || statusUpdating || actionCooldown) {
      return
    }

    setStatusUpdating(true)
    try {
      const response = await fetch(`/api/orders-mysql/${order.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ status }),
      })

      const payload = await response.json()

      if (!response.ok || !payload?.success) {
        throw new Error(payload?.error || "Error al actualizar el estado del pedido")
      }

      setOrder((prev) => (prev ? { ...prev, status } : prev))
      toast.success("Estado actualizado", `Pedido marcado como ${normalizeStatus(status)}`)
      await fetchOrderDetails({ silent: true })

      if (actionCooldownTimer.current) {
        clearTimeout(actionCooldownTimer.current)
      }
      setActionCooldown(true)
      actionCooldownTimer.current = setTimeout(() => {
        setActionCooldown(false)
      }, ACTION_COOLDOWN_MS)
    } catch (err: any) {
      console.error("Error al actualizar el estado del pedido:", err)
      setError(err.message || "Error al actualizar el estado del pedido")
      toast.error("Error", err.message || "No se pudo actualizar el estado")
    } finally {
      setStatusUpdating(false)
    }
  }

  const getStatusIcon = (status: string) => {
    const normalized = normalizeStatus(status)
    switch (normalized) {
      case "pendiente":
        return <Clock className="h-5 w-5 text-yellow-500" />
      case "preparando":
        return <Package className="h-5 w-5 text-blue-500" />
      case "en_camino":
        return <Truck className="h-5 w-5 text-purple-500" />
      case "entregado":
        return <CheckCircle className="h-5 w-5 text-green-500" />
      case "cancelado":
        return <AlertCircle className="h-5 w-5 text-red-500" />
      default:
        return <Clock className="h-5 w-5 text-gray-500" />
    }
  }

  const getStatusClass = (status: string) => {
    const normalized = normalizeStatus(status)
    switch (normalized) {
      case "pendiente":
        return "bg-yellow-100 text-yellow-800"
      case "preparando":
        return "bg-blue-100 text-blue-800"
      case "en_camino":
        return "bg-purple-100 text-purple-800"
      case "entregado":
        return "bg-green-100 text-green-800"
      case "cancelado":
        return "bg-red-100 text-red-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  if (loading || isLoading) {
    return (
      <AdminLayout>
        <div className="bg-white p-8 rounded-lg shadow-md text-center">
          <p className="text-amber-800">Cargando detalles del pedido...</p>
        </div>
      </AdminLayout>
    )
  }

  if (error) {
    return (
      <AdminLayout>
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">{error}</div>
        <Link href="/admin/orders" className="text-amber-700 hover:underline">
          &lt;&lt; Volver a la lista de pedidos
        </Link>
      </AdminLayout>
    )
  }

  if (!order) {
    return (
      <AdminLayout>
        <div className="bg-white p-8 rounded-lg shadow-md text-center">
          <p className="text-amber-800">Pedido no encontrado</p>
        </div>
        <Link href="/admin/orders" className="text-amber-700 hover:underline mt-4 inline-block">
          &lt;&lt; Volver a la lista de pedidos
        </Link>
      </AdminLayout>
    )
  }

  const customerInfo = (order.customer_info || {}) as CustomerInfo
  const currentStatus = normalizeStatus(order.status)

  return (
    <AdminLayout>
      <div className="mb-4">
        <Link href="/admin/orders" className="text-amber-700 hover:underline">
          &lt;&lt; Volver a la lista de pedidos
        </Link>
      </div>

      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="bg-amber-50 p-6 border-b border-amber-200">
          <div className="flex flex-col md:flex-row md:items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-amber-900">Pedido #{order.id}</h1>
              <p className="text-amber-700">
                Realizado el {new Date(order.created_at).toLocaleDateString()} a las {" "}
                {new Date(order.created_at).toLocaleTimeString()}
              </p>
              {order.created_from === "chat" && (
                <div className="flex items-center mt-1 text-blue-600">
                  <MessageSquare className="h-4 w-4 mr-1" />
                  <span className="text-sm">Creado desde el chat asistente</span>
                </div>
              )}
              {customerInfo?.source === "chat-whatsapp" && (
                <div className="flex items-center mt-1 text-green-600">
                  <MessageSquare className="h-4 w-4 mr-1" />
                  <span className="text-sm">Pedido realizado desde WhatsApp/chat sin autenticación</span>
                </div>
              )}
            </div>
            <div className="mt-4 md:mt-0">
              <div className={`inline-flex items-center px-3 py-1 rounded-full ${getStatusClass(order.status)}`}>
                {getStatusIcon(order.status)}
                <span className="ml-2 font-medium">{currentStatus}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              <h2 className="text-lg font-bold text-amber-900 mb-4">Información del Cliente</h2>
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="flex items-start mb-3">
                  <User className="h-5 w-5 text-amber-700 mr-2 mt-0.5" />
                  <div>
                    <h3 className="font-medium text-amber-900">Nombre:</h3>
                    <p className="text-gray-700">{customerInfo?.name || order.username || "Sin datos"}</p>
                  </div>
                </div>

                {customerInfo?.phone && (
                  <div className="flex items-start mb-3">
                    <Phone className="h-5 w-5 text-amber-700 mr-2 mt-0.5" />
                    <div>
                      <h3 className="font-medium text-amber-900">Teléfono:</h3>
                      <p className="text-gray-700">{customerInfo.phone}</p>
                    </div>
                  </div>
                )}

                {customerInfo?.deliveryType === "delivery" && customerInfo?.address && (
                  <div className="flex items-start mb-3">
                    <MapPin className="h-5 w-5 text-amber-700 mr-2 mt-0.5" />
                    <div>
                      <h3 className="font-medium text-amber-900">Dirección de entrega:</h3>
                      <p className="text-gray-700">{customerInfo.address}</p>
                    </div>
                  </div>
                )}

                {customerInfo?.deliveryType === "pickup" && customerInfo?.pickupTime && (
                  <div className="flex items-start mb-3">
                    <Calendar className="h-5 w-5 text-amber-700 mr-2 mt-0.5" />
                    <div>
                      <h3 className="font-medium text-amber-900">Horario de recogida:</h3>
                      <p className="text-gray-700">{customerInfo.pickupTime}</p>
                    </div>
                  </div>
                )}

                {customerInfo?.notes && (
                  <div className="flex items-start">
                    <AlertCircle className="h-5 w-5 text-amber-700 mr-2 mt-0.5" />
                    <div>
                      <h3 className="font-medium text-amber-900">Notas adicionales:</h3>
                      <p className="text-gray-700">{customerInfo.notes}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div>
              <h2 className="text-lg font-bold text-amber-900 mb-4">Resumen del Pedido</h2>
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="border-b border-gray-200 pb-4 mb-4">
                  <ul className="space-y-3">
                    {items.map((item, index) => (
                      <li key={index} className="flex justify-between">
                        <div>
                          <span className="text-gray-900">{item.quantity} </span>
                          <span className="text-gray-700">
                            {item.unit ? (item.unit === "kg" ? "kg" : "pieza(s)") : "x"} {item.name}
                          </span>
                        </div>
                        <span className="text-gray-900 font-medium">${(item.price * item.quantity).toFixed(2)}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="flex justify-between font-bold text-lg text-gray-900">
                  <span>Total:</span>
                  <span>${order.total.toFixed(2)}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-8 p-4 bg-amber-50 rounded-lg">
            <h2 className="text-lg font-bold text-amber-900 mb-4">Actualizar Estado del Pedido</h2>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => updateOrderStatus("pendiente")}
                disabled={currentStatus === "pendiente" || statusUpdating || actionCooldown}
                className={`px-4 py-2 rounded-md ${
                  currentStatus === "pendiente"
                    ? "bg-yellow-200 text-yellow-800 cursor-not-allowed"
                    : "bg-yellow-100 text-yellow-800 hover:bg-yellow-200"
                }`}
              >
                Pendiente
              </button>
              <button
                onClick={() => updateOrderStatus("preparando")}
                disabled={currentStatus === "preparando" || statusUpdating || actionCooldown}
                className={`px-4 py-2 rounded-md ${
                  currentStatus === "preparando"
                    ? "bg-blue-200 text-blue-800 cursor-not-allowed"
                    : "bg-blue-100 text-blue-800 hover:bg-blue-200"
                }`}
              >
                Preparando
              </button>
              <button
                onClick={() => updateOrderStatus("en_camino")}
                disabled={currentStatus === "en_camino" || statusUpdating || actionCooldown}
                className={`px-4 py-2 rounded-md ${
                  currentStatus === "en_camino"
                    ? "bg-purple-200 text-purple-800 cursor-not-allowed"
                    : "bg-purple-100 text-purple-800 hover:bg-purple-200"
                }`}
              >
                En camino
              </button>
              <button
                onClick={() => updateOrderStatus("entregado")}
                disabled={currentStatus === "entregado" || statusUpdating || actionCooldown}
                className={`px-4 py-2 rounded-md ${
                  currentStatus === "entregado"
                    ? "bg-green-200 text-green-800 cursor-not-allowed"
                    : "bg-green-100 text-green-800 hover:bg-green-200"
                }`}
              >
                Entregado
              </button>
              <button
                onClick={() => updateOrderStatus("cancelado")}
                disabled={currentStatus === "cancelado" || statusUpdating || actionCooldown}
                className={`px-4 py-2 rounded-md ${
                  currentStatus === "cancelado"
                    ? "bg-red-200 text-red-800 cursor-not-allowed"
                    : "bg-red-100 text-red-800 hover:bg-red-200"
                }`}
              >
                Cancelado
              </button>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  )
}
