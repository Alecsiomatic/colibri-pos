// Tipos para el sistema de repartidores
export type LatLng = {
  lat: number
  lng: number
}

export type DeliveryDriver = {
  id: string
  name: string
  phone: string
  email: string
  isActive: boolean
  currentLocation?: LatLng
  lastUpdated?: string
  currentOrderId?: number | null
  rating?: number
}

export type DeliveryAssignment = {
  id: string
  orderId: number
  driverId: string
  status: "pending" | "accepted" | "rejected" | "completed" | "cancelled"
  assignedAt: string
  acceptedAt?: string
  completedAt?: string
  startLocation: LatLng
  deliveryLocation: LatLng
  estimatedDistance?: number
  estimatedDuration?: number
}

export type OrderStatus =
  | "pendiente"
  | "preparando"
  | "listo_para_recoger"
  | "asignado_repartidor"
  | "en_camino"
  | "entregado"
  | "cancelado"

export type OrderStatusUpdate = {
  id: string
  orderId: number
  status: OrderStatus
  timestamp: string
  note?: string
  driverId?: string
}

export type NotificationType = "order_status" | "driver_assignment" | "pickup_ready" | "delivery_complete"

export type Notification = {
  id: string
  userId: string
  type: NotificationType
  title: string
  message: string
  read: boolean
  timestamp: string
  data?: any
}

// Tipos para productos y reportes
export interface Product {
  id: number
  name: string
  description: string
  price: number
  cost_price?: number
  stock?: number
  image_url?: string
  category_id: number
  category_name?: string
  available: boolean
  created_at: string
  updated_at: string
}

export interface Category {
  id: number
  name: string
  description?: string
  created_at: string
  updated_at: string
}
