import { executeQuery } from "./mysql-db"
import { updateStockFromOrder } from "./db-functions"

type OrderProduct = {
  id: number | string
  name: string
  price: number
  quantity: number
  [key: string]: any
}

export interface CustomerInfo {
  name: string
  phone: string
  deliveryType: "delivery" | "pickup"
  address?: string
  pickupTime?: string
  notes?: string
  source: string
}

export interface OrderData {
  products: Array<OrderProduct>
  customerInfo: CustomerInfo
  userId?: number | string | null
  total: number
}

function normalizeCustomerInfo(info?: CustomerInfo): CustomerInfo {
  const baseInfo: CustomerInfo = {
    name: info?.name?.trim() || "Cliente sin nombre",
    phone: info?.phone?.trim() || "0000000000",
    deliveryType: info?.deliveryType || "pickup",
    address: info?.address?.trim(),
    pickupTime: info?.pickupTime?.trim(),
    notes: info?.notes?.trim(),
    source: info?.source || "desconocido",
  }

  return baseInfo
}

function normalizeProducts(products: Array<OrderProduct>) {
  return products.map((product) => {
    const numericId = typeof product.id === "string" ? Number.parseInt(product.id, 10) : product.id
    const numericQuantity =
      typeof product.quantity === "string" ? Number.parseInt(product.quantity, 10) : product.quantity || 1
    const numericPrice = typeof product.price === "string" ? Number.parseFloat(product.price) : product.price || 0

    return {
      ...product,
      id: Number.isFinite(numericId) ? numericId ?? 0 : 0,
      quantity: Number.isFinite(numericQuantity) && numericQuantity > 0 ? numericQuantity : 1,
      price: Number.isFinite(numericPrice) ? numericPrice : 0,
      name: product.name || "Producto sin nombre",
    }
  })
}

export async function processOrder(orderData: OrderData): Promise<{
  success: boolean
  order?: any
  error?: string
}> {
  try {
    if (!orderData.products || !Array.isArray(orderData.products) || orderData.products.length === 0) {
      return { success: false, error: "No hay productos en el pedido" }
    }

    const normalizedCustomerInfo = normalizeCustomerInfo(orderData.customerInfo)
    const normalizedProducts = normalizeProducts(orderData.products)

    const calculatedTotal = normalizedProducts.reduce((sum, product) => sum + product.price * product.quantity, 0)
    const orderTotal =
      typeof orderData.total === "number" && Number.isFinite(orderData.total) && orderData.total > 0
        ? orderData.total
        : calculatedTotal

    const itemsJson = JSON.stringify(normalizedProducts)
    const customerInfoJson = JSON.stringify(normalizedCustomerInfo)

    const result = (await executeQuery(
      `INSERT INTO orders (user_id, items, total, customer_info, status, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, NOW(), NOW())`,
      [
        orderData.userId ? Number(orderData.userId) || null : null,
        itemsJson,
        orderTotal,
        customerInfoJson,
        "pendiente",
      ],
    )) as any

    const orderId = result.insertId

    // Intentar guardar metadatos adicionales si existen las columnas (no crítico si falla)
    try {
      await executeQuery(
        `UPDATE orders
         SET customer_name = ?, customer_phone = ?, delivery_type = ?, source = ?
         WHERE id = ?`,
        [
          normalizedCustomerInfo.name,
          normalizedCustomerInfo.phone,
          normalizedCustomerInfo.deliveryType,
          normalizedCustomerInfo.source,
          orderId,
        ],
      )
    } catch (metaError: any) {
      if (metaError?.code !== "ER_BAD_FIELD_ERROR") {
        console.warn("No se pudieron guardar metadatos adicionales del pedido:", metaError)
      }
    }

    try {
      await updateStockFromOrder(orderId)
    } catch (stockError: any) {
      console.error("Error al actualizar stock para el pedido", orderId, stockError)
    }

    const orders = (await executeQuery(
      `SELECT id, user_id, items, total, status, customer_info, created_at, updated_at, customer_name, customer_phone
       FROM orders WHERE id = ?`,
      [orderId],
    )) as any[]

    if (!orders || orders.length === 0) {
      return { success: true, order: { id: orderId, items: normalizedProducts, customer_info: normalizedCustomerInfo } }
    }

    const order = orders[0]

    let items = normalizedProducts
    if (order.items && typeof order.items === "string") {
      try {
        items = JSON.parse(order.items)
      } catch (parseError) {
        console.warn("No se pudo parsear items de la BD para el pedido", orderId, parseError)
      }
    }

    let customerInfo = normalizedCustomerInfo
    if (order.customer_info && typeof order.customer_info === "string") {
      try {
        customerInfo = JSON.parse(order.customer_info)
      } catch (parseError) {
        console.warn("No se pudo parsear customer_info de la BD para el pedido", orderId, parseError)
      }
    }

    return {
      success: true,
      order: {
        ...order,
        items,
        customer_info: customerInfo,
      },
    }
  } catch (error: any) {
    console.error("Error en procesamiento de pedido:", error)
    return { success: false, error: error?.message || "Error desconocido en el procesamiento del pedido" }
  }
}
