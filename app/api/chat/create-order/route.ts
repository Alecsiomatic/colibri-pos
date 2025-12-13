import { NextResponse } from "next/server"
import { processOrder } from "@/lib/order-processor"

export async function POST(request: Request) {
  console.log("Iniciando procesamiento de pedido desde chat")
  try {
    // Verificar que la solicitud sea JSON
    const contentType = request.headers.get("content-type")
    if (!contentType || !contentType.includes("application/json")) {
      return NextResponse.json(
        { success: false, error: "La solicitud debe ser JSON" },
        { status: 400, headers: { "Content-Type": "application/json" } },
      )
    }

    // Analizar el cuerpo de la solicitud
    let body
    try {
      body = await request.json()
    } catch (parseError) {
      console.error("Error al analizar JSON de la solicitud:", parseError)
      return NextResponse.json(
        { success: false, error: "Error al analizar JSON de la solicitud" },
        { status: 400, headers: { "Content-Type": "application/json" } },
      )
    }

    const { products, customerInfo, total } = body

    // Validación más robusta de datos de entrada
    if (!products) {
      return NextResponse.json(
        { success: false, error: "No se proporcionaron productos" },
        { status: 400, headers: { "Content-Type": "application/json" } },
      )
    }

    if (!Array.isArray(products)) {
      return NextResponse.json(
        { success: false, error: "El formato de productos es inválido" },
        { status: 400, headers: { "Content-Type": "application/json" } },
      )
    }

    if (products.length === 0) {
      return NextResponse.json(
        { success: false, error: "La lista de productos está vacía" },
        { status: 400, headers: { "Content-Type": "application/json" } },
      )
    }

    // Validar que cada producto tenga los campos necesarios
    for (const product of products) {
      if (!product.id) {
        return NextResponse.json(
          { success: false, error: "Uno o más productos no tienen ID" },
          { status: 400, headers: { "Content-Type": "application/json" } },
        )
      }
      if (typeof product.quantity !== "number" || product.quantity <= 0) {
        return NextResponse.json(
          { success: false, error: "Cantidad de producto inválida" },
          { status: 400, headers: { "Content-Type": "application/json" } },
        )
      }
    }

    // Verificar información del cliente mínima
    if (!customerInfo) {
      return NextResponse.json(
        { success: false, error: "No se proporcionó información del cliente" },
        { status: 400, headers: { "Content-Type": "application/json" } },
      )
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

    try {
      // Procesar el pedido usando la función centralizada
      const result = await processOrder({
        products,
        customerInfo: processedCustomerInfo,
        total: processedTotal,
      })

      if (!result.success) {
        console.error("Error al procesar pedido:", result.error)
        return NextResponse.json(
          { success: false, error: result.error },
          { status: 500, headers: { "Content-Type": "application/json" } },
        )
      }

      console.log("Pedido creado exitosamente:", result.order)
      return NextResponse.json(
        { success: true, order: result.order },
        { headers: { "Content-Type": "application/json" } },
      )
    } catch (processError: any) {
      console.error("Error al procesar el pedido:", processError)
      return NextResponse.json(
        {
          success: false,
          error: `Error al procesar el pedido: ${processError.message || "Error desconocido"}`,
        },
        { status: 500, headers: { "Content-Type": "application/json" } },
      )
    }
  } catch (error: any) {
    console.error("Error general al crear el pedido desde el chat:", error)
    return NextResponse.json(
      {
        success: false,
        error: `Error al procesar la solicitud: ${error.message || "Error desconocido"}`,
        details: error.stack,
      },
      { status: 500, headers: { "Content-Type": "application/json" } },
    )
  }
}
