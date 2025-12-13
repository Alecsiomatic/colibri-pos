import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

// Rutas protegidas que requieren autenticación
const protectedRoutes = ["/orders", "/checkout", "/profile"]

// Rutas protegidas que requieren ser administrador
const adminRoutes = ["/admin"]

// Rutas protegidas que requieren ser driver
const driverRoutes = ["/driver"]

// Función simple para verificar si es un token válido (sin verificar firma por ahora)
function isValidTokenFormat(token: string): boolean {

  try {
    const parts = token.split('.')
    if (parts.length !== 3) return false
    const payload = JSON.parse(atob(parts[1]))
    if (!payload.id || !payload.email || !payload.exp) return false
    const now = Math.floor(Date.now() / 1000)
    if (payload.exp < now) return false
    return true
  } catch {
    return false
  }
}



// Función para obtener información del usuario del token (sin verificar firma)
function getUserFromToken(token: string): { id: number, email: string, username: string, is_admin: number, is_driver: number } | null {

  try {
    const parts = token.split('.')
    if (parts.length !== 3) return null
    const payload = JSON.parse(atob(parts[1]))
    return {
      id: payload.id,
      email: payload.email,
      username: payload.username,
      is_admin: payload.is_admin || 0,
      is_driver: payload.is_driver || 0
    }
  } catch {
    return null
  }
}

export async function middleware(req: NextRequest) {
  let response: NextResponse | undefined = undefined;
  // No aplicar middleware a rutas de API o recursos estáticos
  if (
    req.nextUrl.pathname.startsWith("/api/") ||
    req.nextUrl.pathname.startsWith("/_next/") ||
    req.nextUrl.pathname.includes(".")
  ) {
    response = NextResponse.next();
  } else {
    const path = req.nextUrl.pathname;
    console.log('🔍 Middleware verificando ruta:', path);

    // Verificar si la ruta requiere autenticación
    const requiresAuth = protectedRoutes.some((route) => path.startsWith(route));
    const requiresAdmin = adminRoutes.some((route) => path.startsWith(route));
    const requiresDriver = driverRoutes.some((route) => path.startsWith(route));

    console.log('🔐 Requiere auth:', requiresAuth, 'Requiere admin:', requiresAdmin, 'Requiere driver:', requiresDriver);

    // Si no requiere autenticación ni permisos especiales, continuar
    if (!requiresAuth && !requiresAdmin && !requiresDriver) {
      console.log('✅ Ruta pública, continuando');
      response = NextResponse.next();
    } else {
      // Obtener token de las cookies
      const authToken = req.cookies.get('auth-token')?.value;
      const allCookies = req.cookies.getAll();
      
      // También revisar el header Authorization para localStorage
      const authHeader = req.headers.get('Authorization');
      const tokenFromHeader = authHeader?.startsWith('Bearer ') ? authHeader.substring(7) : null;
      
      const finalToken = authToken || tokenFromHeader;
      
      console.log('🎫 Token encontrado:', finalToken ? 'SÍ' : 'NO');
      console.log('🍪 Todas las cookies:', allCookies.map(c => `${c.name}=${c.value.substring(0, 20)}...`).join(', '));
      console.log('🔎 Headers de request:', {
        'cookie': req.headers.get('cookie'),
        'authorization': req.headers.get('authorization'),
        'user-agent': req.headers.get('user-agent'),
        'host': req.headers.get('host')
      });

      if (!finalToken) {
        console.log('❌ Sin token, redirigiendo a login');
        response = NextResponse.redirect(new URL(`/login?redirect=${encodeURIComponent(path)}`, req.url));
      } else {
        try {
          // Verificar si el token tiene formato válido
          if (!isValidTokenFormat(finalToken)) {
            console.log('❌ Token con formato inválido o expirado');
            response = NextResponse.redirect(new URL(`/login?redirect=${encodeURIComponent(path)}`, req.url));
            response.cookies.delete('auth-token');
            response.cookies.delete('refresh-token');
          } else {
            // Obtener información del usuario del token
            const user = getUserFromToken(finalToken);
            console.log('👤 Usuario del token:', user);

            if (!user) {
              console.log('❌ No se pudo obtener usuario del token');
              response = NextResponse.redirect(new URL(`/login?redirect=${encodeURIComponent(path)}`, req.url));
              response.cookies.delete('auth-token');
              response.cookies.delete('refresh-token');
            } else {
              // Si requiere permisos de admin, verificar
              if (requiresAdmin) {
                console.log('🔒 Verificando permisos admin para:', user);
                console.log('🔍 is_admin value:', user.is_admin, 'type:', typeof user.is_admin);
                if (!user.is_admin || user.is_admin === 0) {
                  console.log('❌ Usuario no es admin, redirigiendo');
                  response = NextResponse.redirect(new URL('/unauthorized', req.url));
                } else {
                  console.log('✅ Usuario es admin, acceso permitido');
                }
              }

              // Si requiere permisos de driver, verificar
              if (!response && requiresDriver) {
                console.log('🚚 Verificando permisos driver para:', user);
                if ((!user.is_driver || user.is_driver === 0) && (!user.is_admin || user.is_admin === 0)) {
                  console.log('❌ Usuario no es driver ni admin, redirigiendo');
                  response = NextResponse.redirect(new URL('/unauthorized', req.url));
                } else {
                  console.log('✅ Usuario es driver/admin, acceso permitido');
                }
              }

              // Si es driver puro (no admin), bloquear acceso a rutas normales (menú, checkout, etc.)
              if (!response) {
                const isDriverOnly = user.is_driver && !user.is_admin;
                const isRestrictedForDriver = ['/menu', '/checkout'].some(route => path.startsWith(route)) ||
                  (path.startsWith('/orders') && !path.startsWith('/orders/thank-you'));
                if (isDriverOnly && isRestrictedForDriver) {
                  console.log('🚫 Driver intentando acceder a ruta restringida, redirigiendo a dashboard');
                  response = NextResponse.redirect(new URL('/driver/dashboard', req.url));
                }
              }
              if (!response) {
                console.log('✅ Middleware completado, continuando');
                response = NextResponse.next();
              }
            }
          }
        } catch (error) {
          console.error('❌ Error en middleware:', error);
          response = NextResponse.redirect(new URL(`/login?redirect=${encodeURIComponent(path)}`, req.url));
          response.cookies.delete('auth-token');
          response.cookies.delete('refresh-token');
        }
      }
    }
  }

  return response;
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};


