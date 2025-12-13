'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { useToast } from '@/hooks/use-notifications'
import {
  DollarSign,
  Clock,
  TrendingUp,
  CreditCard,
  Package,
  AlertTriangle,
  CheckCircle,
  Printer
} from 'lucide-react'

export default function ShiftClosurePage() {
  const params = useParams()
  const router = useRouter()
  const toast = useToast()
  const shiftId = params.id as string

  const [shift, setShift] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [closingCash, setClosingCash] = useState('')
  const [notes, setNotes] = useState('')
  const [processing, setProcessing] = useState(false)

  useEffect(() => {
    loadShiftDetails()
  }, [shiftId])

  const loadShiftDetails = async () => {
    try {
      const response = await fetch(`/api/shifts/${shiftId}`)
      const data = await response.json()
      
      if (data.success) {
        setShift(data.shift)
      } else {
        toast.error('Error', 'No se encontró el turno')
        router.push('/caja')
      }
    } catch (error) {
      console.error('Error loading shift:', error)
      toast.error('Error', 'No se pudo cargar la información del turno')
    } finally {
      setLoading(false)
    }
  }

  const calculateExpectedCash = () => {
    if (!shift) return 0
    const cashSales = parseFloat(shift.cash_sales || 0)
    const opening = parseFloat(shift.opening_cash || 0)
    const cashIn = parseFloat(shift.cash_in || 0)
    const cashOut = parseFloat(shift.cash_out || 0)
    return opening + cashSales + cashIn - cashOut
  }

  const calculateDifference = () => {
    const expected = calculateExpectedCash()
    const actual = parseFloat(closingCash) || 0
    return actual - expected
  }

  const handleCloseShift = async () => {
    if (!closingCash) {
      toast.error('Error', 'Debes ingresar el efectivo de cierre')
      return
    }

    const difference = calculateDifference()
    const confirmMessage = difference !== 0
      ? `Hay una diferencia de $${Math.abs(difference).toFixed(2)} (${difference > 0 ? 'Sobrante' : 'Faltante'}). ¿Deseas continuar?`
      : '¿Confirmas el cierre de turno?'

    if (!confirm(confirmMessage)) return

    try {
      setProcessing(true)
      
      const response = await fetch(`/api/shifts/${shiftId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          closing_cash: parseFloat(closingCash),
          notes: notes
        })
      })

      const data = await response.json()
      
      if (data.success) {
        toast.success('¡Turno Cerrado!', 'El reporte ha sido generado')
        
        // Opcional: Imprimir reporte
        if (confirm('¿Deseas imprimir el reporte de cierre?')) {
          await printShiftReport()
        }
        
        router.push('/caja')
      }
    } catch (error: any) {
      toast.error('Error', error.message || 'No se pudo cerrar el turno')
    } finally {
      setProcessing(false)
    }
  }

  const printShiftReport = async () => {
    try {
      const response = await fetch('/api/print/shift-report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          shift: {
            ...shift,
            closing_cash: parseFloat(closingCash),
            notes: notes,
            difference: calculateDifference()
          }
        })
      })

      if (response.ok) {
        toast.success('Impreso', 'Reporte enviado a impresora')
      }
    } catch (error) {
      console.error('Error printing:', error)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-colibri-gold"></div>
      </div>
    )
  }

  if (!shift) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center">
        <Card className="max-w-md bg-slate-900/95 backdrop-blur-2xl border-colibri-wine/30">
          <CardContent className="p-8 text-center">
            <AlertTriangle className="h-16 w-16 text-yellow-400 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-white mb-2">Turno No Encontrado</h2>
            <Button onClick={() => router.push('/caja')} className="mt-4">
              Volver a Caja
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  const difference = calculateDifference()
  const expected = calculateExpectedCash()

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <Card className="bg-slate-900/95 backdrop-blur-2xl border-colibri-green/30 shadow-2xl">
          <CardHeader>
            <CardTitle className="text-3xl text-white flex items-center gap-3">
              <Clock className="h-8 w-8 text-colibri-gold" />
              Cierre de Turno
            </CardTitle>
            <p className="text-colibri-gold">
              Turno {shift.shift_type} - {shift.user_name}
            </p>
          </CardHeader>
        </Card>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Statistics Cards */}
          <Card className="bg-slate-900/80 backdrop-blur-xl border-green-500/30">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-slate-300">Ventas Totales</span>
                <DollarSign className="h-5 w-5 text-green-400" />
              </div>
              <p className="text-3xl font-bold text-green-400">
                ${parseFloat(shift.total_sales || 0).toFixed(2)}
              </p>
              <p className="text-sm text-slate-400 mt-1">
                {shift.transactions_count || 0} transacciones
              </p>
            </CardContent>
          </Card>

          <Card className="bg-slate-900/80 backdrop-blur-xl border-colibri-gold/30">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-slate-300">Ventas Efectivo</span>
                <DollarSign className="h-5 w-5 text-colibri-gold" />
              </div>
              <p className="text-3xl font-bold text-colibri-gold">
                ${parseFloat(shift.cash_sales || 0).toFixed(2)}
              </p>
            </CardContent>
          </Card>

          <Card className="bg-slate-900/80 backdrop-blur-xl border-blue-500/30">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-slate-300">Ventas Tarjeta</span>
                <CreditCard className="h-5 w-5 text-blue-400" />
              </div>
              <p className="text-3xl font-bold text-blue-400">
                ${parseFloat(shift.card_sales || 0).toFixed(2)}
              </p>
            </CardContent>
          </Card>

          <Card className="bg-slate-900/80 backdrop-blur-xl border-colibri-wine/30">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-slate-300">Productos Vendidos</span>
                <Package className="h-5 w-5 text-colibri-wine" />
              </div>
              <p className="text-3xl font-bold text-colibri-wine">
                {shift.items_sold || 0}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Cash Reconciliation */}
        <Card className="bg-slate-900/95 backdrop-blur-2xl border-colibri-green/30 shadow-2xl">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <DollarSign className="h-6 w-6 text-colibri-gold" />
              Arqueo de Caja
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Opening Cash */}
            <div className="flex items-center justify-between p-3 bg-slate-950/80 border border-colibri-green/20 rounded">
              <span className="text-slate-300">Efectivo Inicial:</span>
              <span className="text-xl font-bold text-white">
                ${parseFloat(shift.opening_cash || 0).toFixed(2)}
              </span>
            </div>

            {/* Cash Sales */}
            <div className="flex items-center justify-between p-3 bg-slate-950/80 border border-green-500/20 rounded">
              <span className="text-slate-300">+ Ventas en Efectivo:</span>
              <span className="text-xl font-bold text-green-400">
                ${parseFloat(shift.cash_sales || 0).toFixed(2)}
              </span>
            </div>

            {/* Cash In */}
            {shift.cash_in > 0 && (
              <div className="flex items-center justify-between p-3 bg-green-900/20 rounded border border-green-500/30">
                <span className="text-slate-300">+ Entradas de Efectivo:</span>
                <span className="text-xl font-bold text-green-400">
                  ${parseFloat(shift.cash_in || 0).toFixed(2)}
                </span>
              </div>
            )}

            {/* Cash Out */}
            {shift.cash_out > 0 && (
              <div className="flex items-center justify-between p-3 bg-red-900/20 rounded border border-red-500/30">
                <span className="text-slate-300">- Salidas de Efectivo:</span>
                <span className="text-xl font-bold text-red-400">
                  ${parseFloat(shift.cash_out || 0).toFixed(2)}
                </span>
              </div>
            )}

            {/* Expected */}
            <div className="flex items-center justify-between p-4 bg-colibri-gold/10 rounded border-2 border-colibri-gold/50">
              <span className="text-white font-semibold">Efectivo Esperado:</span>
              <span className="text-2xl font-bold text-colibri-gold">
                ${expected.toFixed(2)}
              </span>
            </div>

            {/* Closing Cash Input */}
            <div>
              <Label className="text-white font-semibold mb-2 block">Efectivo Real en Caja *</Label>
              <Input
                type="number"
                step="0.01"
                value={closingCash}
                onChange={(e) => setClosingCash(e.target.value)}
                placeholder="0.00"
                className="h-20 bg-slate-950 border-2 border-colibri-gold text-white text-4xl font-black text-center placeholder:text-slate-600 focus:border-colibri-wine focus:ring-2 focus:ring-colibri-wine/30"
              />
            </div>

            {/* Difference Display */}
            {closingCash && (
              <div className={`flex items-center justify-between p-4 rounded border-2 ${
                Math.abs(difference) < 0.01 
                  ? 'bg-green-900/30 border-green-700' 
                  : difference > 0 
                    ? 'bg-blue-900/30 border-blue-700'
                    : 'bg-red-900/30 border-red-700'
              }`}>
                <div className="flex items-center gap-2">
                  {Math.abs(difference) < 0.01 ? (
                    <CheckCircle className="h-6 w-6 text-green-400" />
                  ) : (
                    <AlertTriangle className={`h-6 w-6 ${difference > 0 ? 'text-blue-400' : 'text-red-400'}`} />
                  )}
                  <span className="text-gray-300 font-semibold">
                    {Math.abs(difference) < 0.01 
                      ? 'Caja Cuadrada ✅' 
                      : difference > 0 
                        ? 'Sobrante'
                        : 'Faltante'
                    }
                  </span>
                </div>
                <span className={`text-2xl font-bold ${
                  Math.abs(difference) < 0.01 
                    ? 'text-green-400' 
                    : difference > 0 
                      ? 'text-blue-400'
                      : 'text-red-400'
                }`}>
                  {difference > 0 ? '+' : ''}${difference.toFixed(2)}
                </span>
              </div>
            )}

            {/* Notes */}
            <div>
              <Label className="text-white font-semibold mb-2 block">Notas de Cierre (opcional)</Label>
              <Input
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Observaciones sobre el turno..."
                className="bg-slate-950 border-2 border-colibri-green/30 text-white placeholder:text-slate-600 focus:border-colibri-gold"
              />
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-4">
              <Button
                variant="outline"
                onClick={() => router.push('/caja')}
                className="flex-1 border-2 border-colibri-wine/50 text-white hover:bg-colibri-wine/20"
                disabled={processing}
              >
                Cancelar
              </Button>
              
              <Button
                onClick={handleCloseShift}
                disabled={!closingCash || processing}
                className="flex-1 bg-gradient-to-r from-colibri-wine to-colibri-green hover:from-colibri-green hover:to-colibri-wine text-white py-6 text-lg font-bold shadow-lg">
              >
                {processing ? 'Cerrando...' : 'Cerrar Turno'}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Transactions Summary */}
        {shift.transactions && shift.transactions.length > 0 && (
          <Card className="bg-slate-900/80 backdrop-blur-xl border-colibri-green/30">
            <CardHeader>
              <CardTitle className="text-white">Últimas Transacciones</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {shift.transactions.slice(0, 10).map((tx: any) => (
                  <div
                    key={tx.id}
                    className="flex items-center justify-between p-2 bg-slate-950/50 border border-colibri-green/20 rounded text-sm"
                  >
                    <div>
                      <p className="text-white font-medium">{tx.customer_name || 'Cliente'}</p>
                      <p className="text-slate-400 text-xs">
                        {new Date(tx.created_at).toLocaleTimeString()}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-colibri-gold font-bold">
                        ${parseFloat(tx.amount).toFixed(2)}
                      </p>
                      <Badge variant="secondary" className="text-xs">
                        {tx.payment_method}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
