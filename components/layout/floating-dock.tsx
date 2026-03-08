"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  Home,
  UtensilsCrossed,
  ClipboardList,
  LayoutDashboard,
  ShoppingCart,
  ChefHat,
  Users,
  Truck,
  BarChart3,
  Map,
  CreditCard,
  Package,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { useAuth } from "@/hooks/use-auth"

interface DockItem {
  href: string
  label: string
  icon: React.ElementType
  matchPrefix?: string
}

const customerItems: DockItem[] = [
  { href: "/", label: "Inicio", icon: Home },
  { href: "/menu", label: "Menú", icon: UtensilsCrossed },
  { href: "/orders", label: "Pedidos", icon: ClipboardList },
]

const waiterItems: DockItem[] = [
  { href: "/mesero/mesas-abiertas", label: "Mesas", icon: CreditCard, matchPrefix: "/mesero" },
  { href: "/menu", label: "Menú", icon: UtensilsCrossed },
  { href: "/mesero/mapa-mesas", label: "Mapa", icon: Map },
  { href: "/orders", label: "Pedidos", icon: ClipboardList },
]

const adminItems: DockItem[] = [
  { href: "/admin/dashboard", label: "Panel", icon: LayoutDashboard, matchPrefix: "/admin" },
  { href: "/admin/orders", label: "Pedidos", icon: ShoppingCart },
  { href: "/cocina", label: "Cocina", icon: ChefHat },
  { href: "/admin/products", label: "Productos", icon: Package },
  { href: "/admin/reportes", label: "Reportes", icon: BarChart3 },
  { href: "/admin/delivery", label: "Delivery", icon: Truck },
]

const driverItems: DockItem[] = [
  { href: "/driver/dashboard", label: "Entregas", icon: Truck, matchPrefix: "/driver" },
]

// Pages that should NOT show the dock (standalone/fullscreen views)
const hiddenOnPages = ["/login", "/register", "/kiosk", "/landing", "/qr/"]

export default function FloatingDock() {
  const pathname = usePathname()
  const { user, isLoading } = useAuth()

  if (isLoading || !user) return null
  if (hiddenOnPages.some((p) => pathname.startsWith(p))) return null

  const isDriverOnly = user.is_driver && !user.is_admin
  const isWaiter = user.is_waiter && !user.is_admin

  let items: DockItem[]
  if (isDriverOnly) {
    items = driverItems
  } else if (isWaiter) {
    items = waiterItems
  } else if (user.is_admin) {
    items = adminItems
  } else {
    items = customerItems
  }

  const isActive = (item: DockItem) => {
    if (item.href === "/") return pathname === "/"
    if (item.matchPrefix) return pathname.startsWith(item.matchPrefix)
    return pathname.startsWith(item.href)
  }

  // Find current section name for the floating label
  const activeItem = items.find((item) => isActive(item))

  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 flex flex-col items-center gap-1 pointer-events-none">
      {/* Active section label */}
      {activeItem && (
        <div className="pointer-events-none px-3 py-1 rounded-full bg-black/70 backdrop-blur-md text-xs font-semibold text-colibri-gold border border-colibri-gold/30 shadow-lg">
          {activeItem.label}
        </div>
      )}

      {/* Dock bar */}
      <nav className="pointer-events-auto flex items-center gap-1 px-2 py-1.5 rounded-2xl bg-black/60 backdrop-blur-xl border border-colibri-gold/20 shadow-2xl">
        {items.map((item) => {
          const active = isActive(item)
          const Icon = item.icon
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "relative flex flex-col items-center justify-center w-12 h-12 rounded-xl transition-all duration-200",
                active
                  ? "bg-gradient-to-t from-colibri-wine/80 to-colibri-green/80 text-white scale-110 shadow-lg shadow-colibri-green/30"
                  : "text-colibri-beige/70 hover:text-white hover:bg-white/10"
              )}
            >
              <Icon className={cn("h-5 w-5", active && "drop-shadow-[0_0_6px_rgba(255,255,255,0.5)]")} />
              <span className={cn("text-[9px] mt-0.5 leading-none", active ? "font-bold" : "font-medium opacity-70")}>
                {item.label}
              </span>
              {active && (
                <span className="absolute -bottom-0.5 w-1.5 h-1.5 rounded-full bg-colibri-gold shadow-sm shadow-colibri-gold/50" />
              )}
            </Link>
          )
        })}
      </nav>
    </div>
  )
}
