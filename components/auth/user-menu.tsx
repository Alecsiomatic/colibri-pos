"use client"

import { useState, useEffect, useRef } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import type { Session } from "@supabase/supabase-js"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { ShoppingCart, User, LogOut, LogIn, UserPlus, Settings, Bell } from "lucide-react"
import CartSidebar from "@/components/cart/cart-sidebar"
import { Badge } from "@/components/ui/badge"

export default function UserMenu({ session }: { session: Session | null }) {
  const router = useRouter()
  const supabase = createClientComponentClient()
  const [isCartOpen, setIsCartOpen] = useState(false)
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isAdmin, setIsAdmin] = useState(false)
  const [loading, setLoading] = useState(true)
  const [cartItemCount, setCartItemCount] = useState(0)
  const [notifications, setNotifications] = useState(0)
  const menuRef = useRef<HTMLDivElement>(null)

  // Close menu when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [])

  // Verificar si el usuario es administrador
  useEffect(() => {
    async function checkAdminStatus() {
      if (!session?.user?.id) {
        setIsAdmin(false)
        setLoading(false)
        return
      }

      try {
        console.log("Verificando estado de admin para usuario:", session.user.email)

        // Consultar directamente la tabla profiles
        const { data, error } = await supabase.from("profiles").select("is_admin").eq("id", session.user.id).single()

        if (error) {
          console.error("Error al verificar estado de administrador:", error)
          // Si no existe el perfil, crearlo
          if (error.code === "PGRST116") {
            console.log("Perfil no existe, creando...")
            const { data: newProfile, error: createError } = await supabase
              .from("profiles")
              .insert({
                id: session.user.id,
                username: session.user.email?.split("@")[0] || "usuario",
                full_name: session.user.user_metadata?.full_name || session.user.email,
                is_admin: false,
              })
              .select()
              .single()

            if (createError) {
              console.error("Error creando perfil:", createError)
            } else {
              console.log("Perfil creado:", newProfile)
            }
          }
          setIsAdmin(false)
        } else {
          console.log("Estado de administrador encontrado:", data?.is_admin)
          setIsAdmin(!!data?.is_admin)

          // Store admin status in localStorage for other components
          localStorage.setItem("isAdmin", data?.is_admin ? "true" : "false")

          // Dispatch event for other components
          window.dispatchEvent(new Event("adminStatusChanged"))
        }
      } catch (err) {
        console.error("Error inesperado al verificar admin:", err)
        setIsAdmin(false)
      } finally {
        setLoading(false)
      }
    }

    checkAdminStatus()

    // Get cart items count from localStorage
    const getCartItems = () => {
      try {
        const cartItems = localStorage.getItem("cartItems")
        if (cartItems) {
          const items = JSON.parse(cartItems)
          setCartItemCount(items.length)
        }
      } catch (error) {
        console.error("Error getting cart items:", error)
      }
    }

    getCartItems()

    // Listen for cart updates
    window.addEventListener("cartUpdated", getCartItems)

    // Check for notifications if user is logged in
    if (session?.user?.id) {
      const checkNotifications = async () => {
        try {
          const { data, error } = await supabase
            .from("notifications")
            .select("id")
            .eq("user_id", session.user.id)
            .eq("read", false)

          if (!error && data) {
            setNotifications(data.length)
          }
        } catch (error) {
          console.error("Error checking notifications:", error)
        }
      }

      checkNotifications()

      // Set up interval to check notifications
      const interval = setInterval(checkNotifications, 60000) // Check every minute

      return () => {
        clearInterval(interval)
        window.removeEventListener("cartUpdated", getCartItems)
      }
    }

    return () => {
      window.removeEventListener("cartUpdated", getCartItems)
    }
  }, [session?.user?.id, supabase])

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    setIsMenuOpen(false)
    router.refresh()
  }

  const toggleCart = () => {
    setIsCartOpen(!isCartOpen)
  }

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen)
  }

  const closeMenu = () => {
    setIsMenuOpen(false)
  }

  return (
    <div className="flex items-center space-x-2">
      {/* Notifications */}
      {session && (
        <Button
          variant="ghost"
          size="icon"
          className="relative text-gray-300 hover:text-purple-400 hover:bg-purple-400/10 transition-colors"
          aria-label={`${notifications} notificaciones`}
        >
          <Bell className="h-5 w-5" />
          {notifications > 0 && (
            <Badge
              variant="destructive"
              className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs bg-purple-600"
            >
              {notifications > 9 ? "9+" : notifications}
            </Badge>
          )}
        </Button>
      )}

      {/* Cart Button */}
      <Button
        variant="ghost"
        size="icon"
        onClick={toggleCart}
        className="relative text-gray-300 hover:text-purple-400 hover:bg-purple-400/10 transition-colors"
        aria-label={`Carrito con ${cartItemCount} artículos`}
      >
        <ShoppingCart className="h-5 w-5" />
        {cartItemCount > 0 && (
          <Badge className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs bg-orange-500">
            {cartItemCount > 9 ? "9+" : cartItemCount}
          </Badge>
        )}
      </Button>

      {session ? (
        <div className="relative" ref={menuRef}>
          {/* User Avatar Button */}
          <Button
            variant="ghost"
            onClick={toggleMenu}
            className="relative h-10 w-10 rounded-full focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 focus:ring-offset-black"
            aria-label="Menú de usuario"
            aria-expanded={isMenuOpen}
            aria-haspopup="true"
          >
            <Avatar className="h-10 w-10 border border-purple-600">
              <AvatarImage
                src={session.user.user_metadata?.avatar_url || "/supernova-logo.png"}
                alt={session.user.email || "Usuario"}
              />
              <AvatarFallback className="bg-purple-900 text-purple-300 font-semibold">
                {session.user.email ? session.user.email.charAt(0).toUpperCase() : "U"}
              </AvatarFallback>
            </Avatar>
            {loading ? (
              <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full bg-gray-400 ring-2 ring-black"></span>
            ) : isAdmin ? (
              <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full bg-purple-600 ring-2 ring-black"></span>
            ) : (
              <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full bg-green-500 ring-2 ring-black"></span>
            )}
          </Button>

          {/* Dropdown Menu */}
          {isMenuOpen && (
            <div className="absolute right-0 mt-2 w-64 bg-black/95 backdrop-blur rounded-md shadow-lg ring-1 ring-purple-800 z-50 border border-purple-800">
              <div className="py-1">
                {/* User Info */}
                <div className="px-4 py-3 border-b border-purple-800">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium text-white">Mi Cuenta</p>
                    <p className="text-xs text-gray-400">{session.user.email}</p>
                    {loading && <p className="text-xs text-purple-400">Verificando permisos...</p>}
                    {!loading && isAdmin && (
                      <div className="flex items-center space-x-1 mt-1">
                        <span className="inline-block h-2 w-2 rounded-full bg-purple-600"></span>
                        <p className="text-xs font-medium text-purple-400">Administrador</p>
                      </div>
                    )}
                    {!loading && !isAdmin && (
                      <div className="flex items-center space-x-1 mt-1">
                        <span className="inline-block h-2 w-2 rounded-full bg-green-500"></span>
                        <p className="text-xs text-gray-400">Usuario</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Admin Panel Link */}
                {isAdmin && !loading && (
                  <>
                    <Link
                      href="/admin/dashboard"
                      onClick={closeMenu}
                      className="flex items-center px-4 py-2 text-sm text-gray-300 hover:bg-purple-900/50 hover:text-purple-400 transition-colors"
                    >
                      <Settings className="mr-3 h-4 w-4 text-purple-600" />
                      <span className="font-medium">Panel de Administración</span>
                    </Link>
                    <div className="border-t border-purple-800"></div>
                  </>
                )}

                {/* Menu Items */}
                <Link
                  href="/profile"
                  onClick={closeMenu}
                  className="flex items-center px-4 py-2 text-sm text-gray-300 hover:bg-purple-900/30 hover:text-purple-400 transition-colors"
                >
                  <User className="mr-3 h-4 w-4" />
                  <span>Mi Perfil</span>
                </Link>

                <Link
                  href="/orders"
                  onClick={closeMenu}
                  className="flex items-center px-4 py-2 text-sm text-gray-300 hover:bg-purple-900/30 hover:text-purple-400 transition-colors"
                >
                  <ShoppingCart className="mr-3 h-4 w-4" />
                  <span>Mis Pedidos</span>
                </Link>

                <div className="border-t border-purple-800"></div>

                {/* Sign Out */}
                <button
                  onClick={handleSignOut}
                  className="flex items-center w-full px-4 py-2 text-sm text-red-400 hover:bg-red-900/30 transition-colors"
                >
                  <LogOut className="mr-3 h-4 w-4" />
                  <span>Cerrar Sesión</span>
                </button>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="flex items-center space-x-2">
          <Button asChild variant="ghost" size="sm" className="text-gray-300 hover:text-purple-400">
            <Link href="/login">
              <LogIn className="mr-2 h-4 w-4" />
              Ingresar
            </Link>
          </Button>
          <Button asChild variant="default" size="sm" className="bg-purple-600 hover:bg-purple-700">
            <Link href="/register">
              <UserPlus className="mr-2 h-4 w-4" />
              Registrarse
            </Link>
          </Button>
        </div>
      )}

      <CartSidebar isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} />
    </div>
  )
}
