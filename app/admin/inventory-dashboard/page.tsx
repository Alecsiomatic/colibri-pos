"use client"

import { useState, useEffect } from "react"
import AdminLayout from "@/components/admin/admin-layout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Package, AlertTriangle, TrendingUp, TrendingDown, BarChart3, Loader2 } from "lucide-react"
import Link from "next/link"

type ProductStock = {
  id: number
  name: string
  stock: number
  category: string
  price: number
}

export default function InventoryDashboardPage() {
  const [products, setProducts] = useState<ProductStock[]>([])
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({
    total: 0,
    lowStock: 0,
    outOfStock: 0,
    totalValue: 0
  })

  useEffect(() => {
    fetchInventory()
  }, [])

  async function fetchInventory() {
    try {
      const response = await fetch('/api/products-mysql', {
        credentials: 'include'
      })
      
      if (response.ok) {
        const data = await response.json()
        if (data.success) {
          setProducts(data.products)
          
          // Calcular estadísticas
          const total = data.products.length
          const lowStock = data.products.filter((p: ProductStock) => p.stock > 0 && p.stock <= 10).length
          const outOfStock = data.products.filter((p: ProductStock) => p.stock === 0).length
          const totalValue = data.products.reduce((sum: number, p: ProductStock) => sum + (p.stock * Number(p.price)), 0)
          
          setStats({ total, lowStock, outOfStock, totalValue })
        }
      }
    } catch (error) {
      console.error('Error al cargar inventario:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-96">
          <Loader2 className="h-12 w-12 animate-spin text-purple-600" />
        </div>
      </AdminLayout>
    )
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
            Dashboard de Inventario
          </h1>
          <p className="text-muted-foreground">
            Monitoreo en tiempo real del stock y productos
          </p>
        </div>

        {/* Estadísticas */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Productos</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total}</div>
              <p className="text-xs text-muted-foreground">
                Productos en sistema
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Stock Bajo</CardTitle>
              <AlertTriangle className="h-4 w-4 text-yellow-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">{stats.lowStock}</div>
              <p className="text-xs text-muted-foreground">
                Menos de 10 unidades
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Sin Stock</CardTitle>
              <TrendingDown className="h-4 w-4 text-red-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{stats.outOfStock}</div>
              <p className="text-xs text-muted-foreground">
                Productos agotados
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Valor Total</CardTitle>
              <TrendingUp className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">${stats.totalValue.toFixed(2)}</div>
              <p className="text-xs text-muted-foreground">
                Inventario total
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Productos con stock bajo */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <AlertTriangle className="h-5 w-5 mr-2 text-yellow-500" />
              Productos con Stock Bajo
            </CardTitle>
          </CardHeader>
          <CardContent>
            {products.filter(p => p.stock > 0 && p.stock <= 10).length === 0 ? (
              <p className="text-muted-foreground text-center py-4">
                ✅ Todos los productos tienen stock suficiente
              </p>
            ) : (
              <div className="space-y-2">
                {products
                  .filter(p => p.stock > 0 && p.stock <= 10)
                  .map(product => (
                    <div key={product.id} className="flex items-center justify-between p-3 bg-yellow-50 dark:bg-yellow-950 rounded-lg border border-yellow-200 dark:border-yellow-800">
                      <div>
                        <p className="font-medium text-yellow-900 dark:text-yellow-100">{product.name}</p>
                        <p className="text-sm text-yellow-700 dark:text-yellow-300">{product.category}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-bold text-yellow-600">{product.stock}</p>
                        <p className="text-xs text-yellow-700 dark:text-yellow-300">unidades</p>
                      </div>
                    </div>
                  ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Productos sin stock */}
        {stats.outOfStock > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center text-red-600">
                <TrendingDown className="h-5 w-5 mr-2" />
                Productos Agotados
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {products
                  .filter(p => p.stock === 0)
                  .map(product => (
                    <div key={product.id} className="flex items-center justify-between p-3 bg-red-50 dark:bg-red-950 rounded-lg border border-red-200 dark:border-red-800">
                      <div>
                        <p className="font-medium text-red-900 dark:text-red-100">{product.name}</p>
                        <p className="text-sm text-red-700 dark:text-red-300">{product.category}</p>
                      </div>
                      <div className="text-red-600 font-bold">AGOTADO</div>
                    </div>
                  ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Acciones rápidas */}
        <Card>
          <CardHeader>
            <CardTitle>Acciones Rápidas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-4">
              <Button asChild>
                <Link href="/admin/inventory">
                  <Package className="h-4 w-4 mr-2" />
                  Gestionar Stock
                </Link>
              </Button>
              <Button asChild variant="outline">
                <Link href="/admin/products">
                  <BarChart3 className="h-4 w-4 mr-2" />
                  Ver Todos los Productos
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  )
}