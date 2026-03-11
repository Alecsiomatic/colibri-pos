"use client"

import { useState } from "react"
import { useCart } from "@/hooks/use-cart"
import { ShoppingCart, Check, AlertCircle } from "lucide-react"

type AddToCartButtonProps = {
  menuItem: {
    id: number
    title: string
    price: number
    image_url?: string
    category_name?: string
  }
  disabled?: boolean
}

export default function AddToCartButton({ menuItem, disabled = false }: AddToCartButtonProps) {
  const { addItem } = useCart()
  const [added, setAdded] = useState(false)

  const handleAddToCart = () => {
    if (disabled) return

    addItem({
      id: menuItem.id,
      name: menuItem.title,
      price: menuItem.price,
      image_url: menuItem.image_url,
      category_name: menuItem.category_name,
    }, 1)
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
