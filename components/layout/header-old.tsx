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
import { Menu, Search, X, ShoppingCart, Bell } from "lucide-react"
import UserMenu from "@/components/auth/user-menu"
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
  const { user, loading } = useAuth()
  const { itemCount } = useCart()
  const { unreadCount } = useNotifications()

  const supabase = createClientComponentClient()

  // Get session on client side
  useEffect(() => {
    const getSession = async () => {
      try {
        const {
          data: { session },
          error,
        } = await supabase.auth.getSession()
        console.log("Header - Client session:", session)
        setSession(session)
      } catch (error) {
        console.error("Header - Error getting session:", error)
      } finally {
        setLoading(false)
      }
    }

    getSession()

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      console.log("Header - Auth state changed:", event, session)
      setSession(session)
      setLoading(false)
    })

    return () => subscription.unsubscribe()
  }, [supabase])

  // Handle scroll effect
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10)
    }

    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  const navigation = [
    { href: "/", label: "Inicio" },
    { href: "/menu", label: "Menú" },
  ]

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      // Implement search functionality
      console.log("Searching for:", searchQuery)
      setIsSearchOpen(false)
      setSearchQuery("")
    }
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
          "sticky top-0 z-50 w-full border-b bg-black/80 backdrop-blur supports-[backdrop-filter]:bg-black/60 transition-all duration-200",
          isScrolled && "shadow-lg shadow-purple-500/20",
        )}
      >
        <div className="container mx-auto px-4">
          <div className="flex h-16 items-center justify-between">
            {/* Logo */}
            <Link href="/" className="flex items-center space-x-2">
              <Image
                src="/supernova-logo.png"
                alt="Supernova Burgers & Wings Logo"
                width={40}
                height={40}
                className="h-10 w-10"
                priority
              />
              <span className="hidden sm:block text-lg font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                Supernova Burgers & Wings
              </span>
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center space-x-6">
              {navigationItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "text-sm font-medium transition-all duration-200 hover:text-purple-400 relative",
                    isActivePage(item.href) ? "text-purple-400" : "text-gray-300",
                  )}
                  aria-current={isActivePage(item.href) ? "page" : undefined}
                >
                  {item.label}
                  {isActivePage(item.href) && (
                    <span className="absolute -bottom-1 left-0 w-full h-0.5 bg-gradient-to-r from-purple-400 to-pink-400 rounded-full" />
                  )}
                </Link>
              ))}
            </nav>

            {/* Right Side Actions */}
            <div className="flex items-center space-x-2">
              {/* Search Button */}
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsSearchOpen(!isSearchOpen)}
                className="text-gray-300 hover:text-purple-400 hover:bg-purple-400/10"
                aria-label="Buscar productos"
              >
                <Search className="h-5 w-5" />
              </Button>

              {/* User Menu */}
              {loading ? (
                <div className="flex items-center space-x-2">
                  <div className="h-8 w-8 bg-purple-900/50 rounded-full animate-pulse" />
                  <div className="h-8 w-16 bg-purple-900/50 rounded animate-pulse" />
                </div>
              ) : (
                <UserMenu session={session} />
              )}

              {/* Mobile Menu Button */}
              <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
                <SheetTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="md:hidden text-gray-300 hover:text-purple-400 hover:bg-purple-400/10"
                    aria-label="Abrir menú"
                  >
                    <Menu className="h-5 w-5" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="right" className="w-80 bg-black/95 border-purple-900">
                  <div className="flex flex-col space-y-4 mt-6">
                    <div className="flex items-center justify-between">
                      <h2 className="text-lg font-semibold text-white">Navegación</h2>
                    </div>

                    {/* Mobile Navigation */}
                    <nav className="flex flex-col space-y-2">
                      {navigationItems.map((item) => (
                        <Link
                          key={item.href}
                          href={item.href}
                          onClick={() => setIsMobileMenuOpen(false)}
                          className={cn(
                            "flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium transition-colors",
                            isActivePage(item.href)
                              ? "bg-purple-900/50 text-purple-400"
                              : "text-gray-300 hover:bg-purple-900/30 hover:text-purple-400",
                          )}
                          aria-current={isActivePage(item.href) ? "page" : undefined}
                        >
                          <span>{item.label}</span>
                        </Link>
                      ))}
                    </nav>

                    {/* Mobile User Section */}
                    {session && (
                      <div className="border-t border-purple-900 pt-4">
                        <div className="flex flex-col space-y-2">
                          <Link
                            href="/profile"
                            onClick={() => setIsMobileMenuOpen(false)}
                            className="flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium text-gray-300 hover:bg-purple-900/30 hover:text-purple-400"
                          >
                            <span>Mi Perfil</span>
                          </Link>
                          <Link
                            href="/orders"
                            onClick={() => setIsMobileMenuOpen(false)}
                            className="flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium text-gray-300 hover:bg-purple-900/30 hover:text-purple-400"
                          >
                            <span>Mis Pedidos</span>
                          </Link>
                        </div>
                      </div>
                    )}
                  </div>
                </SheetContent>
              </Sheet>
            </div>
          </div>

          {/* Search Bar */}
          {isSearchOpen && (
            <div className="border-t border-purple-900 py-3">
              <form onSubmit={handleSearch} className="flex items-center space-x-2">
                <div className="flex-1 relative">
                  <Input
                    type="search"
                    placeholder="Buscar hamburguesas, alitas..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-purple-900/20 border-purple-800 text-white placeholder:text-gray-400"
                    autoFocus
                  />
                </div>
                <Button type="submit" size="sm" className="bg-purple-600 hover:bg-purple-700">
                  Buscar
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsSearchOpen(false)}
                  className="text-gray-300 hover:text-purple-400"
                >
                  <X className="h-4 w-4" />
                </Button>
              </form>
            </div>
          )}
        </div>
      </header>
    </>
  )
}
