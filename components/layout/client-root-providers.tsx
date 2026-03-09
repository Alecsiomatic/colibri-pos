"use client"
import { useEffect, useState } from "react"
import { ThemeProvider } from "@/components/theme-provider"
import { AuthProvider } from "@/hooks/use-auth"
import { NotificationProvider } from "@/hooks/use-notifications"
import { CartProvider } from "@/hooks/use-cart"
import Header from "@/components/layout/header"
import Footer from "@/components/layout/footer"
import FloatingCart from "@/components/cart/floating-cart"
import { NotificationToast } from "@/components/notifications/notification-toast"
import { ErrorBoundary } from "@/components/ErrorBoundary"

export default function ClientRootProviders({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false)
  useEffect(() => { setMounted(true) }, [])
  if (!mounted) return null
  return (
    <ErrorBoundary>
      <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
        <AuthProvider>
          <NotificationProvider>
            <CartProvider>
              <div className="flex flex-col min-h-screen">
                <Header />
                <main className="flex-grow">{children}</main>
                <Footer />
              </div>
              <FloatingCart />
              <NotificationToast />
            </CartProvider>
          </NotificationProvider>
        </AuthProvider>
      </ThemeProvider>
    </ErrorBoundary>
  )
}