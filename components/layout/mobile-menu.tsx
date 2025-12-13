"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { Menu } from "lucide-react"
import { cn } from "@/lib/utils"

interface NavItem {
  href: string
  label: string
  adminOnly?: boolean
}

export default function MobileMenu({ isAdmin = false }: { isAdmin?: boolean }) {
  const [open, setOpen] = useState(false)
  const pathname = usePathname()

  // Close the menu when route changes
  useEffect(() => {
    setOpen(false)
  }, [pathname])

  const navItems: NavItem[] = [
    { href: "/", label: "Inicio" },
    { href: "/menu", label: "Menú" },
    { href: "/orders", label: "Mis Pedidos" },
    { href: "/admin/dashboard", label: "Panel Admin", adminOnly: true },
    { href: "/admin/products", label: "Productos", adminOnly: true },
    { href: "/admin/categories", label: "Categorías", adminOnly: true },
    { href: "/admin/orders", label: "Gestión Pedidos", adminOnly: true },
    { href: "/admin/stock", label: "Inventario", adminOnly: true },
  ]

  const filteredNavItems = navItems.filter((item) => !item.adminOnly || (item.adminOnly && isAdmin))

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="md:hidden" aria-label="Abrir menú">
          <Menu className="h-6 w-6" />
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-[300px] sm:w-[350px] pt-10">
        <nav className="flex flex-col gap-4">
          {filteredNavItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center px-4 py-3 text-lg rounded-md transition-colors",
                pathname === item.href ? "bg-red-50 text-red-700 font-medium" : "text-gray-700 hover:bg-gray-100",
              )}
              aria-current={pathname === item.href ? "page" : undefined}
            >
              {item.label}
              {item.adminOnly && (
                <span className="ml-2 text-xs bg-red-100 text-red-700 px-2 py-1 rounded-full">Admin</span>
              )}
            </Link>
          ))}
        </nav>
      </SheetContent>
    </Sheet>
  )
}
