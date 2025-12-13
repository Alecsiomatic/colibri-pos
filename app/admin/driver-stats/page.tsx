"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { toast } from "@/hooks/use-toast"
import { Loader2, TrendingUp, Clock, CheckCircle, XCircle, Package, User, Star } from "lucide-react"
import AdminLayout from "@/components/admin/admin-layout"

interface DriverStats {
  driver_id: number
  user_id: number
  name: string
  email: string
  phone: string
  is_available: number | boolean
  is_active: number | boolean
  username: string
  total_deliveries: number
  active_deliveries: number
  completed_today: number
  completed_this_week: number
  completed_this_month: number
  avg_delivery_time_minutes: number
  success_rate: number
  total_earnings: number
  last_delivery: string | null
}

interface RecentDelivery {
  order_id: number
  customer_name: string
  delivery_address: string
  total: number
  assigned_at: string
  completed_at: string
  delivery_time_minutes: number
  status: string
}

export default function DriverStatsPage() {
  const [drivers, setDrivers] = useState<DriverStats[]>([])
  const [selectedDriver, setSelectedDriver] = useState<number | null>(null)
  const [recentDeliveries, setRecentDeliveries] = useState<RecentDelivery[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isLoadingDeliveries, setIsLoadingDeliveries] = useState(false)

  useEffect(() => {
    fetchDriverStats()
  }, [])

  useEffect(() => {
    if (selectedDriver) {
      fetchDriverDeliveries(selectedDriver)
    }
  }, [selectedDriver])

  const fetchDriverStats = async () => {
    try {
      setIsLoading(true)
      const response = await fetch('/api/admin/driver-stats')
      
      if (!response.ok) {
        throw new Error('Error al cargar estadísticas')
      }

      const data = await response.json()
      setDrivers(data.drivers || [])
      
      if (data.drivers && data.drivers.length > 0) {
        setSelectedDriver(data.drivers[0].driver_id)
      }
    } catch (error) {
      console.error('Error:', error)
      toast({
        title: "Error",
        description: "No se pudieron cargar las estadísticas de repartidores",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const fetchDriverDeliveries = async (driverId: number) => {
    try {
      setIsLoadingDeliveries(true)
      const response = await fetch(`/api/admin/driver-stats/${driverId}/deliveries`)
      
      if (!response.ok) {
        throw new Error('Error al cargar entregas')
      }

      const data = await response.json()
      setRecentDeliveries(data.deliveries || [])
    } catch (error) {
      console.error('Error:', error)
      toast({
        title: "Error",
        description: "No se pudieron cargar las entregas del repartidor",
        variant: "destructive",
      })
    } finally {
      setIsLoadingDeliveries(false)
    }
  }

  const formatTime = (minutes: number) => {
    if (minutes < 60) {
      return `${Math.round(minutes)} min`
    }
    const hours = Math.floor(minutes / 60)
    const mins = Math.round(minutes % 60)
    return `${hours}h ${mins}m`
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP',
    }).format(amount)
  }

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-96">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </AdminLayout>
    )
  }

  const selectedDriverData = drivers.find(d => d.driver_id === selectedDriver)

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Estadísticas de Repartidores</h1>
            <p className="text-muted-foreground">
              Rendimiento y métricas de tus repartidores
            </p>
          </div>
          <Button onClick={fetchDriverStats} variant="outline">
            Actualizar
          </Button>
        </div>

        {drivers.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <User className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-lg font-medium mb-2">No hay repartidores registrados</p>
              <p className="text-sm text-muted-foreground mb-4">
                Ejecuta <code className="bg-muted px-2 py-1 rounded">npm run create-driver</code> para crear uno
              </p>
            </CardContent>
          </Card>
        ) : (
          <>
            {/* Resumen General */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Repartidores</CardTitle>
                  <User className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{drivers.length}</div>
                  <p className="text-xs text-muted-foreground">
                    Activos en el sistema
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Entregas Activas</CardTitle>
                  <Package className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {drivers.reduce((sum, d) => sum + d.active_deliveries, 0)}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    En este momento
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Completadas Hoy</CardTitle>
                  <CheckCircle className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {drivers.reduce((sum, d) => sum + d.completed_today, 0)}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Total del día
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Promedio Entrega</CardTitle>
                  <Clock className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {formatTime(
                      drivers.reduce((sum, d) => sum + d.avg_delivery_time_minutes, 0) / 
                      drivers.filter(d => d.avg_delivery_time_minutes > 0).length || 0
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Tiempo promedio
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Tabs por Repartidor */}
            <Card>
              <CardHeader>
                <CardTitle>Detalle por Repartidor</CardTitle>
                <CardDescription>
                  Selecciona un repartidor para ver sus estadísticas detalladas
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Tabs value={selectedDriver?.toString()} onValueChange={(v) => setSelectedDriver(Number(v))}>
                  <TabsList className="grid w-full" style={{ gridTemplateColumns: `repeat(${drivers.length}, minmax(0, 1fr))` }}>
                    {drivers.map((driver) => (
                      <TabsTrigger key={driver.driver_id} value={driver.driver_id.toString()}>
                        {driver.name}
                      </TabsTrigger>
                    ))}
                  </TabsList>

                  {drivers.map((driver) => (
                    <TabsContent key={driver.driver_id} value={driver.driver_id.toString()} className="space-y-4">
                      {/* Stats Cards */}
                      <div className="grid gap-4 md:grid-cols-3">
                        <Card>
                          <CardHeader className="pb-3">
                            <CardTitle className="text-sm font-medium">Entregas Totales</CardTitle>
                          </CardHeader>
                          <CardContent>
                            <div className="text-2xl font-bold">{driver.total_deliveries}</div>
                            <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                              <TrendingUp className="h-3 w-3" />
                              <span>Hoy: {driver.completed_today}</span>
                              <span>Semana: {driver.completed_this_week}</span>
                            </div>
                          </CardContent>
                        </Card>

                        <Card>
                          <CardHeader className="pb-3">
                            <CardTitle className="text-sm font-medium">Tiempo Promedio</CardTitle>
                          </CardHeader>
                          <CardContent>
                            <div className="text-2xl font-bold">
                              {formatTime(driver.avg_delivery_time_minutes)}
                            </div>
                            <p className="text-xs text-muted-foreground mt-1">
                              Por entrega completada
                            </p>
                          </CardContent>
                        </Card>

                        <Card>
                          <CardHeader className="pb-3">
                            <CardTitle className="text-sm font-medium">Tasa de Éxito</CardTitle>
                          </CardHeader>
                          <CardContent>
                            <div className="text-2xl font-bold">{driver.success_rate}%</div>
                            <p className="text-xs text-muted-foreground mt-1">
                              Entregas completadas
                            </p>
                          </CardContent>
                        </Card>
                      </div>

                      {/* Contact Info */}
                      <Card>
                        <CardHeader>
                          <CardTitle className="text-sm font-medium">Información de Contacto</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-2">
                          <div className="flex justify-between">
                            <span className="text-sm text-muted-foreground">Email:</span>
                            <span className="text-sm font-medium">{driver.email}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-sm text-muted-foreground">Teléfono:</span>
                            <span className="text-sm font-medium">{driver.phone || 'No registrado'}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-sm text-muted-foreground">Estado:</span>
                            <Badge variant={driver.active_deliveries > 0 ? "default" : "secondary"}>
                              {driver.active_deliveries > 0 ? `${driver.active_deliveries} en camino` : 'Disponible'}
                            </Badge>
                          </div>
                          {driver.last_delivery && (
                            <div className="flex justify-between">
                              <span className="text-sm text-muted-foreground">Última entrega:</span>
                              <span className="text-sm font-medium">
                                {new Date(driver.last_delivery).toLocaleString('es-CL')}
                              </span>
                            </div>
                          )}
                        </CardContent>
                      </Card>

                      {/* Recent Deliveries */}
                      <Card>
                        <CardHeader>
                          <CardTitle>Entregas Recientes</CardTitle>
                          <CardDescription>Últimas 20 entregas completadas</CardDescription>
                        </CardHeader>
                        <CardContent>
                          {isLoadingDeliveries ? (
                            <div className="flex justify-center py-8">
                              <Loader2 className="h-6 w-6 animate-spin text-primary" />
                            </div>
                          ) : recentDeliveries.length === 0 ? (
                            <p className="text-center text-muted-foreground py-8">
                              No hay entregas registradas
                            </p>
                          ) : (
                            <Table>
                              <TableHeader>
                                <TableRow>
                                  <TableHead>Pedido</TableHead>
                                  <TableHead>Cliente</TableHead>
                                  <TableHead>Dirección</TableHead>
                                  <TableHead>Monto</TableHead>
                                  <TableHead>Tiempo</TableHead>
                                  <TableHead>Fecha</TableHead>
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                {recentDeliveries.map((delivery) => (
                                  <TableRow key={delivery.order_id}>
                                    <TableCell className="font-medium">#{delivery.order_id}</TableCell>
                                    <TableCell>{delivery.customer_name}</TableCell>
                                    <TableCell className="max-w-[200px] truncate">
                                      {delivery.delivery_address}
                                    </TableCell>
                                    <TableCell>{formatCurrency(delivery.total)}</TableCell>
                                    <TableCell>
                                      <Badge variant="outline">
                                        {formatTime(delivery.delivery_time_minutes)}
                                      </Badge>
                                    </TableCell>
                                    <TableCell className="text-sm text-muted-foreground">
                                      {new Date(delivery.completed_at).toLocaleDateString('es-CL')}
                                    </TableCell>
                                  </TableRow>
                                ))}
                              </TableBody>
                            </Table>
                          )}
                        </CardContent>
                      </Card>
                    </TabsContent>
                  ))}
                </Tabs>
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </AdminLayout>
  )
}
