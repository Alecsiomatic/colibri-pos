import { NextResponse } from "next/server"
import { processOrder } from "@/lib/order-processor"
// Añadir la función para crear un cliente admin
import { createAdminClient } from "@/lib/supabase/server"
import { createClient } from "@/lib/supabase/server"

// Buscar la función updateStockAfterOrder y asegurarse de que use el cliente admin cuando sea necesario
export async function updateStockAfterOrder(
  orderItems: Array<{ product_id: number; quantity: number }>,
  orderId: number,
  useAdmin = false,
): Promise<{ success: boolean; message?: string }> {
  try {
    console.log(`Actualizando stock para orden #${orderId} con ${orderItems.length} items. Usando admin: ${useAdmin}`)

    // Usar cliente admin si se solicita explícitamente
    const supabase = useAdmin ? createAdminClient() : createClient()

    // Resto de la función...
    // ...

    return { success: true }
  } catch (error: any) {
    console.error(`Error al actualizar stock para orden #${orderId}:`, error)
    return { success: false, message: error.message }
  }
}

export async function POST(request: Request) {
  console.log("Iniciando procesamiento de pedido desde chat")
  try {
    const { products, customerInfo, total } = await request.json()

    // Validación más robusta de datos de entrada
    if (!products) {
      return NextResponse.json({ error: "No se proporcionaron productos" }, { status: 400 })
    }

    if (!Array.isArray(products)) {
      return NextResponse.json({ error: "El formato de productos es inválido" }, { status: 400 })
    }

    if (products.length === 0) {
      return NextResponse.json({ error: "La lista de productos está vacía" }, { status: 400 })
    }

    // Validar que cada producto tenga los campos necesarios
    for (const product of products) {
      if (!product.id) {
        return NextResponse.json({ error: "Uno o más productos no tienen ID" }, { status: 400 })
      }
      if (typeof product.quantity !== "number" || product.quantity <= 0) {
        return NextResponse.json({ error: "Cantidad de producto inválida" }, { status: 400 })
      }
    }

    // Verificar información del cliente mínima
    if (!customerInfo) {
      return NextResponse.json({ error: "No se proporcionó información del cliente" }, { status: 400 })
    }

    // Establecer valores por defecto para customerInfo si faltan
    const processedCustomerInfo = {
      name: customerInfo.name || "Cliente sin nombre",
      phone: customerInfo.phone || "0000000000",
      deliveryType: customerInfo.deliveryType || "pickup",
      address: customerInfo.deliveryType === "delivery" ? customerInfo.address || "Dirección pendiente" : undefined,
      pickupTime: customerInfo.deliveryType === "pickup" ? customerInfo.pickupTime || "Por confirmar" : undefined,
      notes: customerInfo.notes || "Sin notas adicionales",
      source: customerInfo.source || "chat-web",
    }

    // Calcular total si no se proporcionó o es inválido
    let processedTotal = total
    if (typeof total !== "number" || isNaN(total) || total <= 0) {
      processedTotal = products.reduce((sum, product) => sum + product.price * product.quantity, 0)
    }

    console.log("Procesando pedido desde chat con datos:", {
      products: products.length,
      customerInfo: processedCustomerInfo,
      total: processedTotal,
    })

    // Procesar el pedido usando la función centralizada
    const result = await processOrder({
      products,
      customerInfo: processedCustomerInfo,
      total: processedTotal,
    })

    if (!result.success) {
      console.error("Error al procesar pedido:", result.error)
      return NextResponse.json({ error: result.error }, { status: 500 })
    }

    console.log("Pedido creado exitosamente:", result.order)
    return NextResponse.json({
      success: true,
      order: result.order,
    })
  } catch (error: any) {
    console.error("Error detallado al crear el pedido desde el chat:", error)
    return NextResponse.json(
      {
        error: `Error al procesar la solicitud: ${error.message || "Error desconocido"}`,
        details: error.stack,
      },
      {
        status: 500,
      },
    )
  }
}
