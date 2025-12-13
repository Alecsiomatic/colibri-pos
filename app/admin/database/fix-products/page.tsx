"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { CheckCircle, AlertCircle, Database, RefreshCw } from "lucide-react"
import AdminLayout from "@/components/admin/admin-layout"

export default function FixProductsPage() {
  const [isLoading, setIsLoading] = useState(false)
  const [result, setResult] = useState<{
    success?: boolean
    message?: string
    totalProducts?: number
    productsUpdated?: number
    error?: string
  } | null>(null)

  const fixProductsTable = async () => {
    setIsLoading(true)
    setResult(null)

    try {
      const response = await fetch("/api/admin/database/fix-products", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      })

      const data = await response.json()
      setResult(data)
    } catch (error: any) {
      setResult({
        success: false,
        error: error.message || "Error desconocido",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <AdminLayout>
      <div className="container mx-auto py-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl flex items-center gap-2">
              <Database className="h-6 w-6" />
              Corrección de Tabla de Productos
            </CardTitle>
            <CardDescription>
              Esta herramienta verifica y corrige la estructura de la tabla de productos, asegurando que todos los
              productos tengan un valor de stock válido.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <p>Al ejecutar esta herramienta:</p>
              <ul className="list-disc pl-5 space-y-1">
                <li>
                  Se verificará si la columna <code>stock</code> existe en la tabla de productos
                </li>
                <li>Se añadirá la columna si no existe</li>
                <li>Se actualizarán los productos que no tengan un valor de stock válido</li>
                <li>Se establecerá un valor predeterminado de 10 unidades para productos sin stock</li>
              </ul>

              {result && (
                <Alert variant={result.success ? "default" : "destructive"} className="mt-4">
                  {result.success ? <CheckCircle className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
                  <AlertTitle>{result.success ? "Operación exitosa" : "Error"}</AlertTitle>
                  <AlertDescription>
                    {result.success ? (
                      <div>
                        <p>{result.message}</p>
                        {result.totalProducts !== undefined && <p>Total de productos: {result.totalProducts}</p>}
                        {result.productsUpdated !== undefined && (
                          <p>Productos actualizados: {result.productsUpdated}</p>
                        )}
                      </div>
                    ) : (
                      <p>{result.error || "Ocurrió un error desconocido"}</p>
                    )}
                  </AlertDescription>
                </Alert>
              )}
            </div>
          </CardContent>
          <CardFooter>
            <Button onClick={fixProductsTable} disabled={isLoading} className="w-full sm:w-auto">
              {isLoading ? (
                <>
                  <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                  Procesando...
                </>
              ) : (
                <>Corregir Tabla de Productos</>
              )}
            </Button>
          </CardFooter>
        </Card>
      </div>
    </AdminLayout>
  )
}
