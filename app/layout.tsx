import type React from "react"
import "./globals.css"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import { ThemeProvider } from "@/components/theme-provider"
import Footer from "@/components/layout/footer"
import { CartProvider } from "@/hooks/use-cart"
import { NotificationProvider } from "@/hooks/use-notifications"
import { AuthProvider } from "@/hooks/use-auth"
import Header from "@/components/layout/header"
import { NotificationToast } from "@/components/notifications/notification-toast"
import FloatingCart from "@/components/cart/floating-cart"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Colibrí-REST - Sistema para Restaurantes",
  description: "Sistema completo de gestión para restaurantes: pedidos, mesas, delivery, kiosko y más",
  generator: "v0.dev",
}


import ClientRootProviders from "@/components/layout/client-root-providers"

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <head>
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
      </head>
      <body className={inter.className}>
        <ClientRootProviders>{children}</ClientRootProviders>
      </body>
    </html>
  )
}
