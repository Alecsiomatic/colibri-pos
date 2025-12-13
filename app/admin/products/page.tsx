"use client"

import { useState, useEffect } from "react"
import AdminLayout from "@/components/admin/admin-layout"
import { Plus, Search, Edit, Trash2, Save, X, Upload, Eye, Package, Star, AlertTriangle, Image as ImageIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useProducts } from "@/hooks/use-products"
import { useToast } from "@/hooks/use-notifications"
import { cn } from "@/lib/utils"
import { ImageSelector } from "@/components/admin/image-selector"

interface Product {
  id: number
  name: string
  description: string
  price: number
  cost_price?: number
  image_url?: string
  category_id: number
  stock?: number
  available: boolean
  created_at: string
  updated_at: string
  category_name?: string
}

interface Category {
  id: number
  name: string
  description?: string
}

export default function AdminProductsPage() {
  const { products, categories, loading, fetchProducts, fetchCategories, createProduct, updateProduct, deleteProduct } = useProducts()
  const toast = useToast()
  
  // Estado local
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedCategory, setSelectedCategory] = useState<string>("all")
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)
  const [newProduct, setNewProduct] = useState({
    name: "",
    description: "",
    price: 0,
    cost_price: 0,
    image_url: "",
    category_id: 0,
    stock: 0,
    available: true
  })

  // Estados de carga
  const [isCreating, setIsCreating] = useState(false)
  const [isUpdating, setIsUpdating] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [hasFetched, setHasFetched] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string>("")
  const [isImageSelectorOpen, setIsImageSelectorOpen] = useState(false)
  const [isEditImageSelectorOpen, setIsEditImageSelectorOpen] = useState(false)

  useEffect(() => {
    if (!hasFetched) {
      fetchProducts()
      fetchCategories()
      setHasFetched(true)
    }
  }, [])

  // Filtrar productos
  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         product.description.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCategory = selectedCategory === "all" || product.category_id?.toString() === selectedCategory
    return matchesSearch && matchesCategory
  })

  // Estadísticas
  const stats = {
    total: products.length,
    available: products.filter(p => p.available).length,
    outOfStock: products.filter(p => (p.stock ?? 0) === 0).length,
    lowStock: products.filter(p => (p.stock ?? 0) > 0 && (p.stock ?? 0) <= 5).length
  }

  // Manejar selección de archivo
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setSelectedFile(file)
      // Crear preview
      const reader = new FileReader()
      reader.onloadend = () => {
        setPreviewUrl(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  // Subir archivo
  const uploadFile = async (file: File): Promise<string | null> => {
    try {
      setIsUploading(true)
      const formData = new FormData()
      formData.append('file', file)
      formData.append('folder', 'products')

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
        credentials: 'include'
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Error al subir archivo')
      }

      const data = await response.json()
      return data.url
    } catch (error: any) {
      console.error('Error uploading file:', error)
      toast.error("Error al subir imagen", error.message)
      return null
    } finally {
      setIsUploading(false)
    }
  }

  const handleCreateProduct = async () => {
    if (!newProduct.name || !newProduct.description || newProduct.price <= 0) {
      toast.error("Datos incompletos", "Por favor completa todos los campos obligatorios")
      return
    }

    setIsCreating(true)
    try {
      // Subir imagen si hay un archivo seleccionado
      let imageUrl = newProduct.image_url
      if (selectedFile) {
        const uploadedUrl = await uploadFile(selectedFile)
        if (uploadedUrl) {
          imageUrl = uploadedUrl
        }
      }

      await createProduct({ ...newProduct, image_url: imageUrl })
      toast.success("Producto creado", "El producto se ha creado exitosamente")
      setIsAddDialogOpen(false)
      setNewProduct({
        name: "",
        description: "",
        price: 0,
        cost_price: 0,
        image_url: "",
        category_id: 0,
        stock: 0,
        available: true
      })
      setSelectedFile(null)
      setPreviewUrl("")
    } catch (error) {
      console.error("Error creating product:", error)
      toast.error("Error", "No se pudo crear el producto")
    } finally {
      setIsCreating(false)
    }
  }

  const handleUpdateProduct = async () => {
    if (!editingProduct) return

    setIsUpdating(true)
    try {
      // Subir imagen si hay un archivo seleccionado
      let imageUrl = editingProduct.image_url
      if (selectedFile) {
        const uploadedUrl = await uploadFile(selectedFile)
        if (uploadedUrl) {
          imageUrl = uploadedUrl
        }
      }

      await updateProduct(editingProduct.id, { ...editingProduct, image_url: imageUrl })
      toast.success("Producto actualizado", "Los cambios se han guardado exitosamente")
      setIsEditDialogOpen(false)
      setEditingProduct(null)
      setSelectedFile(null)
      setPreviewUrl("")
    } catch (error) {
      console.error("Error updating product:", error)
      toast.error("Error", "No se pudo actualizar el producto")
    } finally {
      setIsUpdating(false)
    }
  }

  const handleDeleteProduct = async (productId: number, productName: string) => {
    if (!confirm(`¿Estás seguro de que quieres eliminar "${productName}"?`)) {
      return
    }

    setIsDeleting(true)
    try {
      await deleteProduct(productId)
      toast.success("Producto eliminado", "El producto se ha eliminado exitosamente")
    } catch (error) {
      console.error("Error deleting product:", error)
      toast.error("Error", "No se pudo eliminar el producto")
    } finally {
      setIsDeleting(false)
    }
  }

  const toggleProductAvailability = async (product: Product) => {
    try {
      await updateProduct(product.id, { ...product, available: !product.available })
      toast.success(
        product.available ? "Producto desactivado" : "Producto activado",
        `${product.name} ahora está ${!product.available ? "disponible" : "no disponible"}`
      )
    } catch (error) {
      console.error("Error toggling availability:", error)
      toast.error("Error", "No se pudo cambiar la disponibilidad del producto")
    }
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
              Gestión de Productos
            </h1>
            <p className="text-muted-foreground">
              Administra el catálogo de productos del restaurante
            </p>
          </div>

          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700">
                <Plus className="h-4 w-4 mr-2" />
                Nuevo Producto
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Crear Nuevo Producto</DialogTitle>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Nombre *</Label>
                    <Input
                      id="name"
                      value={newProduct.name}
                      onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })}
                      placeholder="Nombre del producto"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="price">Precio de Venta *</Label>
                    <Input
                      id="price"
                      type="number"
                      step="0.01"
                      value={newProduct.price}
                      onChange={(e) => setNewProduct({ ...newProduct, price: parseFloat(e.target.value) || 0 })}
                      placeholder="0.00"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="cost-price">Precio de Costo</Label>
                    <Input
                      id="cost-price"
                      type="number"
                      step="0.01"
                      value={newProduct.cost_price}
                      onChange={(e) => setNewProduct({ ...newProduct, cost_price: parseFloat(e.target.value) || 0 })}
                      placeholder="0.00"
                    />
                    <p className="text-xs text-muted-foreground">Para calcular ganancias en reportes</p>
                  </div>
                  <div className="space-y-2">
                    <Label>Margen de Ganancia</Label>
                    <div className="flex items-center h-10 px-3 bg-muted rounded-md">
                      <span className="text-sm font-medium">
                        {newProduct.price > 0 && newProduct.cost_price > 0 
                          ? `${(((newProduct.price - newProduct.cost_price) / newProduct.price) * 100).toFixed(1)}%`
                          : '0%'
                        }
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground">Ganancia sobre precio de venta</p>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Descripción *</Label>
                  <Textarea
                    id="description"
                    value={newProduct.description}
                    onChange={(e) => setNewProduct({ ...newProduct, description: e.target.value })}
                    placeholder="Descripción del producto"
                    rows={3}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="category">Categoría</Label>
                    <Select
                      value={newProduct.category_id?.toString() || ""}
                      onValueChange={(value) => setNewProduct({ ...newProduct, category_id: value ? parseInt(value) : 0 })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar categoría" />
                      </SelectTrigger>
                      <SelectContent>
                        {categories.map((category) => (
                          <SelectItem key={category.id} value={category.id.toString()}>
                            {category.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="stock">Stock Inicial</Label>
                    <Input
                      id="stock"
                      type="number"
                      value={newProduct.stock}
                      onChange={(e) => setNewProduct({ ...newProduct, stock: parseInt(e.target.value) || 0 })}
                      placeholder="0"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="image">Imagen del Producto</Label>
                  <div className="border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-lg p-4">
                    {previewUrl || newProduct.image_url ? (
                      <div className="space-y-3">
                        <img 
                          src={previewUrl || newProduct.image_url} 
                          alt="Preview" 
                          className="mx-auto h-32 w-32 object-cover rounded-lg"
                        />
                        <div className="flex gap-2 justify-center">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setIsImageSelectorOpen(true)}
                          >
                            <ImageIcon className="h-4 w-4 mr-1" />
                            Cambiar desde galería
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setSelectedFile(null)
                              setPreviewUrl("")
                              setNewProduct({ ...newProduct, image_url: "" })
                            }}
                          >
                            <X className="h-4 w-4 mr-1" />
                            Quitar
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        <div className="space-y-2 text-center">
                          <Upload className="mx-auto h-12 w-12 text-gray-400" />
                          <div className="text-sm text-gray-600 dark:text-gray-400">
                            <label htmlFor="file-upload-new" className="cursor-pointer text-purple-600 hover:text-purple-500 font-medium">
                              Subir nueva imagen
                            </label>
                            <input
                              id="file-upload-new"
                              type="file"
                              className="sr-only"
                              accept="image/*"
                              onChange={handleFileSelect}
                            />
                            <p className="mt-1 text-xs">PNG, JPG, GIF hasta 5MB</p>
                          </div>
                        </div>
                        <div className="relative">
                          <div className="absolute inset-0 flex items-center">
                            <div className="w-full border-t border-gray-300 dark:border-gray-600" />
                          </div>
                          <div className="relative flex justify-center text-sm">
                            <span className="px-2 bg-background text-muted-foreground">o</span>
                          </div>
                        </div>
                        <Button
                          type="button"
                          variant="outline"
                          className="w-full"
                          onClick={() => setIsImageSelectorOpen(true)}
                        >
                          <ImageIcon className="h-4 w-4 mr-2" />
                          Seleccionar de galería
                        </Button>
                        <p className="text-xs text-center text-muted-foreground">
                          📁 /public/uploads/products/
                        </p>
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    id="available"
                    checked={newProduct.available}
                    onCheckedChange={(checked) => setNewProduct({ ...newProduct, available: checked })}
                  />
                  <Label htmlFor="available">Producto disponible</Label>
                </div>
              </div>
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setIsAddDialogOpen(false)}
                  disabled={isCreating}
                >
                  Cancelar
                </Button>
                <Button onClick={handleCreateProduct} disabled={isCreating}>
                  {isCreating ? "Creando..." : "Crear Producto"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
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
                  <p className="text-sm font-medium text-green-600 dark:text-green-400">Disponibles</p>
                  <p className="text-2xl font-bold text-green-900 dark:text-green-100">{stats.available}</p>
                </div>
                <Star className="h-8 w-8 text-green-600 dark:text-green-400" />
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
                <X className="h-8 w-8 text-red-600 dark:text-red-400" />
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
        </div>

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
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger className="w-full lg:w-48">
                  <SelectValue placeholder="Todas las categorías" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas las categorías</SelectItem>
                  {categories.map((category) => (
                    <SelectItem key={category.id} value={category.id.toString()}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Products Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredProducts.map((product) => (
            <Card key={product.id} className="overflow-hidden hover:shadow-lg transition-shadow">
              <div className="aspect-square relative bg-gray-100 dark:bg-gray-800">
                {product.image_url ? (
                  <img
                    src={product.image_url}
                    alt={product.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="flex items-center justify-center h-full text-muted-foreground">
                    <Package className="h-12 w-12" />
                  </div>
                )}
                <div className="absolute top-2 right-2 flex gap-1">
                  {!product.available && (
                    <Badge variant="secondary" className="bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200">
                      No disponible
                    </Badge>
                  )}
                  {(product.stock ?? 0) === 0 && (
                    <Badge variant="secondary" className="bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200">
                      Sin stock
                    </Badge>
                  )}
                  {(product.stock ?? 0) > 0 && (product.stock ?? 0) <= 5 && (
                    <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">
                      Stock bajo
                    </Badge>
                  )}
                </div>
              </div>
              <CardContent className="p-4">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-semibold text-lg truncate">{product.name}</h3>
                  <div className="text-right">
                    <div className="text-xl font-bold text-purple-600">${product.price}</div>
                    {product.cost_price && (
                      <div className="text-xs text-muted-foreground">
                        Costo: ${product.cost_price}
                      </div>
                    )}
                  </div>
                </div>
                <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                  {product.description}
                </p>
                {product.cost_price && product.cost_price > 0 && (
                  <div className="mb-3 p-2 bg-green-50 dark:bg-green-950 rounded-md">
                    <div className="flex justify-between text-sm">
                      <span className="text-green-700 dark:text-green-300">Ganancia:</span>
                      <span className="font-medium text-green-800 dark:text-green-200">
                        ${(product.price - product.cost_price).toFixed(2)} ({(((product.price - product.cost_price) / product.price) * 100).toFixed(1)}%)
                      </span>
                    </div>
                  </div>
                )}
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm text-muted-foreground">
                    Stock: <span className="font-medium">{product.stock ?? 0}</span>
                  </span>
                  {product.category_name && (
                    <Badge variant="outline">{product.category_name}</Badge>
                  )}
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setEditingProduct(product)
                      setSelectedFile(null)
                      setPreviewUrl("")
                      setIsEditDialogOpen(true)
                    }}
                    className="flex-1"
                  >
                    <Edit className="h-4 w-4 mr-1" />
                    Editar
                  </Button>
                  <Button
                    variant={product.available ? "outline" : "default"}
                    size="sm"
                    onClick={() => toggleProductAvailability(product)}
                    className={cn(
                      "flex-1",
                      !product.available && "bg-green-600 hover:bg-green-700 text-white"
                    )}
                  >
                    {product.available ? "Desactivar" : "Activar"}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDeleteProduct(product.id, product.name)}
                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    disabled={isDeleting}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {filteredProducts.length === 0 && (
          <Card>
            <CardContent className="p-12 text-center">
              <Package className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-semibold mb-2">No se encontraron productos</h3>
              <p className="text-muted-foreground">
                {searchTerm || selectedCategory !== "all" 
                  ? "Prueba ajustando los filtros de búsqueda"
                  : "Crea tu primer producto para comenzar"
                }
              </p>
            </CardContent>
          </Card>
        )}

        {/* Edit Product Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Editar Producto</DialogTitle>
            </DialogHeader>
            {editingProduct && (
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="edit-name">Nombre *</Label>
                    <Input
                      id="edit-name"
                      value={editingProduct.name}
                      onChange={(e) => setEditingProduct({ ...editingProduct, name: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-price">Precio de Venta *</Label>
                    <Input
                      id="edit-price"
                      type="number"
                      step="0.01"
                      value={editingProduct.price}
                      onChange={(e) => setEditingProduct({ ...editingProduct, price: parseFloat(e.target.value) || 0 })}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="edit-cost-price">Precio de Costo</Label>
                    <Input
                      id="edit-cost-price"
                      type="number"
                      step="0.01"
                      value={editingProduct.cost_price || 0}
                      onChange={(e) => setEditingProduct({ ...editingProduct, cost_price: parseFloat(e.target.value) || 0 })}
                      placeholder="0.00"
                    />
                    <p className="text-xs text-muted-foreground">Para calcular ganancias en reportes</p>
                  </div>
                  <div className="space-y-2">
                    <Label>Margen de Ganancia</Label>
                    <div className="flex items-center h-10 px-3 bg-muted rounded-md">
                      <span className="text-sm font-medium">
                        {editingProduct.price > 0 && (editingProduct.cost_price || 0) > 0 
                          ? `${(((editingProduct.price - (editingProduct.cost_price || 0)) / editingProduct.price) * 100).toFixed(1)}%`
                          : '0%'
                        }
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground">Ganancia sobre precio de venta</p>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-description">Descripción *</Label>
                  <Textarea
                    id="edit-description"
                    value={editingProduct.description}
                    onChange={(e) => setEditingProduct({ ...editingProduct, description: e.target.value })}
                    rows={3}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="edit-category">Categoría</Label>
                    <Select
                      value={editingProduct.category_id?.toString() || ""}
                      onValueChange={(value) => setEditingProduct({ ...editingProduct, category_id: value ? parseInt(value) : 0 })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar categoría" />
                      </SelectTrigger>
                      <SelectContent>
                        {categories.map((category) => (
                          <SelectItem key={category.id} value={category.id.toString()}>
                            {category.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-stock">Stock</Label>
                    <Input
                      id="edit-stock"
                      type="number"
                      value={editingProduct.stock}
                      onChange={(e) => setEditingProduct({ ...editingProduct, stock: parseInt(e.target.value) || 0 })}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-image">Imagen del Producto</Label>
                  <div className="border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-lg p-4">
                    {previewUrl || editingProduct.image_url ? (
                      <div className="space-y-3">
                        <img 
                          src={previewUrl || editingProduct.image_url} 
                          alt="Preview" 
                          className="mx-auto h-32 w-32 object-cover rounded-lg"
                        />
                        <div className="flex gap-2 justify-center">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setIsEditImageSelectorOpen(true)}
                          >
                            <ImageIcon className="h-4 w-4 mr-1" />
                            Cambiar desde galería
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setSelectedFile(null)
                              setPreviewUrl("")
                              setEditingProduct({ ...editingProduct, image_url: "" })
                            }}
                          >
                            <X className="h-4 w-4 mr-1" />
                            Quitar
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        <div className="space-y-2 text-center">
                          <Upload className="mx-auto h-12 w-12 text-gray-400" />
                          <div className="text-sm text-gray-600 dark:text-gray-400">
                            <label htmlFor="file-upload-edit" className="cursor-pointer text-purple-600 hover:text-purple-500 font-medium">
                              Subir nueva imagen
                            </label>
                            <input
                              id="file-upload-edit"
                              type="file"
                              className="sr-only"
                              accept="image/*"
                              onChange={handleFileSelect}
                            />
                            <p className="mt-1 text-xs">PNG, JPG, GIF hasta 5MB</p>
                          </div>
                        </div>
                        <div className="relative">
                          <div className="absolute inset-0 flex items-center">
                            <div className="w-full border-t border-gray-300 dark:border-gray-600" />
                          </div>
                          <div className="relative flex justify-center text-sm">
                            <span className="px-2 bg-background text-muted-foreground">o</span>
                          </div>
                        </div>
                        <Button
                          type="button"
                          variant="outline"
                          className="w-full"
                          onClick={() => setIsEditImageSelectorOpen(true)}
                        >
                          <ImageIcon className="h-4 w-4 mr-2" />
                          Seleccionar de galería
                        </Button>
                        <p className="text-xs text-center text-muted-foreground">
                          📁 /public/uploads/products/
                        </p>
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    id="edit-available"
                    checked={editingProduct.available}
                    onCheckedChange={(checked) => setEditingProduct({ ...editingProduct, available: checked })}
                  />
                  <Label htmlFor="edit-available">Producto disponible</Label>
                </div>
              </div>
            )}
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => {
                  setIsEditDialogOpen(false)
                  setEditingProduct(null)
                  setSelectedFile(null)
                  setPreviewUrl("")
                }}
                disabled={isUpdating}
              >
                Cancelar
              </Button>
              <Button onClick={handleUpdateProduct} disabled={isUpdating}>
                {isUpdating ? "Guardando..." : "Guardar Cambios"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Image Selector para Nuevo Producto */}
        <ImageSelector
          open={isImageSelectorOpen}
          onOpenChange={setIsImageSelectorOpen}
          onSelect={(imageUrl) => {
            setNewProduct({ ...newProduct, image_url: imageUrl })
            setPreviewUrl(imageUrl)
            setSelectedFile(null)
          }}
          currentImage={newProduct.image_url}
        />

        {/* Image Selector para Editar Producto */}
        <ImageSelector
          open={isEditImageSelectorOpen}
          onOpenChange={setIsEditImageSelectorOpen}
          onSelect={(imageUrl) => {
            if (editingProduct) {
              setEditingProduct({ ...editingProduct, image_url: imageUrl })
              setPreviewUrl(imageUrl)
              setSelectedFile(null)
            }
          }}
          currentImage={editingProduct?.image_url}
        />
      </div>
    </AdminLayout>
  )
}