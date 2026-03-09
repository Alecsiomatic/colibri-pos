"use client"

import { useState, useEffect, useCallback } from "react"
import AdminLayout from "@/components/admin/admin-layout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Dialog, DialogContent, DialogHeader, DialogFooter, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { useToast } from "@/hooks/use-notifications"
import {
  Package, AlertTriangle, Plus, Minus, RotateCcw, Trash2, RefreshCw, Search,
  Warehouse, ShoppingCart, Clock, ChevronLeft, ChevronRight, DollarSign,
  ArrowUpDown, Edit, Check, X, Boxes, TrendingUp, BookOpen, Save, Percent
} from "lucide-react"

function fmt(n: number | string): string {
  return Number(n || 0).toLocaleString('es-MX', { style: 'currency', currency: 'MXN', minimumFractionDigits: 2 })
}

type Ingredient = {
  id: number; name: string; unit: string; stock: number; cost_per_unit: number;
  min_stock: number; supplier: string | null; category: string | null;
  is_active: boolean; used_in_products?: number
}

type RecipeItem = {
  id: number; product_id: number; ingredient_id: number; quantity: number;
  ingredient_name: string; ingredient_unit: string; ingredient_stock: number; ingredient_cost: number
}

type ProductWithRecipe = {
  id: number; name: string; price: number; cost_price: number; stock: number;
  image_url: string; category_name: string; ingredient_count: number; recipe_cost: number
}

type Movement = {
  id: number; ingredient_id: number; ingredient_name: string; ingredient_unit: string;
  previous_stock: number; new_stock: number; change_amount: number;
  change_type: string; notes: string; created_at: string
}

// ─── Movement type labels ───
const TYPE_LABELS: Record<string, string> = {
  sale: 'Venta', cancel_restore: 'Cancelación', entry: 'Entrada',
  manual_reduce: 'Salida', waste: 'Merma', adjustment: 'Ajuste',
}
const TYPE_COLORS: Record<string, string> = {
  sale: 'bg-blue-500/20 text-blue-300', cancel_restore: 'bg-yellow-500/20 text-yellow-300',
  entry: 'bg-green-500/20 text-green-300', manual_reduce: 'bg-red-500/20 text-red-300',
  waste: 'bg-orange-500/20 text-orange-300', adjustment: 'bg-purple-500/20 text-purple-300',
}

// ─── KPI Card ───
function KPI({ title, value, sub, icon: Icon, accent = "colibri-gold" }: {
  title: string; value: string | number; sub?: string; icon: any; accent?: string
}) {
  return (
    <div className="bg-black/40 border border-colibri-gold/20 rounded-xl p-4">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs text-gray-400 font-medium">{title}</span>
        <Icon className={`w-4 h-4 text-${accent}`} />
      </div>
      <p className="text-xl sm:text-2xl font-bold text-white">{value}</p>
      {sub && <p className="text-xs text-colibri-beige mt-1">{sub}</p>}
    </div>
  )
}

export default function InsumosPage() {
  const toast = useToast()
  const [activeTab, setActiveTab] = useState("insumos")
  const [loading, setLoading] = useState(true)

  // Insumos state
  const [ingredients, setIngredients] = useState<Ingredient[]>([])
  const [summary, setSummary] = useState<any>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [categoryFilter, setCategoryFilter] = useState("all")
  const [sortField, setSortField] = useState<"name" | "stock" | "cost_per_unit">("name")
  const [sortAsc, setSortAsc] = useState(true)

  // Create/edit ingredient dialog
  const [editDialog, setEditDialog] = useState(false)
  const [editingIngredient, setEditingIngredient] = useState<Ingredient | null>(null)
  const [form, setForm] = useState({ name: '', unit: 'porción', stock: '0', cost_per_unit: '0', min_stock: '5', supplier: '', category: '' })
  const [saving, setSaving] = useState(false)

  // Stock adjust dialog
  const [adjustDialog, setAdjustDialog] = useState(false)
  const [adjustIngredient, setAdjustIngredient] = useState<Ingredient | null>(null)
  const [adjustAction, setAdjustAction] = useState<"entry" | "manual_reduce" | "adjustment" | "waste">("entry")
  const [adjustQty, setAdjustQty] = useState("")
  const [adjustNotes, setAdjustNotes] = useState("")
  const [adjustCost, setAdjustCost] = useState("")
  const [adjusting, setAdjusting] = useState(false)

  // Recipes state
  const [products, setProducts] = useState<ProductWithRecipe[]>([])
  const [recipeDialogOpen, setRecipeDialogOpen] = useState(false)
  const [recipeProduct, setRecipeProduct] = useState<ProductWithRecipe | null>(null)
  const [recipeItems, setRecipeItems] = useState<{ ingredient_id: number; quantity: string }[]>([])
  const [recipeSaving, setRecipeSaving] = useState(false)
  const [productsSearch, setProductsSearch] = useState("")

  // Movements state
  const [movements, setMovements] = useState<Movement[]>([])
  const [movPage, setMovPage] = useState(1)
  const [movTotal, setMovTotal] = useState(0)
  const [movLoading, setMovLoading] = useState(false)

  // ─── Data fetching ───
  const fetchIngredients = useCallback(async () => {
    try {
      const [listRes, summaryRes] = await Promise.all([
        fetch('/api/ingredients', { credentials: 'include' }),
        fetch('/api/ingredients?action=summary', { credentials: 'include' }),
      ])
      const listData = await listRes.json()
      const summaryData = await summaryRes.json()
      if (listData.success) setIngredients(listData.data)
      if (summaryData.success) setSummary(summaryData.data.totals)
    } catch { /* silent */ }
  }, [])

  const fetchProducts = useCallback(async () => {
    try {
      const res = await fetch('/api/recipes?action=all', { credentials: 'include' })
      const data = await res.json()
      if (data.success) setProducts(data.data)
    } catch { /* silent */ }
  }, [])

  const fetchMovements = useCallback(async () => {
    setMovLoading(true)
    try {
      const res = await fetch(`/api/ingredients?action=movements&page=${movPage}&limit=30`, { credentials: 'include' })
      const data = await res.json()
      if (data.success) { setMovements(data.data.movements); setMovTotal(data.data.total) }
    } catch { /* silent */ }
    setMovLoading(false)
  }, [movPage])

  useEffect(() => { fetchIngredients().then(() => setLoading(false)) }, [fetchIngredients])
  useEffect(() => { if (activeTab === 'recetas') fetchProducts() }, [activeTab, fetchProducts])
  useEffect(() => { if (activeTab === 'movimientos') fetchMovements() }, [activeTab, fetchMovements])

  // ─── CRUD handlers ───
  function openCreate() {
    setEditingIngredient(null)
    setForm({ name: '', unit: 'porción', stock: '0', cost_per_unit: '0', min_stock: '5', supplier: '', category: '' })
    setEditDialog(true)
  }
  function openEdit(ing: Ingredient) {
    setEditingIngredient(ing)
    setForm({
      name: ing.name, unit: ing.unit, stock: String(ing.stock), cost_per_unit: String(ing.cost_per_unit),
      min_stock: String(ing.min_stock), supplier: ing.supplier || '', category: ing.category || '',
    })
    setEditDialog(true)
  }
  async function handleSaveIngredient() {
    if (!form.name.trim()) { toast.error('Error', 'Nombre requerido'); return }
    setSaving(true)
    try {
      if (editingIngredient) {
        const res = await fetch('/api/ingredients', {
          method: 'PUT', credentials: 'include', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: editingIngredient.id, name: form.name, unit: form.unit, cost_per_unit: Number(form.cost_per_unit), min_stock: Number(form.min_stock), supplier: form.supplier || null, category: form.category || null }),
        })
        const data = await res.json()
        if (data.success) { toast.success('Actualizado', `${form.name} guardado`); setEditDialog(false); fetchIngredients() }
        else toast.error('Error', data.error)
      } else {
        const res = await fetch('/api/ingredients', {
          method: 'POST', credentials: 'include', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: form.name, unit: form.unit, stock: Number(form.stock), cost_per_unit: Number(form.cost_per_unit), min_stock: Number(form.min_stock), supplier: form.supplier || null, category: form.category || null }),
        })
        const data = await res.json()
        if (data.success) { toast.success('Creado', `${form.name} agregado`); setEditDialog(false); fetchIngredients() }
        else toast.error('Error', data.error)
      }
    } catch { toast.error('Error', 'Error de conexión') }
    setSaving(false)
  }
  async function handleDelete(ing: Ingredient) {
    if (!confirm(`¿Eliminar "${ing.name}"? Se quitará de todas las recetas.`)) return
    try {
      const res = await fetch(`/api/ingredients?id=${ing.id}`, { method: 'DELETE', credentials: 'include' })
      const data = await res.json()
      if (data.success) { toast.success('Eliminado', `${ing.name} eliminado`); fetchIngredients() }
      else toast.error('Error', data.error)
    } catch { toast.error('Error', 'Error de conexión') }
  }

  // ─── Stock adjust ───
  function openAdjust(ing: Ingredient, action: "entry" | "manual_reduce" | "adjustment" | "waste") {
    setAdjustIngredient(ing)
    setAdjustAction(action)
    setAdjustQty("")
    setAdjustNotes("")
    setAdjustCost("")
    setAdjustDialog(true)
  }
  async function handleAdjust() {
    if (!adjustIngredient || !adjustQty) return
    setAdjusting(true)
    try {
      const res = await fetch('/api/ingredients', {
        method: 'POST', credentials: 'include', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'adjust', ingredient_id: adjustIngredient.id, type: adjustAction,
          quantity: Number(adjustQty), notes: adjustNotes || undefined,
        }),
      })
      const data = await res.json()
      if (data.success) {
        // If entry + cost provided, update cost_per_unit
        if (adjustAction === 'entry' && adjustCost && Number(adjustCost) > 0) {
          const totalCost = Number(adjustCost)
          const qty = Number(adjustQty)
          const newCostPerUnit = totalCost / qty
          await fetch('/api/ingredients', {
            method: 'PUT', credentials: 'include', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id: adjustIngredient.id, cost_per_unit: Math.round(newCostPerUnit * 100) / 100 }),
          })
          // Recalc product costs
          await fetch('/api/ingredients', {
            method: 'POST', credentials: 'include', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'recalc_costs' }),
          })
        }
        toast.success('Stock actualizado', `${adjustIngredient.name}: ${data.data.previousStock} → ${data.data.newStock}`)
        setAdjustDialog(false)
        fetchIngredients()
      } else toast.error('Error', data.error)
    } catch { toast.error('Error', 'Error de conexión') }
    setAdjusting(false)
  }

  // ─── Recipe handlers ───
  async function openRecipeEditor(product: ProductWithRecipe) {
    setRecipeProduct(product)
    setRecipeItems([])
    setRecipeDialogOpen(true)
    try {
      const res = await fetch(`/api/recipes?product_id=${product.id}`, { credentials: 'include' })
      const data = await res.json()
      if (data.success && data.data.length > 0) {
        setRecipeItems(data.data.map((r: RecipeItem) => ({ ingredient_id: r.ingredient_id, quantity: String(r.quantity) })))
      } else {
        setRecipeItems([{ ingredient_id: 0, quantity: '1' }])
      }
    } catch {
      setRecipeItems([{ ingredient_id: 0, quantity: '1' }])
    }
  }
  function addRecipeLine() {
    setRecipeItems([...recipeItems, { ingredient_id: 0, quantity: '1' }])
  }
  function removeRecipeLine(idx: number) {
    setRecipeItems(recipeItems.filter((_, i) => i !== idx))
  }
  function updateRecipeLine(idx: number, field: 'ingredient_id' | 'quantity', value: string) {
    const updated = [...recipeItems]
    updated[idx] = { ...updated[idx], [field]: field === 'ingredient_id' ? Number(value) : value }
    setRecipeItems(updated)
  }
  async function saveRecipe() {
    if (!recipeProduct) return
    const validItems = recipeItems.filter(i => i.ingredient_id > 0 && Number(i.quantity) > 0)
    setRecipeSaving(true)
    try {
      const res = await fetch('/api/recipes', {
        method: 'POST', credentials: 'include', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          product_id: recipeProduct.id,
          items: validItems.map(i => ({ ingredient_id: i.ingredient_id, quantity: Number(i.quantity) })),
        }),
      })
      const data = await res.json()
      if (data.success) {
        toast.success('Receta guardada', `${recipeProduct.name} actualizado`)
        setRecipeDialogOpen(false)
        fetchProducts()
      } else toast.error('Error', data.error)
    } catch { toast.error('Error', 'Error de conexión') }
    setRecipeSaving(false)
  }

  // Recipe cost preview
  const recipeCostPreview = recipeItems.reduce((sum, item) => {
    if (!item.ingredient_id) return sum
    const ing = ingredients.find(i => i.id === item.ingredient_id)
    return sum + (Number(item.quantity) || 0) * (Number(ing?.cost_per_unit) || 0)
  }, 0)

  // ─── Filters ───
  const categories = [...new Set(ingredients.map(i => i.category).filter(Boolean))]
  const filtered = ingredients
    .filter(i => {
      if (searchTerm && !i.name.toLowerCase().includes(searchTerm.toLowerCase())) return false
      if (categoryFilter !== 'all' && i.category !== categoryFilter) return false
      return true
    })
    .sort((a, b) => {
      const m = sortAsc ? 1 : -1
      if (sortField === 'name') return a.name.localeCompare(b.name) * m
      return ((Number(a[sortField]) || 0) - (Number(b[sortField]) || 0)) * m
    })

  const filteredProducts = products.filter(p =>
    !productsSearch || p.name.toLowerCase().includes(productsSearch.toLowerCase())
  )

  function toggleSort(field: typeof sortField) {
    if (sortField === field) setSortAsc(!sortAsc)
    else { setSortField(field); setSortAsc(true) }
  }

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-96">
          <RefreshCw className="h-8 w-8 animate-spin text-colibri-gold" />
        </div>
      </AdminLayout>
    )
  }

  return (
    <AdminLayout>
      <div className="space-y-6 p-4 sm:p-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div>
            <h1 className="text-3xl font-bold text-white flex items-center gap-3">
              <Boxes className="h-8 w-8 text-colibri-gold" /> Insumos y Recetas
            </h1>
            <p className="text-colibri-beige mt-1">Materia prima, recetas y costo automático</p>
          </div>
          <div className="flex items-center gap-2">
            <Button size="sm" onClick={openCreate} className="bg-colibri-gold text-black hover:bg-colibri-gold/80">
              <Plus className="h-4 w-4 mr-1" /> Nuevo insumo
            </Button>
            <Button size="sm" variant="outline" onClick={() => { fetchIngredients(); if (activeTab === 'recetas') fetchProducts(); if (activeTab === 'movimientos') fetchMovements() }}
              className="border-colibri-gold/30 text-colibri-beige hover:bg-colibri-green/30">
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* KPIs */}
        {summary && (
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            <KPI title="Total insumos" value={summary.total} icon={Boxes} />
            <KPI title="Valor inventario" value={fmt(summary.total_value)} icon={DollarSign} accent="colibri-wine" />
            <KPI title="Agotados" value={summary.out_of_stock} icon={AlertTriangle} accent="red-400" />
            <KPI title="Stock bajo" value={summary.low_stock} icon={AlertTriangle} accent="yellow-400" />
            <KPI title="Saludable" value={summary.healthy} icon={Check} accent="emerald-400" />
          </div>
        )}

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="bg-black/50 border border-colibri-gold/30">
            <TabsTrigger value="insumos" className="data-[state=active]:bg-colibri-green/50 data-[state=active]:text-white text-gray-400">
              <Boxes className="h-4 w-4 mr-2" /> Insumos
            </TabsTrigger>
            <TabsTrigger value="recetas" className="data-[state=active]:bg-colibri-green/50 data-[state=active]:text-white text-gray-400">
              <BookOpen className="h-4 w-4 mr-2" /> Recetas
            </TabsTrigger>
            <TabsTrigger value="movimientos" className="data-[state=active]:bg-colibri-green/50 data-[state=active]:text-white text-gray-400">
              <Clock className="h-4 w-4 mr-2" /> Movimientos
            </TabsTrigger>
          </TabsList>

          {/* ═══════ INSUMOS TAB ═══════ */}
          <TabsContent value="insumos" className="space-y-4">
            <div className="flex flex-wrap gap-3">
              <div className="relative flex-1 min-w-[200px]">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
                <Input placeholder="Buscar insumo..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
                  className="pl-10 bg-black/40 border-colibri-gold/20 text-white placeholder:text-gray-500" />
              </div>
              <select value={categoryFilter} onChange={e => setCategoryFilter(e.target.value)}
                className="bg-black/40 border border-colibri-gold/20 rounded-md px-3 py-2 text-sm text-white">
                <option value="all">Todas las categorías</option>
                {categories.map(c => <option key={c} value={c!}>{c}</option>)}
              </select>
            </div>

            <p className="text-xs text-gray-500">{filtered.length} insumos</p>

            <div className="overflow-x-auto rounded-xl border border-colibri-gold/20 bg-black/30">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-colibri-gold/20">
                    <th className="text-left p-3 text-colibri-gold cursor-pointer" onClick={() => toggleSort('name')}>
                      <span className="flex items-center gap-1">Insumo <ArrowUpDown className="h-3 w-3" /></span>
                    </th>
                    <th className="text-left p-3 text-colibri-gold">Unidad</th>
                    <th className="text-right p-3 text-colibri-gold cursor-pointer" onClick={() => toggleSort('stock')}>
                      <span className="flex items-center justify-end gap-1">Stock <ArrowUpDown className="h-3 w-3" /></span>
                    </th>
                    <th className="text-right p-3 text-colibri-gold hidden sm:table-cell">Mínimo</th>
                    <th className="text-right p-3 text-colibri-gold cursor-pointer hidden sm:table-cell" onClick={() => toggleSort('cost_per_unit')}>
                      <span className="flex items-center justify-end gap-1">Costo/u <ArrowUpDown className="h-3 w-3" /></span>
                    </th>
                    <th className="text-left p-3 text-colibri-gold hidden md:table-cell">Proveedor</th>
                    <th className="text-center p-3 text-colibri-gold">Estado</th>
                    <th className="text-center p-3 text-colibri-gold">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(ing => {
                    const stock = Number(ing.stock) || 0
                    const min = Number(ing.min_stock) || 5
                    const status = stock <= 0 ? 'out' : stock <= min ? 'low' : 'ok'
                    return (
                      <tr key={ing.id} className="border-b border-colibri-green/10 hover:bg-colibri-green/10 transition-colors">
                        <td className="p-3">
                          <span className="text-white font-medium">{ing.name}</span>
                          {ing.category && <span className="text-[10px] text-gray-500 ml-2">{ing.category}</span>}
                        </td>
                        <td className="p-3 text-colibri-beige text-xs">{ing.unit}</td>
                        <td className="p-3 text-right font-mono text-white">{stock}</td>
                        <td className="p-3 text-right text-gray-400 hidden sm:table-cell">{min}</td>
                        <td className="p-3 text-right text-colibri-beige hidden sm:table-cell">{fmt(ing.cost_per_unit)}</td>
                        <td className="p-3 text-gray-400 text-xs hidden md:table-cell">{ing.supplier || '—'}</td>
                        <td className="p-3 text-center">
                          {status === 'out' && <Badge variant="destructive" className="text-[10px]">Agotado</Badge>}
                          {status === 'low' && <Badge className="bg-yellow-500/20 text-yellow-300 border-yellow-500/30 text-[10px]">Bajo</Badge>}
                          {status === 'ok' && <Badge className="bg-green-500/20 text-green-300 border-green-500/30 text-[10px]">OK</Badge>}
                        </td>
                        <td className="p-3">
                          <div className="flex items-center justify-center gap-1">
                            <button onClick={() => openAdjust(ing, 'entry')} title="Entrada"
                              className="p-1.5 rounded-md hover:bg-green-500/20 text-green-400 transition-colors">
                              <Plus className="h-3.5 w-3.5" />
                            </button>
                            <button onClick={() => openAdjust(ing, 'manual_reduce')} title="Salida"
                              className="p-1.5 rounded-md hover:bg-red-500/20 text-red-400 transition-colors">
                              <Minus className="h-3.5 w-3.5" />
                            </button>
                            <button onClick={() => openAdjust(ing, 'waste')} title="Merma"
                              className="p-1.5 rounded-md hover:bg-orange-500/20 text-orange-400 transition-colors">
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                            <button onClick={() => openEdit(ing)} title="Editar"
                              className="p-1.5 rounded-md hover:bg-blue-500/20 text-blue-400 transition-colors">
                              <Edit className="h-3.5 w-3.5" />
                            </button>
                            <button onClick={() => handleDelete(ing)} title="Eliminar"
                              className="p-1.5 rounded-md hover:bg-red-500/20 text-red-400/50 transition-colors">
                              <X className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                  {filtered.length === 0 && (
                    <tr><td colSpan={8} className="p-8 text-center text-gray-500">
                      {ingredients.length === 0 ? 'No hay insumos aún. ¡Crea el primero!' : 'No se encontraron insumos'}
                    </td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </TabsContent>

          {/* ═══════ RECETAS TAB ═══════ */}
          <TabsContent value="recetas" className="space-y-4">
            <div className="bg-black/30 rounded-xl border border-colibri-gold/20 p-4">
              <p className="text-sm text-colibri-beige mb-2">
                <BookOpen className="h-4 w-4 inline mr-1 text-colibri-gold" />
                Asigna insumos a cada producto. Los productos <strong className="text-white">con receta</strong> deducirán insumos automáticamente al vender.
                Los <strong className="text-white">sin receta</strong> seguirán usando stock por unidad.
              </p>
            </div>

            <div className="relative max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
              <Input placeholder="Buscar producto..." value={productsSearch} onChange={e => setProductsSearch(e.target.value)}
                className="pl-10 bg-black/40 border-colibri-gold/20 text-white placeholder:text-gray-500" />
            </div>

            <div className="overflow-x-auto rounded-xl border border-colibri-gold/20 bg-black/30">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-colibri-gold/20">
                    <th className="text-left p-3 text-colibri-gold">Producto</th>
                    <th className="text-left p-3 text-colibri-gold hidden sm:table-cell">Categoría</th>
                    <th className="text-right p-3 text-colibri-gold">Precio venta</th>
                    <th className="text-right p-3 text-colibri-gold">Costo receta</th>
                    <th className="text-right p-3 text-colibri-gold hidden sm:table-cell">Margen</th>
                    <th className="text-center p-3 text-colibri-gold">Insumos</th>
                    <th className="text-center p-3 text-colibri-gold">Receta</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredProducts.map(p => {
                    const cost = Number(p.recipe_cost) || Number(p.cost_price) || 0
                    const price = Number(p.price) || 0
                    const margin = price > 0 ? ((price - cost) / price * 100) : 0
                    const hasRecipe = Number(p.ingredient_count) > 0
                    return (
                      <tr key={p.id} className="border-b border-colibri-green/10 hover:bg-colibri-green/10 transition-colors">
                        <td className="p-3 text-white font-medium">{p.name}</td>
                        <td className="p-3 text-colibri-beige text-xs hidden sm:table-cell">{p.category_name || '—'}</td>
                        <td className="p-3 text-right text-colibri-beige">{fmt(price)}</td>
                        <td className="p-3 text-right">
                          {hasRecipe ? (
                            <span className="text-white font-mono">{fmt(cost)}</span>
                          ) : (
                            <span className="text-gray-500 text-xs">Sin receta</span>
                          )}
                        </td>
                        <td className="p-3 text-right hidden sm:table-cell">
                          {cost > 0 && price > 0 ? (
                            <span className={`font-medium ${margin >= 50 ? 'text-green-400' : margin >= 30 ? 'text-yellow-400' : 'text-red-400'}`}>
                              {margin.toFixed(0)}%
                            </span>
                          ) : <span className="text-gray-500">—</span>}
                        </td>
                        <td className="p-3 text-center">
                          {hasRecipe ? (
                            <Badge className="bg-green-500/20 text-green-300 border-green-500/30 text-[10px]">
                              {p.ingredient_count} insumos
                            </Badge>
                          ) : (
                            <Badge className="bg-gray-500/20 text-gray-400 border-gray-500/30 text-[10px]">Sin receta</Badge>
                          )}
                        </td>
                        <td className="p-3 text-center">
                          <Button size="sm" variant="outline" onClick={() => openRecipeEditor(p)}
                            className="border-colibri-gold/30 text-colibri-beige hover:bg-colibri-green/30 text-xs h-7 px-2">
                            <Edit className="h-3 w-3 mr-1" /> {hasRecipe ? 'Editar' : 'Crear'}
                          </Button>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </TabsContent>

          {/* ═══════ MOVEMENTS TAB ═══════ */}
          <TabsContent value="movimientos" className="space-y-4">
            {movLoading ? (
              <div className="flex justify-center py-12">
                <RefreshCw className="h-6 w-6 animate-spin text-colibri-gold" />
              </div>
            ) : (
              <>
                <div className="overflow-x-auto rounded-xl border border-colibri-gold/20 bg-black/30">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-colibri-gold/20">
                        <th className="text-left p-3 text-colibri-gold">Fecha</th>
                        <th className="text-left p-3 text-colibri-gold">Insumo</th>
                        <th className="text-center p-3 text-colibri-gold">Tipo</th>
                        <th className="text-right p-3 text-colibri-gold">Cambio</th>
                        <th className="text-right p-3 text-colibri-gold hidden sm:table-cell">Antes</th>
                        <th className="text-right p-3 text-colibri-gold hidden sm:table-cell">Después</th>
                        <th className="text-left p-3 text-colibri-gold hidden md:table-cell">Notas</th>
                      </tr>
                    </thead>
                    <tbody>
                      {movements.map(m => (
                        <tr key={m.id} className="border-b border-colibri-green/10 hover:bg-colibri-green/10 transition-colors">
                          <td className="p-3 text-colibri-beige text-xs whitespace-nowrap">
                            {new Date(m.created_at).toLocaleString('es-MX', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                          </td>
                          <td className="p-3 text-white">{m.ingredient_name}</td>
                          <td className="p-3 text-center">
                            <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-medium ${TYPE_COLORS[m.change_type] || 'bg-gray-500/20 text-gray-300'}`}>
                              {TYPE_LABELS[m.change_type] || m.change_type}
                            </span>
                          </td>
                          <td className={`p-3 text-right font-mono font-medium ${m.change_amount > 0 ? 'text-green-400' : 'text-red-400'}`}>
                            {m.change_amount > 0 ? '+' : ''}{Number(m.change_amount).toFixed(1)}
                          </td>
                          <td className="p-3 text-right text-gray-400 hidden sm:table-cell">{Number(m.previous_stock).toFixed(1)}</td>
                          <td className="p-3 text-right text-white hidden sm:table-cell">{Number(m.new_stock).toFixed(1)}</td>
                          <td className="p-3 text-gray-400 text-xs hidden md:table-cell max-w-[200px] truncate">{m.notes || '—'}</td>
                        </tr>
                      ))}
                      {movements.length === 0 && (
                        <tr><td colSpan={7} className="p-8 text-center text-gray-500">No hay movimientos de insumos aún</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
                {movTotal > 30 && (
                  <div className="flex items-center justify-center gap-4">
                    <Button size="sm" variant="outline" disabled={movPage <= 1} onClick={() => setMovPage(p => p - 1)}
                      className="border-colibri-gold/30 text-colibri-beige hover:bg-colibri-green/30">
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <span className="text-sm text-gray-400">Pág {movPage} de {Math.ceil(movTotal / 30)}</span>
                    <Button size="sm" variant="outline" disabled={movPage >= Math.ceil(movTotal / 30)} onClick={() => setMovPage(p => p + 1)}
                      className="border-colibri-gold/30 text-colibri-beige hover:bg-colibri-green/30">
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </>
            )}
          </TabsContent>
        </Tabs>

        {/* ═══════ CREATE/EDIT INGREDIENT DIALOG ═══════ */}
        <Dialog open={editDialog} onOpenChange={setEditDialog}>
          <DialogContent className="bg-slate-950 border-colibri-gold/40 text-white max-w-md">
            <DialogHeader>
              <DialogTitle className="text-colibri-gold">
                {editingIngredient ? '✏️ Editar insumo' : '➕ Nuevo insumo'}
              </DialogTitle>
              <DialogDescription className="text-colibri-beige">
                {editingIngredient ? `Editando: ${editingIngredient.name}` : 'Define el insumo con su unidad de manejo'}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-3 py-2">
              <div>
                <label className="text-xs text-gray-400 mb-1 block">Nombre *</label>
                <Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })}
                  placeholder="Ej: Carne para hamburguesa" className="bg-black/40 border-colibri-gold/20 text-white" autoFocus />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-gray-400 mb-1 block">Unidad</label>
                  <select value={form.unit} onChange={e => setForm({ ...form, unit: e.target.value })}
                    className="w-full bg-black/40 border border-colibri-gold/20 rounded-md px-3 py-2 text-sm text-white">
                    <option value="porción">Porción</option>
                    <option value="pieza">Pieza</option>
                    <option value="kg">Kilogramo</option>
                    <option value="g">Gramo</option>
                    <option value="L">Litro</option>
                    <option value="ml">Mililitro</option>
                    <option value="bolsa">Bolsa</option>
                    <option value="caja">Caja</option>
                    <option value="rebanada">Rebanada</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs text-gray-400 mb-1 block">Categoría</label>
                  <Input value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}
                    placeholder="Ej: Carnes" className="bg-black/40 border-colibri-gold/20 text-white" />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3">
                {!editingIngredient && (
                  <div>
                    <label className="text-xs text-gray-400 mb-1 block">Stock inicial</label>
                    <Input type="number" value={form.stock} onChange={e => setForm({ ...form, stock: e.target.value })}
                      className="bg-black/40 border-colibri-gold/20 text-white font-mono" />
                  </div>
                )}
                <div>
                  <label className="text-xs text-gray-400 mb-1 block">Costo / unidad</label>
                  <Input type="number" step="0.01" value={form.cost_per_unit} onChange={e => setForm({ ...form, cost_per_unit: e.target.value })}
                    className="bg-black/40 border-colibri-gold/20 text-white font-mono" />
                </div>
                <div>
                  <label className="text-xs text-gray-400 mb-1 block">Mínimo alerta</label>
                  <Input type="number" value={form.min_stock} onChange={e => setForm({ ...form, min_stock: e.target.value })}
                    className="bg-black/40 border-colibri-gold/20 text-white font-mono" />
                </div>
              </div>
              <div>
                <label className="text-xs text-gray-400 mb-1 block">Proveedor (opcional)</label>
                <Input value={form.supplier} onChange={e => setForm({ ...form, supplier: e.target.value })}
                  placeholder="Ej: Carnes Don Juan" className="bg-black/40 border-colibri-gold/20 text-white" />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setEditDialog(false)} className="border-gray-700 text-gray-400">Cancelar</Button>
              <Button onClick={handleSaveIngredient} disabled={saving} className="bg-colibri-green hover:bg-colibri-green/80 text-white">
                {saving && <RefreshCw className="h-4 w-4 mr-2 animate-spin" />}
                {editingIngredient ? 'Guardar' : 'Crear'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* ═══════ STOCK ADJUST DIALOG ═══════ */}
        <Dialog open={adjustDialog} onOpenChange={setAdjustDialog}>
          <DialogContent className="bg-slate-950 border-colibri-gold/40 text-white max-w-md">
            <DialogHeader>
              <DialogTitle className="text-colibri-gold">
                {adjustAction === 'entry' && '📦 Entrada de mercancía'}
                {adjustAction === 'manual_reduce' && '➖ Salida manual'}
                {adjustAction === 'adjustment' && '🔄 Ajuste de inventario'}
                {adjustAction === 'waste' && '🗑️ Registrar merma'}
              </DialogTitle>
              <DialogDescription className="text-colibri-beige">
                {adjustIngredient?.name} — Stock actual: <span className="font-mono text-white">{adjustIngredient?.stock} {adjustIngredient?.unit}s</span>
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-2">
              <div className="flex gap-2">
                {([['entry', 'Entrada', 'bg-green-500/20 border-green-500/40 text-green-300'],
                   ['manual_reduce', 'Salida', 'bg-red-500/20 border-red-500/40 text-red-300'],
                   ['adjustment', 'Ajustar', 'bg-purple-500/20 border-purple-500/40 text-purple-300'],
                   ['waste', 'Merma', 'bg-orange-500/20 border-orange-500/40 text-orange-300']] as const).map(([key, label, cls]) => (
                  <button key={key} onClick={() => setAdjustAction(key as any)}
                    className={`flex-1 px-3 py-2 rounded-lg text-xs font-medium border transition ${adjustAction === key ? cls : 'border-gray-700 text-gray-500 hover:border-gray-500'}`}>
                    {label}
                  </button>
                ))}
              </div>

              <div>
                <label className="text-xs text-gray-400 mb-1 block">
                  {adjustAction === 'adjustment' ? `Nuevo stock (${adjustIngredient?.unit}s)` : `Cantidad (${adjustIngredient?.unit}s)`}
                </label>
                <Input type="number" min="0" step="0.5" value={adjustQty} onChange={e => setAdjustQty(e.target.value)}
                  placeholder="Ej: 80" className="bg-black/40 border-colibri-gold/20 text-white text-lg font-mono" autoFocus />
              </div>

              {adjustAction === 'entry' && (
                <div>
                  <label className="text-xs text-gray-400 mb-1 block">Costo total de la compra (opcional)</label>
                  <Input type="number" step="0.01" value={adjustCost} onChange={e => setAdjustCost(e.target.value)}
                    placeholder="Ej: 1200 → auto-calcula costo/unidad" className="bg-black/40 border-colibri-gold/20 text-white font-mono" />
                  {adjustCost && adjustQty && Number(adjustQty) > 0 && (
                    <p className="text-xs text-colibri-gold mt-1">
                      = {fmt(Number(adjustCost) / Number(adjustQty))} por {adjustIngredient?.unit}
                      {adjustIngredient?.cost_per_unit ? ` (antes: ${fmt(adjustIngredient.cost_per_unit)})` : ''}
                    </p>
                  )}
                </div>
              )}

              <div>
                <label className="text-xs text-gray-400 mb-1 block">Notas (opcional)</label>
                <Input value={adjustNotes} onChange={e => setAdjustNotes(e.target.value)}
                  placeholder="Ej: Compra a Carnes Don Juan" className="bg-black/40 border-colibri-gold/20 text-white" />
              </div>

              {adjustQty && adjustIngredient && (
                <div className="bg-black/30 rounded-lg p-3 border border-colibri-gold/10">
                  <p className="text-xs text-gray-400">Resultado:</p>
                  <p className="text-lg font-mono text-white">
                    {Number(adjustIngredient.stock).toFixed(1)} → {' '}
                    <span className="text-colibri-gold font-bold">
                      {adjustAction === 'adjustment' ? Number(adjustQty).toFixed(1)
                        : adjustAction === 'entry' ? (Number(adjustIngredient.stock) + Number(adjustQty)).toFixed(1)
                        : Math.max(0, Number(adjustIngredient.stock) - Number(adjustQty)).toFixed(1)}
                    </span> {adjustIngredient.unit}s
                  </p>
                </div>
              )}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setAdjustDialog(false)} className="border-gray-700 text-gray-400">Cancelar</Button>
              <Button onClick={handleAdjust} disabled={adjusting || !adjustQty} className="bg-colibri-green hover:bg-colibri-green/80 text-white">
                {adjusting && <RefreshCw className="h-4 w-4 mr-2 animate-spin" />}
                Confirmar
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* ═══════ RECIPE EDITOR DIALOG ═══════ */}
        <Dialog open={recipeDialogOpen} onOpenChange={setRecipeDialogOpen}>
          <DialogContent className="bg-slate-950 border-colibri-gold/40 text-white max-w-lg max-h-[85vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-colibri-gold">
                📋 Receta: {recipeProduct?.name}
              </DialogTitle>
              <DialogDescription className="text-colibri-beige">
                Precio venta: {fmt(recipeProduct?.price || 0)} — Define qué insumos usa y en qué cantidad
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-3 py-2">
              {recipeItems.map((item, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <select value={item.ingredient_id} onChange={e => updateRecipeLine(idx, 'ingredient_id', e.target.value)}
                    className="flex-1 bg-black/40 border border-colibri-gold/20 rounded-md px-2 py-2 text-sm text-white">
                    <option value="0">Seleccionar insumo...</option>
                    {ingredients.map(i => (
                      <option key={i.id} value={i.id}>{i.name} ({i.unit})</option>
                    ))}
                  </select>
                  <Input type="number" step="0.5" min="0.1" value={item.quantity}
                    onChange={e => updateRecipeLine(idx, 'quantity', e.target.value)}
                    className="w-20 bg-black/40 border-colibri-gold/20 text-white font-mono text-center" placeholder="Qty" />
                  <span className="text-xs text-gray-500 w-16 truncate">
                    {item.ingredient_id ? ingredients.find(i => i.id === item.ingredient_id)?.unit || '' : ''}
                  </span>
                  <button onClick={() => removeRecipeLine(idx)} className="p-1 text-red-400 hover:text-red-300">
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ))}

              <Button size="sm" variant="outline" onClick={addRecipeLine}
                className="border-colibri-gold/30 text-colibri-beige hover:bg-colibri-green/30 w-full">
                <Plus className="h-4 w-4 mr-1" /> Agregar insumo
              </Button>

              {/* Cost preview */}
              <div className="bg-black/30 rounded-lg p-3 border border-colibri-gold/10 space-y-1">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Costo receta:</span>
                  <span className="text-white font-mono font-bold">{fmt(recipeCostPreview)}</span>
                </div>
                {recipeProduct && Number(recipeProduct.price) > 0 && (
                  <>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-400">Precio venta:</span>
                      <span className="text-colibri-beige">{fmt(recipeProduct.price)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-400">Utilidad:</span>
                      <span className="text-green-400 font-medium">{fmt(Number(recipeProduct.price) - recipeCostPreview)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-400">Margen:</span>
                      <span className={`font-medium ${((Number(recipeProduct.price) - recipeCostPreview) / Number(recipeProduct.price) * 100) >= 50 ? 'text-green-400' : 'text-yellow-400'}`}>
                        {((Number(recipeProduct.price) - recipeCostPreview) / Number(recipeProduct.price) * 100).toFixed(1)}%
                      </span>
                    </div>
                  </>
                )}
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setRecipeDialogOpen(false)} className="border-gray-700 text-gray-400">Cancelar</Button>
              <Button onClick={saveRecipe} disabled={recipeSaving} className="bg-colibri-green hover:bg-colibri-green/80 text-white">
                {recipeSaving && <RefreshCw className="h-4 w-4 mr-2 animate-spin" />}
                <Save className="h-4 w-4 mr-1" /> Guardar receta
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  )
}
