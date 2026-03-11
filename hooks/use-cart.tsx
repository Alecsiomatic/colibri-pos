'use client'

import { createContext, useContext, useEffect, useState, ReactNode } from 'react'

interface CartItem {
  id: number
  name: string
  price: number
  quantity: number
  image_url?: string
  category_name?: string
  modifiers?: Array<{
    option_id?: number
    group: string
    modifier: string
    price: number
  }>
}

interface CartContextType {
  items: CartItem[]
  addItem: (product: any, quantity?: number) => void
  removeItem: (productId: number, modifiers?: CartItem['modifiers']) => void
  updateQuantity: (productId: number, quantity: number, modifiers?: CartItem['modifiers']) => void
  clearCart: () => void
  total: number
  itemCount: number
  hydrated: boolean
  createOrder: (orderData: any) => Promise<{ success: boolean; orderId?: number; message?: string }>
}

const CartContext = createContext<CartContextType | undefined>(undefined)

// Comparación determinista de modificadores (independiente del orden de propiedades)
function modifiersKey(modifiers?: CartItem['modifiers']): string {
  if (!modifiers || modifiers.length === 0) return ''
  return modifiers
    .map(m => `${m.group}:${m.modifier}:${m.price}`)
    .sort()
    .join('|')
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([])
  const [hydrated, setHydrated] = useState(false)

  // Cargar carrito del localStorage al iniciar
  useEffect(() => {
    const savedCart = localStorage.getItem('cart')
    if (savedCart) {
      try {
        setItems(JSON.parse(savedCart))
      } catch (error) {
        console.error('Error cargando carrito:', error)
      }
    }
    setHydrated(true)
  }, [])

  // Guardar carrito en localStorage cuando cambie
  useEffect(() => {
    localStorage.setItem('cart', JSON.stringify(items))
  }, [items])

  const addItem = (product: any, quantity: number = 1) => {
    setItems(currentItems => {
      // Si tiene modificadores, crear un ID único para no mezclar items con diferentes modificadores
      const itemId = product.modifiers && product.modifiers.length > 0 
        ? `${product.id}_${modifiersKey(product.modifiers)}`
        : product.id
      
      const existingItem = currentItems.find(item => {
        if (product.modifiers && product.modifiers.length > 0) {
          return item.id === product.id && 
                 modifiersKey(item.modifiers) === modifiersKey(product.modifiers)
        }
        return item.id === product.id
      })
      
      if (existingItem) {
        return currentItems.map(item => {
          if (product.modifiers && product.modifiers.length > 0) {
            return item.id === product.id && 
                   modifiersKey(item.modifiers) === modifiersKey(product.modifiers)
              ? { ...item, quantity: item.quantity + quantity }
              : item
          }
          return item.id === product.id
            ? { ...item, quantity: item.quantity + quantity }
            : item
        })
      } else {
        return [...currentItems, {
          id: product.id,
          name: product.name,
          price: product.price,
          quantity,
          image_url: product.image_url,
          category_name: product.category_name,
          modifiers: product.modifiers || []
        }]
      }
    })
  }

  const removeItem = (productId: number, modifiers?: CartItem['modifiers']) => {
    setItems(currentItems => currentItems.filter(item => {
      if (item.id !== productId) return true
      if (modifiers !== undefined) {
        return modifiersKey(item.modifiers) !== modifiersKey(modifiers)
      }
      return false
    }))
  }

  const updateQuantity = (productId: number, quantity: number, modifiers?: CartItem['modifiers']) => {
    if (quantity <= 0) {
      removeItem(productId, modifiers)
      return
    }

    setItems(currentItems =>
      currentItems.map(item => {
        if (item.id !== productId) return item
        if (modifiers !== undefined && modifiersKey(item.modifiers) !== modifiersKey(modifiers)) return item
        return { ...item, quantity }
      })
    )
  }

  const clearCart = () => {
    setItems([])
  }

  const total = items.reduce((sum, item) => sum + (item.price * item.quantity), 0)
  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0)

  const createOrder = async (orderData: any) => {
    try {
      const orderItems = items.map(item => ({
        id: item.id,
        name: item.name,
        price: item.price,
        quantity: item.quantity,
        modifiers: item.modifiers || []
      }))

      const response = await fetch('/api/orders-mysql', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          items: orderItems,
          customer_info: orderData.customer_info,
          delivery_address: orderData.delivery_address,
          payment_method: orderData.payment_method,
          notes: orderData.notes,
          delivery_type: orderData.delivery_type,
          waiter_order: orderData.waiter_order,
          table: orderData.table,
          order_source: orderData.order_type || orderData.order_source || 'online',
          discount_amount: orderData.discount_amount,
          discount_detail: orderData.discount_detail,
          coupon_code: orderData.coupon_code,
          loyalty_points_redeemed: orderData.loyalty_points_redeemed,
          loyalty_discount: orderData.loyalty_discount,
        }),
      })

      const data = await response.json()

      if (data.success) {
        // NO limpiar el carrito aquí, dejar que el checkout lo haga después de redirigir
        return { 
          success: true, 
          orderId: data.orderId, 
          message: 'Pedido creado exitosamente' 
        }
      } else {
        return { 
          success: false, 
          message: data.error || 'Error al crear pedido' 
        }
      }
    } catch (error) {
      console.error('Error creando pedido:', error)
      return { 
        success: false, 
        message: 'Error de conexión' 
      }
    }
  }

  return (
    <CartContext.Provider value={{
      items,
      addItem,
      removeItem,
      updateQuantity,
      clearCart,
      total,
      itemCount,
      hydrated,
      createOrder
    }}>
      {children}
    </CartContext.Provider>
  )
}

export function useCart() {
  const context = useContext(CartContext)
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider')
  }
  return context
}