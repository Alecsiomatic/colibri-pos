import { NextResponse } from "next/server"

export async function GET() {
  // Verificar si la API key está configurada (sin exponer la key)
  const isConfigured = !!process.env.OPENAI_API_KEY

  return NextResponse.json({
    configured: isConfigured,
  })
}
