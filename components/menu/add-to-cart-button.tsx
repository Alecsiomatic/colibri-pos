"use client"

import { useState } from "react"
import { useCart } from "@/components/cart/cart-provider"
import { ShoppingCart, Check, AlertCircle } from "lucide-react"

type AddToCartButtonProps = {
  menuItem: {
    title: string
    price: number
  }
  disabled?: boolean
}

export default function AddToCartButton({ menuItem, disabled = false }: AddToCartButtonProps) {
  const { addItem } = useCart()
  const [added, setAdded] = useState(false)

  const handleAddToCart = () => {
    if (disabled) return

    const cartItem = {
      id: menuItem.title.toLowerCase().replace(/\s+/g, "-"),
      name: menuItem.title,
      price: menuItem.price,
      quantity: 1,
      category: "menu",
    }

    addItem(cartItem)
    setAdded(true)

    // Resetear el estado después de un tiempo
    setTimeout(() => {
      setAdded(false)
    }, 2000)
  }

  if (disabled) {
    return (
      <button
        disabled
        className="flex items-center px-3 py-1 rounded text-sm font-medium bg-gray-300 text-gray-500 cursor-not-allowed"
      >
        <AlertCircle size={14} className="mr-1" /> Agotado
      </button>
    )
  }

  return (
    <button
      onClick={handleAddToCart}
      className={`flex items-center px-3 py-1 rounded text-sm font-medium transition-colors ${
        added ? "bg-green-600 hover:bg-green-700 text-white" : "bg-black hover:bg-gray-800 text-white"
      }`}
    >
      {added ? (
        <span className="flex items-center">
          <Check size={14} className="mr-1" /> Añadido
        </span>
      ) : (
        <span className="flex items-center">
          <ShoppingCart size={14} className="mr-1" /> Ordenar
        </span>
      )}
    </button>
  )
}
