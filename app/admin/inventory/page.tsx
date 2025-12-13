"use client"

import { useState, useEffect } from "react"
import AdminLayout from "@/components/admin/admin-layout"
import { Package, TrendingUp, TrendingDown, AlertTriangle, Plus, Minus, History, Search, Filter, Eye, Edit } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Textarea } from "@/components/ui/textarea"
import { useProducts } from "@/hooks/use-products"
import { useToast } from "@/hooks/use-notifications"
import { cn } from "@/lib/utils"

interface StockMovement {
  id: number
  product_id: number
  previous_stock: number
  new_stock: number
  change_amount: number
  change_type: 'addition' | 'reduction' | 'adjustment'
  reference_id?: number
  notes?: string
  created_at: string
  product?: {
    name: string
  }
}

interface Product {
  id: number
  name: string
  description: string
  price: number
  image_url: string
  category_id: number | null
  stock: number
  available: boolean
  created_at: string
  updated_at: string
  category?: {
    id: number
    name: string
  }
}

export default function AdminInventoryPage() {
  const { products, loading, fetchProducts, updateProduct } = useProducts()
  const toast = useToast()
  
  // Estado local
  const [stockMovements, setStockMovements] = useState<StockMovement[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [stockFilter, setStockFilter] = useState<string>("all")
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const [isStockDialogOpen, setIsStockDialogOpen] = useState(false)
  const [isHistoryDialogOpen, setIsHistoryDialogOpen] = useState(false)
  const [stockChange, setStockChange] = useState({
    type: 'adjustment' as 'addition' | 'reduction' | 'adjustment',
    amount: 0,
    notes: ''
  })
  
  // Estados de carga
  const [isUpdatingStock, setIsUpdatingStock] = useState(false)
  const [isLoadingMovements, setIsLoadingMovements] = useState(false)

  useEffect(() => {
    fetchProducts()
    fetchStockMovements()
  }, [fetchProducts])

  // Cargar movimientos de stock
  const fetchStockMovements = async () => {
    setIsLoadingMovements(true)
    try {
      // Temporalmente deshabilitado - la tabla de movimientos no existe aún
      // const response = await fetch('/api/admin/inventory/movements', {
      //   credentials: 'include'
      // })
      
      // if (!response.ok) {
      //   throw new Error('Error al cargar movimientos')
      // }
      
      // const data = await response.json()
      // setStockMovements(data.movements || [])
      
      setStockMovements([]) // Por ahora, array vacío
    } catch (error) {
      console.error('Error fetching stock movements:', error)
      // No mostrar error toast por ahora
    } finally {
      setIsLoadingMovements(false)
    }
  }

  // Filtrar productos
  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesStock = stockFilter === "all" ||
                        (stockFilter === "in-stock" && product.stock > 0) ||
                        (stockFilter === "out-of-stock" && product.stock === 0) ||
                        (stockFilter === "low-stock" && product.stock > 0 && product.stock <= 5)
    
    return matchesSearch && matchesStock
  })

  // Estadísticas de inventario
  const stats = {
    total: products.length,
    inStock: products.filter(p => p.stock > 0).length,
    outOfStock: products.filter(p => p.stock === 0).length,
    lowStock: products.filter(p => p.stock > 0 && p.stock <= 5).length,
    totalValue: products.reduce((sum, p) => sum + (p.price * p.stock), 0)
  }

  // Actualizar stock
  const handleStockUpdate = async () => {
    if (!selectedProduct) return

    if (stockChange.amount <= 0) {
      toast.error("Error", "La cantidad debe ser mayor a 0")
      return
    }

    setIsUpdatingStock(true)
    try {
      let newStock = selectedProduct.stock

      switch (stockChange.type) {
        case 'addition':
          newStock = selectedProduct.stock + stockChange.amount
          break
        case 'reduction':
          newStock = Math.max(0, selectedProduct.stock - stockChange.amount)
          break
        case 'adjustment':
          newStock = stockChange.amount
          break
      }

      // Actualizar stock en el producto
      await updateProduct(selectedProduct.id, { ...selectedProduct, stock: newStock })

      // Registrar movimiento de stock
      const response = await fetch('/api/admin/inventory/movements', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          product_id: selectedProduct.id,
          previous_stock: selectedProduct.stock,
          new_stock: newStock,
          change_amount: stockChange.type === 'reduction' ? -stockChange.amount : stockChange.amount,
          change_type: stockChange.type,
          notes: stockChange.notes
        })
      })

      if (!response.ok) {
        throw new Error('Error al registrar movimiento')
      }

      toast.success("Stock actualizado", `Stock de ${selectedProduct.name} actualizado exitosamente`)
      setIsStockDialogOpen(false)
      setSelectedProduct(null)
      setStockChange({ type: 'adjustment', amount: 0, notes: '' })
      await fetchStockMovements()
    } catch (error) {
      console.error('Error updating stock:', error)
      toast.error("Error", "No se pudo actualizar el stock")
    } finally {
      setIsUpdatingStock(false)
    }
  }

  // Obtener badge de stock
  const getStockBadge = (stock: number) => {
    if (stock === 0) {
      return <Badge variant="destructive">Sin stock</Badge>
    }
    if (stock <= 5) {
      return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">Stock bajo</Badge>
    }
    return <Badge variant="default" className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">En stock</Badge>
  }

  // Formatear fecha
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-96">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-purple-600"></div>
        </div>
      </AdminLayout>
    )
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
              Gestión de Inventario
            </h1>
            <p className="text-muted-foreground">
              Controla el stock y movimientos de productos
            </p>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <Card className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950 dark:to-blue-900">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-blue-600 dark:text-blue-400">Total Productos</p>
                  <p className="text-2xl font-bold text-blue-900 dark:text-blue-100">{stats.total}</p>
                </div>
                <Package className="h-8 w-8 text-blue-600 dark:text-blue-400" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950 dark:to-green-900">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-green-600 dark:text-green-400">En Stock</p>
                  <p className="text-2xl font-bold text-green-900 dark:text-green-100">{stats.inStock}</p>
                </div>
                <TrendingUp className="h-8 w-8 text-green-600 dark:text-green-400" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-red-50 to-red-100 dark:from-red-950 dark:to-red-900">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-red-600 dark:text-red-400">Sin Stock</p>
                  <p className="text-2xl font-bold text-red-900 dark:text-red-100">{stats.outOfStock}</p>
                </div>
                <TrendingDown className="h-8 w-8 text-red-600 dark:text-red-400" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-yellow-50 to-yellow-100 dark:from-yellow-950 dark:to-yellow-900">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-yellow-600 dark:text-yellow-400">Stock Bajo</p>
                  <p className="text-2xl font-bold text-yellow-900 dark:text-yellow-100">{stats.lowStock}</p>
                </div>
                <AlertTriangle className="h-8 w-8 text-yellow-600 dark:text-yellow-400" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-950 dark:to-purple-900">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-purple-600 dark:text-purple-400">Valor Total</p>
                  <p className="text-xl font-bold text-purple-900 dark:text-purple-100">${stats.totalValue.toFixed(2)}</p>
                </div>
                <Package className="h-8 w-8 text-purple-600 dark:text-purple-400" />
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="products" className="space-y-4">
          <TabsList>
            <TabsTrigger value="products">Productos</TabsTrigger>
            <TabsTrigger value="movements">Historial de Movimientos</TabsTrigger>
          </TabsList>

          <TabsContent value="products" className="space-y-4">
            {/* Filters */}
            <Card>
              <CardContent className="p-6">
                <div className="flex flex-col lg:flex-row gap-4">
                  <div className="flex-1">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                      <Input
                        placeholder="Buscar productos..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                  </div>
                  <Select value={stockFilter} onValueChange={setStockFilter}>
                    <SelectTrigger className="w-full lg:w-48">
                      <SelectValue placeholder="Filtrar por stock" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos</SelectItem>
                      <SelectItem value="in-stock">En stock</SelectItem>
                      <SelectItem value="low-stock">Stock bajo</SelectItem>
                      <SelectItem value="out-of-stock">Sin stock</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            {/* Products Table */}
            <Card>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Producto</TableHead>
                      <TableHead>Categoría</TableHead>
                      <TableHead>Precio</TableHead>
                      <TableHead>Stock Actual</TableHead>
                      <TableHead>Estado</TableHead>
                      <TableHead>Valor en Stock</TableHead>
                      <TableHead className="text-right">Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredProducts.map((product) => (
                      <TableRow key={product.id}>
                        <TableCell>
                          <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 bg-gray-200 dark:bg-gray-700 rounded-lg flex items-center justify-center">
                              {product.image_url ? (
                                <img 
                                  src={product.image_url} 
                                  alt={product.name}
                                  className="w-full h-full object-cover rounded-lg"
                                />
                              ) : (
                                <Package className="h-5 w-5 text-muted-foreground" />
                              )}
                            </div>
                            <div>
                              <p className="font-medium">{product.name}</p>
                              <p className="text-sm text-muted-foreground line-clamp-1">{product.description}</p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          {product.category ? (
                            <Badge variant="outline">{product.category.name}</Badge>
                          ) : (
                            <span className="text-muted-foreground">Sin categoría</span>
                          )}
                        </TableCell>
                        <TableCell className="font-medium">${product.price}</TableCell>
                        <TableCell>
                          <span className={cn(
                            "font-bold",
                            product.stock === 0 ? "text-red-600" : 
                            product.stock <= 5 ? "text-yellow-600" : "text-green-600"
                          )}>
                            {product.stock}
                          </span>
                        </TableCell>
                        <TableCell>
                          {getStockBadge(product.stock)}
                        </TableCell>
                        <TableCell className="font-medium">
                          ${(product.price * product.stock).toFixed(2)}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setSelectedProduct(product)
                                setIsStockDialogOpen(true)
                              }}
                            >
                              <Edit className="h-4 w-4 mr-1" />
                              Ajustar Stock
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setSelectedProduct(product)
                                setIsHistoryDialogOpen(true)
                              }}
                            >
                              <History className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>

                {filteredProducts.length === 0 && (
                  <div className="p-12 text-center">
                    <Package className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
                    <h3 className="text-lg font-semibold mb-2">No se encontraron productos</h3>
                    <p className="text-muted-foreground">
                      {searchTerm || stockFilter !== "all"
                        ? "Prueba ajustando los filtros de búsqueda"
                        : "No hay productos en el inventario"
                      }
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="movements" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Historial de Movimientos de Stock</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Fecha</TableHead>
                      <TableHead>Producto</TableHead>
                      <TableHead>Tipo</TableHead>
                      <TableHead>Stock Anterior</TableHead>
                      <TableHead>Stock Nuevo</TableHead>
                      <TableHead>Cambio</TableHead>
                      <TableHead>Notas</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {stockMovements.map((movement) => (
                      <TableRow key={movement.id}>
                        <TableCell className="text-sm">
                          {formatDate(movement.created_at)}
                        </TableCell>
                        <TableCell>
                          {movement.product?.name || `Producto ${movement.product_id}`}
                        </TableCell>
                        <TableCell>
                          <Badge 
                            variant={
                              movement.change_type === 'addition' ? 'default' :
                              movement.change_type === 'reduction' ? 'destructive' : 'secondary'
                            }
                          >
                            {movement.change_type === 'addition' ? 'Adición' :
                             movement.change_type === 'reduction' ? 'Reducción' : 'Ajuste'}
                          </Badge>
                        </TableCell>
                        <TableCell>{movement.previous_stock}</TableCell>
                        <TableCell>{movement.new_stock}</TableCell>
                        <TableCell>
                          <span className={cn(
                            "font-medium",
                            movement.change_amount > 0 ? "text-green-600" : "text-red-600"
                          )}>
                            {movement.change_amount > 0 ? '+' : ''}{movement.change_amount}
                          </span>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {movement.notes || 'Sin notas'}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>

                {stockMovements.length === 0 && (
                  <div className="p-12 text-center">
                    <History className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
                    <h3 className="text-lg font-semibold mb-2">No hay movimientos registrados</h3>
                    <p className="text-muted-foreground">
                      Los movimientos de stock aparecerán aquí cuando realices ajustes
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Stock Update Dialog */}
        <Dialog open={isStockDialogOpen} onOpenChange={setIsStockDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Ajustar Stock - {selectedProduct?.name}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label className="text-sm font-medium text-muted-foreground">Stock actual</Label>
                <p className="text-lg font-bold">{selectedProduct?.stock}</p>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="change-type">Tipo de cambio</Label>
                <Select value={stockChange.type} onValueChange={(value: any) => setStockChange({ ...stockChange, type: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="addition">Agregar stock</SelectItem>
                    <SelectItem value="reduction">Reducir stock</SelectItem>
                    <SelectItem value="adjustment">Ajustar a cantidad específica</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="amount">
                  {stockChange.type === 'adjustment' ? 'Nueva cantidad' : 'Cantidad a cambiar'}
                </Label>
                <Input
                  id="amount"
                  type="number"
                  min="0"
                  value={stockChange.amount}
                  onChange={(e) => setStockChange({ ...stockChange, amount: parseInt(e.target.value) || 0 })}
                  placeholder="0"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">Notas (opcional)</Label>
                <Textarea
                  id="notes"
                  value={stockChange.notes}
                  onChange={(e) => setStockChange({ ...stockChange, notes: e.target.value })}
                  placeholder="Motivo del cambio de stock..."
                  rows={3}
                />
              </div>

              {stockChange.amount > 0 && selectedProduct && (
                <div className="p-3 bg-muted rounded-lg">
                  <p className="text-sm">
                    <strong>Resultado:</strong> {' '}
                    {stockChange.type === 'addition' && `${selectedProduct.stock} → ${selectedProduct.stock + stockChange.amount}`}
                    {stockChange.type === 'reduction' && `${selectedProduct.stock} → ${Math.max(0, selectedProduct.stock - stockChange.amount)}`}
                    {stockChange.type === 'adjustment' && `${selectedProduct.stock} → ${stockChange.amount}`}
                  </p>
                </div>
              )}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsStockDialogOpen(false)} disabled={isUpdatingStock}>
                Cancelar
              </Button>
              <Button onClick={handleStockUpdate} disabled={isUpdatingStock || stockChange.amount <= 0}>
                {isUpdatingStock ? "Actualizando..." : "Actualizar Stock"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  )
}