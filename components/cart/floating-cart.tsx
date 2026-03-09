"use client"

import { ShoppingCart, X, Plus, Minus, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useCart } from "@/hooks/use-cart"
import { useState } from "react"
import { useRouter, usePathname, useSearchParams } from "next/navigation"
import { useAuth } from "@/hooks/use-auth"

export default function FloatingCart() {
  const { items, total, updateQuantity, removeItem } = useCart()
  const [isOpen, setIsOpen] = useState(false)
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const { user } = useAuth()
  
  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0)

  // Ocultar en kiosko (usa carrito especial)
  if (pathname?.startsWith('/kiosk')) {
    return null
  }

  if (itemCount === 0) return null

  return (
    <>
      {/* Botón flotante */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        data-floating-cart
        className="fixed bottom-6 right-6 z-50 bg-gradient-to-r from-colibri-green to-colibri-wine text-white rounded-full w-16 h-16 flex items-center justify-center shadow-2xl hover:scale-110 transition-transform"
      >
        <ShoppingCart className="w-6 h-6" />
        {itemCount > 0 && (
          <span className="absolute -top-2 -right-2 bg-orange-500 text-white text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center">
            {itemCount}
          </span>
        )}
      </button>

      {/* Panel del carrito */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:justify-end p-4">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setIsOpen(false)}
          />
          
          <div className="relative glass-effect border-2 border-colibri-gold/30 rounded-2xl shadow-2xl w-full max-w-md max-h-[80vh] flex flex-col overflow-hidden">
            {/* Header */}
            <div className="p-4 border-b border-colibri-green/40 flex items-center justify-between">
              <h3 className="text-xl font-bold text-white flex items-center">
                <ShoppingCart className="w-5 h-5 mr-2 text-colibri-gold" />
                Tu Carrito ({itemCount})
              </h3>
              <button
                onClick={() => setIsOpen(false)}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Items */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {items.map((item) => (
                <div
                  key={item.id}
                  className="bg-slate-900/80 backdrop-blur-xl rounded-lg p-3 flex items-center space-x-3 border border-colibri-green/20"
                >
                  <div className="flex-1 min-w-0">
                    <h4 className="text-white font-medium text-sm truncate">
                      {item.name}
                    </h4>
                    <p className="text-colibri-gold text-xs">
                      ${Number(item.price).toFixed(2)} c/u
                    </p>
                    
                    {/* Mostrar modificadores */}
                    {item.modifiers && item.modifiers.length > 0 && (
                      <div className="mt-1 space-y-0.5">
                        {item.modifiers.map((mod: any, idx: number) => (
                          <p key={idx} className="text-xs text-slate-300">
                            • {mod.group}: <span className="text-colibri-gold">{mod.modifier}</span>
                            {mod.price !== 0 && <span className="text-green-400"> (+${mod.price.toFixed(2)})</span>}
                          </p>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="flex items-center space-x-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => updateQuantity(item.id, item.quantity - 1)}
                      className="h-7 w-7 p-0 border-colibri-green/50 text-colibri-gold hover:bg-colibri-wine/20"
                    >
                      <Minus className="h-3 w-3" />
                    </Button>
                    
                    <span className="text-white font-bold w-8 text-center">
                      {item.quantity}
                    </span>
                    
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => updateQuantity(item.id, item.quantity + 1)}
                      className="h-7 w-7 p-0 border-colibri-green/50 text-colibri-gold hover:bg-colibri-wine/20"
                    >
                      <Plus className="h-3 w-3" />
                    </Button>
                    
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => removeItem(item.id)}
                      className="h-7 w-7 p-0 text-red-400 hover:text-red-300"
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>

                  <div className="text-white font-bold text-sm">
                    ${(Number(item.price) * item.quantity).toFixed(2)}
                  </div>
                </div>
              ))}
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-colibri-green/40 space-y-3">
              <div className="flex items-center justify-between text-lg">
                <span className="text-white font-semibold">Total:</span>
                <span className="text-colibri-gold font-black text-2xl drop-shadow-[0_0_10px_rgba(171,153,118,0.5)]">
                  ${total.toFixed(2)}
                </span>
              </div>

              <Button
                onClick={() => {
                  setIsOpen(false)
                  // Redirigir a checkout de mesero si el usuario es mesero, sino checkout normal
                  // Pass mesaNombre from URL (set by visual map's "Abrir Mesa") through to checkout
                  const nuevaMesa = searchParams.get('nuevaMesa')
                  const mesaParam = nuevaMesa ? `?mesaNombre=${encodeURIComponent(nuevaMesa)}` : ''
                  const checkoutPath = user?.is_waiter ? `/checkout/mesero${mesaParam}` : '/checkout'
                  router.push(checkoutPath)
                }}
                className="w-full bg-gradient-to-r from-colibri-green to-colibri-wine hover:from-colibri-green/90 hover:to-colibri-wine/90 text-white font-bold py-3"
              >
                {user?.is_waiter ? 'Registrar Pedido' : 'Ir al Checkout'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
