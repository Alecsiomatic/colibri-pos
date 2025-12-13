import { NextResponse } from "next/server"

export async function GET() {
  try {
    // Verificamos las variables de entorno necesarias
    const jwtSecret = process.env.JWT_SECRET
    const apiKey = process.env.GOOGLE_MAPS_API_KEY

    // Creamos un objeto con información de diagnóstico
    const diagnosticInfo = {
      jwtSecretConfigured: !!jwtSecret,
      apiKeyConfigured: !!apiKey,
      apiKeyFirstChars: apiKey ? `${apiKey.substring(0, 5)}...` : null,
      environment: process.env.NODE_ENV,
      timestamp: new Date().toISOString(),
    }

    // Devolvemos la información de diagnóstico
    return NextResponse.json(diagnosticInfo)
  } catch (error) {
    console.error("Error en diagnóstico de Google Maps:", error)
    return NextResponse.json({ error: "Error al realizar diagnóstico" }, { status: 500 })
  }
}
