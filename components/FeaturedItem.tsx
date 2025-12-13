"use client"

import AddToCartButton from "@/components/menu/add-to-cart-button"

type FeaturedItemProps = {
  id: string
  title: string
  description: string
  price: string
  priceNum: number
  category: string
}

export default function FeaturedItem({ id, title, description, price, priceNum, category }: FeaturedItemProps) {
  return (
    <div className="bg-white rounded-lg p-4 shadow border border-gray-200 hover:shadow-md transition-shadow">
      <h4 className="text-xl font-bold text-gray-900 mb-2">{title}</h4>
      <p className="text-gray-700 mb-4 text-sm">{description}</p>
      <div className="flex justify-between items-center">
        <span className="text-lg font-bold text-gold-dark">{price}</span>
        <AddToCartButton
          item={{
            id,
            name: title,
            price: priceNum,
            category,
          }}
          variant="small"
        />
      </div>
    </div>
  )
}
