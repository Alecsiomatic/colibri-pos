'use client'

import { useState } from 'react'
import AdminLayout from '@/components/admin/admin-layout'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Database, Loader2, CheckCircle, AlertCircle, ArrowRight } from 'lucide-react'

interface Driver {
  id: number
  username: string
  email: string
  is_driver: boolean
  driver_id: number | null
  driver_name: string | null
}

interface MigrationResult {
  message: string
  updated_users: number
  drivers: Driver[]
  summary: {
    users_with_flag: number
    users_in_delivery_drivers: number
    total: number
  }
}

export default function MigrateAddIsDriverPage() {
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<MigrationResult | null>(null)
  const [error, setError] = useState<string | null>(null)

  const handleMigrate = async () => {
    try {
      setLoading(true)
      setResult(null)
      setError(null)

      const response = await fetch('/api/admin/migrate-add-is-driver', {
        method: 'POST',
        credentials: 'include'
      })

      const data = await response.json()

      if (!response.ok || !data.success) {
        throw new Error(data.message || 'Error en la migración')
      }

      setResult(data)
    } catch (err: any) {
      console.error('Error:', err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Agregar Columna is_driver</h1>
          <p className="text-muted-foreground">
            Migración de esquema: agregar columna is_driver a la tabla users
          </p>
        </div>

        <Card className="border-orange-200 bg-orange-50 dark:bg-orange-950 dark:border-orange-800">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-orange-700 dark:text-orange-400">
              <AlertCircle className="h-5 w-5" />
              ⚠️ Migración Requerida
            </CardTitle>
            <CardDescription>
              Tu tabla users no tiene la columna is_driver. Esta columna es necesaria para que el sistema funcione correctamente.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2 text-sm">
              <p><strong>¿Qué hace esta migración?</strong></p>
              <ol className="list-decimal list-inside space-y-1 ml-2">
                <li>Agrega la columna <code className="bg-orange-100 dark:bg-orange-900 px-1 rounded">is_driver BOOLEAN</code> a la tabla users</li>
                <li>Crea un índice para mejorar el rendimiento</li>
                <li>Actualiza automáticamente usuarios que ya tienen registro en delivery_drivers</li>
                <li>Verifica que todo quedó correctamente</li>
              </ol>
            </div>

            <Button
              onClick={handleMigrate}
              disabled={loading}
              size="lg"
              className="w-full sm:w-auto bg-orange-600 hover:bg-orange-700"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Ejecutando Migración...
                </>
              ) : (
                <>
                  <Database className="mr-2 h-4 w-4" />
                  Ejecutar Migración Ahora
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {error && (
          <Card className="border-red-200 bg-red-50 dark:bg-red-950 dark:border-red-800">
            <CardContent className="pt-6">
              <div className="flex items-center gap-2 text-red-700 dark:text-red-400">
                <AlertCircle className="h-5 w-5" />
                <p className="font-semibold">Error en la migración</p>
              </div>
              <p className="mt-2 text-sm text-red-600 dark:text-red-400">{error}</p>
            </CardContent>
          </Card>
        )}

        {result && (
          <div className="space-y-4">
            <Card className="border-green-200 bg-green-50 dark:bg-green-950 dark:border-green-800">
              <CardContent className="pt-6">
                <div className="flex items-center gap-2 text-green-700 dark:text-green-400">
                  <CheckCircle className="h-5 w-5" />
                  <p className="font-semibold">{result.message}</p>
                </div>
                <div className="mt-4 grid grid-cols-3 gap-4">
                  <div className="bg-white dark:bg-gray-900 p-4 rounded-lg border">
                    <p className="text-2xl font-bold text-green-600">{result.updated_users}</p>
                    <p className="text-sm text-muted-foreground">Usuarios Actualizados</p>
                  </div>
                  <div className="bg-white dark:bg-gray-900 p-4 rounded-lg border">
                    <p className="text-2xl font-bold text-blue-600">{result.summary.users_with_flag}</p>
                    <p className="text-sm text-muted-foreground">Con Flag is_driver</p>
                  </div>
                  <div className="bg-white dark:bg-gray-900 p-4 rounded-lg border">
                    <p className="text-2xl font-bold text-purple-600">{result.summary.users_in_delivery_drivers}</p>
                    <p className="text-sm text-muted-foreground">En delivery_drivers</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {result.drivers.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Drivers Encontrados ({result.drivers.length})</CardTitle>
                  <CardDescription>
                    Usuarios con is_driver=1 o registro en delivery_drivers
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {result.drivers.map((driver) => (
                      <div
                        key={driver.id}
                        className="flex items-center justify-between p-3 bg-muted rounded-lg"
                      >
                        <div className="flex-1">
                          <p className="font-medium">{driver.username}</p>
                          <p className="text-sm text-muted-foreground">{driver.email}</p>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="text-center">
                            <p className="text-xs text-muted-foreground">is_driver</p>
                            <p className="font-medium">
                              {driver.is_driver ? (
                                <span className="text-green-600">✓ Sí</span>
                              ) : (
                                <span className="text-red-600">✗ No</span>
                              )}
                            </p>
                          </div>
                          <ArrowRight className="h-4 w-4 text-muted-foreground" />
                          <div className="text-center">
                            <p className="text-xs text-muted-foreground">Driver ID</p>
                            <p className="font-medium">
                              {driver.driver_id ? (
                                <span className="text-blue-600">#{driver.driver_id}</span>
                              ) : (
                                <span className="text-gray-400">-</span>
                              )}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            <Card className="bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800">
              <CardHeader>
                <CardTitle className="text-lg">✅ Siguiente Paso</CardTitle>
              </CardHeader>
              <CardContent className="text-sm space-y-2">
                <p>La migración se completó exitosamente. Ahora puedes:</p>
                <ol className="list-decimal list-inside space-y-1 ml-2">
                  <li>Crear nuevos repartidores desde <strong>/admin/delivery</strong></li>
                  <li>Ver estadísticas en <strong>/admin/driver-stats</strong></li>
                  <li>Asignar pedidos desde <strong>/admin/orders</strong></li>
                </ol>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </AdminLayout>
  )
}
