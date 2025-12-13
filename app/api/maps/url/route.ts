import { NextResponse } from "next/server"
import { sign } from "jsonwebtoken"

export async function GET() {
  try {
    // Verificamos que tengamos la clave secreta para JWT
    const jwtSecret = process.env.JWT_SECRET

    if (!jwtSecret) {
      console.error("JWT_SECRET no está configurado")
      return NextResponse.json({ error: "Error de configuración del servidor" }, { status: 500 })
    }

    // Creamos un token que expira en 1 hora
    const token = sign(
      {
        purpose: "maps",
        libraries: "places,geometry",
      },
      jwtSecret,
      { expiresIn: "1h" },
    )

    // Devolvemos el token y las bibliotecas necesarias
    return NextResponse.json({
      token,
      libraries: "places,geometry",
    })
  } catch (error) {
    console.error("Error al generar token para Google Maps:", error)
    return NextResponse.json({ error: "Error al generar token" }, { status: 500 })
  }
}
