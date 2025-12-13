"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { Bell, CheckCircle, XCircle } from "lucide-react"
import { useRouter } from "next/navigation"

export default function DriverOrderNotification() {
  const [newOrders, setNewOrders] = useState<any[]>([])
  const [showNotification, setShowNotification] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    // Verificar si el usuario es un repartidor
    const checkIfDriver = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession()

      if (!session) return

      // Obtener información del repartidor
      const { data: driver } = await supabase
        .from("delivery_drivers")
        .select("*")
        .eq("user_id", session.user.id)
        .single()

      if (!driver) return

      // Cargar pedidos pendientes
      loadPendingOrders()

      // Suscribirse a nuevos pedidos
      const subscription = supabase
        .channel("orders-ready")
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "orders",
            filter: "status=eq.listo_para_recoger",
          },
          () => {
            loadPendingOrders()
            playNotificationSound()
          },
        )
        .subscribe()

      return () => {
        subscription.unsubscribe()
      }
    }

    checkIfDriver()
  }, [supabase])

  const loadPendingOrders = async () => {
    try {
      // Obtener pedidos listos para recoger
      const { data } = await supabase
        .from("orders")
        .select("*")
        .eq("status", "listo_para_recoger")
        .order("created_at", { ascending: false })
        .limit(5)

      if (data && data.length > 0) {
        // Filtrar solo pedidos de entrega a domicilio
        const deliveryOrders = data.filter((order) => {
          try {
            const customerInfo =
              typeof order.customer_info === "string" ? JSON.parse(order.customer_info) : order.customer_info

            return customerInfo && customerInfo.deliveryType === "delivery"
          } catch (e) {
            console.error("Error al parsear customer_info:", e)
            return false
          }
        })

        if (deliveryOrders.length > 0) {
          setNewOrders(deliveryOrders)
          setShowNotification(true)
        } else {
          setNewOrders([])
          setShowNotification(false)
        }
      }
    } catch (err) {
      console.error("Error al cargar pedidos:", err)
    }
  }

  const playNotificationSound = () => {
    try {
      const audio = new Audio("/notification.mp3")
      audio.play()
    } catch (error) {
      console.error("Error al reproducir sonido:", error)
    }
  }

  const handleAccept = async (orderId: number) => {
    try {
      setLoading(true)
      setError(null)

      // Obtener información del repartidor
      const {
        data: { session },
      } = await supabase.auth.getSession()

      if (!session) {
        setError("No has iniciado sesión")
        return
      }

      const { data: driver } = await supabase
        .from("delivery_drivers")
        .select("*")
        .eq("user_id", session.user.id)
        .single()

      if (!driver) {
        setError("No se encontró información de repartidor")
        return
      }

      // Verificar si el pedido ya fue asignado
      const { data: order } = await supabase.from("orders").select("status, customer_info").eq("id", orderId).single()

      if (!order || order.status !== "listo_para_recoger") {
        setError("Este pedido ya no está disponible")
        loadPendingOrders()
        return
      }

      // Verificar que sea un pedido de entrega a domicilio
      const customerInfo =
        typeof order.customer_info === "string" ? JSON.parse(order.customer_info) : order.customer_info

      if (!customerInfo || customerInfo.deliveryType !== "delivery") {
        setError("Este pedido no es de entrega a domicilio")
        loadPendingOrders()
        return
      }

      // Obtener coordenadas del restaurante (ubicación fija)
      const restaurantLocation = {
        lat: 22.1565, // Coordenadas del restaurante (ejemplo)
        lng: -100.9855,
      }

      // Obtener coordenadas de entrega
      const { data: orderData } = await supabase.from("orders").select("*").eq("id", orderId).single()
      const deliveryLocation = orderData?.delivery_coordinates || {
        lat: 22.1665, // Coordenadas de ejemplo
        lng: -100.9755,
      }

      // Crear asignación
      const { data: assignment, error: assignmentError } = await supabase
        .from("delivery_assignments")
        .insert([
          {
            order_id: orderId,
            driver_id: driver.id,
            status: "accepted",
            accepted_at: new Date().toISOString(),
            start_location: restaurantLocation,
            delivery_location: deliveryLocation,
          },
        ])
        .select()
        .single()

      if (assignmentError) {
        throw assignmentError
      }

      // Actualizar estado del pedido
      await supabase.from("orders").update({ status: "en_camino" }).eq("id", orderId)

      // Actualizar repartidor
      await supabase.from("delivery_drivers").update({ current_order_id: orderId }).eq("id", driver.id)

      // Registrar actualización de estado
      await supabase.from("order_status_updates").insert([
        {
          order_id: orderId,
          status: "en_camino",
          driver_id: driver.id,
          note: "Repartidor en camino",
        },
      ])

      // Notificar al cliente
      const { data: userData } = await supabase.from("orders").select("user_id").eq("id", orderId).single()

      if (userData?.user_id) {
        await supabase.from("notifications").insert({
          user_id: userData.user_id,
          type: "order_status",
          title: "¡Tu pedido está en camino!",
          message: `El repartidor está en camino con tu pedido #${orderId}`,
          data: { order_id: orderId },
        })
      }

      // Actualizar lista de pedidos
      setNewOrders((prev) => prev.filter((order) => order.id !== orderId))
      if (newOrders.length <= 1) {
        setShowNotification(false)
      }

      // Redirigir al dashboard
      router.push("/driver/dashboard")
    } catch (err: any) {
      console.error("Error al aceptar pedido:", err)
      setError(err.message || "Error al aceptar pedido")
    } finally {
      setLoading(false)
    }
  }

  const handleReject = (orderId: number) => {
    setNewOrders((prev) => prev.filter((order) => order.id !== orderId))
    if (newOrders.length <= 1) {
      setShowNotification(false)
    }
  }

  const handleClose = () => {
    setShowNotification(false)
  }

  if (!showNotification || newOrders.length === 0) {
    return null
  }

  return (
    <div className="fixed bottom-20 right-4 z-50 w-80 bg-white rounded-lg shadow-lg overflow-hidden">
      <div className="bg-amber-700 text-white p-3 flex justify-between items-center">
        <div className="flex items-center">
          <Bell className="h-5 w-5 mr-2" />
          <h3 className="font-medium">Nuevos Pedidos Disponibles</h3>
        </div>
        <button onClick={handleClose} className="text-white hover:text-amber-200">
          &times;
        </button>
      </div>
      <div className="max-h-96 overflow-y-auto">
        {error && <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-2 text-sm">{error}</div>}
        {newOrders.map((order) => {
          // Parsear customer_info si es necesario
          const customerInfo =
            typeof order.customer_info === "string" ? JSON.parse(order.customer_info) : order.customer_info || {}

          return (
            <div key={order.id} className="p-3 border-b border-gray-200 hover:bg-amber-50">
              <div className="flex justify-between items-start">
                <div>
                  <h4 className="font-medium text-amber-900">Pedido #{order.id}</h4>
                  <p className="text-sm text-amber-700">
                    Cliente: {customerInfo.name || "Cliente"}
                    <br />
                    Dirección: {customerInfo.address || "No disponible"}
                  </p>
                  <p className="text-xs text-amber-600 mt-1">{new Date(order.created_at).toLocaleString()}</p>
                </div>
                <div className="flex flex-col gap-1">
                  <button
                    onClick={() => handleAccept(order.id)}
                    disabled={loading}
                    className="bg-green-600 hover:bg-green-700 text-white p-1 rounded text-xs flex items-center"
                  >
                    <CheckCircle size={12} className="mr-1" />
                    Aceptar
                  </button>
                  <button
                    onClick={() => handleReject(order.id)}
                    disabled={loading}
                    className="bg-red-600 hover:bg-red-700 text-white p-1 rounded text-xs flex items-center"
                  >
                    <XCircle size={12} className="mr-1" />
                    Rechazar
                  </button>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
