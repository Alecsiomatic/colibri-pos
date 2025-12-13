 import { cookies } from "next/headers"
import { type NextRequest, NextResponse } from "next/server"
import { verifyUser } from "@/lib/db"
import { verifyAccessToken } from "@/lib/auth-mysql"

// Clave secreta para firmar cookies (en producción usar variable de entorno)
const AUTH_SECRET = process.env.JWT_SECRET || "auth_secret_key_restaurante_tus_tias"

// Función para iniciar sesión
export async function login(username: string, password: string) {
  try {
    // Verificar credenciales
    const user = await verifyUser(username, password)

    if (!user) {
      return { success: false, message: "Credenciales inválidas" }
    }

    // Crear payload de usuario (sin información sensible)
    const userPayload = {
      id: user.id,
      username: user.username,
      isAdmin: user.isAdmin,
      // Añadir timestamp para invalidar cookies antiguas
      timestamp: Date.now(),
    }

    // Convertir a string y codificar en base64
    const userDataStr = JSON.stringify(userPayload)
    const encodedData = Buffer.from(userDataStr).toString("base64")

    return {
      success: true,
      user: userPayload,
      encodedData,
    }
  } catch (error) {
    console.error("Error en login:", error)
    return { success: false, message: "Error interno del servidor" }
  }
}

// Función para obtener usuario actual
export async function getCurrentUser(request?: NextRequest) {
  try {
    const cookieStore = request?.cookies ?? (await cookies())
    const authToken = cookieStore.get("auth-token")?.value

    if (authToken) {
      const verified = verifyAccessToken(authToken)
      if (verified) {
        return {
          id: verified.id,
          email: verified.email,
          username: verified.username,
          isAdmin: Boolean(verified.is_admin),
          is_admin: Boolean(verified.is_admin), // Para compatibilidad
          is_driver: Boolean(verified.is_driver), // Para drivers
          is_waiter: Boolean(verified.is_waiter), // Para meseros
          timestamp: Date.now(),
        }
      }
    }

  const authCookie = cookieStore.get("user_session")

    if (!authCookie) {
      return null
    }

    // Decodificar datos del usuario
    const decodedData = Buffer.from(authCookie.value, "base64").toString()
    const userData = JSON.parse(decodedData)

    // Verificar si la sesión ha expirado (7 días)
    const now = Date.now()
    const sessionAge = 7 * 24 * 60 * 60 * 1000 // 7 días en milisegundos

    if (userData.timestamp && now - userData.timestamp > sessionAge) {
      return null
    }

    return userData
  } catch (error) {
    console.error("Error al obtener usuario actual:", error)
    return null
  }
}

// Middleware para verificar autenticación
export function requireAuth(handler: (request: NextRequest, user: any, ...rest: any[]) => any) {
  return async (request: NextRequest, ...rest: any[]) => {
    const user = await getCurrentUser(request)

    if (!user) {
      return NextResponse.json({ success: false, message: "No autorizado" }, { status: 401 })
    }

    return handler(request, user, ...rest)
  }
}

// Middleware para verificar si es administrador
export function requireAdmin(handler: (request: NextRequest, user: any, ...rest: any[]) => any) {
  return async (request: NextRequest, ...rest: any[]) => {
    const user = await getCurrentUser(request)

    if (!user || !user.isAdmin) {
      return NextResponse.json({ success: false, message: "Acceso denegado" }, { status: 403 })
    }

    return handler(request, user, ...rest)
  }
}
