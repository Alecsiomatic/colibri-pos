"use client"

import { useState, useEffect, useRef } from "react"
import { useCart } from "./cart-provider"
import { ShoppingCart, X, Plus, Minus, Trash2, ShoppingBag, ArrowRight } from "lucide-react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { motion, AnimatePresence } from "framer-motion"
import { useAuth } from "@/hooks/use-auth"

export default function CartSidebar() {
  const [isOpen, setIsOpen] = useState(false)
  const [isHovered, setIsHovered] = useState(false)
  const cartRef = useRef<HTMLDivElement>(null)
  const { items, removeItem, updateQuantity, totalItems, totalPrice, clearCart } = useCart()
  const router = useRouter()
  const { user } = useAuth()

  // Cerrar carrito al hacer click fuera
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (cartRef.current && !cartRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside)
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [isOpen])

  const handleCheckout = () => {
    if (items.length === 0) return
    // Redirigir a checkout de mesero si el usuario es mesero, sino checkout normal
    const checkoutPath = user?.is_waiter ? '/checkout/mesero' : '/checkout'
    router.push(checkoutPath)
    setIsOpen(false)
  }

  const toggleCart = () => {
    setIsOpen(!isOpen)
  }

  return (
    <>
      {/* Botón del carrito flotante */}
      <div className="fixed bottom-20 right-6 z-50">
        <button
          onClick={toggleCart}
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
          className="relative bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white p-4 rounded-full shadow-2xl flex items-center justify-center transition-all duration-300 hover:scale-110 border border-purple-400/50 group"
          aria-label="Carrito espacial"
        >
          <div className="relative">
            <ShoppingCart className="h-6 w-6 transition-transform group-hover:rotate-12" />
            {totalItems > 0 && (
              <span className="absolute -top-2 -right-2 bg-orange-500 text-white text-xs font-bold rounded-full h-6 w-6 flex items-center justify-center animate-pulse">
                {totalItems}
              </span>
            )}
          </div>

          {/* Efecto de partículas */}
          <div className="absolute inset-0 rounded-full overflow-hidden">
            <div className="absolute top-1 left-2 w-1 h-1 bg-pink-300/60 rounded-full animate-ping"></div>
            <div className="absolute bottom-2 right-1 w-0.5 h-0.5 bg-purple-300 rounded-full animate-pulse"></div>
            <div className="absolute top-3 right-3 w-0.5 h-0.5 bg-white/50 rounded-full animate-ping"></div>
          </div>

          {/* Tooltip */}
          <AnimatePresence>
            {isHovered && !isOpen && (
              <motion.div
                initial={{ opacity: 0, scale: 0.8, x: 10 }}
                animate={{ opacity: 1, scale: 1, x: 0 }}
                exit={{ opacity: 0, scale: 0.8, x: 10 }}
                className="absolute right-full mr-3 top-1/2 transform -translate-y-1/2 px-3 py-2 bg-black/90 text-white text-sm rounded-lg whitespace-nowrap backdrop-blur-sm border border-purple-400/30"
              >
                🛒 Carrito Espacial
                <div className="absolute left-full top-1/2 transform -translate-y-1/2 w-0 h-0 border-t-4 border-b-4 border-l-4 border-transparent border-l-black/90"></div>
              </motion.div>
            )}
          </AnimatePresence>
        </button>

        {/* Floating Cart */}
        <AnimatePresence>
          {isOpen && (
            <motion.div
              ref={cartRef}
              initial={{ opacity: 0, scale: 0.8, y: 20, x: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0, x: 0 }}
              exit={{ opacity: 0, scale: 0.8, y: 20, x: 20 }}
              className="absolute bottom-full right-0 mb-4 w-80 max-h-96 bg-black/95 backdrop-blur-xl rounded-2xl shadow-2xl border border-purple-800/50 overflow-hidden"
              style={{ transformOrigin: "bottom right" }}
            >
              {/* Flecha apuntando al botón */}
              <div className="absolute -bottom-2 right-6 w-4 h-4 bg-black/95 border-r border-b border-purple-800/50 transform rotate-45"></div>

              {/* Header */}
              <div className="flex items-center justify-between p-4 border-b border-purple-800/50 bg-gradient-to-r from-purple-900/30 to-pink-900/30">
                <h3 className="text-lg font-bold text-white flex items-center">
                  <ShoppingBag className="mr-2 h-5 w-5 text-purple-400" />
                  Pedido Espacial
                </h3>
                <button onClick={() => setIsOpen(false)} className="text-gray-400 hover:text-white transition-colors">
                  <X size={20} />
                </button>
              </div>

              {/* Content */}
              <div className="max-h-64 overflow-y-auto p-4">
                {items.length === 0 ? (
                  <div className="text-center py-6 text-gray-400">
                    <ShoppingCart className="h-12 w-12 mx-auto mb-3 text-purple-600/50" />
                    <p className="text-sm">Tu carrito está vacío</p>
                    <p className="text-xs mt-1 text-gray-500">¡Agrega hamburguesas espaciales!</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {items.map((item) => (
                      <motion.div
                        key={item.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 20 }}
                        className="flex items-center justify-between p-3 bg-purple-900/20 rounded-lg border border-purple-800/30"
                      >
                        <div className="flex-1 min-w-0">
                          <h4 className="text-sm font-medium text-white truncate">{item.name}</h4>
                          <p className="text-xs text-orange-400">${item.price.toFixed(2)}</p>
                          
                          {/* Mostrar modificadores */}
                          {item.modifiers && item.modifiers.length > 0 && (
                            <div className="mt-1 space-y-0.5">
                              {item.modifiers.map((mod, idx) => (
                                <p key={idx} className="text-xs text-gray-400">
                                  • {mod.group}: <span className="text-purple-300">{mod.modifier}</span>
                                  {mod.price !== 0 && <span className="text-green-400"> (+${mod.price.toFixed(2)})</span>}
                                </p>
                              ))}
                            </div>
                          )}
                        </div>

                        <div className="flex items-center space-x-2 ml-3">
                          <button
                            onClick={() => updateQuantity(item.id, item.quantity - 1, item.modifiers)}
                            className="w-6 h-6 bg-purple-700/50 hover:bg-purple-600 text-white rounded-full flex items-center justify-center transition-colors"
                          >
                            <Minus size={12} />
                          </button>
                          <span className="text-white text-sm w-6 text-center">{item.quantity}</span>
                          <button
                            onClick={() => updateQuantity(item.id, item.quantity + 1, item.modifiers)}
                            className="w-6 h-6 bg-purple-700/50 hover:bg-purple-600 text-white rounded-full flex items-center justify-center transition-colors"
                          >
                            <Plus size={12} />
                          </button>
                          <button
                            onClick={() => removeItem(item.id, item.modifiers)}
                            className="w-6 h-6 bg-red-600/50 hover:bg-red-500 text-white rounded-full flex items-center justify-center transition-colors ml-2"
                          >
                            <Trash2 size={12} />
                          </button>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}
              </div>

              {/* Footer */}
              {items.length > 0 && (
                <div className="p-4 border-t border-purple-800/50 bg-gradient-to-r from-purple-900/30 to-pink-900/30">
                  <div className="flex justify-between items-center mb-3">
                    <span className="text-white font-semibold">Total:</span>
                    <span className="text-orange-400 font-bold text-lg">${totalPrice.toFixed(2)}</span>
                  </div>

                  <div className="flex space-x-2">
                    <Button
                      onClick={clearCart}
                      variant="outline"
                      size="sm"
                      className="flex-1 border-purple-600/50 text-purple-400 hover:bg-purple-600/20 text-xs"
                    >
                      Vaciar
                    </Button>
                    <Button
                      onClick={handleCheckout}
                      size="sm"
                      className="flex-2 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white text-xs flex items-center"
                    >
                      Ordenar
                      <ArrowRight size={14} className="ml-1" />
                    </Button>
                  </div>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </>
  )
}
