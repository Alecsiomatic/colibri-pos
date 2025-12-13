import { executeQuery } from "./mysql-db"

/**
 * Actualiza el stock de productos basado en un pedido
 * @param orderId ID del pedido
 * @returns Resultado de la operación
 */
export async function updateStockFromOrder(orderId: number): Promise<{
  success: boolean
  message: string
  updatedProducts?: Array<{
    id: number
    name: string
    previousStock: number
    newStock: number
    quantity: number
  }>
}> {
  try {
    console.log(`Actualizando stock para el pedido #${orderId}`)

    // 1. Obtener el pedido desde MySQL
    const orders = (await executeQuery(
      "SELECT id, items, status, stock_processed FROM orders WHERE id = ?",
      [orderId],
    )) as any[]

    if (!orders || orders.length === 0) {
      console.error("Pedido no encontrado en la base de datos")
      return { success: false, message: "Pedido no encontrado" }
    }

    const order = orders[0]

    // Verificar si el pedido ya fue procesado para stock (si existe la columna)
    const alreadyProcessed = typeof order.stock_processed !== "undefined" && Boolean(order.stock_processed)
    if (alreadyProcessed) {
      console.log(`El pedido #${orderId} ya fue procesado para stock`)
      return { success: true, message: "El pedido ya fue procesado para stock" }
    }

    // Verificar si el pedido está cancelado
    const status = (order.status || "").toString().toLowerCase()
    if (status === "cancelado" || status === "cancelled" || status === "canceled") {
      console.log(`El pedido #${orderId} está cancelado, no se actualizará el stock`)
      return { success: true, message: "El pedido está cancelado, no se actualizará el stock" }
    }

    // 2. Obtener los items del pedido
    let items = order.items
    if (typeof items === "string") {
      try {
        items = JSON.parse(items)
      } catch (e: any) {
        console.error("Error al parsear items del pedido:", e)
        return { success: false, message: `Error al parsear items del pedido: ${e.message}` }
      }
    }

    if (!Array.isArray(items) || items.length === 0) {
      console.log(`El pedido #${orderId} no tiene items válidos`)
      return { success: false, message: "El pedido no tiene items válidos" }
    }

    // 3. Procesar cada item y actualizar el stock
    const updatedProducts = []

    for (const item of items) {
      try {
        let productId: number | null = null

        if (typeof item.id !== "undefined") {
          const parsedId = Number.parseInt(item.id, 10)
          if (!Number.isNaN(parsedId)) {
            productId = parsedId
          }
        }

        if (!productId && typeof item.product_id !== "undefined") {
          const parsedId = Number.parseInt(item.product_id, 10)
          if (!Number.isNaN(parsedId)) {
            productId = parsedId
          }
        }

        let productRow: any = null

        if (productId) {
          const products = (await executeQuery(
            "SELECT id, name, stock FROM products WHERE id = ?",
            [productId],
          )) as any[]
          if (products.length > 0) {
            productRow = products[0]
          }
        }

        if (!productRow && item.name) {
          const products = (await executeQuery(
            "SELECT id, name, stock FROM products WHERE LOWER(name) = LOWER(?) LIMIT 1",
            [item.name],
          )) as any[]
          if (products.length > 0) {
            productRow = products[0]
            productId = productRow.id
          }
        }

        if (!productRow || !productId) {
          console.warn(`No se encontró producto para el item: ${JSON.stringify(item)}`)
          continue
        }

        // Determinar la cantidad
        let quantity = 1 // Valor predeterminado
        if (item.quantity) {
          if (typeof item.quantity === "string" && item.quantity.includes(".")) {
            // Manejar cantidades decimales
            quantity = Math.round(Number.parseFloat(item.quantity))
          } else {
            quantity = Number.parseInt(item.quantity.toString(), 10)
          }
          if (isNaN(quantity)) quantity = 1
        }

        // Calcular nuevo stock
        const previousStock = Number(productRow.stock ?? 0)
        const newStock = Math.max(0, previousStock - quantity)

        console.log(
          `Actualizando stock del producto ${productRow.name} (ID: ${productId}): ${previousStock} -> ${newStock} (vendido: ${quantity})`,
        )

        // Actualizar el stock en MySQL
        await executeQuery("UPDATE products SET stock = ?, updated_at = NOW() WHERE id = ?", [newStock, productId])

        updatedProducts.push({
          id: productId,
          name: productRow.name,
          previousStock,
          newStock,
          quantity,
        })

        // Registrar el cambio de stock (opcional, si existe la tabla)
        try {
          await executeQuery(
            `INSERT INTO stock_changes (product_id, previous_stock, new_stock, change_amount, change_type, reference_id, notes, created_at)
             VALUES (?, ?, ?, ?, 'order', ?, ?, NOW())`,
            [productId, previousStock, newStock, quantity, orderId, `Pedido #${orderId}`],
          )
        } catch (logError: any) {
          if (logError?.code !== "ER_NO_SUCH_TABLE") {
            console.warn("No se pudo registrar el cambio de stock:", logError)
          }
        }
      } catch (itemError: any) {
        console.error(`Error al procesar item ${JSON.stringify(item)}:`, itemError)
      }
    }

    // 4. Marcar el pedido como procesado para stock (si la columna existe)
    try {
      await executeQuery("UPDATE orders SET stock_processed = 1 WHERE id = ?", [orderId])
    } catch (markError: any) {
      if (markError?.code !== "ER_BAD_FIELD_ERROR") {
        console.warn(`Error al marcar el pedido #${orderId} como procesado:`, markError)
      }
    }

    return {
      success: true,
      message: `Stock actualizado para ${updatedProducts.length} productos del pedido #${orderId}`,
      updatedProducts,
    }
  } catch (error: any) {
    console.error(`Error al actualizar stock para el pedido #${orderId}:`, error)
    return { success: false, message: `Error: ${error.message}` }
  }
}

/**
 * Actualiza el stock de productos basado en todos los pedidos no procesados
 * @returns Resultado de la operación
 */
export async function updateStockFromAllOrders(): Promise<{
  success: boolean
  message: string
  processedOrders: number
  failedOrders: number
  details?: Array<{ orderId: number; success: boolean; message: string }>
}> {
  try {
    console.log("Actualizando stock para todos los pedidos no procesados")

    let orders: Array<{ id: number }> = []
    try {
      orders = (await executeQuery(
        "SELECT id FROM orders WHERE stock_processed = 0 OR stock_processed IS NULL ORDER BY id",
      )) as any[]
    } catch (ordersError: any) {
      if (ordersError?.code === "ER_BAD_FIELD_ERROR") {
        console.warn(
          "La columna stock_processed no existe, se procesarán pedidos recientes basados en status",
        )
        orders = (await executeQuery(
          "SELECT id FROM orders WHERE status NOT IN ('cancelado', 'cancelled', 'canceled') ORDER BY id DESC LIMIT 50",
        )) as any[]
      } else {
        console.error("Error al obtener pedidos no procesados:", ordersError)
        return {
          success: false,
          message: `Error al obtener pedidos: ${ordersError.message}`,
          processedOrders: 0,
          failedOrders: 0,
        }
      }
    }

    if (!orders || orders.length === 0) {
      console.log("No hay pedidos pendientes de procesar para stock")
      return { success: true, message: "No hay pedidos pendientes de procesar", processedOrders: 0, failedOrders: 0 }
    }

    console.log(`Se encontraron ${orders.length} pedidos pendientes de procesar`)

    // 2. Procesar cada pedido
    const details = []
    let processedOrders = 0
    let failedOrders = 0

    for (const order of orders) {
      try {
        const result = await updateStockFromOrder(order.id)
        details.push({
          orderId: order.id,
          success: result.success,
          message: result.message,
        })

        if (result.success) {
          processedOrders++
        } else {
          failedOrders++
        }
      } catch (orderError: any) {
        console.error(`Error al procesar pedido #${order.id}:`, orderError)
        details.push({
          orderId: order.id,
          success: false,
          message: `Error: ${orderError.message}`,
        })
        failedOrders++
      }
    }

    return {
      success: true,
      message: `Procesados ${processedOrders} pedidos, fallidos ${failedOrders}`,
      processedOrders,
      failedOrders,
      details,
    }
  } catch (error: any) {
    console.error("Error al actualizar stock desde todos los pedidos:", error)
    return {
      success: false,
      message: `Error: ${error.message}`,
      processedOrders: 0,
      failedOrders: 0,
    }
  }
}
