"use client"

import { useState, useEffect } from "react"
import { Loader2 } from "lucide-react"
import MenuItemCard from "@/components/menu/menu-item-card"

interface Category { id: number; name: string; description?: string; slug: string }
interface Product { id: number; name: string; description?: string; price: number; category_id: number; image_url?: string }

export default function InteractiveMenuPage() {
  const [categories, setCategories] = useState<Category[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [businessName, setBusinessName] = useState('')
  const [loading, setLoading] = useState(true)
  const [activeCategory, setActiveCategory] = useState<string>("all")
  const [searchQuery, setSearchQuery] = useState<string>("")

  useEffect(() => {
    async function load() {
      try {
        const [catRes, prodRes, bizRes] = await Promise.all([
          fetch('/api/categories'),
          fetch('/api/products'),
          fetch('/api/business-info'),
        ])
        if (catRes.ok) { const d = await catRes.json(); setCategories(d.categories || d || []) }
        if (prodRes.ok) { const d = await prodRes.json(); setProducts(d.products || d || []) }
        if (bizRes.ok) { const d = await bizRes.json(); setBusinessName(d.name || d.business_name || '') }
      } catch {}
      setLoading(false)
    }
    load()
  }, [])

  const filteredItems = products.filter((item) => {
    const matchesCategory = activeCategory === "all" || String(item.category_id) === activeCategory
    const matchesSearch =
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.description || '').toLowerCase().includes(searchQuery.toLowerCase())
    return matchesCategory && matchesSearch
  })

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background pb-16">
      {/* Header */}
      <header className="bg-colibri-green text-white py-6">
        <div className="max-w-6xl mx-auto px-4">
          <h1 className="text-3xl font-bold font-serif text-center">
            Menú Interactivo{businessName ? ` — ${businessName}` : ''}
          </h1>
          <p className="text-center text-colibri-beige mt-2">Explora nuestros productos y especialidades</p>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Filtros y búsqueda */}
        <div className="mb-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex flex-wrap gap-2 justify-center md:justify-start">
              <button
                onClick={() => setActiveCategory("all")}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                  activeCategory === "all"
                    ? "bg-colibri-green text-white"
                    : "bg-colibri-beige text-foreground hover:bg-colibri-beige/80"
                }`}
              >
                Todos
              </button>
              {categories.map((category) => (
                <button
                  key={category.id}
                  onClick={() => setActiveCategory(String(category.id))}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                    activeCategory === String(category.id)
                      ? "bg-colibri-green text-white"
                      : "bg-colibri-beige text-foreground hover:bg-colibri-beige/80"
                  }`}
                >
                  {category.name}
                </button>
              ))}
            </div>
            <div className="w-full md:w-auto">
              <input
                type="text"
                placeholder="Buscar platillos..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full md:w-64 px-4 py-2 border border-border rounded-full focus:outline-none focus:ring-2 focus:ring-colibri-green"
              />
            </div>
          </div>
        </div>

        {/* Categoría activa */}
        {activeCategory !== "all" && (
          <div className="mb-8">
            <h2 className="text-3xl font-bold text-foreground mb-2 font-serif">
              {categories.find((c) => String(c.id) === activeCategory)?.name}
            </h2>
            <p className="text-xl text-foreground/70 italic">
              {categories.find((c) => String(c.id) === activeCategory)?.description}
            </p>
          </div>
        )}

        {/* Menú items */}
        {filteredItems.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-foreground/70 text-lg">No se encontraron platillos que coincidan con tu búsqueda.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredItems.map((item) => (
              <MenuItemCard
                key={item.id}
                id={item.id}
                title={item.name}
                description={item.description || ''}
                price={item.price}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
