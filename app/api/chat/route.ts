import { NextResponse } from "next/server"
import type { Product } from "@/lib/product-service"

interface Message {
  role: string
  content: string
}

interface ChatRequest {
  messages: Message[]
  products?: Product[]
}

export async function POST(request: Request) {
  try {
    const { messages, products = [] }: ChatRequest = await request.json()

    // Verificar si hay mensajes
    if (!messages || messages.length === 0) {
      return NextResponse.json({ error: "No se proporcionaron mensajes" }, { status: 400 })
    }

    // Obtener el último mensaje del usuario
    const lastUserMessage = messages[messages.length - 1].content

    // Procesar el mensaje y generar una respuesta
    const response = await processMessage(lastUserMessage, products)

    return NextResponse.json({ message: response })
  } catch (error) {
    console.error("Error en el procesamiento del chat:", error)
    return NextResponse.json({ error: "Error en el procesamiento del chat" }, { status: 500 })
  }
}

async function processMessage(message: string, products: Product[]): Promise<string> {
  // Convertir el mensaje a minúsculas para facilitar la comparación
  const lowerMessage = message.toLowerCase()

  // Verificar si el mensaje contiene preguntas sobre el menú o productos
  if (
    lowerMessage.includes("menú") ||
    lowerMessage.includes("carta") ||
    lowerMessage.includes("tienen") ||
    lowerMessage.includes("ofrecen") ||
    lowerMessage.includes("platos") ||
    lowerMessage.includes("comida") ||
    lowerMessage.includes("especialidad")
  ) {
    // Agrupar productos por categoría
    const productsByCategory: Record<string, Product[]> = {}

    products.forEach((product) => {
      const categoryName = product.category?.name || "Sin categoría"
      if (!productsByCategory[categoryName]) {
        productsByCategory[categoryName] = []
      }
      productsByCategory[categoryName].push(product)
    })

    // Construir respuesta con el menú
    let menuResponse = "Claro, te muestro nuestro menú:\n\n"

    Object.entries(productsByCategory).forEach(([category, categoryProducts]) => {
      menuResponse += `**${category}**:\n`
      categoryProducts.forEach((product) => {
        menuResponse += `- ${product.name}: $${product.price.toFixed(2)}\n`
      })
      menuResponse += "\n"
    })

    menuResponse += "Si deseas ordenar algo, solo dímelo. ¿Hay algo que te gustaría probar?"

    return menuResponse
  }

  // Verificar si el mensaje contiene preguntas sobre precios
  if (
    lowerMessage.includes("precio") ||
    lowerMessage.includes("cuesta") ||
    lowerMessage.includes("valor") ||
    lowerMessage.includes("cuánto")
  ) {
    // Buscar productos mencionados en el mensaje
    const mentionedProducts = products.filter((product) => lowerMessage.includes(product.name.toLowerCase()))

    if (mentionedProducts.length > 0) {
      let priceResponse = "Los precios de los productos que mencionas son:\n\n"

      mentionedProducts.forEach((product) => {
        priceResponse += `- ${product.name}: $${product.price.toFixed(2)}\n`
      })

      priceResponse += "\n¿Te gustaría ordenar alguno de estos productos?"

      return priceResponse
    }
  }

  // Verificar si el mensaje contiene intención de ordenar
  if (
    lowerMessage.includes("quiero") ||
    lowerMessage.includes("ordenar") ||
    lowerMessage.includes("pedir") ||
    lowerMessage.includes("llevar") ||
    lowerMessage.includes("comprar")
  ) {
    // Buscar productos mencionados en el mensaje
    const mentionedProducts = products.filter((product) => lowerMessage.includes(product.name.toLowerCase()))

    if (mentionedProducts.length > 0) {
      let orderResponse = "Excelente elección. Puedo agregar a tu carrito:\n\n"

      mentionedProducts.forEach((product) => {
        orderResponse += `- ${product.name}: $${product.price.toFixed(2)}\n`
      })

      orderResponse += "\n¿Deseas confirmar esta orden o agregar algo más?"

      return orderResponse
    }
  }

  // Verificar si el mensaje contiene preguntas sobre recomendaciones
  if (
    lowerMessage.includes("recomienda") ||
    lowerMessage.includes("sugerencia") ||
    lowerMessage.includes("popular") ||
    lowerMessage.includes("mejor") ||
    lowerMessage.includes("especial")
  ) {
    // Filtrar productos destacados o populares
    const featuredProducts = products.filter((product) => product.featured)

    if (featuredProducts.length > 0) {
      const randomProducts = featuredProducts
        .sort(() => 0.5 - Math.random())
        .slice(0, Math.min(3, featuredProducts.length))

      let recommendationResponse = "Te recomiendo probar estos platillos populares:\n\n"

      randomProducts.forEach((product) => {
        recommendationResponse += `- ${product.name}: $${product.price.toFixed(2)} - ${product.description || "Delicioso platillo de nuestra carta"}\n`
      })

      recommendationResponse += "\n¿Te gustaría ordenar alguno de estos?"

      return recommendationResponse
    }
  }

  // Respuesta predeterminada si no se detecta una intención específica
  return "¡Hola! Soy el asistente virtual de Sonora Express. Puedo ayudarte con nuestro menú, precios, recomendaciones o tomar tu orden. ¿En qué puedo ayudarte hoy?"
}
