"use client"
import { useEffect, useState } from "react"
import { usePathname } from "next/navigation"
import { ThemeProvider } from "@/components/theme-provider"
import { AuthProvider } from "@/hooks/use-auth"
import { NotificationProvider } from "@/hooks/use-notifications"
import { CartProvider } from "@/hooks/use-cart"
import Header from "@/components/layout/header"
import Footer from "@/components/layout/footer"
import FloatingCart from "@/components/cart/floating-cart"
import { NotificationToast } from "@/components/notifications/notification-toast"
import { ErrorBoundary } from "@/components/ErrorBoundary"
import ThemeLoader from "@/components/theme-loader"

const HIDE_CHROME_ROUTES = ['/admin', '/cocina', '/driver', '/caja', '/mesero']

export default function ClientRootProviders({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false)
  const pathname = usePathname()
  useEffect(() => { setMounted(true) }, [])
  if (!mounted) return null

  const hideChrome = HIDE_CHROME_ROUTES.some(r => pathname.startsWith(r))

  return (
    <ErrorBoundary>
      <ThemeLoader />
      <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
        <AuthProvider>
          <NotificationProvider>
            <CartProvider>
              <div className="flex flex-col min-h-screen">
                {!hideChrome && <Header />}
                <main className="flex-grow">{children}</main>
                {!hideChrome && <Footer />}
              </div>
              {!hideChrome && <FloatingCart />}
              <NotificationToast />
            </CartProvider>
          </NotificationProvider>
        </AuthProvider>
      </ThemeProvider>
    </ErrorBoundary>
  )
}