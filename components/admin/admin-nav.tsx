"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  Users,
  MessageSquare,
  Truck,
  BarChart3,
  Tags,
  Star,
  Settings,
  TrendingUp,
  Building2,
  PieChart,
  Sliders,
  ChefHat,
  Receipt,
  Warehouse,
  Boxes,
  Shield,
} from "lucide-react"

const navigation = [
  { name: "Dashboard", href: "/admin/dashboard", icon: LayoutDashboard },
  { name: "Pedidos", href: "/admin/orders", icon: ShoppingCart },
  { name: "Cocina (KDS)", href: "/cocina", icon: ChefHat },
  { name: "Productos", href: "/admin/products", icon: Package },
  { name: "Modificadores", href: "/admin/modificadores", icon: Sliders },
  { name: "Productos Destacados", href: "/admin/featured-products", icon: Star },
  { name: "Categorías", href: "/admin/categories", icon: Tags },
  { name: "Reportes", href: "/admin/reportes", icon: TrendingUp },
  { name: "Cortes de Caja", href: "/admin/cortes", icon: Receipt },
  { name: "Usuarios", href: "/admin/users", icon: Users },
  { name: "Delivery", href: "/admin/delivery", icon: Truck },
  { name: "Estadísticas Drivers", href: "/admin/driver-stats", icon: TrendingUp },
  { name: "Inventario", href: "/admin/inventario", icon: Warehouse },
  { name: "Insumos y Recetas", href: "/admin/insumos", icon: Boxes },
  { name: "Permisos", href: "/admin/permisos", icon: Shield },
  { name: "WhatsApp", href: "/admin/whatsapp", icon: MessageSquare },
  { name: "Configuración Empresa", href: "/admin/configuracion-empresa", icon: Building2 },
  { name: "Configuración", href: "/admin/settings", icon: Settings },
]

export default function AdminNav() {
  const pathname = usePathname()

  return (
    <nav className="space-y-1">
      {navigation.map((item) => {
        const isActive = pathname === item.href
        return (
          <Link
            key={item.name}
            href={item.href}
            className={`
              group flex items-center px-3 py-3 text-sm font-medium rounded-lg transition-all duration-200
              ${
                isActive
                  ? "bg-gradient-to-r from-colibri-green/50 to-colibri-wine/50 text-white border border-colibri-gold/50 shadow-lg"
                  : "text-colibri-beige hover:bg-colibri-green/30 hover:text-white border border-transparent"
              }
            `}
          >
            <item.icon
              className={`
                mr-3 h-5 w-5 flex-shrink-0 transition-colors
                ${isActive ? "text-colibri-gold" : "text-colibri-gold group-hover:text-colibri-beige"}
              `}
            />
            {item.name}
          </Link>
        )
      })}
    </nav>
  )
}
