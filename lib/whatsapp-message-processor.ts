import { generateText } from "ai"
import { openai } from "@ai-sdk/openai"
import { executeQuery } from "@/lib/mysql-db"

// Tipos para el estado de conversación
type ConversationState = {
  stage: "initial" | "collecting_name" | "collecting_address" | "confirming_order" | "completed"
  customerName: string
  customerAddress: string
  phone: string
  lastProcessedMessageId: string | null
}

// Mapa en memoria para conversaciones activas
const activeConversations = new Map<string, ConversationState>()

// Función para obtener productos reales de la base de datos
async function getRealProducts() {
  try {
    const products = (await executeQuery(
      `SELECT id, name, description, price, category, active, stock
       FROM products
       WHERE active = 1
       ORDER BY category ASC, name ASC`,
    )) as any[]

    return Array.isArray(products) ? products : []
  } catch (error) {
    console.error("Error in getRealProducts:", error)
    return []
  }
}

// Función para formatear productos para el contexto de IA
function formatProductsForAI(products: any[]) {
  const productsByCategory = products.reduce<Record<string, any[]>>((acc, product: any) => {
    const categoryKey = product.category || "Sin categoría"
    if (!acc[categoryKey]) {
      acc[categoryKey] = []
    }
    acc[categoryKey].push(product)
    return acc
  }, {})

  let formattedText = "PRODUCTOS DISPONIBLES:\n\n"

  for (const [category, categoryProducts] of Object.entries(productsByCategory)) {
    formattedText += `📂 ${category.toUpperCase()}:\n`
    categoryProducts.forEach((product) => {
      formattedText += `• ${product.name} - $${product.price} MXN\n`
      if (product.description) {
        formattedText += `  ${product.description}\n`
      }
      formattedText += `  Stock: ${product.stock > 0 ? "Disponible" : "Agotado"}\n\n`
    })
  }

  return formattedText
}

function getMexicoTime() {
  const now = new Date()
  return {
    date: now.toLocaleDateString("es-MX", {
      timeZone: "America/Mexico_City",
      year: "numeric",
      month: "long",
      day: "numeric",
    }),
    time: now.toLocaleTimeString("es-MX", {
      timeZone: "America/Mexico_City",
      hour12: true,
      hour: "2-digit",
      minute: "2-digit",
    }),
  }
}

async function sendAdminNotification(customerName: string, customerAddress: string, phone: string) {
  try {
    const adminPhone = process.env.ADMIN_PHONE_NUMBER
    if (!adminPhone) {
      console.error("ADMIN_PHONE_NUMBER no está configurado")
      return
    }

    const { date, time } = getMexicoTime()

    const message = `🔔 *NUEVO CLIENTE INTERESADO*

👤 *Cliente:* ${customerName}
📱 *Teléfono:* ${phone}
📍 *Dirección:* ${customerAddress}

📅 *Fecha:* ${date}
🕐 *Hora:* ${time}

El cliente está interesado en hacer un pedido. Por favor, contactarlo lo antes posible.`

    const response = await fetch(`https://graph.facebook.com/v17.0/${process.env.WHATSAPP_PHONE_NUMBER_ID}/messages`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.WHATSAPP_ACCESS_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        to: adminPhone,
        type: "text",
        text: { body: message },
      }),
    })

    if (!response.ok) {
      throw new Error(`Error enviando mensaje al admin: ${response.statusText}`)
    }

    console.log("Notificación enviada al administrador exitosamente")
  } catch (error) {
    console.error("Error enviando notificación al administrador:", error)
  }
}

function parseMetadata(raw: any) {
  if (!raw) return {}
  if (typeof raw === "string") {
    try {
      return JSON.parse(raw)
    } catch (error) {
      console.warn("No se pudo parsear metadata, se utilizará objeto vacío", error)
      return {}
    }
  }
  return raw
}

async function getConversationMetadata(conversationId: string) {
  try {
    const rows = (await executeQuery(
      `SELECT metadata
       FROM chat_conversations
       WHERE id = ?
       LIMIT 1`,
      [conversationId],
    )) as Array<{ metadata: any }>

    if (!rows || rows.length === 0) {
      return {}
    }

    return parseMetadata(rows[0]?.metadata)
  } catch (error) {
    console.error("Error obteniendo metadata de conversación:", error)
    return {}
  }
}

async function saveConversationState(conversationId: string, state: ConversationState) {
  try {
    const currentMetadata = await getConversationMetadata(conversationId)
    const mergedMetadata = {
      ...currentMetadata,
      conversationState: state,
    }

    await executeQuery(
      `UPDATE chat_conversations
       SET metadata = ?, updated_at = NOW()
       WHERE id = ?`,
      [JSON.stringify(mergedMetadata), conversationId],
    )
  } catch (error) {
    console.error("Error guardando estado de conversación:", error)
  }
}

async function getMessageHistory(conversationId: string) {
  try {
    const rows = (await executeQuery(
      `SELECT content, role
       FROM chat_messages
       WHERE conversation_id = ?
       ORDER BY created_at ASC
       LIMIT 10`,
      [conversationId],
    )) as Array<{ content: string; role: string }>

    return rows || []
  } catch (error) {
    console.error("Error obteniendo historial de mensajes:", error)
    return []
  }
}

export async function processWhatsAppMessage(
  message: string,
  phoneNumber: string,
  conversationId: string,
  messageId: string,
): Promise<string> {
  try {
    // Obtener productos y categorías reales
    const products = await getRealProducts()

    // Obtener o crear estado de conversación
    let conversationState = activeConversations.get(phoneNumber)

    if (!conversationState) {
      // Intentar recuperar desde base de datos
      const metadata = await getConversationMetadata(conversationId)
      conversationState = {
        stage: "initial",
        customerName: "",
        customerAddress: "",
        phone: phoneNumber,
        lastProcessedMessageId: null,
        ...(metadata?.conversationState || {}),
      }
    }

    if (!conversationState) {
      throw new Error("No se pudo inicializar el estado de la conversación")
    }

    // Verificar si ya procesamos este mensaje
    if (conversationState && conversationState.lastProcessedMessageId === messageId) {
      return ""
    }

    // Actualizar el ID del último mensaje procesado
    conversationState.lastProcessedMessageId = messageId

    const messageLower = message.toLowerCase().trim()

    // Verificar palabra clave para iniciar proceso de pedido
    if (messageLower === "llamame" || messageLower === "llámame") {
      conversationState.stage = "collecting_name"
      conversationState.customerName = ""
      conversationState.customerAddress = ""

      // Guardar estado
      activeConversations.set(phoneNumber, conversationState)
      await saveConversationState(conversationId, conversationState)

      return "¡Perfecto! Para que uno de nuestros agentes se ponga en contacto contigo, necesito algunos datos.\n\n¿Cuál es tu nombre completo?"
    }

    // Manejar estados específicos
    switch (conversationState.stage) {
      case "collecting_name":
        conversationState.customerName = message.trim()
        conversationState.stage = "collecting_address"

        // Guardar estado
        activeConversations.set(phoneNumber, conversationState)
        await saveConversationState(conversationId, conversationState)

        return `Gracias ${conversationState.customerName}. Ahora necesito tu dirección completa para que nuestro agente pueda contactarte.`

      case "collecting_address":
        conversationState.customerAddress = message.trim()
        conversationState.stage = "confirming_order"

        // Guardar estado
        activeConversations.set(phoneNumber, conversationState)
  await saveConversationState(conversationId, conversationState)

        return `Perfecto ${conversationState.customerName}, he registrado tu dirección:\n\n📍 ${conversationState.customerAddress}\n\n¿Confirmas que quieres que un agente se contacte contigo para hacer tu pedido?\n\nResponde: *SI* para confirmar`

      case "confirming_order":
        if (messageLower === "si" || messageLower === "sí") {
          // Enviar notificación al administrador
          await sendAdminNotification(conversationState.customerName, conversationState.customerAddress, phoneNumber)

          conversationState.stage = "completed"

          // Guardar estado
          activeConversations.set(phoneNumber, conversationState)
          await saveConversationState(conversationId, conversationState)

          return `¡Listo ${conversationState.customerName}! 🎉\n\nHe enviado tu información a nuestro equipo. Un agente se pondrá en contacto contigo muy pronto para tomar tu pedido.\n\n¡Gracias por elegirnos! 🥩✨\n\nSi tienes más preguntas sobre nuestros productos, estaré aquí para ayudarte.`
        } else if (messageLower === "no") {
          conversationState.stage = "initial"
          conversationState.customerName = ""
          conversationState.customerAddress = ""

          // Guardar estado
          activeConversations.set(phoneNumber, conversationState)
          await saveConversationState(conversationId, conversationState)

          return "Entendido. Si cambias de opinión y quieres que un agente se contacte contigo, solo escribe: *LLAMAME*\n\n¿En qué más puedo ayudarte con información sobre nuestros productos?"
        } else {
          return "Por favor responde *SI* para confirmar que quieres que un agente se contacte contigo, o *NO* si prefieres seguir consultando."
        }

      case "completed":
        // Resetear a modo consulta después de completar
        conversationState.stage = "initial"
        conversationState.customerName = ""
        conversationState.customerAddress = ""

        // Guardar estado
        activeConversations.set(phoneNumber, conversationState)
    await saveConversationState(conversationId, conversationState)

        // Continuar con el procesamiento normal
        break

      default:
        // Modo consulta normal
        break
    }

    // Si llegamos aquí, estamos en modo consulta (stage: "initial")
    // Solo procesar si no estamos en un estado específico
    if (conversationState.stage !== "initial") {
      return ""
    }

    // Obtener historial de mensajes para contexto
    const messageHistory = await getMessageHistory(conversationId)

    const formattedHistory = messageHistory.map((msg: any) => ({
      role: msg.role,
      content: msg.content,
    }))

    // Formatear productos para el contexto de IA
    const productsContext = formatProductsForAI(products)

    // Mensaje del sistema con productos reales
    const systemMessage = {
      role: "system" as const,
      content: `Eres un asistente experto del restaurante, especializado en ayudar a los clientes con el menú y productos.

PRODUCTOS REALES DISPONIBLES:
${productsContext}

INSTRUCCIONES IMPORTANTES:
- Eres un CONSULTOR EXPERTO en carnes, no tomas pedidos específicos
- Da información detallada sobre productos, características, sabores, texturas y precios
- Haz preguntas útiles como: "¿Para qué ocasión?", "¿Para cuántas personas?", "¿Prefieres cortes suaves o con más sabor?"
- Da recomendaciones específicas basadas en las necesidades del cliente
- Explica las diferencias entre cortes y por qué recomiendas cada uno
- NUNCA preguntes por cantidades, piezas, kilos o números específicos
- NUNCA digas frases como "¿cuántas piezas quieres?" o "¿qué cantidad necesitas?"

EJEMPLOS DE LO QUE NO DEBES HACER:
- ❌ "¿Cuántas piezas de Rib Eye quieres?"
- ❌ "¿Qué cantidad necesitas?"
- ❌ "¿Cuántos kilos?"

EJEMPLOS DE LO QUE SÍ DEBES HACER:
- ✅ "El Rib Eye Sonora es nuestro corte premium, muy jugoso y con excelente marmoleo"
- ✅ "Para una cena especial te recomiendo el Medallón de Filete, es muy suave"
- ✅ "¿Es para una ocasión especial o una comida familiar?"

PROCESO DE PEDIDOS:
- Cuando el cliente esté listo para hacer un pedido, debe escribir exactamente: "LLAMAME"
- Solo entonces inicias la recopilación de datos (nombre y dirección)
- Explícale claramente que debe escribir "LLAMAME" cuando quiera que un agente se contacte

Sé cálido, profesional y enfócate en ser un consultor experto que ayuda a elegir el mejor producto.`,
    }

    // Generar respuesta con OpenAI
    const { text } = await generateText({
      model: openai("gpt-4o"),
      messages: [systemMessage, ...formattedHistory, { role: "user", content: message }],
      temperature: 0.7,
  maxOutputTokens: 500,
    })

    // Guardar estado actualizado
    activeConversations.set(phoneNumber, conversationState)
    await saveConversationState(conversationId, conversationState)

    return text
  } catch (error) {
    console.error("Error procesando mensaje de WhatsApp:", error)
    return "Disculpa, hubo un error procesando tu mensaje. Por favor intenta de nuevo."
  }
}
