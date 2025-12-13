import { executeTransaction } from "@/lib/mysql-db"

/**
 * Envía un mensaje de texto a través de WhatsApp
 */
export async function sendWhatsAppTextMessage(to: string, text: string) {
  try {
    const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID
    const accessToken = process.env.WHATSAPP_ACCESS_TOKEN

    if (!phoneNumberId || !accessToken) {
      throw new Error("Faltan variables de entorno para WhatsApp")
    }

    const response = await fetch(`https://graph.facebook.com/v17.0/${phoneNumberId}/messages`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        recipient_type: "individual",
        to,
        type: "text",
        text: { body: text },
      }),
    })

    if (!response.ok) {
      const errorData = await response.json()
      console.error("Error al enviar mensaje a WhatsApp:", errorData)
      throw new Error(`Error al enviar mensaje: ${JSON.stringify(errorData)}`)
    }

    const data = await response.json()
    console.log("Mensaje enviado correctamente:", data)
    return data
  } catch (error) {
    console.error("Error al enviar mensaje a WhatsApp:", error)
    throw error
  }
}

/**
 * Borra una conversación y todos sus mensajes
 */
export async function deleteConversation(conversationId: string) {
  try {
    await executeTransaction([
      { query: "DELETE FROM chat_messages WHERE conversation_id = ?", params: [conversationId] },
      { query: "DELETE FROM chat_conversations WHERE id = ?", params: [conversationId] },
    ])

    return { success: true }
  } catch (error) {
    console.error("Error al eliminar conversación:", error)
    return { success: false, error }
  }
}

/**
 * Borra todas las conversaciones y mensajes
 */
export async function deleteAllConversations() {
  try {
    await executeTransaction([
      { query: "DELETE FROM chat_messages", params: [] },
      { query: "DELETE FROM chat_conversations", params: [] },
    ])

    return { success: true }
  } catch (error) {
    console.error("Error al eliminar todas las conversaciones:", error)
    return { success: false, error }
  }
}
