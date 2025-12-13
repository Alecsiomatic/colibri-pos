"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import AdminLayout from "@/components/admin/admin-layout"
import { Plus, Edit, Trash2, Save, X, Tag, Search, Grid } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { useProducts } from "@/hooks/use-products"
import { useToast } from "@/hooks/use-notifications"
import { cn } from "@/lib/utils"

interface Category {
  id: number
  name: string
  description?: string
  created_at: string
  updated_at: string
  products_count?: number
}

export default function AdminCategoriesPage() {
  const toast = useToast()
  const hasFetchedRef = useRef(false)
  
  // Estado local
  const [searchTerm, setSearchTerm] = useState("")
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [editingCategory, setEditingCategory] = useState<Category | null>(null)
  const [newCategory, setNewCategory] = useState({
    name: "",
    description: ""
  })
  
  // Estados de carga
  const [isCreating, setIsCreating] = useState(false)
  const [isUpdating, setIsUpdating] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [categoriesWithCount, setCategoriesWithCount] = useState<Category[]>([])
  const [loading, setLoading] = useState(false)

  // Obtener categorías con conteo de productos
  const fetchCategoriesWithProductCount = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/admin/categories', {
        credentials: 'include'
      })
      
      if (!response.ok) {
        throw new Error('Error al cargar categorías')
      }
      
      const data = await response.json()
      
      if (data.success && Array.isArray(data.categories)) {
        setCategoriesWithCount(data.categories)
      } else {
        throw new Error('Formato de respuesta inválido')
      }
    } catch (error) {
      console.error('Error fetching categories with count:', error)
      toast.error("Error", "No se pudieron cargar las categorías")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (!hasFetchedRef.current) {
      hasFetchedRef.current = true
      fetchCategoriesWithProductCount()
    }
  }, [])

  // Filtrar categorías
  const filteredCategories = categoriesWithCount.filter(category =>
    category.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (category.description && category.description.toLowerCase().includes(searchTerm.toLowerCase()))
  )

  // Estadísticas
  const stats = {
    total: categoriesWithCount.length,
    withProducts: categoriesWithCount.filter(c => (c.products_count || 0) > 0).length,
    empty: categoriesWithCount.filter(c => (c.products_count || 0) === 0).length,
    totalProducts: categoriesWithCount.reduce((sum, c) => sum + (c.products_count || 0), 0)
  }

  // Crear categoría
  const handleCreateCategory = async () => {
    if (!newCategory.name.trim()) {
      toast.error("Error", "El nombre de la categoría es requerido")
      return
    }

    setIsCreating(true)
    try {
      const response = await fetch('/api/admin/categories', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(newCategory)
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Error al crear categoría')
      }

      toast.success("Categoría creada", "La categoría se ha creado exitosamente")
      setIsAddDialogOpen(false)
      setNewCategory({ name: "", description: "" })
      // Refresh después de un pequeño delay para evitar race conditions
      setTimeout(() => fetchCategoriesWithProductCount(), 100)
    } catch (error: any) {
      console.error('Error creating category:', error)
      toast.error("Error", error.message || "No se pudo crear la categoría")
    } finally {
      setIsCreating(false)
    }
  }

  // Actualizar categoría
  const handleUpdateCategory = async () => {
    if (!editingCategory || !editingCategory.name.trim()) {
      toast.error("Error", "El nombre de la categoría es requerido")
      return
    }

    setIsUpdating(true)
    try {
      const response = await fetch(`/api/admin/categories/${editingCategory.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          name: editingCategory.name,
          description: editingCategory.description
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Error al actualizar categoría')
      }

      toast.success("Categoría actualizada", "Los cambios se han guardado exitosamente")
      setIsEditDialogOpen(false)
      setEditingCategory(null)
      // Refresh después de un pequeño delay para evitar race conditions
      setTimeout(() => fetchCategoriesWithProductCount(), 100)
    } catch (error: any) {
      console.error('Error updating category:', error)
      toast.error("Error", error.message || "No se pudo actualizar la categoría")
    } finally {
      setIsUpdating(false)
    }
  }

  // Eliminar categoría
  const handleDeleteCategory = async (categoryId: number, categoryName: string, productsCount: number) => {
    if (productsCount > 0) {
      toast.error("No se puede eliminar", `La categoría "${categoryName}" tiene ${productsCount} productos asociados`)
      return
    }

    if (!confirm(`¿Estás seguro de que quieres eliminar la categoría "${categoryName}"?`)) {
      return
    }

    setIsDeleting(true)
    try {
      const response = await fetch(`/api/admin/categories/${categoryId}`, {
        method: 'DELETE',
        credentials: 'include'
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Error al eliminar categoría')
      }

      toast.success("Categoría eliminada", "La categoría se ha eliminado exitosamente")
      // Refresh después de un pequeño delay para evitar race conditions
      setTimeout(() => fetchCategoriesWithProductCount(), 100)
    } catch (error: any) {
      console.error('Error deleting category:', error)
      toast.error("Error", error.message || "No se pudo eliminar la categoría")
    } finally {
      setIsDeleting(false)
    }
  }

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
              Gestión de Categorías
            </h1>
            <p className="text-muted-foreground">
              Organiza y administra las categorías de productos
            </p>
          </div>

          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700">
                <Plus className="h-4 w-4 mr-2" />
                Nueva Categoría
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Crear Nueva Categoría</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Nombre *</Label>
                  <Input
                    id="name"
                    value={newCategory.name}
                    onChange={(e) => setNewCategory({ ...newCategory, name: e.target.value })}
                    placeholder="Nombre de la categoría"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Descripción</Label>
                  <Textarea
                    id="description"
                    value={newCategory.description}
                    onChange={(e) => setNewCategory({ ...newCategory, description: e.target.value })}
                    placeholder="Descripción de la categoría (opcional)"
                    rows={3}
                  />
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
                <Button onClick={handleCreateCategory} disabled={isCreating}>
                  {isCreating ? "Creando..." : "Crear Categoría"}
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
                  <p className="text-sm font-medium text-blue-600 dark:text-blue-400">Total Categorías</p>
                  <p className="text-2xl font-bold text-blue-900 dark:text-blue-100">{stats.total}</p>
                </div>
                <Tag className="h-8 w-8 text-blue-600 dark:text-blue-400" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950 dark:to-green-900">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-green-600 dark:text-green-400">Con Productos</p>
                  <p className="text-2xl font-bold text-green-900 dark:text-green-100">{stats.withProducts}</p>
                </div>
                <Grid className="h-8 w-8 text-green-600 dark:text-green-400" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-yellow-50 to-yellow-100 dark:from-yellow-950 dark:to-yellow-900">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-yellow-600 dark:text-yellow-400">Vacías</p>
                  <p className="text-2xl font-bold text-yellow-900 dark:text-yellow-100">{stats.empty}</p>
                </div>
                <X className="h-8 w-8 text-yellow-600 dark:text-yellow-400" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-950 dark:to-purple-900">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-purple-600 dark:text-purple-400">Total Productos</p>
                  <p className="text-2xl font-bold text-purple-900 dark:text-purple-100">{stats.totalProducts}</p>
                </div>
                <Grid className="h-8 w-8 text-purple-600 dark:text-purple-400" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Search */}
        <Card>
          <CardContent className="p-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Buscar categorías..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </CardContent>
        </Card>

        {/* Categories Table */}
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nombre</TableHead>
                  <TableHead>Descripción</TableHead>
                  <TableHead>Productos</TableHead>
                  <TableHead>Fecha de creación</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredCategories.map((category) => (
                  <TableRow key={category.id}>
                    <TableCell>
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
                          <Tag className="h-4 w-4 text-white" />
                        </div>
                        <div>
                          <p className="font-medium">{category.name}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {category.description || "Sin descripción"}
                      </p>
                    </TableCell>
                    <TableCell>
                      <Badge 
                        variant={
                          (category.products_count || 0) > 0 ? "default" : "secondary"
                        }
                        className={cn(
                          (category.products_count || 0) > 0 
                            ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                            : "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200"
                        )}
                      >
                        {category.products_count || 0} productos
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm">
                      {formatDate(category.created_at)}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setEditingCategory(category)
                            setIsEditDialogOpen(true)
                          }}
                        >
                          <Edit className="h-4 w-4 mr-1" />
                          Editar
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDeleteCategory(category.id, category.name, category.products_count || 0)}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          disabled={isDeleting}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            {filteredCategories.length === 0 && (
              <div className="p-12 text-center">
                <Tag className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-lg font-semibold mb-2">No se encontraron categorías</h3>
                <p className="text-muted-foreground">
                  {searchTerm
                    ? "Prueba ajustando el término de búsqueda"
                    : "Crea tu primera categoría para organizar los productos"
                  }
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Edit Category Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Editar Categoría</DialogTitle>
            </DialogHeader>
            {editingCategory && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-name">Nombre *</Label>
                  <Input
                    id="edit-name"
                    value={editingCategory.name}
                    onChange={(e) => setEditingCategory({ ...editingCategory, name: e.target.value })}
                    placeholder="Nombre de la categoría"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-description">Descripción</Label>
                  <Textarea
                    id="edit-description"
                    value={editingCategory.description || ""}
                    onChange={(e) => setEditingCategory({ ...editingCategory, description: e.target.value })}
                    placeholder="Descripción de la categoría (opcional)"
                    rows={3}
                  />
                </div>
              </div>
            )}
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => {
                  setIsEditDialogOpen(false)
                  setEditingCategory(null)
                }}
                disabled={isUpdating}
              >
                Cancelar
              </Button>
              <Button onClick={handleUpdateCategory} disabled={isUpdating}>
                {isUpdating ? "Guardando..." : "Guardar Cambios"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  )
}