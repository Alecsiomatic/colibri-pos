import { type NextRequest, NextResponse } from "next/server"
import { verify } from "jsonwebtoken"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { token, libraries } = body

    // Verificamos el token
    const jwtSecret = process.env.JWT_SECRET

    if (!jwtSecret) {
      console.error("JWT_SECRET no está configurado")
      return NextResponse.json({ error: "Error de configuración del servidor" }, { status: 500 })
    }

    try {
      // Verificamos que el token sea válido
      const decoded = verify(token, jwtSecret)

      // Verificamos que el token sea para el propósito correcto
      if ((decoded as any).purpose !== "maps") {
        console.error("Token con propósito incorrecto")
        return NextResponse.json({ error: "Token inválido" }, { status: 401 })
      }

      // Obtenemos la clave de API desde las variables de entorno del servidor
      const apiKey = process.env.GOOGLE_MAPS_API_KEY || ""

      if (!apiKey) {
        console.error("GOOGLE_MAPS_API_KEY no está configurada")
        return NextResponse.json({ error: "Error de configuración del servidor" }, { status: 500 })
      }

      // Creamos la URL del script con la clave de API
      const scriptUrl = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=${libraries || "places,geometry"}`

      // Devolvemos la URL como respuesta
      return NextResponse.json({ url: scriptUrl })
    } catch (error) {
      console.error("Error al verificar token:", error)
      return NextResponse.json({ error: "Token inválido o expirado" }, { status: 401 })
    }
  } catch (error) {
    console.error("Error al procesar solicitud:", error)
    return NextResponse.json({ error: "Error al procesar la solicitud" }, { status: 400 })
  }
}
