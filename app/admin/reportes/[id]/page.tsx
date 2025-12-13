'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  DollarSign,
  Clock,
  CreditCard,
  TrendingUp,
  TrendingDown,
  ArrowLeft,
  Printer,
  Download,
  Package
} from 'lucide-react'

export default function ShiftDetailPage() {
  const params = useParams()
  const router = useRouter()
  const shiftId = params.id as string

  const [shift, setShift] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadShiftDetails()
  }, [shiftId])

  const loadShiftDetails = async () => {
    try {
      const response = await fetch(`/api/shifts/${shiftId}`)
      const data = await response.json()
      if (data.success) {
        setShift(data.shift)
      }
    } catch (error) {
      console.error('Error loading shift:', error)
    } finally {
      setLoading(false)
    }
  }

  const printReport = () => {
    window.print()
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-950 to-slate-950 flex items-center justify-center">
        <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-purple-500"></div>
      </div>
    )
  }

  if (!shift) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-950 to-slate-950 flex items-center justify-center">
        <Card className="max-w-md bg-slate-900/30 border-purple-700/30">
          <CardContent className="p-8 text-center">
            <p className="text-white">Turno no encontrado</p>
            <Button onClick={() => router.push('/admin/reportes')} className="mt-4">
              Volver a Reportes
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  const expectedCash = parseFloat(shift.opening_cash || 0) + 
                      parseFloat(shift.cash_sales || 0) + 
                      parseFloat(shift.cash_in || 0) - 
                      parseFloat(shift.cash_out || 0)
  
  const difference = parseFloat(shift.cash_difference || 0)

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-950 to-slate-950 p-6">
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between print:hidden">
          <Button
            variant="outline"
            onClick={() => router.push('/admin/reportes')}
            className="border-purple-600 text-purple-400"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Volver
          </Button>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={printReport}
              className="border-purple-600 text-purple-400"
            >
              <Printer className="h-4 w-4 mr-2" />
              Imprimir
            </Button>
          </div>
        </div>

        {/* Shift Header */}
        <Card className="bg-gradient-to-r from-purple-900/50 to-slate-900/50 border-purple-700/50">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-3xl text-white flex items-center gap-3">
                  <Clock className="h-8 w-8 text-purple-400" />
                  Reporte de Turno #{shift.id}
                </CardTitle>
                <p className="text-purple-300 mt-2">
                  {shift.user_name} - Turno {shift.shift_type}
                </p>
              </div>
              <Badge className={shift.status === 'closed' ? 'bg-red-600' : 'bg-green-600'}>
                {shift.status === 'closed' ? 'Cerrado' : 'Abierto'}
              </Badge>
            </div>
          </CardHeader>
        </Card>

        {/* Dates */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card className="bg-slate-900/30 border-purple-700/30">
            <CardContent className="p-4">
              <p className="text-gray-400 text-sm mb-1">Apertura</p>
              <p className="text-white text-xl font-bold">
                {new Date(shift.opened_at).toLocaleString('es-MX')}
              </p>
            </CardContent>
          </Card>
          {shift.closed_at && (
            <Card className="bg-slate-900/30 border-purple-700/30">
              <CardContent className="p-4">
                <p className="text-gray-400 text-sm mb-1">Cierre</p>
                <p className="text-white text-xl font-bold">
                  {new Date(shift.closed_at).toLocaleString('es-MX')}
                </p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Statistics */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card className="bg-gradient-to-br from-green-900/30 to-slate-900/30 border-green-700/30">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-gray-300 text-sm">Total Ventas</span>
                <DollarSign className="h-5 w-5 text-green-400" />
              </div>
              <p className="text-2xl font-bold text-green-400">
                ${parseFloat(shift.total_sales || 0).toFixed(2)}
              </p>
              <p className="text-xs text-gray-400 mt-1">{shift.total_orders || 0} pedidos</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-blue-900/30 to-slate-900/30 border-blue-700/30">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-gray-300 text-sm">Efectivo</span>
                <DollarSign className="h-5 w-5 text-blue-400" />
              </div>
              <p className="text-2xl font-bold text-blue-400">
                ${parseFloat(shift.cash_sales || 0).toFixed(2)}
              </p>
              <p className="text-xs text-gray-400 mt-1">{shift.cash_orders || 0} transacciones</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-purple-900/30 to-slate-900/30 border-purple-700/30">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-gray-300 text-sm">Tarjeta</span>
                <CreditCard className="h-5 w-5 text-purple-400" />
              </div>
              <p className="text-2xl font-bold text-purple-400">
                ${parseFloat(shift.card_sales || 0).toFixed(2)}
              </p>
              <p className="text-xs text-gray-400 mt-1">{shift.card_orders || 0} transacciones</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-orange-900/30 to-slate-900/30 border-orange-700/30">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-gray-300 text-sm">Ticket Promedio</span>
                <Package className="h-5 w-5 text-orange-400" />
              </div>
              <p className="text-2xl font-bold text-orange-400">
                ${(parseFloat(shift.total_sales || 0) / Math.max(1, shift.total_orders || 1)).toFixed(2)}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Cash Reconciliation */}
        <Card className="bg-slate-900/30 border-purple-700/30">
          <CardHeader>
            <CardTitle className="text-white">Arqueo de Caja</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between items-center p-3 bg-slate-800/50 rounded">
              <span className="text-gray-300">Efectivo Inicial:</span>
              <span className="text-white font-bold">${parseFloat(shift.opening_cash || 0).toFixed(2)}</span>
            </div>
            
            <div className="flex justify-between items-center p-3 bg-green-900/20 rounded border border-green-700/30">
              <span className="text-gray-300">+ Ventas en Efectivo:</span>
              <span className="text-green-400 font-bold">${parseFloat(shift.cash_sales || 0).toFixed(2)}</span>
            </div>

            {shift.cash_in > 0 && (
              <div className="flex justify-between items-center p-3 bg-cyan-900/20 rounded border border-cyan-700/30">
                <span className="text-gray-300">+ Entradas:</span>
                <span className="text-cyan-400 font-bold">${parseFloat(shift.cash_in || 0).toFixed(2)}</span>
              </div>
            )}

            {shift.cash_out > 0 && (
              <div className="flex justify-between items-center p-3 bg-red-900/20 rounded border border-red-700/30">
                <span className="text-gray-300">- Salidas:</span>
                <span className="text-red-400 font-bold">${parseFloat(shift.cash_out || 0).toFixed(2)}</span>
              </div>
            )}

            <div className="flex justify-between items-center p-4 bg-purple-900/30 rounded border border-purple-700">
              <span className="text-gray-300 font-semibold text-lg">Efectivo Esperado:</span>
              <span className="text-2xl font-bold text-purple-400">${expectedCash.toFixed(2)}</span>
            </div>

            {shift.status === 'closed' && (
              <>
                <div className="flex justify-between items-center p-4 bg-slate-800/50 rounded">
                  <span className="text-gray-300 font-semibold text-lg">Efectivo Real:</span>
                  <span className="text-2xl font-bold text-white">
                    ${parseFloat(shift.closing_cash || 0).toFixed(2)}
                  </span>
                </div>

                <div className={`flex justify-between items-center p-4 rounded border-2 ${
                  Math.abs(difference) < 0.01 
                    ? 'bg-green-900/30 border-green-700' 
                    : difference > 0 
                      ? 'bg-cyan-900/30 border-cyan-700'
                      : 'bg-red-900/30 border-red-700'
                }`}>
                  <div className="flex items-center gap-2">
                    {difference >= 0 ? (
                      <TrendingUp className={`h-6 w-6 ${Math.abs(difference) < 0.01 ? 'text-green-400' : 'text-cyan-400'}`} />
                    ) : (
                      <TrendingDown className="h-6 w-6 text-red-400" />
                    )}
                    <span className="text-white font-semibold text-lg">
                      {Math.abs(difference) < 0.01 ? 'Caja Cuadrada ✅' : difference > 0 ? 'Sobrante' : 'Faltante'}
                    </span>
                  </div>
                  <span className={`text-3xl font-bold ${
                    Math.abs(difference) < 0.01 ? 'text-green-400' : difference > 0 ? 'text-cyan-400' : 'text-red-400'
                  }`}>
                    ${Math.abs(difference).toFixed(2)}
                  </span>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Transactions */}
        {shift.transactions && shift.transactions.length > 0 && (
          <Card className="bg-slate-900/30 border-purple-700/30">
            <CardHeader>
              <CardTitle className="text-white">Movimientos de Efectivo</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {shift.transactions.map((tx: any) => (
                  <div
                    key={tx.id}
                    className={`flex items-center justify-between p-3 rounded border ${
                      tx.transaction_type === 'cash_in'
                        ? 'bg-cyan-900/20 border-cyan-700/30'
                        : 'bg-red-900/20 border-red-700/30'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      {tx.transaction_type === 'cash_in' ? (
                        <TrendingUp className="h-5 w-5 text-cyan-400" />
                      ) : (
                        <TrendingDown className="h-5 w-5 text-red-400" />
                      )}
                      <div>
                        <p className="text-white font-medium">
                          {tx.transaction_type === 'cash_in' ? 'Entrada' : 'Salida'}
                        </p>
                        <p className="text-sm text-gray-400">{tx.notes}</p>
                        <p className="text-xs text-gray-500">
                          {new Date(tx.created_at).toLocaleString('es-MX')}
                        </p>
                      </div>
                    </div>
                    <span className={`text-xl font-bold ${
                      tx.transaction_type === 'cash_in' ? 'text-cyan-400' : 'text-red-400'
                    }`}>
                      {tx.transaction_type === 'cash_in' ? '+' : '-'}${parseFloat(tx.amount || 0).toFixed(2)}
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {shift.notes && (
          <Card className="bg-slate-900/30 border-purple-700/30">
            <CardHeader>
              <CardTitle className="text-white">Notas de Cierre</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-300">{shift.notes}</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
