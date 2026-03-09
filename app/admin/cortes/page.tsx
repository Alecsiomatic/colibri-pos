'use client'

import { useState, useEffect, useCallback } from 'react'
import AdminLayout from '@/components/admin/admin-layout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import {
  DollarSign, Clock, TrendingUp, CreditCard, AlertTriangle,
  CheckCircle, Calendar, Users, Receipt, Printer, FileText,
  ChevronLeft, ChevronRight, Search, Filter, ArrowUpDown
} from 'lucide-react'

function fmt(n: number): string {
  return `$${n.toFixed(2)}`
}

function fmtDate(d: string): string {
  if (!d) return '-'
  return new Date(d).toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' })
}

function fmtTime(d: string): string {
  if (!d) return '-'
  return new Date(d).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })
}

function fmtDateTime(d: string): string {
  if (!d) return '-'
  return `${fmtDate(d)} ${fmtTime(d)}`
}

export default function CortesPage() {
  const [activeTab, setActiveTab] = useState('historial')

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-white flex items-center gap-3">
            <Receipt className="h-8 w-8 text-colibri-gold" />
            Cortes de Caja
          </h1>
          <p className="text-colibri-beige mt-1">Historial de turnos, reportes Z, rendimiento y alertas</p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="bg-black/50 border border-colibri-gold/30">
            <TabsTrigger value="historial" className="data-[state=active]:bg-colibri-green/50 data-[state=active]:text-white">
              <Clock className="h-4 w-4 mr-2" />
              Historial
            </TabsTrigger>
            <TabsTrigger value="z-report" className="data-[state=active]:bg-colibri-green/50 data-[state=active]:text-white">
              <FileText className="h-4 w-4 mr-2" />
              Reporte Z
            </TabsTrigger>
            <TabsTrigger value="rendimiento" className="data-[state=active]:bg-colibri-green/50 data-[state=active]:text-white">
              <Users className="h-4 w-4 mr-2" />
              Rendimiento
            </TabsTrigger>
            <TabsTrigger value="alertas" className="data-[state=active]:bg-colibri-green/50 data-[state=active]:text-white">
              <AlertTriangle className="h-4 w-4 mr-2" />
              Alertas
            </TabsTrigger>
          </TabsList>

          <TabsContent value="historial">
            <ShiftHistoryTab />
          </TabsContent>
          <TabsContent value="z-report">
            <ZReportTab />
          </TabsContent>
          <TabsContent value="rendimiento">
            <StaffPerformanceTab />
          </TabsContent>
          <TabsContent value="alertas">
            <ShortageAlertsTab />
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  )
}

// ════════════════════════════════════════════════════════════
// TAB 1: Shift History
// ════════════════════════════════════════════════════════════
function ShiftHistoryTab() {
  const [shifts, setShifts] = useState<any[]>([])
  const [totals, setTotals] = useState<any>({})
  const [loading, setLoading] = useState(true)
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [selectedShift, setSelectedShift] = useState<any>(null)

  const fetchShifts = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (startDate) params.set('start_date', startDate)
      if (endDate) params.set('end_date', endDate)
      params.set('status', 'closed')

      const res = await fetch(`/api/reports/shifts?${params}`)
      const data = await res.json()
      if (data.success) {
        setShifts(data.shifts || [])
        setTotals(data.totals || {})
      }
    } catch (e) {
      console.error('Error fetching shifts:', e)
    } finally {
      setLoading(false)
    }
  }, [startDate, endDate])

  useEffect(() => { fetchShifts() }, [fetchShifts])

  return (
    <div className="space-y-6">
      {/* Filters */}
      <Card className="bg-black/50 border-colibri-gold/30">
        <CardContent className="p-4">
          <div className="flex flex-wrap gap-4 items-end">
            <div>
              <label className="text-sm text-colibri-beige block mb-1">Desde</label>
              <Input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="bg-slate-900 border-colibri-wine/50 text-white w-44"
              />
            </div>
            <div>
              <label className="text-sm text-colibri-beige block mb-1">Hasta</label>
              <Input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="bg-slate-900 border-colibri-wine/50 text-white w-44"
              />
            </div>
            <Button onClick={fetchShifts} className="bg-colibri-green hover:bg-colibri-green/80">
              <Search className="h-4 w-4 mr-2" />
              Buscar
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card className="bg-black/50 border-colibri-gold/30">
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-white">{totals.total_shifts || 0}</p>
            <p className="text-xs text-colibri-beige">Turnos</p>
          </CardContent>
        </Card>
        <Card className="bg-black/50 border-green-500/30">
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-green-400">{fmt(totals.total_sales || 0)}</p>
            <p className="text-xs text-colibri-beige">Ventas Totales</p>
          </CardContent>
        </Card>
        <Card className="bg-black/50 border-colibri-gold/30">
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-colibri-gold">{fmt(totals.total_cash_sales || 0)}</p>
            <p className="text-xs text-colibri-beige">Efectivo</p>
          </CardContent>
        </Card>
        <Card className="bg-black/50 border-blue-500/30">
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-blue-400">{fmt(totals.total_card_sales || 0)}</p>
            <p className="text-xs text-colibri-beige">Tarjeta</p>
          </CardContent>
        </Card>
        <Card className={`bg-black/50 ${(totals.total_differences || 0) < 0 ? 'border-red-500/30' : 'border-green-500/30'}`}>
          <CardContent className="p-4 text-center">
            <p className={`text-2xl font-bold ${(totals.total_differences || 0) < 0 ? 'text-red-400' : 'text-green-400'}`}>
              {fmt(totals.total_differences || 0)}
            </p>
            <p className="text-xs text-colibri-beige">Diferencias</p>
          </CardContent>
        </Card>
      </div>

      {/* Shifts Table */}
      <Card className="bg-black/50 border-colibri-gold/30">
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center p-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-colibri-gold"></div>
            </div>
          ) : shifts.length === 0 ? (
            <p className="text-center text-colibri-beige p-12">No hay turnos cerrados en este período</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-colibri-gold/20">
                    <th className="text-left p-3 text-colibri-gold">ID</th>
                    <th className="text-left p-3 text-colibri-gold">Cajero</th>
                    <th className="text-left p-3 text-colibri-gold">Turno</th>
                    <th className="text-left p-3 text-colibri-gold">Apertura</th>
                    <th className="text-left p-3 text-colibri-gold">Cierre</th>
                    <th className="text-right p-3 text-colibri-gold">Ventas</th>
                    <th className="text-right p-3 text-colibri-gold">Pedidos</th>
                    <th className="text-right p-3 text-colibri-gold">Diferencia</th>
                    <th className="text-center p-3 text-colibri-gold">Estado</th>
                  </tr>
                </thead>
                <tbody>
                  {shifts.map((shift: any) => {
                    const diff = parseFloat(shift.cash_difference || 0)
                    return (
                      <tr
                        key={shift.id}
                        onClick={() => setSelectedShift(selectedShift?.id === shift.id ? null : shift)}
                        className="border-b border-colibri-green/10 hover:bg-colibri-green/10 cursor-pointer transition-colors"
                      >
                        <td className="p-3 text-white">#{shift.id}</td>
                        <td className="p-3 text-white">{shift.user_name}</td>
                        <td className="p-3 text-colibri-beige capitalize">{shift.shift_type}</td>
                        <td className="p-3 text-colibri-beige">{fmtDateTime(shift.opened_at)}</td>
                        <td className="p-3 text-colibri-beige">{fmtDateTime(shift.closed_at)}</td>
                        <td className="p-3 text-right text-green-400 font-bold">{fmt(parseFloat(shift.total_sales || 0))}</td>
                        <td className="p-3 text-right text-white">{shift.order_count || shift.total_orders || 0}</td>
                        <td className={`p-3 text-right font-bold ${
                          Math.abs(diff) < 0.01 ? 'text-green-400' : diff > 0 ? 'text-blue-400' : 'text-red-400'
                        }`}>
                          {diff > 0 ? '+' : ''}{fmt(diff)}
                        </td>
                        <td className="p-3 text-center">
                          {Math.abs(diff) < 0.01 ? (
                            <Badge className="bg-green-500/20 text-green-400 border-green-500/30">Cuadrada</Badge>
                          ) : diff > 0 ? (
                            <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30">Sobrante</Badge>
                          ) : (
                            <Badge className="bg-red-500/20 text-red-400 border-red-500/30">Faltante</Badge>
                          )}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Shift Detail Popup */}
      {selectedShift && (
        <Card className="bg-slate-900/95 border-colibri-gold/50 shadow-2xl">
          <CardHeader>
            <CardTitle className="text-white flex items-center justify-between">
              <span>Detalle Turno #{selectedShift.id} — {selectedShift.user_name}</span>
              <Button variant="ghost" size="sm" onClick={() => setSelectedShift(null)} className="text-colibri-beige">✕</Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div className="bg-black/40 p-3 rounded border border-colibri-green/20">
                <p className="text-colibri-beige">Efectivo Inicial</p>
                <p className="text-xl font-bold text-white">{fmt(parseFloat(selectedShift.opening_cash || 0))}</p>
              </div>
              <div className="bg-black/40 p-3 rounded border border-colibri-green/20">
                <p className="text-colibri-beige">Efectivo Final</p>
                <p className="text-xl font-bold text-white">{fmt(parseFloat(selectedShift.closing_cash || 0))}</p>
              </div>
              <div className="bg-black/40 p-3 rounded border border-colibri-green/20">
                <p className="text-colibri-beige">Esperado</p>
                <p className="text-xl font-bold text-colibri-gold">{fmt(parseFloat(selectedShift.expected_cash || 0))}</p>
              </div>
              <div className={`bg-black/40 p-3 rounded border ${parseFloat(selectedShift.cash_difference || 0) < 0 ? 'border-red-500/30' : 'border-green-500/30'}`}>
                <p className="text-colibri-beige">Diferencia</p>
                <p className={`text-xl font-bold ${parseFloat(selectedShift.cash_difference || 0) < 0 ? 'text-red-400' : 'text-green-400'}`}>
                  {fmt(parseFloat(selectedShift.cash_difference || 0))}
                </p>
              </div>
              <div className="bg-black/40 p-3 rounded border border-green-500/20">
                <p className="text-colibri-beige">Ventas Efectivo</p>
                <p className="text-lg font-bold text-green-400">{fmt(parseFloat(selectedShift.cash_sales || 0))}</p>
              </div>
              <div className="bg-black/40 p-3 rounded border border-blue-500/20">
                <p className="text-colibri-beige">Ventas Tarjeta</p>
                <p className="text-lg font-bold text-blue-400">{fmt(parseFloat(selectedShift.card_sales || 0))}</p>
              </div>
              <div className="bg-black/40 p-3 rounded border border-colibri-wine/20">
                <p className="text-colibri-beige">Total Ventas</p>
                <p className="text-lg font-bold text-colibri-wine">{fmt(parseFloat(selectedShift.total_sales || 0))}</p>
              </div>
              <div className="bg-black/40 p-3 rounded border border-colibri-gold/20">
                <p className="text-colibri-beige">Propinas</p>
                <p className="text-lg font-bold text-colibri-gold">{fmt(parseFloat(selectedShift.total_tips || 0))}</p>
              </div>
            </div>
            {selectedShift.notes && (
              <div className="mt-4 p-3 bg-black/40 rounded border border-colibri-green/20">
                <p className="text-colibri-beige text-sm">Notas: <span className="text-white">{selectedShift.notes}</span></p>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}

// ════════════════════════════════════════════════════════════
// TAB 2: Z-Report (Daily Consolidated)
// ════════════════════════════════════════════════════════════
function ZReportTab() {
  const [date, setDate] = useState(new Date().toISOString().split('T')[0])
  const [report, setReport] = useState<any>(null)
  const [loading, setLoading] = useState(false)

  const fetchReport = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/reports/z-report?date=${date}`)
      const data = await res.json()
      if (data.success) setReport(data)
    } catch (e) {
      console.error('Error fetching Z report:', e)
    } finally {
      setLoading(false)
    }
  }, [date])

  useEffect(() => { fetchReport() }, [fetchReport])

  const changeDay = (delta: number) => {
    const d = new Date(date)
    d.setDate(d.getDate() + delta)
    setDate(d.toISOString().split('T')[0])
  }

  const printZReport = () => {
    if (!report) return
    const s = report.summary
    const ss = report.shiftSummary

    const html = `
      <html><head><title>Reporte Z — ${fmtDate(date)}</title>
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: 'Courier New', monospace; width: 80mm; padding: 4mm; font-size: 12px; }
        .center { text-align: center; }
        .right { text-align: right; }
        .bold { font-weight: bold; }
        .line { border-top: 1px dashed #000; margin: 6px 0; }
        .dline { border-top: 2px solid #000; margin: 6px 0; }
        .row { display: flex; justify-content: space-between; margin: 2px 0; }
        h1 { font-size: 16px; margin: 4px 0; }
        h2 { font-size: 13px; margin: 8px 0 4px; }
        .small { font-size: 10px; }
        @media print { @page { size: 80mm auto; margin: 0; } }
      </style></head><body>
        <div class="center bold"><h1>REPORTE Z</h1></div>
        <div class="center">${fmtDate(date)}</div>
        <div class="dline"></div>
        
        <h2>RESUMEN DE VENTAS</h2>
        <div class="row"><span>Total Pedidos:</span><span class="bold">${s.total_orders}</span></div>
        <div class="row"><span>Ingreso Total:</span><span class="bold">${fmt(s.total_revenue)}</span></div>
        <div class="row"><span>Ticket Promedio:</span><span>${fmt(s.avg_ticket)}</span></div>
        <div class="line"></div>
        
        <h2>POR MÉTODO DE PAGO</h2>
        <div class="row"><span>Efectivo (${s.cash_orders}):</span><span>${fmt(s.cash_revenue)}</span></div>
        <div class="row"><span>Tarjeta (${s.card_orders}):</span><span>${fmt(s.card_revenue)}</span></div>
        <div class="line"></div>
        
        <h2>POR CANAL</h2>
        <div class="row"><span>Mesa (${s.dine_in_orders}):</span><span>${fmt(s.dine_in_revenue)}</span></div>
        <div class="row"><span>Kiosko (${s.kiosk_orders}):</span><span>${fmt(s.kiosk_revenue)}</span></div>
        <div class="row"><span>Online (${s.online_orders}):</span><span>${fmt(s.online_revenue)}</span></div>
        <div class="line"></div>
        
        <h2>MOVIMIENTOS DE CAJA</h2>
        <div class="row"><span>Entradas:</span><span>+${fmt(s.cash_in)}</span></div>
        <div class="row"><span>Salidas:</span><span>-${fmt(s.cash_out)}</span></div>
        ${s.total_tips > 0 ? `<div class="row"><span>Propinas:</span><span>${fmt(s.total_tips)}</span></div>` : ''}
        <div class="line"></div>
        
        <h2>TURNOS (${ss.total_shifts})</h2>
        ${ss.shifts.map((sh: any) => `
          <div class="row"><span>${sh.user_name} (${sh.shift_type})</span><span>${fmt(sh.total_sales)}</span></div>
          <div class="row small"><span>&nbsp;&nbsp;Diferencia:</span><span>${sh.cash_difference >= 0 ? '+' : ''}${fmt(sh.cash_difference)}</span></div>
        `).join('')}
        <div class="line"></div>
        <div class="row bold"><span>Diferencia Total:</span><span>${ss.total_difference >= 0 ? '+' : ''}${fmt(ss.total_difference)}</span></div>
        
        ${report.topProducts.length > 0 ? `
          <div class="line"></div>
          <h2>TOP PRODUCTOS</h2>
          ${report.topProducts.slice(0, 5).map((p: any, i: number) => `
            <div class="row"><span>${i + 1}. ${p.name} (${p.quantity})</span><span>${fmt(parseFloat(p.revenue))}</span></div>
          `).join('')}
        ` : ''}
        
        <div class="dline"></div>
        <div class="center small">Generado: ${new Date().toLocaleString('es-MX')}</div>
        <div class="center small">Colibrí POS</div>
      </body></html>
    `
    const win = window.open('', '_blank', 'width=350,height=600')
    if (win) {
      win.document.write(html)
      win.document.close()
      setTimeout(() => win.print(), 300)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-colibri-gold"></div>
      </div>
    )
  }

  const s = report?.summary || {}
  const ss = report?.shiftSummary || {}

  return (
    <div className="space-y-6">
      {/* Date Selector */}
      <Card className="bg-black/50 border-colibri-gold/30">
        <CardContent className="p-4 flex items-center justify-between">
          <Button variant="ghost" onClick={() => changeDay(-1)} className="text-white">
            <ChevronLeft className="h-5 w-5" />
          </Button>
          <div className="flex items-center gap-3">
            <Calendar className="h-5 w-5 text-colibri-gold" />
            <Input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="bg-slate-900 border-colibri-wine/50 text-white w-44"
            />
            <span className="text-white font-bold text-lg">{fmtDate(date)}</span>
          </div>
          <div className="flex gap-2">
            <Button variant="ghost" onClick={() => changeDay(1)} className="text-white">
              <ChevronRight className="h-5 w-5" />
            </Button>
            <Button onClick={printZReport} className="bg-colibri-wine hover:bg-colibri-wine/80">
              <Printer className="h-4 w-4 mr-2" />
              Imprimir Z
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Revenue Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-black/50 border-green-500/30">
          <CardContent className="p-4 text-center">
            <DollarSign className="h-6 w-6 mx-auto text-green-400 mb-1" />
            <p className="text-2xl font-bold text-green-400">{fmt(s.total_revenue || 0)}</p>
            <p className="text-xs text-colibri-beige">Ingreso Total</p>
          </CardContent>
        </Card>
        <Card className="bg-black/50 border-colibri-gold/30">
          <CardContent className="p-4 text-center">
            <Receipt className="h-6 w-6 mx-auto text-colibri-gold mb-1" />
            <p className="text-2xl font-bold text-white">{s.total_orders || 0}</p>
            <p className="text-xs text-colibri-beige">Pedidos</p>
          </CardContent>
        </Card>
        <Card className="bg-black/50 border-blue-500/30">
          <CardContent className="p-4 text-center">
            <TrendingUp className="h-6 w-6 mx-auto text-blue-400 mb-1" />
            <p className="text-2xl font-bold text-blue-400">{fmt(s.avg_ticket || 0)}</p>
            <p className="text-xs text-colibri-beige">Ticket Promedio</p>
          </CardContent>
        </Card>
        <Card className="bg-black/50 border-colibri-wine/30">
          <CardContent className="p-4 text-center">
            <DollarSign className="h-6 w-6 mx-auto text-colibri-wine mb-1" />
            <p className="text-2xl font-bold text-colibri-wine">{fmt(s.total_tips || 0)}</p>
            <p className="text-xs text-colibri-beige">Propinas</p>
          </CardContent>
        </Card>
      </div>

      {/* Payment Methods + Channels */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="bg-black/50 border-colibri-gold/30">
          <CardHeader><CardTitle className="text-white text-lg">Por Método de Pago</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between items-center p-3 bg-green-900/20 rounded border border-green-500/20">
              <span className="text-colibri-beige">Efectivo ({s.cash_orders || 0} pedidos)</span>
              <span className="text-green-400 font-bold">{fmt(s.cash_revenue || 0)}</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-blue-900/20 rounded border border-blue-500/20">
              <span className="text-colibri-beige">Tarjeta ({s.card_orders || 0} pedidos)</span>
              <span className="text-blue-400 font-bold">{fmt(s.card_revenue || 0)}</span>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-black/50 border-colibri-gold/30">
          <CardHeader><CardTitle className="text-white text-lg">Por Canal</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between items-center p-3 bg-slate-800/50 rounded border border-colibri-green/20">
              <span className="text-colibri-beige">Mesa ({s.dine_in_orders || 0})</span>
              <span className="text-white font-bold">{fmt(s.dine_in_revenue || 0)}</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-slate-800/50 rounded border border-colibri-green/20">
              <span className="text-colibri-beige">Kiosko ({s.kiosk_orders || 0})</span>
              <span className="text-white font-bold">{fmt(s.kiosk_revenue || 0)}</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-slate-800/50 rounded border border-colibri-green/20">
              <span className="text-colibri-beige">Online ({s.online_orders || 0})</span>
              <span className="text-white font-bold">{fmt(s.online_revenue || 0)}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Shifts Detail */}
      {ss.shifts && ss.shifts.length > 0 && (
        <Card className="bg-black/50 border-colibri-gold/30">
          <CardHeader>
            <CardTitle className="text-white text-lg">
              Turnos del Día ({ss.total_shifts})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {ss.shifts.map((sh: any) => (
                <div key={sh.id} className="flex items-center justify-between p-3 bg-slate-800/50 rounded border border-colibri-green/20">
                  <div>
                    <p className="text-white font-medium">{sh.user_name}</p>
                    <p className="text-xs text-colibri-beige capitalize">{sh.shift_type} · {fmtTime(sh.opened_at)} - {sh.closed_at ? fmtTime(sh.closed_at) : 'Abierto'}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-green-400 font-bold">{fmt(sh.total_sales)}</p>
                    <p className={`text-xs font-medium ${sh.cash_difference < 0 ? 'text-red-400' : 'text-green-400'}`}>
                      Dif: {sh.cash_difference >= 0 ? '+' : ''}{fmt(sh.cash_difference)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-4 p-4 bg-colibri-gold/10 rounded border-2 border-colibri-gold/50">
              <div className="flex justify-between items-center">
                <span className="text-white font-bold">Diferencia Total del Día</span>
                <span className={`text-2xl font-bold ${(ss.total_difference || 0) < 0 ? 'text-red-400' : 'text-green-400'}`}>
                  {(ss.total_difference || 0) >= 0 ? '+' : ''}{fmt(ss.total_difference || 0)}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Top Products */}
      {report?.topProducts && report.topProducts.length > 0 && (
        <Card className="bg-black/50 border-colibri-gold/30">
          <CardHeader><CardTitle className="text-white text-lg">Top Productos del Día</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-2">
              {report.topProducts.map((p: any, i: number) => (
                <div key={i} className="flex items-center justify-between p-2 bg-slate-800/50 rounded">
                  <div className="flex items-center gap-3">
                    <span className="text-colibri-gold font-bold w-6">{i + 1}.</span>
                    <span className="text-white">{p.name}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-colibri-beige mr-4">{p.quantity} uds</span>
                    <span className="text-green-400 font-bold">{fmt(parseFloat(p.revenue || 0))}</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

// ════════════════════════════════════════════════════════════
// TAB 3: Staff Performance
// ════════════════════════════════════════════════════════════
function StaffPerformanceTab() {
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (startDate) params.set('start_date', startDate)
      if (endDate) params.set('end_date', endDate)

      const res = await fetch(`/api/reports/staff-performance?${params}`)
      const json = await res.json()
      if (json.success) setData(json)
    } catch (e) {
      console.error('Error:', e)
    } finally {
      setLoading(false)
    }
  }, [startDate, endDate])

  useEffect(() => { fetchData() }, [fetchData])

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-colibri-gold"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Filters */}
      <Card className="bg-black/50 border-colibri-gold/30">
        <CardContent className="p-4">
          <div className="flex flex-wrap gap-4 items-end">
            <div>
              <label className="text-sm text-colibri-beige block mb-1">Desde</label>
              <Input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="bg-slate-900 border-colibri-wine/50 text-white w-44"
              />
            </div>
            <div>
              <label className="text-sm text-colibri-beige block mb-1">Hasta</label>
              <Input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="bg-slate-900 border-colibri-wine/50 text-white w-44"
              />
            </div>
            <Button onClick={fetchData} className="bg-colibri-green hover:bg-colibri-green/80">
              <Search className="h-4 w-4 mr-2" />
              Buscar
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Shift Performance (cajeros) */}
      <Card className="bg-black/50 border-colibri-gold/30">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Users className="h-5 w-5 text-colibri-gold" />
            Rendimiento por Cajero (Turnos)
          </CardTitle>
        </CardHeader>
        <CardContent>
          {!data?.shiftPerformance || data.shiftPerformance.length === 0 ? (
            <p className="text-center text-colibri-beige py-8">No hay datos de turnos</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-colibri-gold/20">
                    <th className="text-left p-3 text-colibri-gold">Cajero</th>
                    <th className="text-right p-3 text-colibri-gold">Turnos</th>
                    <th className="text-right p-3 text-colibri-gold">Ventas Total</th>
                    <th className="text-right p-3 text-colibri-gold">Prom/Turno</th>
                    <th className="text-right p-3 text-colibri-gold">Pedidos</th>
                    <th className="text-right p-3 text-colibri-gold">Propinas</th>
                    <th className="text-right p-3 text-colibri-gold">Diferencia</th>
                    <th className="text-right p-3 text-colibri-gold">Faltantes</th>
                  </tr>
                </thead>
                <tbody>
                  {data.shiftPerformance.map((sp: any, i: number) => (
                    <tr key={i} className="border-b border-colibri-green/10 hover:bg-colibri-green/10">
                      <td className="p-3 text-white font-medium">{sp.staff_name}</td>
                      <td className="p-3 text-right text-white">{sp.total_shifts}</td>
                      <td className="p-3 text-right text-green-400 font-bold">{fmt(parseFloat(sp.total_sales || 0))}</td>
                      <td className="p-3 text-right text-colibri-beige">{fmt(parseFloat(sp.avg_shift_sales || 0))}</td>
                      <td className="p-3 text-right text-white">{sp.total_orders}</td>
                      <td className="p-3 text-right text-colibri-gold">{fmt(parseFloat(sp.total_tips || 0))}</td>
                      <td className={`p-3 text-right font-medium ${parseFloat(sp.total_difference || 0) < 0 ? 'text-red-400' : 'text-green-400'}`}>
                        {fmt(parseFloat(sp.total_difference || 0))}
                      </td>
                      <td className="p-3 text-right">
                        {parseInt(sp.shortage_count || 0) > 0 ? (
                          <Badge className="bg-red-500/20 text-red-400 border-red-500/30">{sp.shortage_count}</Badge>
                        ) : (
                          <Badge className="bg-green-500/20 text-green-400 border-green-500/30">0</Badge>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Waiter Sales */}
      {data?.staffSales && data.staffSales.length > 0 && (
        <Card className="bg-black/50 border-colibri-gold/30">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-green-400" />
              Ventas por Mesero (Órdenes de Mesa)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-colibri-gold/20">
                    <th className="text-left p-3 text-colibri-gold">Mesero</th>
                    <th className="text-right p-3 text-colibri-gold">Pedidos</th>
                    <th className="text-right p-3 text-colibri-gold">Ventas</th>
                    <th className="text-right p-3 text-colibri-gold">Ticket Prom</th>
                    <th className="text-right p-3 text-colibri-gold">Ticket Máx</th>
                    <th className="text-right p-3 text-colibri-gold">Mesas</th>
                    <th className="text-right p-3 text-colibri-gold">Días</th>
                  </tr>
                </thead>
                <tbody>
                  {data.staffSales.map((ss: any, i: number) => (
                    <tr key={i} className="border-b border-colibri-green/10 hover:bg-colibri-green/10">
                      <td className="p-3 text-white font-medium">{ss.staff_name}</td>
                      <td className="p-3 text-right text-white">{ss.total_orders}</td>
                      <td className="p-3 text-right text-green-400 font-bold">{fmt(parseFloat(ss.total_sales || 0))}</td>
                      <td className="p-3 text-right text-colibri-beige">{fmt(parseFloat(ss.avg_ticket || 0))}</td>
                      <td className="p-3 text-right text-colibri-gold">{fmt(parseFloat(ss.max_ticket || 0))}</td>
                      <td className="p-3 text-right text-white">{ss.tables_served}</td>
                      <td className="p-3 text-right text-colibri-beige">{ss.days_worked}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

// ════════════════════════════════════════════════════════════
// TAB 4: Shortage Alerts
// ════════════════════════════════════════════════════════════
function ShortageAlertsTab() {
  const [alerts, setAlerts] = useState<any[]>([])
  const [threshold, setThreshold] = useState(50)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    fetchAlerts()
    fetchThreshold()
  }, [])

  const fetchThreshold = async () => {
    try {
      const res = await fetch('/api/business-info')
      const data = await res.json()
      if (data.businessInfo?.shortage_alert_threshold) {
        setThreshold(parseFloat(data.businessInfo.shortage_alert_threshold))
      }
    } catch (e) {
      console.error('Error fetching threshold:', e)
    }
  }

  const fetchAlerts = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/reports/shifts?status=closed')
      const data = await res.json()
      if (data.success) {
        // Filter shifts with significant shortages
        const shortages = (data.shifts || []).filter((s: any) => {
          const diff = parseFloat(s.cash_difference || 0)
          return diff < -threshold
        })
        setAlerts(shortages)
      }
    } catch (e) {
      console.error('Error:', e)
    } finally {
      setLoading(false)
    }
  }

  const saveThreshold = async () => {
    setSaving(true)
    try {
      await fetch('/api/business-info', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ shortage_alert_threshold: threshold })
      })
      fetchAlerts()
    } catch (e) {
      console.error('Error saving threshold:', e)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Threshold Configuration */}
      <Card className="bg-black/50 border-colibri-gold/30">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-yellow-400" />
            Configuración de Alertas
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-end gap-4">
            <div>
              <label className="text-sm text-colibri-beige block mb-1">Umbral de Faltante ($)</label>
              <Input
                type="number"
                step="10"
                value={threshold}
                onChange={(e) => setThreshold(parseFloat(e.target.value) || 0)}
                className="bg-slate-900 border-colibri-wine/50 text-white w-40"
              />
            </div>
            <Button onClick={saveThreshold} disabled={saving} className="bg-colibri-green hover:bg-colibri-green/80">
              {saving ? 'Guardando...' : 'Guardar'}
            </Button>
            <p className="text-sm text-colibri-beige">
              Se alertará cuando un turno tenga un faltante mayor a {fmt(threshold)}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Alert Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-black/50 border-red-500/30">
          <CardContent className="p-4 text-center">
            <AlertTriangle className="h-8 w-8 mx-auto text-red-400 mb-2" />
            <p className="text-3xl font-bold text-red-400">{alerts.length}</p>
            <p className="text-xs text-colibri-beige">Alertas Activas</p>
          </CardContent>
        </Card>
        <Card className="bg-black/50 border-red-500/30">
          <CardContent className="p-4 text-center">
            <DollarSign className="h-8 w-8 mx-auto text-red-400 mb-2" />
            <p className="text-3xl font-bold text-red-400">
              {fmt(Math.abs(alerts.reduce((sum, a) => sum + parseFloat(a.cash_difference || 0), 0)))}
            </p>
            <p className="text-xs text-colibri-beige">Total Faltantes</p>
          </CardContent>
        </Card>
        <Card className="bg-black/50 border-colibri-gold/30">
          <CardContent className="p-4 text-center">
            <Users className="h-8 w-8 mx-auto text-colibri-gold mb-2" />
            <p className="text-3xl font-bold text-white">
              {new Set(alerts.map(a => a.user_name)).size}
            </p>
            <p className="text-xs text-colibri-beige">Usuarios Afectados</p>
          </CardContent>
        </Card>
      </div>

      {/* Alerts List */}
      <Card className="bg-black/50 border-colibri-gold/30">
        <CardHeader>
          <CardTitle className="text-white">Turnos con Faltante &gt; {fmt(threshold)}</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center p-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-colibri-gold"></div>
            </div>
          ) : alerts.length === 0 ? (
            <div className="text-center p-12">
              <CheckCircle className="h-16 w-16 mx-auto text-green-400 mb-4" />
              <p className="text-green-400 text-lg font-bold">Sin alertas</p>
              <p className="text-colibri-beige">No hay turnos con faltantes significativos</p>
            </div>
          ) : (
            <div className="space-y-3">
              {alerts.map((alert: any) => {
                const diff = parseFloat(alert.cash_difference || 0)
                return (
                  <div key={alert.id} className="p-4 bg-red-900/10 rounded border border-red-500/30">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <AlertTriangle className="h-4 w-4 text-red-400" />
                          <span className="text-white font-bold">{alert.user_name}</span>
                          <Badge className="bg-red-500/20 text-red-400 border-red-500/30">
                            Faltante: {fmt(Math.abs(diff))}
                          </Badge>
                        </div>
                        <p className="text-xs text-colibri-beige mt-1">
                          Turno #{alert.id} · {alert.shift_type} · {fmtDateTime(alert.opened_at)} - {fmtDateTime(alert.closed_at)}
                        </p>
                        {alert.notes && (
                          <p className="text-xs text-colibri-beige mt-1">Nota: {alert.notes}</p>
                        )}
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-colibri-beige">Esperado: {fmt(parseFloat(alert.expected_cash || 0))}</p>
                        <p className="text-sm text-colibri-beige">Real: {fmt(parseFloat(alert.closing_cash || 0))}</p>
                        <p className="text-sm text-colibri-beige">Ventas: {fmt(parseFloat(alert.total_sales || 0))}</p>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
