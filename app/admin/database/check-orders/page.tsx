"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Loader2, AlertCircle, Info } from "lucide-react"

export default function CheckOrdersStructurePage() {
  const [isLoading, setIsLoading] = useState(true)
  const [data, setData] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)

  const fetchOrdersStructure = async () => {
    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch("/api/admin/database/check-orders-structure")
      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || "Error al obtener la estructura de pedidos")
      }

      setData(result)
    } catch (err) {
      console.error("Error:", err)
      setError(err instanceof Error ? err.message : "Error desconocido")
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchOrdersStructure()
  }, [])

  const handleRefresh = () => {
    fetchOrdersStructure()
  }

  return (
    <div className="container mx-auto py-8 space-y-8">
      <Card>
        <CardHeader>
          <CardTitle>Análisis de Estructura de Pedidos</CardTitle>
          <CardDescription>
            Esta herramienta analiza la estructura de los pedidos para verificar si los items están almacenados
            correctamente.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center items-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-gray-500" />
            </div>
          ) : error ? (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          ) : data ? (
            <>
              <Alert className="mb-4">
                <Info className="h-4 w-4" />
                <AlertTitle>Información</AlertTitle>
                <AlertDescription>
                  {data.message}. Se analizaron {data.orders_count} pedidos.
                </AlertDescription>
              </Alert>

              {data.orders_analysis && data.orders_analysis.length > 0 ? (
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>ID</TableHead>
                        <TableHead>Estado</TableHead>
                        <TableHead>Estructura de Items</TableHead>
                        <TableHead>Items Válidos</TableHead>
                        <TableHead>Stock Procesado</TableHead>
                        <TableHead>Ejemplo de Item</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {data.orders_analysis.map((order: any) => (
                        <TableRow key={order.id}>
                          <TableCell>{order.id}</TableCell>
                          <TableCell>{order.status}</TableCell>
                          <TableCell>{order.items_structure}</TableCell>
                          <TableCell>
                            {order.items_valid ? (
                              <Badge className="bg-green-500">Válido</Badge>
                            ) : (
                              <Badge className="bg-red-500">Inválido</Badge>
                            )}
                          </TableCell>
                          <TableCell>
                            {order.stock_processed ? (
                              <Badge className="bg-green-500">Sí</Badge>
                            ) : (
                              <Badge className="bg-yellow-500">No</Badge>
                            )}
                          </TableCell>
                          <TableCell>
                            <pre className="text-xs overflow-x-auto max-w-xs">
                              {order.sample_item ? JSON.stringify(order.sample_item, null, 2) : "N/A"}
                            </pre>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <Alert>
                  <AlertTitle>Sin datos</AlertTitle>
                  <AlertDescription>No se encontraron pedidos para analizar.</AlertDescription>
                </Alert>
              )}
            </>
          ) : null}
        </CardContent>
        <CardFooter>
          <Button onClick={handleRefresh} disabled={isLoading} className="w-full">
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Analizando...
              </>
            ) : (
              "Actualizar Análisis"
            )}
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}
