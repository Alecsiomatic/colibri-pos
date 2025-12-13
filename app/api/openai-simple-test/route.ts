import { NextResponse } from "next/server"

export async function GET() {
  try {
    // Usar solo la API key del servidor
    const apiKey = process.env.OPENAI_API_KEY

    // Verificar si la API key está disponible
    if (!apiKey) {
      return NextResponse.json({ error: "API Key de OpenAI no configurada" }, { status: 500 })
    }

    console.log("API Key disponible")

    // Hacer una solicitud directa a la API de OpenAI sin usar el SDK
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
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
      }),
    })

    if (!response.ok) {
      const errorData = await response.json()
      console.error("Error en la respuesta de OpenAI:", errorData)
      return NextResponse.json(
        {
          success: false,
          error: "Error en la respuesta de OpenAI",
          status: response.status,
          details: errorData,
        },
        { status: response.status },
      )
    }

    const data = await response.json()
    console.log("Respuesta recibida de OpenAI")

    return NextResponse.json({
      success: true,
      message: "API de OpenAI funcionando correctamente",
      response: data.choices[0].message,
    })
  } catch (error: any) {
    console.error("Error en el test simple de OpenAI:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Error general",
        details: error.message || "Error desconocido",
      },
      { status: 500 },
    )
  }
}
