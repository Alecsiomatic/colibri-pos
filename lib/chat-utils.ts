import OpenAI from "openai"

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

/**
 * Detecta si el mensaje contiene una intención de proceder con el pedido
 */
export function detectProceedIntent(message: string): boolean {
  const lowerMessage = message.toLowerCase()

  // Patrones para detectar intención de proceder
  const proceedPatterns = [
    /\b(proceder|continuar|seguir|adelante|listo|ok|okay|vale|bueno|confirmar|confirmo|aceptar|acepto)\b/i,
    /\b(hacer|realizar|completar|finalizar|terminar)(\s+un|\s+el|\s+mi)?\s+(pedido|orden|compra)\b/i,
    /\b(quiero|deseo|me\s+gustaría|quisiera)(\s+hacer|\s+realizar|\s+completar|\s+finalizar|\s+terminar)?(\s+un|\s+el|\s+mi)?\s+(pedido|orden|compra)\b/i,
    /\bsí\b/i,
    /\bsi\b/i,
    /\bya\b/i,
    /\blisto\b/i,
    /\bvamos\b/i,
  ]

  // Verificar si alguno de los patrones coincide
  return proceedPatterns.some((pattern) => pattern.test(lowerMessage))
}

/**
 * Detecta el número de personas mencionado en el mensaje
 */
export async function detectNumberOfPeople(message: string): Promise<number | null> {
  try {
    // Patrones simples para detectar números de personas
    const personasRegex = /(\d+)\s*(personas?|gente|comensales|invitados|amigos|familia|asistentes)/i
    const match = message.match(personasRegex)

    if (match) {
      return Number.parseInt(match[1], 10)
    }

    // Si no hay un patrón claro, usar OpenAI para extraer el número
    const response = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content:
            "Eres un asistente que extrae información numérica. Extrae SOLO el número de personas mencionado en el mensaje. Si no hay un número de personas, responde con 'null'.",
        },
        {
          role: "user",
          content: message,
        },
      ],
      temperature: 0.1,
      max_tokens: 10,
    })

    const content = response.choices[0].message.content?.trim()

    if (content === "null" || !content) {
      return null
    }

    // Intentar extraer un número del contenido
    const numberMatch = content.match(/\d+/)
    if (numberMatch) {
      return Number.parseInt(numberMatch[0], 10)
    }

    return null
  } catch (error) {
    console.error("Error al detectar número de personas:", error)
    return null
  }
}
