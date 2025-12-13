"use client"

import { useState } from 'react'
import * as LucideIcons from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Search } from 'lucide-react'

// Lista de iconos disponibles para categorías
const AVAILABLE_ICONS = [
  // Comida
  { name: 'hamburger', label: 'Hamburguesa', component: LucideIcons.Sandwich, category: 'Comida' },
  { name: 'beef', label: 'Carne', component: LucideIcons.Beef, category: 'Comida' },
  { name: 'cake', label: 'Pastel', component: LucideIcons.Cake, category: 'Comida' },
  { name: 'drumstick', label: 'Pollo', component: LucideIcons.Drumstick, category: 'Comida' },
  { name: 'pizza', label: 'Pizza', component: LucideIcons.Pizza, category: 'Comida' },
  { name: 'sandwich', label: 'Sandwich', component: LucideIcons.Sandwich, category: 'Comida' },
  { name: 'croissant', label: 'Croissant', component: LucideIcons.Croissant, category: 'Comida' },
  { name: 'cookie', label: 'Galleta', component: LucideIcons.Cookie, category: 'Comida' },
  { name: 'soup', label: 'Sopa', component: LucideIcons.Soup, category: 'Comida' },
  { name: 'fish', label: 'Pescado', component: LucideIcons.Fish, category: 'Comida' },
  { name: 'egg', label: 'Huevo', component: LucideIcons.Egg, category: 'Comida' },
  { name: 'salad', label: 'Ensalada', component: LucideIcons.Salad, category: 'Comida' },
  { name: 'utensils', label: 'Cubiertos', component: LucideIcons.Utensils, category: 'Comida' },
  { name: 'chef-hat', label: 'Gorro Chef', component: LucideIcons.ChefHat, category: 'Comida' },
  
  // Bebidas
  { name: 'coffee', label: 'Café', component: LucideIcons.Coffee, category: 'Bebidas' },
  { name: 'wine', label: 'Vino', component: LucideIcons.Wine, category: 'Bebidas' },
  { name: 'beer', label: 'Cerveza', component: LucideIcons.Beer, category: 'Bebidas' },
  { name: 'milk', label: 'Leche', component: LucideIcons.Milk, category: 'Bebidas' },
  { name: 'glass-water', label: 'Agua', component: LucideIcons.GlassWater, category: 'Bebidas' },
  
  // Frutas y Vegetales
  { name: 'apple', label: 'Manzana', component: LucideIcons.Apple, category: 'Frutas' },
  { name: 'cherry', label: 'Cereza', component: LucideIcons.Cherry, category: 'Frutas' },
  { name: 'banana', label: 'Banana', component: LucideIcons.Banana, category: 'Frutas' },
  { name: 'carrot', label: 'Zanahoria', component: LucideIcons.Carrot, category: 'Frutas' },
  
  // Especiales
  { name: 'baby', label: 'Infantil', component: LucideIcons.Baby, category: 'Especial' },
  { name: 'utensils-crossed', label: 'Cubiertos', component: LucideIcons.UtensilsCrossed, category: 'Especial' },
  { name: 'ice-cream', label: 'Helado', component: LucideIcons.IceCream2, category: 'Especial' },
  { name: 'candy', label: 'Dulce', component: LucideIcons.Candy, category: 'Especial' },
  { name: 'popcorn', label: 'Palomitas', component: LucideIcons.Popcorn, category: 'Especial' },
  
  // Decorativos
  { name: 'flame', label: 'Picante', component: LucideIcons.Flame, category: 'Decorativo' },
  { name: 'sparkles', label: 'Especial', component: LucideIcons.Sparkles, category: 'Decorativo' },
  { name: 'snowflake', label: 'Frío', component: LucideIcons.Snowflake, category: 'Decorativo' },
  { name: 'star', label: 'Estrella', component: LucideIcons.Star, category: 'Decorativo' },
  { name: 'heart', label: 'Favorito', component: LucideIcons.Heart, category: 'Decorativo' },
  { name: 'package', label: 'Por defecto', component: LucideIcons.Package, category: 'Decorativo' },
]

interface IconPickerProps {
  value?: string
  onChange: (iconName: string) => void
  label?: string
}

export function IconPicker({ value, onChange, label = "Icono" }: IconPickerProps) {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')

  const selectedIcon = AVAILABLE_ICONS.find(icon => icon.name === value)
  const SelectedIconComponent = selectedIcon?.component || LucideIcons.Package

  const filteredIcons = AVAILABLE_ICONS.filter(icon =>
    icon.label.toLowerCase().includes(search.toLowerCase()) ||
    icon.name.toLowerCase().includes(search.toLowerCase()) ||
    icon.category.toLowerCase().includes(search.toLowerCase())
  )

  // Agrupar por categoría
  const groupedIcons = filteredIcons.reduce((acc, icon) => {
    if (!acc[icon.category]) {
      acc[icon.category] = []
    }
    acc[icon.category].push(icon)
    return acc
  }, {} as Record<string, typeof AVAILABLE_ICONS>)

  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-full justify-start"
          >
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-gradient-to-br from-purple-100 to-pink-100 dark:from-purple-900 dark:to-pink-900">
                <SelectedIconComponent className="h-5 w-5 text-purple-600 dark:text-purple-400" />
              </div>
              <span className="flex-1 text-left">
                {selectedIcon?.label || 'Seleccionar icono'}
              </span>
            </div>
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[400px] p-0" align="start">
          <div className="p-3 border-b">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar icono..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>
          <ScrollArea className="h-[400px]">
            <div className="p-3 space-y-4">
              {Object.entries(groupedIcons).map(([category, icons]) => (
                <div key={category}>
                  <h4 className="text-xs font-semibold text-muted-foreground uppercase mb-2 px-2">
                    {category}
                  </h4>
                  <div className="grid grid-cols-6 gap-2">
                    {icons.map((icon) => {
                      const IconComponent = icon.component
                      const isSelected = value === icon.name
                      return (
                        <button
                          key={icon.name}
                          onClick={() => {
                            onChange(icon.name)
                            setOpen(false)
                          }}
                          className={`
                            p-3 rounded-lg border-2 transition-all duration-200
                            hover:scale-110 hover:shadow-lg
                            ${isSelected 
                              ? 'border-purple-500 bg-purple-50 dark:bg-purple-950 shadow-md' 
                              : 'border-transparent hover:border-purple-200 dark:hover:border-purple-800'
                            }
                          `}
                          title={icon.label}
                        >
                          <IconComponent className={`h-6 w-6 ${isSelected ? 'text-purple-600 dark:text-purple-400' : 'text-muted-foreground'}`} />
                        </button>
                      )
                    })}
                  </div>
                </div>
              ))}
              {filteredIcons.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  <LucideIcons.Search className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p>No se encontraron iconos</p>
                </div>
              )}
            </div>
          </ScrollArea>
        </PopoverContent>
      </Popover>
      {selectedIcon && (
        <p className="text-xs text-muted-foreground">
          Icono seleccionado: <span className="font-mono bg-muted px-1 rounded">{selectedIcon.name}</span>
        </p>
      )}
    </div>
  )
}
