"use client"

import { useState } from "react"
import { useCart, type CartItem } from "@/components/cart/cart-provider"
import { ShoppingCart, Check } from "lucide-react"
import ProductImagePreview from "./product-image-preview"

type MenuItemCardProps = {
  id: string | number
  title: string
  description: string
  price: number
  category: string
  imageUrl?: string
}

export default function MenuItemCard({ id, title, description, price, category, imageUrl }: MenuItemCardProps) {
  const { addItem } = useCart()
  const [added, setAdded] = useState(false)

  const handleAddToCart = () => {
    const cartItem: CartItem = {
      id: String(id),
      name: title,
      price,
      quantity: 1,
      category,
    }

    addItem(cartItem)
    setAdded(true)

    setTimeout(() => {
      setAdded(false)
    }, 2000)
  }

  return (
    <div className="bg-white rounded-lg p-4 shadow border border-gray-200 hover:shadow-md transition-shadow">
      <div className="h-40 mb-4 overflow-hidden rounded-md">
        <ProductImagePreview
          productId={id}
          productName={title}
          fallbackImage={imageUrl}
          className="h-full w-full"
          showImageCount={true}
        />
      </div>

      <h4 className="text-xl font-bold text-gray-900 mb-2">{title}</h4>
      <p className="text-gray-700 mb-4 text-sm line-clamp-2">{description}</p>

      <div className="flex justify-between items-center">
        <span className="text-lg font-bold text-gray-800">${price.toFixed(2)}</span>
        <button
          onClick={handleAddToCart}
          disabled={added}
          className={`flex items-center px-3 py-1 rounded text-sm font-medium transition-all duration-300 ${
            added
              ? "bg-green-600 hover:bg-green-700 text-white scale-105"
              : "bg-black hover:bg-gray-800 text-white hover:scale-105"
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
      </div>
    </div>
  )
}
