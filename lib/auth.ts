import { cookies } from "next/headers"
import type { NextRequest } from "next/server"
import { createToken, verifyToken, type JwtPayload } from "./simple-jwt"
import { verifyAccessToken } from "./auth-mysql"

const JWT_SECRET = process.env.JWT_SECRET || "default_secret_key_change_this"

export type UserData = {
  id: number
  username: string
  isAdmin: boolean
}

// Crear token JWT
export function createAuthToken(user: UserData) {
  try {
    return createToken(
      { id: user.id, username: user.username, isAdmin: user.isAdmin },
      JWT_SECRET,
      60 * 60 * 24 * 7, // 7 días en segundos
    )
  } catch (error) {
    console.error("Error al crear token de autenticación:", error)
    throw new Error("No se pudo crear el token de autenticación")
  }
}

// Verificar token JWT
export function verifyAuthToken(token: string) {
  try {
    return verifyToken(token, JWT_SECRET) as JwtPayload | null
  } catch (error) {
    console.error("Error al verificar token de autenticación:", error)
    return null
  }
}

// Obtener usuario actual desde cookies
export async function getCurrentUser(request?: NextRequest) {
  try {
    const cookieStore = request ? request.cookies : await cookies()
    const rawToken = cookieStore.get("auth-token")?.value || cookieStore.get("auth_token")?.value

    if (!rawToken) {
      return null
    }

    const verified = verifyAccessToken(rawToken)
    if (verified) {
      return {
        id: verified.id,
        username: verified.username,
        isAdmin: Boolean(verified.is_admin),
        email: verified.email,
      } as UserData & { email: string }
    }

    const userData = verifyAuthToken(rawToken)
    if (!userData) {
      if (!request) {
        const store = await cookies()
        store.delete("auth-token")
        store.delete("auth_token")
      }
      return null
    }

    return userData as UserData
  } catch (error) {
    console.error("Error al obtener usuario actual:", error)
    return null
  }
}

// Middleware para verificar autenticación
export function requireAuth(handler: Function) {
  return async (request: NextRequest) => {
    try {
  const user = await getCurrentUser(request)

      if (!user) {
        return Response.json({ success: false, message: "No autorizado" }, { status: 401 })
      }

      return handler(request, user)
    } catch (error) {
      console.error("Error en requireAuth:", error)
      return Response.json({ success: false, message: "Error de autenticación" }, { status: 500 })
    }
  }
}

// Middleware para verificar si es administrador
export function requireAdmin(handler: Function) {
  return async (request: NextRequest) => {
    try {
  const user = await getCurrentUser(request)

      if (!user || !user.isAdmin) {
        return Response.json({ success: false, message: "Acceso denegado" }, { status: 403 })
      }

      return handler(request, user)
    } catch (error) {
      console.error("Error en requireAdmin:", error)
      return Response.json({ success: false, message: "Error de autenticación" }, { status: 500 })
    }
  }
}
