'use client'

import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { DollarSign, CreditCard, CheckCircle, AlertCircle } from 'lucide-react'

interface CollectPaymentModalProps {
  isOpen: boolean
  onClose: () => void
  order: any
  onConfirm: (data: { cashReceived?: number; changeGiven?: number; paymentMethod?: string }) => void
}

export function CollectPaymentModal({ isOpen, onClose, order, onConfirm }: CollectPaymentModalProps) {
  const [cashReceived, setCashReceived] = useState('')
  const [error, setError] = useState('')
  const [paymentMethod, setPaymentMethod] = useState<'efectivo' | 'tarjeta'>('efectivo')

  const totalAmount = parseFloat(order?.total || 0)
  const isPaid = order?.status === 'paid' || order?.payment_method === 'card' || order?.payment_method === 'tarjeta'
  const changeAmount = cashReceived ? Math.max(0, parseFloat(cashReceived) - totalAmount) : 0

  useEffect(() => {
    if (isOpen) {
      setCashReceived('')
      setError('')
      // Detectar método de pago existente
      if (order?.payment_method === 'card' || order?.payment_method === 'tarjeta') {
        setPaymentMethod('tarjeta')
      } else {
        setPaymentMethod('efectivo')
      }
    }
  }, [isOpen, order])

  const handleConfirm = () => {
    if (isPaid) {
      // Ya está pagado, solo confirmar entrega
      onConfirm({ paymentMethod: 'tarjeta' })
      return
    }

    // Si es tarjeta, solo confirmar
    if (paymentMethod === 'tarjeta') {
      onConfirm({ paymentMethod: 'tarjeta' })
      return
    }

    // Validar efectivo
    const received = parseFloat(cashReceived)
    if (isNaN(received) || received <= 0) {
      setError('Ingresa un monto válido')
      return
    }

    if (received < totalAmount) {
      setError(`El efectivo debe ser mayor o igual a $${totalAmount.toFixed(2)}`)
      return
    }

    onConfirm({
      cashReceived: received,
      changeGiven: changeAmount,
      paymentMethod: 'efectivo'
    })
  }

  if (!order) return null

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md bg-slate-900/95 backdrop-blur-2xl border-2 border-colibri-green/30 shadow-2xl text-white">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl text-white">
            {isPaid ? (
              <>
                <CheckCircle className="h-6 w-6 text-green-400" />
                Confirmar Entrega
              </>
            ) : (
              <>
                <DollarSign className="h-6 w-6 text-colibri-gold" />
                Cobrar Pedido
              </>
            )}
          </DialogTitle>
          <DialogDescription className="text-colibri-gold">
            Pedido #{order.id}
            {order.table && ` - Mesa ${order.table}`}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Información del pedido */}
          <div className="bg-slate-950/80 rounded-lg p-4 space-y-2 border border-colibri-green/30">
            <div className="flex justify-between items-center">
              <span className="text-slate-400">Cliente:</span>
              <span className="font-medium text-white">{order.customer_name || 'Cliente'}</span>
            </div>
            
            {order.table && (
              <div className="flex justify-between items-center">
                <span className="text-gray-400">Mesa:</span>
                <Badge variant="outline" className="border-colibri-wine/50 text-colibri-wine bg-colibri-wine/5 font-semibold">
                  🍽️ {order.table}
                </Badge>
              </div>
            )}

            <div className="flex justify-between items-center pt-2 border-t border-colibri-green/30">
              <span className="text-white font-semibold text-lg">Total:</span>
              <span className="text-4xl font-black text-colibri-gold drop-shadow-[0_0_15px_rgba(171,153,118,0.5)]">
                ${totalAmount.toFixed(2)}
              </span>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-gray-400">Método de pago:</span>
              <Badge className={paymentMethod === 'tarjeta' ? 'bg-blue-500/20 text-blue-400 border-blue-500/30' : 'bg-green-500/20 text-green-400 border-green-500/30'}>
                {paymentMethod === 'tarjeta' ? (
                  <>
                    <CreditCard className="h-3 w-3 mr-1" />
                    Tarjeta
                  </>
                ) : (
                  <>
                    <DollarSign className="h-3 w-3 mr-1" />
                    Efectivo
                  </>
                )}
              </Badge>
            </div>
          </div>

          {/* Selector de método de pago (solo si no está pagado) */}
          {!isPaid && (
            <div className="space-y-2">
              <Label className="text-white font-semibold">Método de pago</Label>
              <div className="grid grid-cols-2 gap-3">
                <Button
                  type="button"
                  variant={paymentMethod === 'efectivo' ? 'default' : 'outline'}
                  onClick={() => setPaymentMethod('efectivo')}
                  className={paymentMethod === 'efectivo' 
                    ? 'bg-colibri-green hover:bg-colibri-green/90 text-white' 
                    : 'border-colibri-green text-colibri-green hover:bg-colibri-green/10'
                  }
                >
                  <DollarSign className="h-4 w-4 mr-2" />
                  Efectivo
                </Button>
                <Button
                  type="button"
                  variant={paymentMethod === 'tarjeta' ? 'default' : 'outline'}
                  onClick={() => setPaymentMethod('tarjeta')}
                  className={paymentMethod === 'tarjeta' 
                    ? 'bg-colibri-wine hover:bg-colibri-wine/90 text-white' 
                    : 'border-colibri-wine text-colibri-wine hover:bg-colibri-wine/10'
                  }
                >
                  <CreditCard className="h-4 w-4 mr-2" />
                  Tarjeta
                </Button>
              </div>
            </div>
          )}

          {/* Estado de pago */}
          {isPaid ? (
            <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <CheckCircle className="h-5 w-5 text-blue-400 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium text-blue-400">Pedido ya pagado</p>
                  <p className="text-sm text-gray-400 mt-1">
                    El pago con tarjeta fue procesado exitosamente. 
                    Confirma la entrega del pedido al cliente.
                  </p>
                </div>
              </div>
            </div>
          ) : paymentMethod === 'tarjeta' ? (
            <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <CreditCard className="h-5 w-5 text-blue-400 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium text-blue-400">Pago con tarjeta</p>
                  <p className="text-sm text-gray-400 mt-1">
                    Confirma que el pago con tarjeta fue procesado correctamente antes de entregar el pedido.
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <>
              {/* Input de efectivo */}
              <div className="space-y-2">
                <Label htmlFor="cash" className="text-colibri-gold font-semibold text-base">
                  Efectivo recibido
                </Label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 h-6 w-6 text-colibri-wine" />
                  <Input
                    id="cash"
                    type="number"
                    step="0.01"
                    value={cashReceived}
                    onChange={(e) => {
                      setCashReceived(e.target.value)
                      setError('')
                    }}
                    placeholder="0.00"
                    className="pl-14 h-20 bg-slate-950 border-3 border-colibri-gold text-white text-5xl font-black text-center placeholder:text-slate-600 focus:border-colibri-gold focus:ring-4 focus:ring-colibri-gold/30 shadow-2xl"
                    autoFocus
                  />
                </div>
                {/* Vista previa del monto */}
                {cashReceived && parseFloat(cashReceived) > 0 && (
                  <div className="bg-slate-950/80 rounded-lg p-3 text-center border border-colibri-green/30">
                    <span className="text-3xl font-black text-colibri-gold">
                      ${parseFloat(cashReceived).toFixed(2)}
                    </span>
                  </div>
                )}
                {error && (
                  <div className="flex items-center gap-2 text-red-400 text-sm">
                    <AlertCircle className="h-4 w-4" />
                    {error}
                  </div>
                )}
              </div>

              {/* Cambio */}
              {cashReceived && parseFloat(cashReceived) >= totalAmount && (
                <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-4 animate-in fade-in slide-in-from-top-2 duration-300">
                  <div className="flex items-center justify-between">
                    <span className="text-green-400 font-medium">Cambio:</span>
                    <span className="text-3xl font-bold text-green-400">
                      ${changeAmount.toFixed(2)}
                    </span>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Botones */}
        <div className="flex gap-3">
          <Button
            variant="outline"
            onClick={onClose}
            className="flex-1 border-colibri-green text-colibri-green hover:bg-colibri-green/10"
          >
            Cancelar
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={!isPaid && paymentMethod === 'efectivo' && (!cashReceived || parseFloat(cashReceived) < totalAmount)}
            className={`flex-1 text-white ${
              isPaid || paymentMethod === 'tarjeta'
                ? 'bg-colibri-wine hover:bg-colibri-wine/90'
                : 'bg-colibri-green hover:bg-colibri-green/90'
            } disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            {isPaid ? (
              <>
                <CheckCircle className="h-4 w-4 mr-2" />
                Confirmar Entrega
              </>
            ) : paymentMethod === 'tarjeta' ? (
              <>
                <CreditCard className="h-4 w-4 mr-2" />
                Confirmar Pago
              </>
            ) : (
              <>
                <DollarSign className="h-4 w-4 mr-2" />
                Cobrar ${totalAmount.toFixed(2)}
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
