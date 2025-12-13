'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useToast } from '@/hooks/use-notifications'
import { Plus, Edit, Trash2, Save, X, Package, ChevronDown, ChevronUp } from 'lucide-react'

export default function ModifiersPage() {
  const toast = useToast()
  
  const [groups, setGroups] = useState<any[]>([])
  const [products, setProducts] = useState<any[]>([])
  const [expandedGroupId, setExpandedGroupId] = useState<number | null>(null)
  const [options, setOptions] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [isCreatingGroup, setIsCreatingGroup] = useState(false)
  
  const [groupForm, setGroupForm] = useState({
    id: null,
    name: '',
    is_required: false,
    max_selections: 1
  })

  const [optionForm, setOptionForm] = useState({
    name: '',
    price_adjustment: 0
  })

  const [selectedProduct, setSelectedProduct] = useState<string>('')
  const [productModifiers, setProductModifiers] = useState<any[]>([])

  useEffect(() => {
    loadGroups()
    loadProducts()
  }, [])

  const loadGroups = async () => {
    try {
      const res = await fetch('/api/modifiers')
      const data = await res.json()
      setGroups(data.groups || [])
    } catch (error) {
      console.error('Error:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadProducts = async () => {
    try {
      const res = await fetch('/api/products-mysql')
      const data = await res.json()
      setProducts(data.products || [])
    } catch (error) {
      console.error('Error:', error)
    }
  }

  const loadOptions = async (groupId: number) => {
    try {
      const res = await fetch(`/api/modifiers/options?group_id=${groupId}`)
      const data = await res.json()
      return data.options || []
    } catch (error) {
      console.error('Error:', error)
      return []
    }
  }

  const loadProductModifiers = async (productId: string) => {
    try {
      const res = await fetch(`/api/modifiers/${productId}`)
      const data = await res.json()
      setProductModifiers(data.modifiers || [])
    } catch (error) {
      console.error('Error:', error)
    }
  }

  const handleToggleGroup = async (groupId: number) => {
    if (expandedGroupId === groupId) {
      setExpandedGroupId(null)
      setOptions([])
    } else {
      setExpandedGroupId(groupId)
      const opts = await loadOptions(groupId)
      setOptions(opts)
      const group = groups.find(g => g.id === groupId)
      if (group) {
        setGroupForm({
          id: group.id,
          name: group.name,
          is_required: group.is_required === 1,
          max_selections: group.max_selections || 1
        })
      }
    }
    setIsCreatingGroup(false)
  }

  const handleNewGroup = () => {
    setIsCreatingGroup(true)
    setExpandedGroupId(null)
    setGroupForm({
      id: null,
      name: '',
      is_required: false,
      max_selections: 1
    })
    setOptions([])
  }

  const handleSaveGroup = async () => {
    if (!groupForm.name.trim()) {
      toast.error('Error', 'El nombre es requerido')
      return
    }

    try {
      const method = groupForm.id ? 'PUT' : 'POST'
      const res = await fetch('/api/modifiers', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: groupForm.id,
          name: groupForm.name,
          is_required: groupForm.is_required ? 1 : 0,
          min_selections: groupForm.is_required ? 1 : 0,
          max_selections: groupForm.max_selections,
          selection_type: groupForm.max_selections > 1 ? 'multiple' : 'single'
        })
      })

      if (res.ok) {
        toast.success('Éxito', groupForm.id ? 'Grupo actualizado' : 'Grupo creado')
        await loadGroups()
        if (!groupForm.id) {
          const data = await res.json()
          setExpandedGroupId(data.id)
        }
      }
    } catch (error) {
      toast.error('Error', 'No se pudo guardar el grupo')
    }
  }

  const handleDeleteGroup = async (id: number) => {
    if (!confirm('¿Eliminar este grupo?')) return

    try {
      const res = await fetch(`/api/modifiers?id=${id}`, { method: 'DELETE' })
      if (res.ok) {
        toast.success('Éxito', 'Grupo eliminado')
        await loadGroups()
        setExpandedGroupId(null)
        setOptions([])
      }
    } catch (error) {
      toast.error('Error', 'No se pudo eliminar')
    }
  }

  const handleAddOption = async () => {
    if (!expandedGroupId || !optionForm.name.trim()) {
      toast.error('Error', 'El nombre es requerido')
      return
    }

    try {
      const res = await fetch('/api/modifiers/options', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          group_id: expandedGroupId,
          name: optionForm.name,
          price_adjustment: optionForm.price_adjustment || 0
        })
      })

      if (res.ok) {
        toast.success('Éxito', 'Opción agregada')
        setOptionForm({ name: '', price_adjustment: 0 })
        const opts = await loadOptions(expandedGroupId)
        setOptions(opts)
      }
    } catch (error) {
      toast.error('Error', 'No se pudo agregar la opción')
    }
  }

  const handleDeleteOption = async (id: number) => {
    try {
      const res = await fetch(`/api/modifiers/options?id=${id}`, { method: 'DELETE' })
      if (res.ok) {
        toast.success('Éxito', 'Opción eliminada')
        const opts = await loadOptions(expandedGroupId!)
        setOptions(opts)
      }
    } catch (error) {
      toast.error('Error', 'No se pudo eliminar')
    }
  }

  const handleAssignGroupToProduct = async (groupId: number) => {
    if (!selectedProduct) {
      toast.error('Error', 'Selecciona un producto')
      return
    }

    try {
      const res = await fetch('/api/modifiers/assign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          product_id: parseInt(selectedProduct),
          modifier_group_id: groupId
        })
      })

      if (res.ok) {
        toast.success('Éxito', 'Grupo asignado al producto')
        loadProductModifiers(selectedProduct)
      }
    } catch (error) {
      toast.error('Error', 'No se pudo asignar')
    }
  }

  const handleUnassignGroupFromProduct = async (groupId: number) => {
    if (!selectedProduct) return

    try {
      const res = await fetch(`/api/modifiers/assign?product_id=${selectedProduct}&group_id=${groupId}`, {
        method: 'DELETE'
      })

      if (res.ok) {
        toast.success('Éxito', 'Grupo desasignado')
        loadProductModifiers(selectedProduct)
      }
    } catch (error) {
      toast.error('Error', 'No se pudo desasignar')
    }
  }

  if (loading) {
    return <div className="flex items-center justify-center h-screen text-colibri-beige">Cargando...</div>
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-6">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold text-colibri-gold mb-6">Modificadores</h1>

        <Tabs defaultValue="groups" className="w-full">
          <TabsList className="bg-slate-800/50 mb-4">
            <TabsTrigger value="groups" className="data-[state=active]:bg-colibri-wine">
              Gestionar Grupos
            </TabsTrigger>
            <TabsTrigger value="assign" className="data-[state=active]:bg-colibri-wine">
              <Package className="h-4 w-4 mr-2" />
              Asignar a Productos
            </TabsTrigger>
          </TabsList>

          {/* TAB 1: GESTIONAR GRUPOS */}
          <TabsContent value="groups">
            <Card className="bg-white/10 backdrop-blur-md border-2 border-colibri-green/30">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-white">Grupos de Modificadores</CardTitle>
                <Button
                  onClick={handleNewGroup}
                  size="sm"
                  className="bg-colibri-wine hover:bg-colibri-green"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Nuevo Grupo
                </Button>
              </CardHeader>
              <CardContent className="space-y-2">
                {/* FORM NUEVO GRUPO */}
                {isCreatingGroup && (
                  <div className="mb-4 p-4 bg-slate-800/80 border-2 border-colibri-wine rounded-lg space-y-4">
                    <h3 className="text-white font-semibold">Crear Nuevo Grupo</h3>
                    <div>
                      <Label className="text-white">Nombre</Label>
                      <Input
                        value={groupForm.name}
                        onChange={(e) => setGroupForm({ ...groupForm, name: e.target.value })}
                        placeholder="Ej: Tamaño, Ingredientes extras"
                        className="bg-slate-900 border-colibri-green/50 text-white"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="flex items-center justify-between">
                        <Label className="text-white">Obligatorio</Label>
                        <Switch
                          checked={groupForm.is_required}
                          onCheckedChange={(checked) => setGroupForm({ ...groupForm, is_required: checked })}
                        />
                      </div>
                      <div>
                        <Label className="text-colibri-beige">Máx. selecciones</Label>
                        <Input
                          type="number"
                          min="1"
                          value={groupForm.max_selections || ''}
                          onChange={(e) => setGroupForm({ ...groupForm, max_selections: parseInt(e.target.value) || 1 })}
                          className="bg-slate-900 border-colibri-green/50 text-white"
                        />
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button onClick={handleSaveGroup} className="bg-green-600 hover:bg-green-700">
                        <Save className="h-4 w-4 mr-2" />
                        Crear
                      </Button>
                      <Button onClick={() => setIsCreatingGroup(false)} variant="ghost" className="text-gray-400">
                        <X className="h-4 w-4 mr-2" />
                        Cancelar
                      </Button>
                    </div>
                  </div>
                )}

                {/* LISTA DE GRUPOS */}
                {groups.map((group) => (
                  <div key={group.id} className="border border-slate-700 rounded-lg overflow-hidden">
                    {/* HEADER DEL GRUPO */}
                    <div
                      onClick={() => handleToggleGroup(group.id)}
                      className="flex items-center justify-between p-4 bg-slate-800/50 cursor-pointer hover:bg-slate-750 transition"
                    >
                      <div className="flex items-center gap-3">
                        {expandedGroupId === group.id ? (
                          <ChevronUp className="h-5 w-5 text-colibri-gold" />
                        ) : (
                          <ChevronDown className="h-5 w-5 text-gray-400" />
                        )}
                        <div>
                          <h3 className="text-white font-semibold">{group.name}</h3>
                          <p className="text-xs text-gray-400">
                            Máx: {group.max_selections} {group.max_selections === 1 ? 'opción' : 'opciones'}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {group.is_required === 1 && (
                          <Badge variant="destructive" className="text-xs">Obligatorio</Badge>
                        )}
                      </div>
                    </div>

                    {/* EDITOR EXPANDIBLE */}
                    {expandedGroupId === group.id && (
                      <div className="p-4 bg-slate-900/50 space-y-4">
                        {/* EDITAR GRUPO */}
                        <div className="space-y-3 p-3 bg-slate-800 rounded border-2 border-colibri-wine/30">
                          <h4 className="text-colibri-beige font-medium">Configuración del Grupo</h4>
                          <div>
                            <Label className="text-white">Nombre</Label>
                            <Input
                              value={groupForm.name}
                              onChange={(e) => setGroupForm({ ...groupForm, name: e.target.value })}
                              className="bg-slate-900 border-colibri-green/50 text-white placeholder:text-gray-400"
                            />
                          </div>
                          <div className="grid grid-cols-2 gap-3">
                            <div className="flex items-center justify-between">
                              <Label className="text-white">Obligatorio</Label>
                              <Switch
                                checked={groupForm.is_required}
                                onCheckedChange={(checked) => setGroupForm({ ...groupForm, is_required: checked })}
                              />
                            </div>
                            <div>
                              <Label className="text-colibri-beige">Máx. selecciones</Label>
                              <Input
                                type="number"
                                min="1"
                                value={groupForm.max_selections || ''}
                                onChange={(e) => setGroupForm({ ...groupForm, max_selections: parseInt(e.target.value) || 1 })}
                                className="bg-slate-900 border-colibri-green/50 text-white placeholder:text-gray-400"
                              />
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <Button onClick={handleSaveGroup} size="sm" className="bg-green-600 hover:bg-green-700">
                              <Save className="h-4 w-4 mr-2" />
                              Actualizar
                            </Button>
                            <Button
                              onClick={() => handleDeleteGroup(group.id)}
                              size="sm"
                              variant="destructive"
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Eliminar Grupo
                            </Button>
                          </div>
                        </div>

                        {/* OPCIONES */}
                        <div className="space-y-3">
                          <h4 className="text-colibri-beige font-medium">Opciones</h4>
                          
                          {/* AGREGAR OPCIÓN */}
                          <div className="p-3 bg-slate-800/50 rounded border border-slate-700">
                            <div className="grid grid-cols-12 gap-2">
                              <div className="col-span-6">
                                <Input
                                  value={optionForm.name}
                                  onChange={(e) => setOptionForm({ ...optionForm, name: e.target.value })}
                                  placeholder="Nombre de la opción"
                                  className="bg-slate-900 border-colibri-green/50 text-white placeholder:text-gray-400"
                                  onKeyPress={(e) => e.key === 'Enter' && handleAddOption()}
                                />
                              </div>
                              <div className="col-span-3">
                                <Input
                                  type="number"
                                  step="0.01"
                                  value={optionForm.price_adjustment || ''}
                                  onChange={(e) => setOptionForm({ ...optionForm, price_adjustment: parseFloat(e.target.value) || 0 })}
                                  placeholder="Precio extra"
                                  className="bg-slate-900 border-colibri-green/50 text-white placeholder:text-gray-400"
                                  onKeyPress={(e) => e.key === 'Enter' && handleAddOption()}
                                />
                              </div>
                              <div className="col-span-3">
                                <Button
                                  onClick={handleAddOption}
                                  size="sm"
                                  className="w-full bg-colibri-wine hover:bg-colibri-green"
                                >
                                  <Plus className="h-4 w-4 mr-1" />
                                  Agregar
                                </Button>
                              </div>
                            </div>
                          </div>

                          {/* LISTA DE OPCIONES */}
                          <div className="space-y-2">
                            {options.length === 0 ? (
                              <p className="text-gray-500 text-sm text-center py-3">
                                No hay opciones. Agrega la primera.
                              </p>
                            ) : (
                              options.map((option) => (
                                <div
                                  key={option.id}
                                  className="flex items-center justify-between p-2 bg-slate-800/50 rounded"
                                >
                                  <div>
                                    <span className="text-colibri-beige">{option.name}</span>
                                    {option.price_adjustment > 0 && (
                                      <span className="text-green-400 text-sm ml-2">
                                        +${parseFloat(option.price_adjustment).toFixed(2)}
                                      </span>
                                    )}
                                  </div>
                                  <Button
                                    onClick={() => handleDeleteOption(option.id)}
                                    size="sm"
                                    variant="ghost"
                                    className="text-red-400 hover:text-red-300 hover:bg-red-900/20"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </div>
                              ))
                            )}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ))}

                {groups.length === 0 && !isCreatingGroup && (
                  <p className="text-gray-500 text-center py-8">
                    No hay grupos. Crea el primero.
                  </p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* TAB 2: ASIGNAR A PRODUCTOS */}
          <TabsContent value="assign">
            <Card className="bg-white/10 backdrop-blur-md border-2 border-colibri-green/30">
              <CardHeader>
                <CardTitle className="text-colibri-gold">Asignar Grupos a Productos</CardTitle>
                <p className="text-sm text-gray-400 mt-2">
                  Selecciona un producto y marca los grupos de modificadores que quieres asignarle
                </p>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <Label className="text-colibri-beige text-base font-semibold mb-2 block">Producto</Label>
                  <select
                    value={selectedProduct}
                    onChange={(e) => {
                      setSelectedProduct(e.target.value)
                      if (e.target.value) loadProductModifiers(e.target.value)
                    }}
                    className="w-full p-3 bg-gradient-to-br from-colibri-green/20 to-colibri-wine/10 border-2 border-colibri-wine/30/50 rounded text-colibri-beige text-base"
                  >
                    <option value="">-- Selecciona un producto --</option>
                    {products.map((product) => (
                      <option key={product.id} value={product.id}>
                        {product.name}
                      </option>
                    ))}
                  </select>
                </div>

                {selectedProduct && (
                  <>
                    {/* GRUPOS ASIGNADOS - Arriba con más destaque */}
                    {productModifiers.length > 0 && (
                      <div className="p-4 bg-green-900/20 border border-green-700 rounded-lg">
                        <h3 className="text-green-400 font-semibold mb-3 flex items-center gap-2">
                          <span className="text-xl">✓</span>
                          Grupos Asignados ({productModifiers.length})
                        </h3>
                        <div className="space-y-2">
                          {productModifiers.map((pm) => (
                            <div key={pm.id} className="flex items-center justify-between p-3 bg-colibri-beige/50 rounded">
                              <div>
                                <span className="text-colibri-beige font-medium">{pm.group_name}</span>
                                <div className="text-xs text-gray-400 mt-1">
                                  {pm.is_required ? '🔴 Obligatorio' : '⚪ Opcional'} • Máx: {pm.max_selections}
                                </div>
                              </div>
                              <Button
                                onClick={() => handleUnassignGroupFromProduct(pm.group_id)}
                                size="sm"
                                variant="ghost"
                                className="text-red-400 hover:text-red-300 hover:bg-red-900/20"
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* GRUPOS DISPONIBLES */}
                    <div className="border-t border-slate-700 pt-4">
                      <h3 className="text-colibri-beige font-semibold mb-3">
                        Grupos Disponibles
                        <span className="text-sm text-gray-400 ml-2 font-normal">
                          (Click para asignar/desasignar)
                        </span>
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {groups.map((group) => {
                          const isAssigned = productModifiers.some(pm => pm.group_id === group.id)
                          return (
                            <button
                              key={group.id}
                              onClick={() => isAssigned ? handleUnassignGroupFromProduct(group.id) : handleAssignGroupToProduct(group.id)}
                              className={`p-3 rounded-lg border-2 transition text-left ${
                                isAssigned 
                                  ? 'bg-colibri-wine border-colibri-gold hover:bg-colibri-green' 
                                  : 'bg-colibri-beige border-slate-600 hover:border-colibri-gold hover:bg-slate-750'
                              }`}
                            >
                              <div className="flex items-center justify-between">
                                <div>
                                  <div className="flex items-center gap-2">
                                    <span className={`text-lg ${isAssigned ? 'text-colibri-beige' : 'text-colibri-beige'}`}>
                                      {isAssigned ? '✓' : '+'}
                                    </span>
                                    <span className={`font-medium ${isAssigned ? 'text-colibri-beige' : 'text-colibri-beige'}`}>
                                      {group.name}
                                    </span>
                                  </div>
                                  <div className={`text-xs mt-1 ${isAssigned ? 'text-colibri-green' : 'text-gray-500'}`}>
                                    Máx: {group.max_selections} {group.max_selections === 1 ? 'opción' : 'opciones'}
                                    {group.is_required === 1 && ' • Obligatorio'}
                                  </div>
                                </div>
                              </div>
                            </button>
                          )
                        })}
                      </div>
                    </div>

                    {productModifiers.length === 0 && (
                      <div className="text-center py-8 text-gray-500">
                        <p className="text-lg mb-2">No hay grupos asignados aún</p>
                        <p className="text-sm">Selecciona grupos de la lista para asignarlos</p>
                      </div>
                    )}
                  </>
                )}

                {!selectedProduct && (
                  <div className="text-center py-12 text-gray-500">
                    <Package className="h-16 w-16 mx-auto mb-4 opacity-50" />
                    <p className="text-lg">Selecciona un producto para comenzar</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}



