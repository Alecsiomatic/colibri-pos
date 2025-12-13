'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useAuth } from './use-auth'
import { useToast } from './use-notifications'

interface Product {
  id: number
  name: string
  description: string
  price: number
  cost_price?: number
  stock?: number
  image_url?: string
  category_id: number
  category_name?: string
  available: boolean
  created_at: string
  updated_at: string
}

interface Category {
  id: number
  name: string
  description?: string
  created_at: string
  updated_at: string
}

export function useProducts() {
  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  // Usar refs para control interno
  const inFlightProducts = useRef(false)
  const inFlightCategories = useRef(false)
  const lastErrorToast = useRef<number>(0)
  
  const { user } = useAuth()
  const toast = useToast()

  const fetchWithRetry = useCallback(async (url: string, attempts = 2) => {
    let attempt = 0
    while (true) {
      try {
        const response = await fetch(url)
        if (!response.ok) throw new Error(`HTTP ${response.status}`)
        return await response.json()
      } catch (err: any) {
        attempt++
        if (attempt >= attempts) throw err
        const delay = 500 * Math.pow(2, attempt - 1)
        await new Promise((res) => setTimeout(res, delay))
      }
    }
  }, [])

  const fetchProducts = useCallback(async (categoryId?: number) => {
    // prevent concurrent fetches
    if (inFlightProducts.current) {
      return
    }

    try {
      inFlightProducts.current = true
      setLoading(true)
      setError(null)

      const url = categoryId ? `/api/products-mysql?category=${categoryId}` : '/api/products-mysql'
      const data = await fetchWithRetry(url, 2)

      if (data.success) {
        setProducts(data.products)
        setError(null)
      } else {
        const errorMsg = data.error || 'Error cargando productos'
        setError(errorMsg)
        const now = Date.now()
        if (now - lastErrorToast.current > 5000) {
          toast.error('Error de productos', errorMsg)
          lastErrorToast.current = now
        }
      }
    } catch (error: any) {
      console.error('Error fetching products:', error)
      const errorMsg = 'Error de conexión'
      setError(errorMsg)
      const now = Date.now()
      if (now - lastErrorToast.current > 5000) {
        toast.error('Error de conexión', errorMsg)
        lastErrorToast.current = now
      }
    } finally {
      setLoading(false)
      inFlightProducts.current = false
    }
  }, [fetchWithRetry, toast])

  // Cargar categorías
  const fetchCategories = useCallback(async () => {
    if (inFlightCategories.current) {
      return
    }

    try {
      inFlightCategories.current = true

      const data = await fetchWithRetry('/api/categories', 2)
      if (data.success) {
        setCategories(data.categories)
        setError(null)
      } else {
        const errorMsg = data.error || 'Error cargando categorías'
        setError(errorMsg)
        const now = Date.now()
        if (now - lastErrorToast.current > 5000) {
          toast.error('Error de categorías', errorMsg)
          lastErrorToast.current = now
        }
      }
    } catch (error) {
      console.error('Error fetching categories:', error)
      const errorMsg = 'No se pudieron cargar las categorías'
      setError(errorMsg)
      const now = Date.now()
      if (now - lastErrorToast.current > 5000) {
        toast.error('Error de conexión', errorMsg)
        lastErrorToast.current = now
      }
    } finally {
      inFlightCategories.current = false
    }
  }, [fetchWithRetry, toast])

  // Crear producto (admin only)
  const createProduct = async (productData: Omit<Product, 'id' | 'created_at' | 'updated_at'>) => {
    if (!user?.is_admin) {
      console.warn('Create product attempted without admin permission')
      return { success: false, error: 'Sin permisos' }
    }

    try {
      const response = await fetch('/api/products-mysql', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(productData),
      })

      const data = await response.json()

      if (data.success) {
        toast.success('Producto creado', 'El producto se ha creado exitosamente')
        await fetchProducts() // Recargar lista
        return { success: true, product: data.product }
      } else {
        console.error('Error creating product:', data.error)
        return { success: false, error: data.error }
      }
    } catch (error) {
      console.error('Error creating product:', error)
      return { success: false, error: 'Error de conexión' }
    }
  }

  // Actualizar producto (admin only)
  const updateProduct = async (id: number, productData: Partial<Product>) => {
    if (!user?.is_admin) {
      console.warn('Update product attempted without admin permission')
      return { success: false, error: 'Sin permisos' }
    }

    try {
      const response = await fetch('/api/products-mysql', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ id, ...productData }),
      })

      const data = await response.json()

      if (data.success) {
        toast.success('Producto actualizado', 'Los cambios se han guardado')
        await fetchProducts() // Recargar lista
        return { success: true, product: data.product }
      } else {
        console.error('Error updating product:', data.error)
        return { success: false, error: data.error }
      }
    } catch (error) {
      console.error('Error updating product:', error)
      return { success: false, error: 'Error de conexión' }
    }
  }

  // Eliminar producto (admin only)
  const deleteProduct = async (id: number) => {
    if (!user?.is_admin) {
      console.warn('Delete product attempted without admin permission')
      return { success: false, error: 'Sin permisos' }
    }

    try {
      const response = await fetch(`/api/products-mysql?id=${id}`, {
        method: 'DELETE',
        credentials: 'include',
      })

      const data = await response.json()

      if (data.success) {
        toast.success('Producto eliminado', 'El producto se ha eliminado')
        await fetchProducts() // Recargar lista
        return { success: true }
      } else {
        console.error('Error deleting product:', data.error)
        return { success: false, error: data.error }
      }
    } catch (error) {
      console.error('Error deleting product:', error)
      return { success: false, error: 'Error de conexión' }
    }
  }

  // Alternar disponibilidad del producto
  const toggleAvailability = async (id: number, available: boolean) => {
    return await updateProduct(id, { available })
  }

  return {
    products,
    categories,
    loading,
    error,
    fetchProducts,
    fetchCategories,
    createProduct,
    updateProduct,
    deleteProduct,
    toggleAvailability,
    refetch: fetchProducts
  }
}