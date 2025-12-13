
"use client"
// Helper para filtrar por fecha (debe estar fuera del componente)
function isToday(dateString: string) {
  const d = new Date(dateString)
  const now = new Date()
  return d.getDate() === now.getDate() && d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()
}

import { useState, useEffect } from "react"
import AdminLayout from "@/components/admin/admin-layout"
import { Clock, CheckCircle, Truck, AlertCircle, Package, ShoppingBag, X, User, Phone, Mail, MapPin } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import OrderFilters from "./components/OrderFilters"
import OrderTable from "./components/OrderTable"
import OrderDetailsModal from "./components/OrderDetailsModal"

type Order = {
  id: number
  user_id: number
  items: string
  total: number
  status: string
  created_at: string
  customer_info: string
  username?: string
  raw_status?: string
  payment_method?: string
  delivery_address?: string
  notes?: string
}

const STATUS_MAP: Record<string, string> = {
  pending: "pendiente",
  pendiente: "pendiente",
  confirmed: "confirmado",
  confirmado: "confirmado",
  processing: "procesando",
  procesando: "procesando",
  preparing: "procesando",
  ready: "listo",
  assigned_to_driver: "asignado",
  accepted_by_driver: "aceptado",
  en_camino: "enviado",
  in_delivery: "enviado",
  enviado: "enviado",
  delivered: "entregado",
  entregado: "entregado",
  cancelled: "cancelado",
  canceled: "cancelado",
  cancelado: "cancelado",
}

function normalizeStatus(status: string) {
  if (!status) return "desconocido"
  const key = status.toLowerCase()
  return STATUS_MAP[key] || status
}

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [filter, setFilter] = useState<string>("all")
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)
    const [dateFilter, setDateFilter] = useState<string>("")
    const [rangeStart, setRangeStart] = useState<string>("")
    const [rangeEnd, setRangeEnd] = useState<string>("")
  const [showModal, setShowModal] = useState(false)
  const [updatingStatus, setUpdatingStatus] = useState(false)
  const [drivers, setDrivers] = useState<any[]>([])
  const [selectedDriver, setSelectedDriver] = useState<string>('')
  const [assigningDriver, setAssigningDriver] = useState(false)

  const fetchDrivers = async () => {
    try {
      console.log('🚚 Cargando repartidores...')
      const response = await fetch('/api/admin/drivers', {
        credentials: 'include'
      })
      console.log('📡 Response status:', response.status)
      if (response.ok) {
        const data = await response.json()
        console.log('📦 Data recibida:', data)
        if (data.success) {
          console.log('✅ Repartidores cargados:', data.drivers.length)
          setDrivers(data.drivers || [])
        } else {
          console.error('❌ API respondió sin éxito:', data)
        }
      } else {
        console.error('❌ Error HTTP:', response.status)
      }
    } catch (error) {
      console.error('❌ Error fetching drivers:', error)
    }
  }

  const fetchOrders = async () => {
    try {
      const response = await fetch('/api/orders-mysql?limit=200', {
        credentials: 'include'
      })

      if (response.ok) {
        const data = await response.json()
        if (data.success) {
          const normalized = (data.orders || []).map((order: Order) => ({
            ...order,
            raw_status: order.status,
            status: normalizeStatus(order.status),
          }))
          setOrders(normalized)
        } else {
          setError(data.message || 'Error al cargar pedidos')
        }
      } else {
        setError('Error al cargar pedidos')
      }
    } catch (error) {
      console.error('Error fetching orders:', error)
      setError('Error de conexión')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchOrders()
    fetchDrivers()
  }, [])

  const updateOrderStatus = async (orderId: number, newStatus: string) => {
    setUpdatingStatus(true)
    try {
      const response = await fetch(`/api/orders-mysql/${orderId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ status: newStatus })
      })

      const data = await response.json()

      if (data.success) {
        alert(`✅ Estado actualizado a: ${newStatus}`)
        await fetchOrders()
        
        // ACTUALIZAR selectedOrder con el nuevo estado
        if (selectedOrder && selectedOrder.id === orderId) {
          setSelectedOrder({
            ...selectedOrder,
            raw_status: newStatus,
            status: normalizeStatus(newStatus)
          })
        }
      } else {
        alert(`❌ ${data.error || 'Error al actualizar estado'}`)
      }
    } catch (error) {
      console.error('Error updating status:', error)
      alert('❌ Error al actualizar estado')
    } finally {
      setUpdatingStatus(false)
    }
  }

  const assignDriver = async (orderId: number, driverId: string) => {
    if (!driverId) {
      alert('❌ Selecciona un repartidor')
      return
    }

    console.log('🚀 Asignando driver:', { orderId, driverId, tipo: typeof driverId })
    
    setAssigningDriver(true)
    try {
      const response = await fetch(`/api/orders-mysql/${orderId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ driverId })
      })

      const data = await response.json()
      
      console.log('📡 Respuesta del servidor:', data)

      if (data.success) {
        alert(`✅ Pedido asignado a ${data.driver?.name || 'repartidor'}`)
        setShowModal(false)
        setSelectedDriver('')
        await fetchOrders()
      } else {
        alert(`❌ ${data.error || 'Error al asignar repartidor'}`)
      }
    } catch (error) {
      console.error('Error assigning driver:', error)
      alert('❌ Error al asignar repartidor')
    } finally {
      setAssigningDriver(false)
    }
  }


  // Filtering logic
  let filteredOrders = orders;
  if (dateFilter === "HOY") {
    filteredOrders = filteredOrders.filter((order) => isToday(order.created_at));
  } else if (rangeStart && rangeEnd) {
    const start = new Date(rangeStart);
    const end = new Date(rangeEnd);
    filteredOrders = filteredOrders.filter((order) => {
      const d = new Date(order.created_at);
      return d >= start && d <= end;
    });
  }
  if (filter !== "all") {
    filteredOrders = filteredOrders.filter(
      (order) => order.status === filter || order.raw_status === filter
    );
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pendiente": return "text-amber-400 bg-amber-400/20"
      case "procesando":
      case "listo":
        return "text-blue-400 bg-blue-400/20"
      case "asignado":
      case "aceptado":
        return "text-cyan-400 bg-cyan-400/20"
      case "enviado": return "text-purple-400 bg-purple-400/20"
      case "entregado": return "text-green-400 bg-green-400/20"
      case "cancelado": return "text-red-400 bg-red-400/20"
      default: return "text-gray-400 bg-gray-400/20"
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "pendiente": return <Clock className="h-4 w-4" />
      case "procesando":
      case "listo":
        return <Package className="h-4 w-4" />
      case "asignado":
      case "aceptado":
        return <User className="h-4 w-4" />
      case "enviado": return <Truck className="h-4 w-4" />
      case "entregado": return <CheckCircle className="h-4 w-4" />
      case "cancelado": return <AlertCircle className="h-4 w-4" />
      default: return <ShoppingBag className="h-4 w-4" />
    }
  }


  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-400"></div>
        </div>
      </AdminLayout>
    );
  }

  if (error) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-red-400 font-bold text-lg">{error}</div>
        </div>
      </AdminLayout>
    );
  }

  // Main UI
  return (
    <AdminLayout>
      <div className="p-4">
        <h1 className="text-3xl font-bold mb-6 text-white">Gestión de Pedidos</h1>
        <OrderFilters
          filter={filter}
          setFilter={setFilter}
          dateFilter={dateFilter}
          setDateFilter={setDateFilter}
          rangeStart={rangeStart}
          setRangeStart={setRangeStart}
          rangeEnd={rangeEnd}
          setRangeEnd={setRangeEnd}
        />
        <OrderTable
          orders={filteredOrders}
          getStatusColor={getStatusColor}
          getStatusIcon={getStatusIcon}
          onView={(order) => {
            setSelectedOrder(order);
            setShowModal(true);
          }}
          onDelete={async (order) => {
            if (confirm(`¿Seguro que quieres eliminar el pedido #${order.id}?`)) {
              try {
                const response = await fetch(`/api/orders-mysql/${order.id}`, {
                  method: 'DELETE',
                  credentials: 'include',
                });
                const data = await response.json();
                if (data.success) {
                  alert('✅ Pedido eliminado');
                  await fetchOrders();
                } else {
                  alert(`❌ ${data.error || 'Error al eliminar pedido'}`);
                }
              } catch (error) {
                alert('❌ Error al eliminar pedido');
              }
            }
          }}
        />
        <OrderDetailsModal
          open={showModal}
          onOpenChange={(open) => setShowModal(open)}
          order={selectedOrder}
          drivers={drivers}
          selectedDriver={selectedDriver}
          setSelectedDriver={setSelectedDriver}
          assigningDriver={assigningDriver}
          assignDriver={assignDriver}
          fetchDrivers={fetchDrivers}
          updatingStatus={updatingStatus}
          updateOrderStatus={updateOrderStatus}
          fetchOrders={fetchOrders}
          setShowModal={setShowModal}
        />
      </div>
    </AdminLayout>
  );
}
                                    