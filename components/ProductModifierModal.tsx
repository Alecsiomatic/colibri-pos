'use client'

import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Label } from '@/components/ui/label'
import { Plus, Minus, X } from 'lucide-react'

interface Modifier {
  id: number
  name: string
  price_adjustment: number
  type: string
  display_order: number
}

interface ModifierGroup {
  id: number
  name: string
  description: string
  is_required: boolean
  min_selections: number
  max_selections: number
  modifiers: Modifier[]
}

interface ProductModifierModalProps {
  isOpen: boolean
  onClose: () => void
  product: any
  onAddToCart: (product: any, selectedModifiers: any[], totalPrice: number) => void
}

export function ProductModifierModal({ isOpen, onClose, product, onAddToCart }: ProductModifierModalProps) {
  const [modifierGroups, setModifierGroups] = useState<ModifierGroup[]>([])
  const [selectedModifiers, setSelectedModifiers] = useState<{[groupId: number]: number[]}>({})
  const [quantity, setQuantity] = useState(1)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (isOpen && product?.id) {
      loadModifiers()
    }
  }, [isOpen, product])

  const loadModifiers = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/modifiers/product/${product.id}`)
      const data = await response.json()
      
      if (data.success) {
        setModifierGroups(data.groups || [])
      }
    } catch (error) {
      console.error('Error loading modifiers:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleModifierToggle = (groupId: number, modifierId: number, group: ModifierGroup) => {
    setSelectedModifiers(prev => {
      const current = prev[groupId] || []
      
      if (group.max_selections === 1) {
        // Radio button behavior
        return { ...prev, [groupId]: [modifierId] }
      } else {
        // Checkbox behavior
        const isSelected = current.includes(modifierId)
        
        if (isSelected) {
          return { ...prev, [groupId]: current.filter(id => id !== modifierId) }
        } else {
          if (current.length < group.max_selections) {
            return { ...prev, [groupId]: [...current, modifierId] }
          }
          return prev
        }
      }
    })
  }

  const calculateTotalPrice = () => {
    let total = parseFloat(product.price)
    
    modifierGroups.forEach(group => {
      const selected = selectedModifiers[group.id] || []
      selected.forEach(modId => {
        const modifier = group.modifiers.find(m => m.id === modId)
        if (modifier) {
          total += modifier.price_adjustment
        }
      })
    })
    
    return total * quantity
  }

  const isValid = () => {
    return modifierGroups.every(group => {
      const selected = selectedModifiers[group.id] || []
      if (group.is_required && selected.length < group.min_selections) {
        return false
      }
      return true
    })
  }

  const handleAddToCart = () => {
    if (!isValid()) return

    const selectedMods: any[] = []
    modifierGroups.forEach(group => {
      const selected = selectedModifiers[group.id] || []
      selected.forEach(modId => {
        const modifier = group.modifiers.find(m => m.id === modId)
        if (modifier) {
          selectedMods.push({
            group: group.name,
            modifier: modifier.name,
            price: modifier.price_adjustment
          })
        }
      })
    })

    onAddToCart(product, selectedMods, calculateTotalPrice())
    onClose()
  }

  if (!product) return null

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-white border-colibri-gold/50 shadow-2xl">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-slate-900 flex items-center gap-3">
            <span className="text-3xl">🎛️</span>
            Personaliza tu {product.name}
          </DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-colibri-gold"></div>
          </div>
        ) : modifierGroups.length === 0 ? (
          <div className="text-center py-8 text-slate-700">
            <p>Este producto no tiene modificadores disponibles.</p>
          </div>
        ) : (
          <div className="space-y-6 py-4">
            {modifierGroups.map(group => (
              <div key={group.id} className="space-y-3 p-4 rounded-lg bg-colibri-beige/30 border-2 border-colibri-gold/40">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
                      {group.name}
                      {group.is_required && (
                        <Badge variant="destructive" className="text-xs bg-colibri-wine text-white">Requerido</Badge>
                      )}
                    </h3>
                    {group.description && (
                      <p className="text-sm text-slate-700 mt-1">{group.description}</p>
                    )}
                    <p className="text-xs text-slate-600 mt-1">
                      {group.max_selections === 1 
                        ? 'Selecciona una opción' 
                        : `Máximo ${group.max_selections} opciones`
                      }
                    </p>
                  </div>
                </div>

                <div className="space-y-2">
                  {group.max_selections === 1 ? (
                    <RadioGroup
                      value={selectedModifiers[group.id]?.[0]?.toString()}
                      onValueChange={(value) => handleModifierToggle(group.id, parseInt(value), group)}
                    >
                      {group.modifiers.map(modifier => (
                        <div key={modifier.id} className="flex items-center space-x-3 p-3 rounded-lg hover:bg-colibri-gold/20 transition-colors border border-transparent hover:border-colibri-gold/40">
                          <RadioGroupItem value={modifier.id.toString()} id={`mod-${modifier.id}`} />
                          <Label 
                            htmlFor={`mod-${modifier.id}`} 
                            className="flex-1 cursor-pointer text-slate-900 font-medium"
                          >
                            <div className="flex items-center justify-between">
                              <span>{modifier.name}</span>
                              {modifier.price_adjustment !== 0 && (
                                <Badge variant="secondary" className="bg-colibri-gold text-white font-bold">
                                  {modifier.price_adjustment > 0 ? '+' : ''}
                                  ${modifier.price_adjustment.toFixed(2)}
                                </Badge>
                              )}
                            </div>
                          </Label>
                        </div>
                      ))}
                    </RadioGroup>
                  ) : (
                    <div className="space-y-2">
                      {group.modifiers.map(modifier => (
                        <div key={modifier.id} className="flex items-center space-x-3 p-3 rounded-lg hover:bg-colibri-gold/20 transition-colors border border-transparent hover:border-colibri-gold/40">
                          <Checkbox
                            id={`mod-${modifier.id}`}
                            checked={selectedModifiers[group.id]?.includes(modifier.id)}
                            onCheckedChange={() => handleModifierToggle(group.id, modifier.id, group)}
                            disabled={
                              !selectedModifiers[group.id]?.includes(modifier.id) &&
                              (selectedModifiers[group.id]?.length || 0) >= group.max_selections
                            }
                          />
                          <Label 
                            htmlFor={`mod-${modifier.id}`} 
                            className="flex-1 cursor-pointer text-slate-900 font-medium"
                          >
                            <div className="flex items-center justify-between">
                              <span>{modifier.name}</span>
                              {modifier.price_adjustment !== 0 && (
                                <Badge variant="secondary" className="bg-colibri-gold text-white font-bold">
                                  {modifier.price_adjustment > 0 ? '+' : ''}
                                  ${modifier.price_adjustment.toFixed(2)}
                                </Badge>
                              )}
                            </div>
                          </Label>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="flex items-center justify-between pt-4 border-t-2 border-colibri-gold/40">
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="icon"
              onClick={() => setQuantity(Math.max(1, quantity - 1))}
              className="h-10 w-10 rounded-full border-2 border-colibri-green text-colibri-green hover:bg-colibri-green hover:text-white"
            >
              <Minus className="h-4 w-4" />
            </Button>
            <span className="text-xl font-bold text-slate-900 min-w-[3ch] text-center">{quantity}</span>
            <Button
              variant="outline"
              size="icon"
              onClick={() => setQuantity(quantity + 1)}
              className="h-10 w-10 rounded-full border-2 border-colibri-green text-colibri-green hover:bg-colibri-green hover:text-white"
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>

          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              onClick={onClose}
              className="border-2 border-slate-300 text-slate-700 hover:bg-slate-100"
            >
              <X className="h-4 w-4 mr-2" />
              Cancelar
            </Button>
            <Button
              onClick={handleAddToCart}
              disabled={!isValid()}
              className="bg-gradient-to-r from-colibri-green to-colibri-wine hover:from-colibri-green/90 hover:to-colibri-wine/90 text-white px-6 shadow-lg font-bold"
            >
              <Plus className="h-4 w-4 mr-2" />
              Agregar ${calculateTotalPrice().toFixed(2)}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
