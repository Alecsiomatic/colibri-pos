'use client'

import { useState, useEffect } from 'react'
import { useAuth } from './use-auth'
import { useToast } from './use-notifications'

interface OrderItem {
  id: number
  order_id: number
  product_id: number
  product_name: string
  quantity: number
  price: number
}

interface Order {
  id: number
  user_id: number
  customer_name: string
  customer_phone: string
  customer_email?: string
  items: OrderItem[]
  total_amount: number
  delivery_type?: 'delivery' | 'pickup'
  status:
    | 'pendiente'
    | 'confirmado'
    | 'preparando'
    | 'en_camino'
    | 'entregado'
    | 'cancelado'
    | 'pending'
    | 'confirmed'
    | 'preparing'
    | 'ready'
    | 'in_delivery'
    | 'delivered'
    | 'cancelled'
  payment_method: string
  delivery_address?: string
  driver_id?: number
  driver_name?: string
  created_at: string
  updated_at: string
}

export function useOrders() {
  const [orders, setOrders] = useState<Order[]>([])
  const [userOrders, setUserOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [lastFailedAt, setLastFailedAt] = useState<number | null>(null)
  const { user } = useAuth()
  const toast = useToast()

  // Cargar todos los pedidos (admin only)
  async function fetchWithRetry(url: string, attempts = 3) {
    let attempt = 0
    while (true) {
      try {
        const response = await fetch(url, { credentials: 'include' })
        if (!response.ok) throw new Error(`HTTP ${response.status}`)
        return await response.json()
      } catch (err: any) {
        attempt++
        if (attempt >= attempts) throw err
        const delay = 200 * Math.pow(2, attempt - 1)
        await new Promise((res) => setTimeout(res, delay))
      }
    }
  }

  const fetchAllOrders = async (status?: string) => {
    if (!user?.is_admin) {
      console.warn('Fetch all orders attempted without admin permission')
      return
    }
    try {
      if (lastFailedAt && Date.now() - lastFailedAt < 30000) {
        console.warn('Last fetch failed recently, backing off orders fetch for 30s')
        return
      }

      setLoading(true)
      setError(null)

      const url = status ? `/api/orders-mysql?status=${status}` : '/api/orders-mysql'
      const data = await fetchWithRetry(url, 3)

      if (data.success) {
        setOrders(data.orders)
      } else {
        setError(data.error || 'Error cargando pedidos')
        setLastFailedAt(Date.now())
      }
    } catch (error) {
      console.error('Error fetching orders:', error)
      setError('Error de conexión')
      setLastFailedAt(Date.now())
    } finally {
      setLoading(false)
    }
  }

  // Cargar pedidos del usuario actual
  const fetchUserOrders = async () => {
    if (!user) return

    try {
      if (lastFailedAt && Date.now() - lastFailedAt < 30000) {
        console.warn('Last fetch failed recently, backing off user orders fetch for 30s')
        return
      }

      setLoading(true)
      setError(null)

      const data = await fetchWithRetry('/api/orders-mysql/user', 3)

      if (data.success) {
        setUserOrders(data.orders)
      } else {
        setError(data.error || 'Error cargando tus pedidos')
        setLastFailedAt(Date.now())
      }
    } catch (error) {
      console.error('Error fetching user orders:', error)
      setError('Error de conexión')
      setLastFailedAt(Date.now())
    } finally {
      setLoading(false)
    }
  }

  // Crear pedido
  const createOrder = async (orderData: {
    items: Array<{ id: number; name: string; price: number; quantity: number }>
    customer_info: { name: string; phone: string; email?: string }
    delivery_address?: string
    payment_method: string
  }) => {
    try {
      const response = await fetch('/api/orders-mysql', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(orderData),
      })

      const data = await response.json()

      if (data.success) {
        toast.success('Pedido creado', 'Tu pedido se ha registrado exitosamente')
        await fetchUserOrders() // Recargar pedidos del usuario
        if (user?.is_admin) {
          await fetchAllOrders() // Recargar todos los pedidos si es admin
        }
        return { success: true, orderId: data.orderId }
      } else {
        console.error('Error creating order:', data.error)
        return { success: false, error: data.error }
      }
    } catch (error) {
      console.error('Error creating order:', error)
      return { success: false, error: 'Error de conexión' }
    }
  }

  // Actualizar estado del pedido (admin only)
  const updateOrderStatus = async (orderId: number, status: Order['status']) => {
    if (!user?.is_admin) {
      toast.error('Sin permisos', 'Solo administradores pueden actualizar pedidos')
      return { success: false, error: 'Sin permisos' }
    }

    try {
      const response = await fetch(`/api/orders-mysql/${orderId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ status }),
      })

      const data = await response.json()

      if (data.success) {
        toast.success('Estado actualizado', `Pedido marcado como ${status}`)
        await fetchAllOrders() // Recargar lista
        return { success: true }
      } else {
        toast.error('Error', data.error || 'Error actualizando pedido')
        return { success: false, error: data.error }
      }
    } catch (error) {
      console.error('Error updating order:', error)
      toast.error('Error', 'Error de conexión')
      return { success: false, error: 'Error de conexión' }
    }
  }

  // Asignar conductor al pedido (admin only)
  const assignDriver = async (orderId: number, driverId: number) => {
    if (!user?.is_admin) {
      toast.error('Sin permisos', 'Solo administradores pueden asignar conductores')
      return { success: false, error: 'Sin permisos' }
    }

    try {
      const response = await fetch('/api/delivery/assignments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ order_id: orderId, driver_id: driverId }),
      })

      const data = await response.json()

      if (data.success) {
        toast.success('Conductor asignado', data.message || 'El conductor ha sido asignado al pedido')
        await fetchAllOrders() // Recargar lista
        return { success: true, assignmentId: data.assignmentId }
      } else {
        const errorMessage = data.error || data.message || 'Error asignando conductor'
        toast.error('Error', errorMessage)
        return { success: false, error: errorMessage }
      }
    } catch (error) {
      console.error('Error assigning driver:', error)
      toast.error('Error', 'Error de conexión')
      return { success: false, error: 'Error de conexión' }
    }
  }

  // Cancelar pedido
  const cancelOrder = async (orderId: number) => {
    try {
      const response = await fetch('/api/orders-mysql', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ id: orderId, status: 'cancelado' }),
      })

      const data = await response.json()

      if (data.success) {
        toast.success('Pedido cancelado', 'El pedido ha sido cancelado')
        await fetchUserOrders()
        if (user?.is_admin) {
          await fetchAllOrders()
        }
        return { success: true }
      } else {
        toast.error('Error', data.error || 'Error cancelando pedido')
        return { success: false, error: data.error }
      }
    } catch (error) {
      console.error('Error canceling order:', error)
      toast.error('Error', 'Error de conexión')
      return { success: false, error: 'Error de conexión' }
    }
  }

  // Cargar datos iniciales
  useEffect(() => {
    if (user) {
      fetchUserOrders()
      if (user.is_admin) {
        fetchAllOrders()
      }
    }
  }, [user])

  return {
    orders,
    userOrders,
    loading,
    error,
    fetchAllOrders,
    fetchUserOrders,
    createOrder,
    updateOrderStatus,
    assignDriver,
    cancelOrder,
    refetch: user?.is_admin ? fetchAllOrders : fetchUserOrders
  }
}