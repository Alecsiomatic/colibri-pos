import { NextResponse } from "next/server"
import OpenAI from "openai"

export async function GET() {
  try {
    // Verificar si la API key está disponible
    if (!process.env.OPENAI_API_KEY) {
      console.error("API Key de OpenAI no encontrada en las variables de entorno")
      return NextResponse.json(
        {
          success: false,
          error: "API Key de OpenAI no configurada",
          details: "La variable de entorno OPENAI_API_KEY no está definida o está vacía",
        },
        { status: 500 },
      )
    }

    console.log(
      "Test de OpenAI: API Key disponible (primeros 5 caracteres):",
      process.env.OPENAI_API_KEY.substring(0, 5) + "...",
    )

    try {
      // Inicializar OpenAI con la API key
      const openai = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY,
      })

      console.log("Test de OpenAI: Cliente inicializado correctamente")

      // Hacer una solicitud simple a OpenAI
      const completion = await openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [
          {
            role: "system",
            content: "Eres un asistente útil.",
          },
          {
            role: "user",
            content: "Hola, dime hola en español.",
          },
        ],
        max_tokens: 20,
      })

      console.log("Test de OpenAI: Respuesta recibida:", completion.choices[0].message)

      // Devolver la respuesta
      return NextResponse.json({
        success: true,
        message: "API de OpenAI funcionando correctamente",
        response: completion.choices[0].message,
      })
    } catch (openaiError: any) {
      console.error("Error específico de OpenAI:", openaiError)

      // Extraer información detallada del error
      const errorDetails = {
        message: openaiError.message || "Error desconocido",
        type: openaiError.type || "unknown",
        code: openaiError.code || "unknown",
        param: openaiError.param,
        status: openaiError.status,
      }

      return NextResponse.json(
        {
          success: false,
          error: "Error al comunicarse con OpenAI",
          details: errorDetails,
        },
        { status: 500 },
      )
    }
  } catch (error: any) {
    console.error("Error general en el test de OpenAI:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Error general",
        details: error.message || "Error desconocido",
        stack: process.env.NODE_ENV === "development" ? error.stack : undefined,
      },
      { status: 500 },
    )
  }
}
