'use client'

import { useState } from 'react'
import AdminLayout from '@/components/admin/admin-layout'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { UserCheck, Loader2, CheckCircle, AlertCircle } from 'lucide-react'

interface MigratedDriver {
  userId: number
  username: string
  driverId: number
}

interface MigrationError {
  userId: number
  username: string
  error: string
}

export default function MigrateDriversPage() {
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<{
    message: string
    migrated: number
    drivers: MigratedDriver[]
    errors?: MigrationError[]
  } | null>(null)

  const handleMigrate = async () => {
    try {
      setLoading(true)
      setResult(null)

      const response = await fetch('/api/admin/migrate-drivers', {
        method: 'POST',
        credentials: 'include'
      })

      const data = await response.json()

      if (!response.ok || !data.success) {
        throw new Error(data.message || 'Error en la migración')
      }

      setResult(data)
    } catch (error: any) {
      console.error('Error:', error)
      setResult({
        message: error.message,
        migrated: 0,
        drivers: [],
        errors: [{ userId: 0, username: 'Error', error: error.message }]
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Migrar Drivers</h1>
          <p className="text-muted-foreground">
            Crea registros en delivery_drivers para usuarios con is_driver=1 que no tienen registro
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserCheck className="h-5 w-5" />
              Migración de Drivers
            </CardTitle>
            <CardDescription>
              Este proceso buscará todos los usuarios que tienen is_driver=1 pero no tienen un registro
              en la tabla delivery_drivers y creará los registros faltantes automáticamente.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button
              onClick={handleMigrate}
              disabled={loading}
              size="lg"
              className="w-full sm:w-auto"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Migrando...
                </>
              ) : (
                <>
                  <UserCheck className="mr-2 h-4 w-4" />
                  Ejecutar Migración
                </>
              )}
            </Button>

            {result && (
              <div className="space-y-4 mt-6">
                <div
                  className={`p-4 rounded-lg border ${
                    result.migrated > 0
                      ? 'bg-green-50 border-green-200 dark:bg-green-950 dark:border-green-800'
                      : 'bg-blue-50 border-blue-200 dark:bg-blue-950 dark:border-blue-800'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    {result.migrated > 0 ? (
                      <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400" />
                    ) : (
                      <AlertCircle className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                    )}
                    <p className="font-semibold">{result.message}</p>
                  </div>
                </div>

                {result.drivers.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">
                        Drivers Migrados ({result.drivers.length})
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        {result.drivers.map((driver) => (
                          <div
                            key={driver.userId}
                            className="flex items-center justify-between p-3 bg-muted rounded-lg"
                          >
                            <div>
                              <p className="font-medium">{driver.username}</p>
                              <p className="text-sm text-muted-foreground">
                                User ID: {driver.userId}
                              </p>
                            </div>
                            <div className="text-right">
                              <p className="text-sm font-medium text-green-600 dark:text-green-400">
                                ✓ Migrado
                              </p>
                              <p className="text-xs text-muted-foreground">
                                Driver ID: {driver.driverId}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {result.errors && result.errors.length > 0 && (
                  <Card className="border-red-200 dark:border-red-800">
                    <CardHeader>
                      <CardTitle className="text-lg text-red-600 dark:text-red-400">
                        Errores ({result.errors.length})
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        {result.errors.map((error, index) => (
                          <div
                            key={index}
                            className="p-3 bg-red-50 dark:bg-red-950 rounded-lg"
                          >
                            <p className="font-medium">{error.username}</p>
                            <p className="text-sm text-red-600 dark:text-red-400">
                              {error.error}
                            </p>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800">
          <CardHeader>
            <CardTitle className="text-lg">ℹ️ Información</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <p>
              <strong>¿Qué hace este proceso?</strong>
            </p>
            <ul className="list-disc list-inside space-y-1 ml-2">
              <li>Busca usuarios con is_driver = 1</li>
              <li>Identifica cuáles NO tienen registro en delivery_drivers</li>
              <li>Crea los registros faltantes con valores predeterminados</li>
              <li>Marca los drivers como disponibles (is_available = 1)</li>
            </ul>
            <p className="mt-4">
              <strong>Después de la migración:</strong>
            </p>
            <ul className="list-disc list-inside space-y-1 ml-2">
              <li>Los drivers aparecerán en las estadísticas</li>
              <li>Podrán ser asignados a pedidos</li>
              <li>Tendrán acceso al panel de repartidor</li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  )
}
