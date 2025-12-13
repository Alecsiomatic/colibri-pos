import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { verifyAccessToken, getSessionByToken } from "@/lib/auth-mysql"

// Rutas protegidas que requieren autenticación
const protectedRoutes = ["/orders", "/checkout", "/profile"]

// Rutas protegidas que requieren ser administrador
const adminRoutes = ["/admin"]

export async function middleware(req: NextRequest) {
  // No aplicar middleware a rutas de API o recursos estáticos
  if (
    req.nextUrl.pathname.startsWith("/api/") ||
    req.nextUrl.pathname.startsWith("/_next/") ||
    req.nextUrl.pathname.includes(".")
  ) {
    return NextResponse.next()
  }

  const path = req.nextUrl.pathname

  // Verificar si la ruta requiere autenticación
  const requiresAuth = protectedRoutes.some((route) => path.startsWith(route))
  const requiresAdmin = adminRoutes.some((route) => path.startsWith(route))

  // Si no requiere autenticación ni permisos de admin, continuar
  if (!requiresAuth && !requiresAdmin) {
    return NextResponse.next()
  }

  // Obtener token de las cookies
  const authToken = req.cookies.get('auth-token')?.value

  if (!authToken) {
    return NextResponse.redirect(new URL(`/login?redirect=${encodeURIComponent(path)}`, req.url))
  }

  try {
    // Verificar token
    const user = verifyAccessToken(authToken)
    
    if (!user) {
      // Token inválido, intentar con la base de datos
      const sessionUser = await getSessionByToken(authToken)
      
      if (!sessionUser) {
        const response = NextResponse.redirect(new URL(`/login?redirect=${encodeURIComponent(path)}`, req.url))
        response.cookies.delete('auth-token')
        response.cookies.delete('refresh-token')
        return response
      }
    }

    // Si requiere permisos de admin, verificar
    if (requiresAdmin) {
      const currentUser = user || await getSessionByToken(authToken)
      
      if (!currentUser?.is_admin) {
        return NextResponse.redirect(new URL('/unauthorized', req.url))
      }
    }

    return NextResponse.next()

  } catch (error) {
    console.error('Error en middleware:', error)
    const response = NextResponse.redirect(new URL(`/login?redirect=${encodeURIComponent(path)}`, req.url))
    response.cookies.delete('auth-token')
    response.cookies.delete('refresh-token')
    return response
  }
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
}