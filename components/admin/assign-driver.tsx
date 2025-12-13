"use client"

import { useEffect, useState } from "react"
import { User, MapPin, CheckCircle } from "lucide-react"
import { useToast } from "@/hooks/use-notifications"

interface AssignDriverProps {
  orderId: number
  currentStatus: string
  onAssigned: () => void
}

interface DeliveryDriver {
  id: number
  name: string
  phone?: string
  email?: string
  is_active: number | boolean
  is_available: number | boolean
  current_location?: unknown
}

interface OrderDetails {
  id: number
  status: string
  customer_info?: Record<string, any> | null
  delivery_address?: Record<string, any> | null
  delivery_coordinates?: Record<string, any> | null
  delivery_type?: string | null
}

export default function AssignDriver({ orderId, currentStatus, onAssigned }: AssignDriverProps) {
  const [drivers, setDrivers] = useState<DeliveryDriver[]>([])
  const [loading, setLoading] = useState(true)
  const [assigning, setAssigning] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [isDeliveryOrder, setIsDeliveryOrder] = useState(false)
  const [deliveryLocation, setDeliveryLocation] = useState<unknown>(null)
  const toast = useToast()

  useEffect(() => {
    loadOrderDetails()
    loadDrivers()
  }, [orderId])

  const loadOrderDetails = async () => {
    try {
      const response = await fetch(`/api/orders-mysql/${orderId}`, {
        credentials: "include",
      })

      if (!response.ok) {
        throw new Error("No se pudo obtener el pedido")
      }

      const data = await response.json()

      if (!data.success || !data.order) {
        throw new Error(data.error || data.message || "Pedido no encontrado")
      }

      const order: OrderDetails = data.order
      const info = (order.customer_info ?? {}) as Record<string, any>

      const deliveryFlag =
        order.delivery_type === "delivery" || info.deliveryType === "delivery" || info.delivery_type === "delivery"

      setIsDeliveryOrder(Boolean(deliveryFlag))

      const address = (order.delivery_address ?? {}) as Record<string, any>
      const locationFromAddress = address.coordinates
      const locationFromInfo = info.deliveryLocation || info.coordinates
      const fallbackLocation = order.delivery_coordinates

      setDeliveryLocation(locationFromAddress || locationFromInfo || fallbackLocation || null)
    } catch (err: any) {
      console.error("Error al cargar pedido:", err)
      setError(err.message || "Error al cargar información del pedido")
      setIsDeliveryOrder(false)
    }
  }

  const loadDrivers = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/delivery/drivers?available=true`, {
        credentials: "include",
      })

      if (!response.ok) {
        throw new Error("No se pudo obtener repartidores")
      }

      const data = await response.json()

      if (!data.success) {
        throw new Error(data.message || "Error al cargar repartidores")
      }

      setDrivers(data.drivers || [])
    } catch (err: any) {
      console.error("Error al cargar repartidores:", err)
      setError(err.message || "Error al cargar repartidores")
    } finally {
      setLoading(false)
    }
  }

  const assignDriver = async (driverId: number) => {
    try {
      setAssigning(true)
      setError(null)
      setSuccess(null)

      const response = await fetch(`/api/delivery/assignments`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          order_id: orderId,
          driver_id: driverId,
          delivery_location: deliveryLocation,
        }),
      })

      const data = await response.json()

      if (!response.ok || !data.success) {
        throw new Error(data.message || data.error || "No se pudo asignar el repartidor")
      }

      setSuccess(data.message || "Repartidor asignado correctamente")
      toast.success("Asignación completada", data.message || "Repartidor asignado correctamente")
      await loadDrivers()
      onAssigned()
    } catch (err: any) {
      console.error("Error al asignar repartidor:", err)
      const message = err.message || "Error al asignar repartidor"
      setError(message)
      toast.error("Error", message)
    } finally {
      setAssigning(false)
    }
  }

  if (!isDeliveryOrder) {
    return null
  }

  const allowedStatuses = new Set([
    "listo_para_recoger",
    "pendiente",
    "preparando",
    "ready",
    "pending",
    "preparing",
  ])

  if (!allowedStatuses.has(currentStatus)) {
    return null
  }

  return (
    <div className="mt-6 bg-amber-50 p-4 rounded-lg border border-amber-200">
      <h3 className="text-lg font-medium text-amber-900 mb-3">Asignar Repartidor</h3>

      {error && <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-2 mb-3">{error}</div>}
      {success && <div className="bg-green-100 border-l-4 border-green-500 text-green-700 p-2 mb-3">{success}</div>}

      {loading ? (
        <p className="text-amber-700">Cargando repartidores...</p>
      ) : drivers.length === 0 ? (
        <p className="text-amber-700">No hay repartidores disponibles</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
          {drivers.map((driver) => (
            <button
              key={driver.id}
              onClick={() => assignDriver(driver.id)}
              disabled={assigning}
              className="bg-white hover:bg-amber-100 border border-amber-300 text-amber-900 px-3 py-2 rounded text-sm flex items-center justify-between transition-colors"
            >
              <div className="flex items-center">
                <div className="w-8 h-8 bg-amber-200 rounded-full flex items-center justify-center mr-2">
                  <User className="w-4 h-4 text-amber-700" />
                </div>
                <div className="text-left">
                  <div className="font-medium">{driver.name}</div>
                  {Boolean(driver.current_location) && (
                    <div className="text-xs text-amber-700 flex items-center">
                      <MapPin className="w-3 h-3 mr-1" />
                      Disponible
                    </div>
                  )}
                </div>
              </div>
              <CheckCircle className="h-4 w-4 text-amber-700" />
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
