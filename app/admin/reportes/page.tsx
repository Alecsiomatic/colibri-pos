'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  Calendar,
  Download,
  Clock,
  CreditCard,
  Package,
  BarChart3,
  FileText,
  ArrowLeft,
  AlertCircle
} from 'lucide-react'

export default function ReportesPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('turnos')
  
  // Filtros
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  
  // Data
  const [shifts, setShifts] = useState<any[]>([])
  const [shiftTotals, setShiftTotals] = useState<any>(null)
  const [salesData, setSalesData] = useState<any[]>([])
  const [topProducts, setTopProducts] = useState<any[]>([])

  useEffect(() => {
    // Set default dates (last 30 days)
    const today = new Date()
    const thirtyDaysAgo = new Date(today)
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
    
    setEndDate(today.toISOString().split('T')[0])
    setStartDate(thirtyDaysAgo.toISOString().split('T')[0])
  }, [])

  useEffect(() => {
    if (startDate && endDate) {
      loadReports()
    }
  }, [startDate, endDate, activeTab])

  const loadReports = async () => {
    setLoading(true)
    try {
      if (activeTab === 'turnos') {
        await loadShiftReports()
      } else if (activeTab === 'ventas') {
        await loadSalesReports()
      }
    } catch (error) {
      console.error('Error loading reports:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadShiftReports = async () => {
    try {
      const response = await fetch(
        `/api/reports/shifts?start_date=${startDate}&end_date=${endDate}&status=closed`
      )
      const data = await response.json()
      if (data.success) {
        setShifts(data.shifts || [])
        setShiftTotals(data.totals || {})
      }
    } catch (error) {
      console.error('Error loading shift reports:', error)
    }
  }

  const loadSalesReports = async () => {
    try {
      const response = await fetch(
        `/api/reports/sales?start_date=${startDate}&end_date=${endDate}&group_by=day`
      )
      const data = await response.json()
      if (data.success) {
        setSalesData(data.sales_by_period || [])
        setTopProducts(data.top_products || [])
      }
    } catch (error) {
      console.error('Error loading sales reports:', error)
    }
  }

  const exportToCSV = (data: any[], filename: string) => {
    if (data.length === 0) return
    
    const headers = Object.keys(data[0])
    const csv = [
      headers.join(','),
      ...data.map(row => headers.map(h => row[h]).join(','))
    ].join('\n')
    
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${filename}_${new Date().toISOString().split('T')[0]}.csv`
    a.click()
  }

  if (loading && shifts.length === 0 && salesData.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-950 to-slate-950 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-purple-500 mx-auto mb-4"></div>
          <p className="text-purple-300">Cargando reportes...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-950 to-slate-950">
      {/* Header */}
      <header className="bg-gradient-to-r from-purple-900/50 to-slate-900/50 backdrop-blur-xl border-b border-purple-700/30 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => router.push('/caja')}
                className="border-purple-600 text-purple-400"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Volver
              </Button>
              <div>
                <h1 className="text-2xl font-bold text-white">📊 Reportes</h1>
                <p className="text-sm text-purple-300">Análisis y estadísticas del negocio</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto p-4 space-y-6">
        {/* Filtros de Fecha */}
        <Card className="bg-slate-900/30 border-purple-700/30">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Calendar className="h-5 w-5 text-purple-400" />
              Filtros
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label className="text-gray-300">Fecha Inicio</Label>
                <Input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="bg-slate-800 border-purple-700 text-white mt-1"
                />
              </div>
              <div>
                <Label className="text-gray-300">Fecha Fin</Label>
                <Input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="bg-slate-800 border-purple-700 text-white mt-1"
                />
              </div>
              <div className="flex items-end">
                <Button
                  onClick={loadReports}
                  className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
                >
                  <BarChart3 className="h-4 w-4 mr-2" />
                  Generar Reporte
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList className="grid w-full grid-cols-2 bg-slate-900/50 border border-purple-700/30">
            <TabsTrigger value="turnos" className="data-[state=active]:bg-purple-600">
              <Clock className="h-4 w-4 mr-2" />
              Turnos
            </TabsTrigger>
            <TabsTrigger value="ventas" className="data-[state=active]:bg-purple-600">
              <TrendingUp className="h-4 w-4 mr-2" />
              Ventas
            </TabsTrigger>
          </TabsList>

          {/* Tab: Turnos */}
          <TabsContent value="turnos" className="space-y-4">
            {shiftTotals && (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card className="bg-gradient-to-br from-purple-900/30 to-slate-900/30 border-purple-700/30">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm text-gray-300 flex items-center gap-2">
                      <Clock className="h-4 w-4 text-purple-400" />
                      Total Turnos
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-3xl font-bold text-purple-400">
                      {shiftTotals.total_shifts}
                    </p>
                  </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-green-900/30 to-slate-900/30 border-green-700/30">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm text-gray-300 flex items-center gap-2">
                      <DollarSign className="h-4 w-4 text-green-400" />
                      Ventas Totales
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-3xl font-bold text-green-400">
                      ${parseFloat(shiftTotals.total_sales || 0).toFixed(2)}
                    </p>
                  </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-blue-900/30 to-slate-900/30 border-blue-700/30">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm text-gray-300 flex items-center gap-2">
                      <Package className="h-4 w-4 text-blue-400" />
                      Total Pedidos
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-3xl font-bold text-blue-400">
                      {shiftTotals.total_orders}
                    </p>
                  </CardContent>
                </Card>

                <Card className={`bg-gradient-to-br ${
                  shiftTotals.total_differences >= 0 
                    ? 'from-cyan-900/30 border-cyan-700/30' 
                    : 'from-red-900/30 border-red-700/30'
                }`}>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm text-gray-300 flex items-center gap-2">
                      {shiftTotals.total_differences >= 0 ? (
                        <TrendingUp className="h-4 w-4 text-cyan-400" />
                      ) : (
                        <TrendingDown className="h-4 w-4 text-red-400" />
                      )}
                      Diferencias
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className={`text-3xl font-bold ${
                      shiftTotals.total_differences >= 0 ? 'text-cyan-400' : 'text-red-400'
                    }`}>
                      ${parseFloat(shiftTotals.total_differences || 0).toFixed(2)}
                    </p>
                  </CardContent>
                </Card>
              </div>
            )}

            <Card className="bg-slate-900/30 border-purple-700/30">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-white">Historial de Turnos</CardTitle>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => exportToCSV(shifts, 'turnos')}
                  className="border-purple-600 text-purple-400"
                  disabled={shifts.length === 0}
                >
                  <Download className="h-4 w-4 mr-2" />
                  Exportar CSV
                </Button>
              </CardHeader>
              <CardContent>
                {shifts.length === 0 ? (
                  <div className="text-center py-12">
                    <FileText className="h-16 w-16 mx-auto mb-4 text-gray-600" />
                    <p className="text-gray-400">No hay turnos en este período</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-purple-900/20 border-b border-purple-700/30">
                        <tr>
                          <th className="text-left p-3 text-gray-300 font-medium">Turno</th>
                          <th className="text-left p-3 text-gray-300 font-medium">Cajero</th>
                          <th className="text-left p-3 text-gray-300 font-medium">Fecha</th>
                          <th className="text-right p-3 text-gray-300 font-medium">Ventas</th>
                          <th className="text-right p-3 text-gray-300 font-medium">Efectivo</th>
                          <th className="text-right p-3 text-gray-300 font-medium">Tarjeta</th>
                          <th className="text-right p-3 text-gray-300 font-medium">Diferencia</th>
                          <th className="text-center p-3 text-gray-300 font-medium">Acciones</th>
                        </tr>
                      </thead>
                      <tbody>
                        {shifts.map((shift) => (
                          <tr key={shift.id} className="border-b border-purple-700/20 hover:bg-purple-900/10">
                            <td className="p-3">
                              <Badge variant="outline" className="border-purple-500/30 text-purple-400">
                                {shift.shift_type}
                              </Badge>
                            </td>
                            <td className="p-3 text-gray-300">{shift.user_name}</td>
                            <td className="p-3 text-gray-400 text-sm">
                              {new Date(shift.opened_at).toLocaleDateString('es-MX')}
                            </td>
                            <td className="p-3 text-right text-green-400 font-bold">
                              ${parseFloat(shift.total_sales || 0).toFixed(2)}
                            </td>
                            <td className="p-3 text-right text-gray-300">
                              ${parseFloat(shift.cash_sales || 0).toFixed(2)}
                            </td>
                            <td className="p-3 text-right text-gray-300">
                              ${parseFloat(shift.card_sales || 0).toFixed(2)}
                            </td>
                            <td className={`p-3 text-right font-bold ${
                              parseFloat(shift.cash_difference || 0) >= 0 
                                ? 'text-cyan-400' 
                                : 'text-red-400'
                            }`}>
                              ${parseFloat(shift.cash_difference || 0).toFixed(2)}
                            </td>
                            <td className="p-3 text-center">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => router.push(`/admin/reportes/${shift.id}`)}
                                className="text-purple-400 hover:text-purple-300"
                              >
                                <FileText className="h-4 w-4" />
                              </Button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tab: Ventas */}
          <TabsContent value="ventas" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <Card className="bg-slate-900/30 border-purple-700/30">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-purple-400" />
                    Productos Más Vendidos
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {topProducts.length === 0 ? (
                    <div className="text-center py-8">
                      <Package className="h-12 w-12 mx-auto mb-4 text-gray-600" />
                      <p className="text-gray-400">No hay datos de productos</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {topProducts.map((product, index) => (
                        <div
                          key={product.id}
                          className="flex items-center justify-between p-3 bg-slate-800/50 rounded-lg"
                        >
                          <div className="flex items-center gap-3">
                            <Badge className="bg-purple-600">#{index + 1}</Badge>
                            <div>
                              <p className="text-white font-medium">{product.name}</p>
                              <p className="text-xs text-gray-400">{product.category_name}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-green-400 font-bold">
                              ${parseFloat(product.total_revenue || 0).toFixed(2)}
                            </p>
                            <p className="text-xs text-gray-400">
                              {product.total_quantity} unidades
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card className="bg-slate-900/30 border-purple-700/30">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <BarChart3 className="h-5 w-5 text-purple-400" />
                    Resumen de Ventas
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {salesData.length === 0 ? (
                    <div className="text-center py-8">
                      <AlertCircle className="h-12 w-12 mx-auto mb-4 text-gray-600" />
                      <p className="text-gray-400">No hay datos de ventas</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="bg-green-900/20 p-4 rounded-lg border border-green-700/30">
                          <p className="text-sm text-gray-400 mb-1">Efectivo</p>
                          <p className="text-xl font-bold text-green-400">
                            ${salesData.reduce((sum, s) => sum + parseFloat(s.cash_sales || 0), 0).toFixed(2)}
                          </p>
                        </div>
                        <div className="bg-blue-900/20 p-4 rounded-lg border border-blue-700/30">
                          <p className="text-sm text-gray-400 mb-1">Tarjeta</p>
                          <p className="text-xl font-bold text-blue-400">
                            ${salesData.reduce((sum, s) => sum + parseFloat(s.card_sales || 0), 0).toFixed(2)}
                          </p>
                        </div>
                      </div>
                      
                      <div className="border-t border-purple-700/30 pt-4">
                        <p className="text-sm text-gray-400 mb-2">Por Canal</p>
                        <div className="space-y-2">
                          <div className="flex justify-between items-center">
                            <span className="text-gray-300">🖥️ Kiosko:</span>
                            <span className="text-purple-400 font-bold">
                              ${salesData.reduce((sum, s) => sum + parseFloat(s.kiosk_sales || 0), 0).toFixed(2)}
                            </span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-gray-300">🌐 Online:</span>
                            <span className="text-cyan-400 font-bold">
                              ${salesData.reduce((sum, s) => sum + parseFloat(s.online_sales || 0), 0).toFixed(2)}
                            </span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-gray-300">🍽️ Comedor:</span>
                            <span className="text-pink-400 font-bold">
                              ${salesData.reduce((sum, s) => sum + parseFloat(s.dine_in_sales || 0), 0).toFixed(2)}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
