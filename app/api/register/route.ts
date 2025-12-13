import { type NextRequest, NextResponse } from "next/server"
import { registerUser } from "@/lib/db"
import { cookies } from "next/headers"

export async function POST(request: NextRequest) {
  const cookieStore = cookies()
  try {
    // 1. Obtener datos de la solicitud
    const body = await request.json()
    const { email, password, username } = body

    // 2. Validar datos
    if (!email || !password) {
      return NextResponse.json(
        { success: false, message: "Correo electrónico y contraseña son requeridos." },
        { status: 400 },
      )
    }

    if (password.length < 6) {
      return NextResponse.json(
        { success: false, message: "La contraseña debe tener al menos 6 caracteres" },
        { status: 400 },
      )
    }

    try {
      // 3. Registrar usuario
      const result = await registerUser(email, password, username)

      if (!result.success) {
        // Use the status from the result if available, otherwise default to 400 or 500
        const statusCode = result.status || (result.message?.includes("base de datos") ? 500 : 400)
        return NextResponse.json(
          { success: false, message: result.message, error_code: result.error_code },
          { status: statusCode },
        )
      }

      // 4. Devolver respuesta exitosa
      return NextResponse.json(
        {
          success: true,
          message: result.message, // "Usuario registrado y perfil creado." or similar
          userId: result.userId,
        },
        { status: 201 },
      ) // 201 Created for successful registration
    } catch (dbError: any) {
      console.error("Error en la base de datos:", dbError)

      // 5. Manejar errores específicos de la base de datos
      return NextResponse.json(
        {
          success: false,
          message: "Error al registrar usuario en la base de datos",
          error: dbError.message,
        },
        { status: 500 },
      )
    }
  } catch (error: any) {
    console.error("Error general en la ruta de registro:", error)

    // 6. Asegurar que siempre devolvemos una respuesta JSON válida
    return NextResponse.json({ success: false, message: "Error interno del servidor al registrar." }, { status: 500 })
  }
}
