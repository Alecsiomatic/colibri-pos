"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { CheckCircle, AlertCircle, Database, RefreshCw } from "lucide-react"
import AdminLayout from "@/components/admin/admin-layout"

export default function CreateFunctionsPage() {
  const [isLoading, setIsLoading] = useState(false)
  const [result, setResult] = useState<{
    success?: boolean
    message?: string
    error?: string
  } | null>(null)

  const createFunctions = async () => {
    setIsLoading(true)
    setResult(null)

    try {
      const response = await fetch("/api/admin/database/create-functions", {
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
              Crear Funciones de Base de Datos
            </CardTitle>
            <CardDescription>
              Esta herramienta crea funciones SQL necesarias para la administración de la base de datos.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <p>Al ejecutar esta herramienta se crearán las siguientes funciones:</p>
              <ul className="list-disc pl-5 space-y-1">
                <li>
                  <code>get_table_columns</code>: Obtiene las columnas de una tabla
                </li>
                <li>
                  <code>execute_sql</code>: Ejecuta código SQL dinámico
                </li>
              </ul>

              <Alert variant="warning" className="mt-4">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Precaución</AlertTitle>
                <AlertDescription>
                  Esta operación requiere privilegios de administrador y modificará la estructura de la base de datos.
                  Solo debe ejecutarse una vez o cuando sea necesario actualizar las funciones.
                </AlertDescription>
              </Alert>

              {result && (
                <Alert variant={result.success ? "default" : "destructive"} className="mt-4">
                  {result.success ? <CheckCircle className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
                  <AlertTitle>{result.success ? "Operación exitosa" : "Error"}</AlertTitle>
                  <AlertDescription>
                    {result.success ? result.message : result.error || "Ocurrió un error desconocido"}
                  </AlertDescription>
                </Alert>
              )}
            </div>
          </CardContent>
          <CardFooter>
            <Button onClick={createFunctions} disabled={isLoading} className="w-full sm:w-auto">
              {isLoading ? (
                <>
                  <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                  Procesando...
                </>
              ) : (
                <>Crear Funciones</>
              )}
            </Button>
          </CardFooter>
        </Card>
      </div>
    </AdminLayout>
  )
}
