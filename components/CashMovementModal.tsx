'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { DollarSign, TrendingUp, TrendingDown, AlertCircle } from 'lucide-react'

interface CashMovementModalProps {
  isOpen: boolean
  onClose: () => void
  shiftId: number
  type: 'cash_in' | 'cash_out'
  onSuccess: () => void
}

export function CashMovementModal({ isOpen, onClose, shiftId, type, onSuccess }: CashMovementModalProps) {
  const [amount, setAmount] = useState('')
  const [notes, setNotes] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const isCashIn = type === 'cash_in'

  const handleSubmit = async () => {
    const parsedAmount = parseFloat(amount)
    
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      setError('Ingresa un monto válido mayor a 0')
      return
    }

    if (!notes.trim()) {
      setError('Debes agregar una descripción')
      return
    }

    try {
      setLoading(true)
      const response = await fetch('/api/cash-transactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          shift_id: shiftId,
          transaction_type: type,
          amount: parsedAmount,
          payment_method: 'efectivo',
          notes: notes
        })
      })

      const data = await response.json()
      
      if (data.success) {
        onSuccess()
        onClose()
        setAmount('')
        setNotes('')
        setError('')
      } else {
        setError(data.error || 'Error al registrar movimiento')
      }
    } catch (error: any) {
      setError(error.message || 'Error al registrar movimiento')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md bg-slate-900/95 backdrop-blur-2xl border-colibri-green/30 shadow-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl text-white">
            {isCashIn ? (
              <>
                <TrendingUp className="h-6 w-6 text-green-400" />
                Entrada de Efectivo
              </>
            ) : (
              <>
                <TrendingDown className="h-6 w-6 text-red-400" />
                Salida de Efectivo
              </>
            )}
          </DialogTitle>
          <DialogDescription className="text-slate-400">
            Registra {isCashIn ? 'una entrada' : 'una salida'} de efectivo en caja
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="bg-slate-950/80 border border-colibri-green/30 rounded-lg p-4">
            <Badge className={isCashIn ? 'bg-green-500/20 text-green-400 border-green-500/30' : 'bg-red-500/20 text-red-400 border-red-500/30'}>
              {isCashIn ? 'Ingreso' : 'Egreso'}
            </Badge>
            <p className="text-sm text-slate-400 mt-2">
              {isCashIn 
                ? 'El efectivo se sumará al total esperado en caja' 
                : 'El efectivo se restará del total esperado en caja'
              }
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="amount" className="text-white font-semibold">
              Monto
            </Label>
            <div className="relative">
              <DollarSign className="absolute left-4 top-1/2 transform -translate-y-1/2 h-6 w-6 text-colibri-gold" />
              <Input
                id="amount"
                type="number"
                step="0.01"
                value={amount}
                onChange={(e) => {
                  setAmount(e.target.value)
                  setError('')
                }}
                placeholder="0.00"
                className="h-16 pl-14 bg-slate-800/90 border-2 border-colibri-wine/50 focus:border-colibri-gold text-white text-3xl font-black placeholder:text-slate-600"
                autoFocus
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes" className="text-white font-semibold">
              Descripción / Motivo
            </Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => {
                setNotes(e.target.value)
                setError('')
              }}
              placeholder={isCashIn ? 'Ej: Préstamo, aporte de capital, etc.' : 'Ej: Compra de insumos, pago a proveedor, etc.'}
              className="bg-slate-800/90 border-2 border-colibri-wine/50 focus:border-colibri-gold text-white placeholder:text-slate-600 resize-none"
              rows={3}
            />
          </div>

          {error && (
            <div className="flex items-center gap-2 text-red-400 text-sm bg-red-500/10 border border-red-500/30 rounded-lg p-3">
              <AlertCircle className="h-4 w-4 flex-shrink-0" />
              {error}
            </div>
          )}
        </div>

        <div className="flex gap-3">
          <Button
            variant="outline"
            onClick={onClose}
            className="flex-1 border-colibri-wine/50 text-white hover:bg-slate-800/50"
            disabled={loading}
          >
            Cancelar
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={loading || !amount || !notes}
            className={`flex-1 ${
              isCashIn
                ? 'bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700'
                : 'bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700'
            } disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            {loading ? 'Registrando...' : `Registrar ${isCashIn ? 'Entrada' : 'Salida'}`}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
