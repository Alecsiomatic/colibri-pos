'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { 
  ShoppingCart, 
  Trash2, 
  Plus, 
  Minus, 
  CheckCircle,
  Loader2,
  UserCheck,
  Clock,
  DollarSign,
  Lock
} from 'lucide-react'
import { useCart } from '@/hooks/use-cart'
import { useAuth } from '@/hooks/use-auth'
import { useToast } from '@/hooks/use-notifications'

interface GroupedTable {
  tableName: string;
  orders: any[];
  totalMesa: number;
  allItems: any[];
  firstOrderDate: string;
  lastOrderDate: string;
  orderCount: number;
}

export default function CheckoutMeseroPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { items, updateQuantity, removeItem, total, itemCount, createOrder, clearCart } = useCart()
  const { user } = useAuth()
  const toast = useToast()

  // Check if table was pre-selected from visual map
  const presetMesa = searchParams.get('mesaNombre') || ''
  const isMapMode = !!presetMesa

  // States
  const [mesasAbiertas, setMesasAbiertas] = useState<GroupedTable[]>([])
  const [mesaSeleccionada, setMesaSeleccionada] = useState<string>(presetMesa)
  const [nuevaMesa, setNuevaMesa] = useState(presetMesa && !isMapMode ? '' : '')
  const [notas, setNotas] = useState('')
  const [loadingMesas, setLoadingMesas] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)

  // Redirect if cart is empty
  useEffect(() => {
    if (itemCount === 0) {
      router.push('/menu')
    }
  }, [itemCount, router])

  // Redirect if not mesero
  useEffect(() => {
    if (user && (!user.is_waiter || user.is_admin || user.is_driver)) {
      router.push('/checkout')
    }
  }, [user, router])

  // Fetch mesas abiertas
  useEffect(() => {
    if (user?.is_waiter) {
      setLoadingMesas(true)
      fetch('/api/mesero/open-tables', { credentials: 'include' })
        .then(res => res.json())
        .then(data => {
          if (data.success) {
            setMesasAbiertas(data.tables || [])
          }
        })
        .catch(err => console.error('Error fetching tables:', err))
        .finally(() => setLoadingMesas(false))
    }
  }, [user])

  const handleSubmit = async () => {
    const mesaFinal = mesaSeleccionada || nuevaMesa
    
    if (!mesaFinal.trim()) {
      toast.error('Error', 'Debes seleccionar una mesa existente o crear una nueva')
      return
    }

    setIsProcessing(true)
    
    try {
      const orderData = {
        items: items.map(item => ({
          id: item.id,
          name: item.name,
          price: item.price,
          quantity: item.quantity,
          modifiers: item.modifiers || []
        })),
        total,
        // Datos específicos del mesero
        waiter_order: true,
        table: mesaFinal,
        notes: notas,
        payment_method: 'efectivo', // Meseros siempre efectivo
        delivery_type: 'mesa' // Tipo especial para mesas
      }

      const result = await createOrder(orderData)
      
      if (result.success) {
        toast.success('¡Pedido creado!', `Productos agregados a ${mesaFinal}`)
        clearCart()
        router.push('/mesero/mesas-abiertas')
      } else {
        toast.error('Error', result.message || 'No se pudo crear el pedido')
      }
    } catch (error) {
      toast.error('Error', 'Error al procesar el pedido')
    } finally {
      setIsProcessing(false)
    }
  }

  if (!user?.is_waiter) {
    return <div className="min-h-screen flex items-center justify-center">
      <Loader2 className="h-8 w-8 animate-spin" />
    </div>
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-colibri-green via-slate-900 to-slate-950 py-4 sm:py-8">
      <div className="max-w-6xl mx-auto px-4">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white drop-shadow-[0_0_20px_rgba(171,153,118,0.5)] mb-2">Checkout - Mesero</h1>
          <p className="text-white text-lg font-semibold">Agrega productos a una mesa existente o crea una nueva mesa</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left Column - Mesa Selection */}
          <div className="space-y-6">
            {/* Mesas Abiertas */}
            <Card className="bg-slate-900/95 backdrop-blur-2xl border-colibri-green/30 shadow-2xl">
              <CardHeader>
                <CardTitle className="text-white flex items-center text-xl">
                  <UserCheck className="h-5 w-5 mr-2 text-colibri-gold" />
                  Seleccionar Mesa
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {isMapMode ? (
                  /* Map mode: table is pre-selected and locked */
                  <div className="p-4 bg-colibri-wine/30 rounded-lg border-2 border-colibri-gold/60">
                    <div className="flex items-center gap-2 mb-2">
                      <Lock className="h-4 w-4 text-colibri-gold" />
                      <span className="text-colibri-gold font-semibold text-sm">Mesa seleccionada desde mapa</span>
                    </div>
                    <div className="text-white font-black text-2xl">{presetMesa}</div>
                  </div>
                ) : loadingMesas ? (
                  <div className="flex items-center gap-2 text-white">
                    <Loader2 className="animate-spin h-5 w-5" />
                    <span>Cargando mesas...</span>
                  </div>
                ) : (
                  <>
                    {mesasAbiertas.length > 0 && (
                      <div>
                        <Label className="text-white mb-3 block font-semibold">
                          Mesas Abiertas ({mesasAbiertas.length}):
                        </Label>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          {mesasAbiertas.map((mesa) => (
                            <button
                              key={mesa.tableName}
                              type="button"
                              className={`p-4 rounded-lg border-2 transition-all text-left backdrop-blur-sm ${
                                mesaSeleccionada === mesa.tableName 
                                  ? 'bg-colibri-wine/80 text-white border-colibri-gold shadow-xl shadow-colibri-gold/20' 
                                  : 'bg-slate-800/80 text-white border-colibri-green/30 hover:bg-slate-700/80 hover:border-colibri-gold/50'
                              }`}
                              onClick={() => {
                                setMesaSeleccionada(mesa.tableName)
                                setNuevaMesa('') // Clear nueva mesa if selecting existing
                              }}
                            >
                              <div className="font-bold text-lg">{mesa.tableName}</div>
                              <div className="flex items-center gap-4 text-sm opacity-75 mt-1">
                                <div className="flex items-center gap-1">
                                  <span>{mesa.orderCount} pedidos</span>
                                </div>
                                <div className="flex items-center gap-1">
                                  <DollarSign className="h-3 w-3" />
                                  <span>${Number(mesa.totalMesa).toFixed(2)}</span>
                                </div>
                              </div>
                              <div className="flex items-center gap-1 text-xs opacity-60 mt-1">
                                <Clock className="h-3 w-3" />
                                <span>{new Date(mesa.firstOrderDate).toLocaleTimeString()}</span>
                              </div>
                            </button>
                          ))}
                        </div>
                        <div className="mt-3 text-sm text-white bg-colibri-green/20 backdrop-blur-xl p-3 rounded-lg border border-colibri-gold/30">
                          💡 Selecciona una mesa existente para agregar productos a esa mesa
                        </div>
                      </div>
                    )}

                    {/* Nueva Mesa */}
                    <div className="mt-6">
                      <Label htmlFor="nueva-mesa" className="text-white font-semibold text-base">
                        O crear nueva mesa:
                      </Label>
                      <Input
                        id="nueva-mesa"
                        value={nuevaMesa}
                        onChange={(e) => {
                          setNuevaMesa(e.target.value)
                          if (e.target.value) setMesaSeleccionada('') // Clear selected if typing new
                        }}
                        className="mt-2 h-14 text-lg bg-slate-800/90 border-colibri-green/40 focus:border-colibri-gold text-white placeholder:text-slate-400 backdrop-blur-xl"
                        placeholder="Ej: Mesa 8, Terraza 2, VIP 1..."
                      />
                    </div>

                    {/* Notas */}
                    <div>
                      <Label htmlFor="notas" className="text-white font-semibold text-base">
                        Notas adicionales (opcional):
                      </Label>
                      <Textarea
                        id="notas"
                        value={notas}
                        onChange={(e) => setNotas(e.target.value)}
                        className="mt-2 bg-slate-800/90 border-colibri-green/40 focus:border-colibri-gold text-white placeholder:text-slate-400 backdrop-blur-xl text-base"
                        placeholder="Instrucciones especiales, alergias, preferencias..."
                        rows={3}
                      />
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Order Summary */}
          <div className="space-y-6">
            <Card className="bg-slate-900/95 backdrop-blur-2xl border-colibri-green/30 shadow-2xl">
              <CardHeader>
                <CardTitle className="text-white flex items-center text-xl">
                  <ShoppingCart className="h-5 w-5 mr-2 text-colibri-gold" />
                  Resumen del Pedido
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {items.map((item) => (
                  <div key={item.id} className="flex items-center justify-between p-3 bg-slate-800/80 backdrop-blur-xl rounded-lg border border-colibri-green/30">
                    <div className="flex-1">
                      <h4 className="font-medium text-white">{item.name}</h4>
                      <p className="text-sm text-colibri-gold">${Number(item.price).toFixed(2)} c/u</p>
                      
                      {/* Mostrar modificadores */}
                      {item.modifiers && item.modifiers.length > 0 && (
                        <div className="mt-1 space-y-0.5">
                          {item.modifiers.map((mod: any, idx: number) => (
                            <p key={idx} className="text-xs text-slate-300">
                              • {mod.group}: <span className="text-colibri-gold">{mod.modifier}</span>
                              {mod.price !== 0 && <span className="text-green-400"> (+${mod.price.toFixed(2)})</span>}
                            </p>
                          ))}
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => updateQuantity(item.id, Math.max(0, item.quantity - 1), item.modifiers)}
                        className="h-8 w-8 p-0 bg-slate-700/80 border-colibri-green/40 text-white hover:bg-colibri-wine/80 hover:border-colibri-gold"
                      >
                        <Minus className="h-3 w-3" />
                      </Button>
                      <Badge className="min-w-[2rem] text-center bg-colibri-wine text-white border-none font-bold text-base">
                        {item.quantity}
                      </Badge>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => updateQuantity(item.id, item.quantity + 1, item.modifiers)}
                        className="h-8 w-8 p-0 bg-slate-700/80 border-colibri-green/40 text-white hover:bg-colibri-wine/80 hover:border-colibri-gold"
                      >
                        <Plus className="h-3 w-3" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => removeItem(item.id, item.modifiers)}
                        className="h-8 w-8 p-0 bg-red-600/30 border-red-500/40 text-red-300 hover:bg-red-600/50 hover:text-white"
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                ))}

                <div className="border-t border-colibri-green/40 pt-4">
                  <div className="flex justify-between items-center text-2xl font-black text-white">
                    <span>Total:</span>
                    <span className="text-colibri-gold drop-shadow-[0_0_10px_rgba(171,153,118,0.5)]">${Number(total).toFixed(2)}</span>
                  </div>
                </div>

                {/* Submit Button */}
                <Button
                  onClick={handleSubmit}
                  disabled={isProcessing || (!mesaSeleccionada && !nuevaMesa.trim())}
                  className="w-full bg-gradient-to-r from-colibri-wine to-colibri-green hover:from-colibri-wine/90 hover:to-colibri-green/90 text-white text-lg py-6 font-bold shadow-xl"
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="h-5 w-5 animate-spin mr-2" />
                      Procesando...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="h-5 w-5 mr-2" />
                      Agregar a {mesaSeleccionada || nuevaMesa || 'Mesa'}
                    </>
                  )}
                </Button>

                {/* Info */}
                <div className="text-sm text-white bg-colibri-green/20 backdrop-blur-xl p-3 rounded-lg border border-colibri-gold/30">
                  <p className="font-semibold mb-1">Información:</p>
                  <p>• Los productos se agregarán a la mesa seleccionada</p>
                  <p>• Pago siempre en efectivo (mesero)</p>
                  <p>• Sin opciones de delivery</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}