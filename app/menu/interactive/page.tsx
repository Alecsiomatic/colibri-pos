"use client"

import { useState } from "react"
import MenuItemCard from "@/components/menu/menu-item-card"

// Datos del menú de Sonora Express
const menuData = {
  categories: [
    {
      id: "premium",
      name: "Cortes Premium",
      description: "Nuestros cortes de mayor calidad, seleccionados cuidadosamente",
    },
    {
      id: "tradicionales",
      name: "Cortes Tradicionales",
      description: "Cortes clásicos con el auténtico sabor de Sonora",
    },
    {
      id: "especiales",
      name: "Especialidades",
      description: "Creaciones especiales de la casa con nuestros mejores cortes",
    },
    {
      id: "acompanantes",
      name: "Acompañantes",
      description: "El complemento perfecto para tu corte favorito",
    },
  ],
  items: [
    {
      id: "tomahawk",
      title: "Tomahawk",
      description: "Impresionante corte con hueso, jugoso y con un sabor intenso. Ideal para compartir.",
      price: 850,
      category: "premium",
    },
    {
      id: "ribeye",
      title: "Ribeye",
      description: "Corte marmoleado de textura suave y sabor excepcional. El favorito de los conocedores.",
      price: 450,
      category: "premium",
    },
    {
      id: "new-york",
      title: "New York",
      description: "Equilibrio perfecto entre sabor y textura, con un característico borde de grasa.",
      price: 380,
      category: "premium",
    },
    {
      id: "t-bone",
      title: "T-Bone",
      description: "Lo mejor de dos mundos: filete y contra en un solo corte espectacular.",
      price: 520,
      category: "premium",
    },
    {
      id: "arrachera",
      title: "Arrachera",
      description: "Nuestro corte más popular, marinado con nuestra receta especial.",
      price: 290,
      category: "tradicionales",
    },
    {
      id: "sirloin",
      title: "Sirloin",
      description: "Corte magro y versátil, perfecto para los amantes de la carne con menos grasa.",
      price: 320,
      category: "tradicionales",
    },
    {
      id: "picana",
      title: "Picaña",
      description: "Jugosa y tierna, con una capa de grasa que le da un sabor inigualable.",
      price: 340,
      category: "tradicionales",
    },
    {
      id: "vacioflank",
      title: "Vacío / Flank",
      description: "Corte con fibras marcadas y sabor intenso, ideal para término medio.",
      price: 310,
      category: "tradicionales",
    },
    {
      id: "costillas",
      title: "Costillas BBQ",
      description: "Costillas de res bañadas en nuestra salsa BBQ casera, ahumadas lentamente.",
      price: 390,
      category: "especiales",
    },
    {
      id: "brisket",
      title: "Brisket Ahumado",
      description: "Pecho de res ahumado por 12 horas, jugoso y lleno de sabor.",
      price: 420,
      category: "especiales",
    },
    {
      id: "chorizo",
      title: "Chorizo de Sonora",
      description: "Nuestro chorizo artesanal, elaborado con la receta tradicional de Sonora.",
      price: 180,
      category: "especiales",
    },
    {
      id: "hamburguesa",
      title: "Hamburguesa Sonora",
      description: "200g de nuestra mejor carne, con queso, tocino y todos los complementos.",
      price: 220,
      category: "especiales",
    },
    {
      id: "papas",
      title: "Papas al Carbón",
      description: "Papas asadas al carbón con mantequilla de ajo y hierbas.",
      price: 90,
      category: "acompanantes",
    },
    {
      id: "elotes",
      title: "Elotes Asados",
      description: "Elotes asados con mantequilla, limón y especias.",
      price: 75,
      category: "acompanantes",
    },
    {
      id: "guacamole",
      title: "Guacamole Tradicional",
      description: "Preparado al momento con aguacate, tomate, cebolla y cilantro.",
      price: 110,
      category: "acompanantes",
    },
    {
      id: "frijoles",
      title: "Frijoles Charros",
      description: "Frijoles cocinados con chorizo, tocino y especias.",
      price: 85,
      category: "acompanantes",
    },
  ],
}

export default function InteractiveMenuPage() {
  const [activeCategory, setActiveCategory] = useState<string>("all")
  const [searchQuery, setSearchQuery] = useState<string>("")

  // Filtrar elementos según la categoría activa y la búsqueda
  const filteredItems = menuData.items.filter((item) => {
    const matchesCategory = activeCategory === "all" || item.category === activeCategory
    const matchesSearch =
      item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.description.toLowerCase().includes(searchQuery.toLowerCase())

    return matchesCategory && matchesSearch
  })

  return (
    <div className="min-h-screen bg-amber-50 pb-16">
      {/* Header */}
      <header className="bg-amber-900 text-amber-100 py-6">
        <div className="max-w-6xl mx-auto px-4">
          <h1 className="text-3xl font-bold font-serif text-center">Menú Interactivo - Sonora Express</h1>
          <p className="text-center text-amber-200 mt-2">Explora nuestros cortes premium y especialidades</p>
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
                    ? "bg-amber-700 text-white"
                    : "bg-amber-100 text-amber-900 hover:bg-amber-200"
                }`}
              >
                Todos
              </button>
              {menuData.categories.map((category) => (
                <button
                  key={category.id}
                  onClick={() => setActiveCategory(category.id)}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                    activeCategory === category.id
                      ? "bg-amber-700 text-white"
                      : "bg-amber-100 text-amber-900 hover:bg-amber-200"
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
                className="w-full md:w-64 px-4 py-2 border border-amber-300 rounded-full focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>
          </div>
        </div>

        {/* Categoría activa */}
        {activeCategory !== "all" && (
          <div className="mb-8">
            <h2 className="text-3xl font-bold text-amber-900 mb-2 font-serif">
              {menuData.categories.find((c) => c.id === activeCategory)?.name}
            </h2>
            <p className="text-xl text-amber-800 italic">
              {menuData.categories.find((c) => c.id === activeCategory)?.description}
            </p>
          </div>
        )}

        {/* Menú items */}
        {filteredItems.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-amber-800 text-lg">No se encontraron platillos que coincidan con tu búsqueda.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredItems.map((item) => (
              <MenuItemCard
                key={item.id}
                id={item.id}
                title={item.title}
                description={item.description}
                price={item.price}
                category={item.category}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
