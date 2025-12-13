"use client"

import type React from "react"

import { useState, useEffect } from "react"
import Link from "next/link"
import Image from "next/image"
import { usePathname } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Menu, Search, X, ShoppingCart, Bell, User, LogOut } from "lucide-react"
import { cn } from "@/lib/utils"
import { useAuth } from "@/hooks/use-auth"
import { useCart } from "@/hooks/use-cart"
import { useNotifications } from "@/hooks/use-notifications"

export default function Header() {
  const pathname = usePathname()
  const [isScrolled, setIsScrolled] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [isSearchOpen, setIsSearchOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const { user, isLoading, logout } = useAuth()
  const { itemCount } = useCart()
  const { unreadCount } = useNotifications()

  // Handle scroll effect
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10)
    }

    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  const navigationItems = [
    { href: "/", label: "Inicio" },
    { href: "/menu", label: "Menú" },
    { href: "/orders", label: "Mis Pedidos" },
  ];

  // Panel especial para mesero
  const waiterNavigationItems = [
    { href: "/mesero/mesas-abiertas", label: "Comedor" },
  ];

  const adminNavigationItems = [
    { href: "/admin/dashboard", label: "Panel Admin" },
    { href: "/admin/products", label: "Productos" },
    { href: "/admin/orders", label: "Pedidos" },
    { href: "/admin/users", label: "Usuarios" },
    { href: "/admin/delivery", label: "Delivery" },
  ]

  const driverNavigationItems = [
    { href: "/driver/dashboard", label: "🚚 Panel de Repartidor" },
  ]

  // Si es driver puro (no admin), solo mostrar su dashboard
  const isDriverOnly = user?.is_driver && !user?.is_admin

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      // Implement search functionality
      console.log("Searching for:", searchQuery)
      setIsSearchOpen(false)
      setSearchQuery("")
    }
  }

  const handleLogout = async () => {
    await logout()
    setIsMobileMenuOpen(false)
  }

  const isActivePage = (href: string) => {
    if (href === "/") {
      return pathname === "/"
    }
    return pathname.startsWith(href)
  }

  return (
    <>
      <header
        className={cn(
          "sticky top-0 z-50 w-full border-b transition-all duration-300",
          isScrolled
            ? "bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60"
            : "bg-background"
        )}
      >
        <div className="container flex h-16 items-center justify-between px-4">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-2">
            <Image
              src="/logo-colibri.png"
              alt="Colibrí-REST"
              width={40}
              height={40}
              className="rounded-full"
              onError={(e) => {
                const target = e.target as HTMLImageElement
                target.style.display = "none"
              }}
            />
            <span className="hidden font-bold sm:inline-block text-colibri-green">
              Colibrí-REST
            </span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-6 text-sm font-medium">
            {/* Si es driver puro, SOLO mostrar dashboard de driver */}
            {isDriverOnly ? (
              <>
                {driverNavigationItems.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "transition-colors hover:text-foreground/80 font-semibold",
                      isActivePage(item.href) ? "text-green-600" : "text-green-600/80"
                    )}
                  >
                    {item.label}
                  </Link>
                ))}
              </>
            ) : user?.is_waiter ? (
              <>
                {waiterNavigationItems.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "transition-colors hover:text-foreground/80 font-semibold",
                      isActivePage(item.href) ? "text-yellow-600" : "text-yellow-600/80"
                    )}
                  >
                    {item.label}
                  </Link>
                ))}
              </>
            ) : (
              <>
                {navigationItems.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "transition-colors hover:text-foreground/80",
                      isActivePage(item.href) ? "text-foreground" : "text-foreground/60"
                    )}
                  >
                    {item.label}
                  </Link>
                ))}
                {/* Admin Navigation */}
                {user?.is_admin && (
                  <>
                    <div className="h-4 w-px bg-border" />
                    {adminNavigationItems.map((item) => (
                      <Link
                        key={item.href}
                        href={item.href}
                        className={cn(
                          "transition-colors hover:text-foreground/80",
                          isActivePage(item.href) ? "text-foreground" : "text-foreground/60"
                        )}
                      >
                        {item.label}
                      </Link>
                    ))}
                  </>
                )}
              </>
            )}
          </nav>

          {/* Right side actions */}
          <div className="flex items-center space-x-2">
            {/* Search - Solo si NO es driver puro */}
            {!isDriverOnly && (
              <Button
                variant="ghost"
                size="sm"
                className="hidden sm:flex"
                onClick={() => setIsSearchOpen(!isSearchOpen)}
              >
                <Search className="h-4 w-4" />
              </Button>
            )}

            {/* Cart - Solo si NO es driver puro */}
            {!isDriverOnly && (
              <Link href={user?.is_waiter ? "/checkout/mesero" : "/checkout"}>
                <Button variant="ghost" size="sm" className="relative" data-cart-button>
                  <ShoppingCart className="h-4 w-4" />
                  {itemCount > 0 && (
                    <Badge
                      variant="destructive"
                      className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 text-xs"
                    >
                      {itemCount}
                    </Badge>
                  )}
                </Button>
              </Link>
            )}

            {/* Notifications */}
            {user && (
              <Button variant="ghost" size="sm" className="relative">
                <Bell className="h-4 w-4" />
                {unreadCount > 0 && (
                  <Badge
                    variant="destructive"
                    className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 text-xs"
                  >
                    {unreadCount}
                  </Badge>
                )}
              </Button>
            )}

            {/* User Menu or Login */}
            {isLoading ? (
              <div className="w-8 h-8 rounded-full bg-muted animate-pulse" />
            ) : user ? (
              <div className="flex items-center space-x-2">
                <span className="hidden sm:inline text-sm">
                  Hola, {user.username}
                </span>
                <div className="flex items-center space-x-1">
                  <Link href="/profile">
                    <Button variant="ghost" size="sm">
                      <User className="h-4 w-4" />
                    </Button>
                  </Link>
                  <Button variant="ghost" size="sm" onClick={handleLogout}>
                    <LogOut className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ) : (
              <div className="flex items-center space-x-2">
                <Link href="/login">
                  <Button variant="ghost" size="sm">
                    Iniciar Sesión
                  </Button>
                </Link>
                <Link href="/register">
                  <Button size="sm">
                    Registrarse
                  </Button>
                </Link>
              </div>
            )}

            {/* Mobile menu trigger */}
            <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="sm" className="md:hidden">
                  <Menu className="h-4 w-4" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-80">
                <div className="flex flex-col space-y-4 mt-4">
                  <div className="flex items-center space-x-2 pb-4 border-b">
                    <Image
                      src="/logo.png"
                      alt="Supernova"
                      width={32}
                      height={32}
                      className="rounded-full"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement
                        target.style.display = "none"
                      }}
                    />
                    <span className="font-bold">Supernova</span>
                  </div>

                  {/* Mobile Navigation */}
                  <nav className="flex flex-col space-y-2">
                    {/* Si es driver puro, SOLO su dashboard */}
                    {isDriverOnly ? (
                      <>
                        <div className="text-xs font-semibold text-green-600 px-2">
                          REPARTIDOR
                        </div>
                        {driverNavigationItems.map((item) => (
                          <Link
                            key={item.href}
                            href={item.href}
                            onClick={() => setIsMobileMenuOpen(false)}
                            className={cn(
                              "flex items-center space-x-2 rounded-md px-2 py-2 text-sm font-medium transition-colors hover:bg-green-50",
                              isActivePage(item.href) ? "bg-green-50 text-green-700" : "text-green-600"
                            )}
                          >
                            <span>{item.label}</span>
                          </Link>
                        ))}
                      </>
                    ) : user?.is_waiter ? (
                      <>
                        {/* MESERO - Botón destacado */}
                        <div className="bg-gradient-to-r from-yellow-500 to-orange-500 rounded-lg p-1 mb-2">
                          <Link
                            href="/mesero/mesas-abiertas"
                            onClick={() => setIsMobileMenuOpen(false)}
                            className="flex items-center justify-center space-x-2 bg-white rounded-md px-4 py-4 text-base font-bold transition-all hover:bg-yellow-50"
                          >
                            <span className="text-2xl">🍽️</span>
                            <span className="text-yellow-700">COMEDOR</span>
                          </Link>
                        </div>
                        
                        {/* Otras opciones de mesero */}
                        <div className="text-xs font-semibold text-yellow-600 px-2 mt-4">
                          NAVEGACIÓN
                        </div>
                        {navigationItems.map((item) => (
                          <Link
                            key={item.href}
                            href={item.href}
                            onClick={() => setIsMobileMenuOpen(false)}
                            className={cn(
                              "flex items-center space-x-2 rounded-md px-2 py-2 text-sm font-medium transition-colors hover:bg-accent",
                              isActivePage(item.href) ? "bg-accent" : ""
                            )}
                          >
                            <span>{item.label}</span>
                          </Link>
                        ))}
                      </>
                    ) : (
                      <>
                        {navigationItems.map((item) => (
                          <Link
                            key={item.href}
                            href={item.href}
                            onClick={() => setIsMobileMenuOpen(false)}
                            className={cn(
                              "flex items-center space-x-2 rounded-md px-2 py-2 text-sm font-medium transition-colors hover:bg-accent",
                              isActivePage(item.href) ? "bg-accent" : ""
                            )}
                          >
                            <span>{item.label}</span>
                          </Link>
                        ))}

                        {/* Admin Navigation Mobile */}
                        {user?.is_admin && (
                          <>
                            <div className="h-px bg-border my-2" />
                            <div className="text-xs font-semibold text-muted-foreground px-2">
                              ADMINISTRACIÓN
                            </div>
                            {adminNavigationItems.map((item) => (
                              <Link
                                key={item.href}
                                href={item.href}
                                onClick={() => setIsMobileMenuOpen(false)}
                                className={cn(
                                  "flex items-center space-x-2 rounded-md px-2 py-2 text-sm font-medium transition-colors hover:bg-accent",
                                  isActivePage(item.href) ? "bg-accent" : ""
                                )}
                              >
                                <span>{item.label}</span>
                              </Link>
                            ))}
                          </>
                        )}
                      </>
                    )}
                  </nav>

                  {/* Mobile User Actions */}
                  <div className="border-t pt-4 mt-4">
                    {user ? (
                      <div className="space-y-2">
                        <div className="px-2 py-2 text-sm">
                          <div className="font-medium">{user.username}</div>
                          <div className="text-muted-foreground">{user.email}</div>
                        </div>
                        <Link
                          href="/profile"
                          onClick={() => setIsMobileMenuOpen(false)}
                          className="flex items-center space-x-2 rounded-md px-2 py-2 text-sm font-medium transition-colors hover:bg-accent"
                        >
                          <User className="h-4 w-4" />
                          <span>Mi Perfil</span>
                        </Link>
                        <Button
                          variant="ghost"
                          className="w-full justify-start"
                          onClick={handleLogout}
                        >
                          <LogOut className="h-4 w-4 mr-2" />
                          Cerrar Sesión
                        </Button>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <Link
                          href="/login"
                          onClick={() => setIsMobileMenuOpen(false)}
                          className="flex items-center justify-center rounded-md border px-4 py-2 text-sm font-medium transition-colors hover:bg-accent"
                        >
                          Iniciar Sesión
                        </Link>
                        <Link
                          href="/register"
                          onClick={() => setIsMobileMenuOpen(false)}
                          className="flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
                        >
                          Registrarse
                        </Link>
                      </div>
                    )}
                  </div>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>

        {/* Search Bar */}
        {isSearchOpen && (
          <div className="border-t bg-background/95 backdrop-blur">
            <div className="container px-4 py-3">
              <form onSubmit={handleSearch} className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Buscar productos..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-9"
                  autoFocus
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-1 top-1/2 -translate-y-1/2"
                  onClick={() => setIsSearchOpen(false)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </form>
            </div>
          </div>
        )}
      </header>
    </>
  )
}