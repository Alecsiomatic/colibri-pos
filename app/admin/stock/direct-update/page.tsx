"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Loader2, CheckCircle, AlertCircle, AlertTriangle } from "lucide-react"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"

export default function DirectUpdateStockPage() {
  const [isProcessing, setIsProcessing] = useState(false)
  const [result, setResult] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)
  const [resetStock, setResetStock] = useState(false)

  const updateStock = async () => {
    setIsProcessing(true)
    setError(null)
    setResult(null)

    try {
      const response = await fetch("/api/admin/stock/direct-update-from-orders", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          resetStock,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Error al actualizar stock")
      }

      setResult(data)
    } catch (err) {
      console.error("Error:", err)
      setError(err instanceof Error ? err.message : "Error desconocido")
    } finally {
      setIsProcessing(false)
    }
  }

  return (
    <div className="container mx-auto py-8 space-y-8">
      <Card>
        <CardHeader>
          <CardTitle>Actualización Directa de Stock desde Pedidos</CardTitle>
          <CardDescription>
            Esta herramienta recalculará el stock de todos los productos basado en los pedidos existentes.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Alert variant="warning" className="mb-4">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Advertencia</AlertTitle>
            <AlertDescription>
              Esta operación actualizará el stock de todos los productos basado en los pedidos existentes. Asegúrate de
              que los pedidos tengan la estructura correcta.
            </AlertDescription>
          </Alert>

          <div className="flex items-center space-x-2 mb-4">
            <Switch id="reset-stock" checked={resetStock} onCheckedChange={setResetStock} />
            <Label htmlFor="reset-stock">Resetear stock a 20 unidades (recomendado para la primera ejecución)</Label>
          </div>
        </CardContent>
        <CardFooter>
          <Button onClick={updateStock} disabled={isProcessing} variant="destructive" className="w-full">
            {isProcessing ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Actualizando...
              </>
            ) : (
              "Actualizar Stock desde Pedidos"
            )}
          </Button>
        </CardFooter>
      </Card>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {result && (
        <Card>
          <CardHeader>
            <CardTitle>Resultado de la Actualización</CardTitle>
            <CardDescription>{result.message}</CardDescription>
          </CardHeader>
          <CardContent>
            <Alert className={result.products_failed > 0 ? "bg-yellow-50" : "bg-green-50"}>
              {result.products_failed > 0 ? (
                <AlertTriangle className="h-4 w-4 text-yellow-500" />
              ) : (
                <CheckCircle className="h-4 w-4 text-green-500" />
              )}
              <AlertTitle>Resumen</AlertTitle>
              <AlertDescription>
                <p>Pedidos procesados: {result.orders_processed}</p>
                <p>Pedidos omitidos: {result.orders_skipped}</p>
                <p>Pedidos inválidos: {result.orders_invalid}</p>
                <p>Productos actualizados: {result.products_updated}</p>
                <p>Productos con errores: {result.products_failed}</p>
              </AlertDescription>
            </Alert>

            <div className="mt-4 rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ID</TableHead>
                    <TableHead>Producto</TableHead>
                    <TableHead>Stock Inicial</TableHead>
                    <TableHead>Vendido</TableHead>
                    <TableHead>Nuevo Stock</TableHead>
                    <TableHead>Estado</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {result.results.map((item: any, index: number) => (
                    <TableRow key={index}>
                      <TableCell>{item.id}</TableCell>
                      <TableCell>{item.name}</TableCell>
                      <TableCell>{item.initialStock}</TableCell>
                      <TableCell>{item.totalSold}</TableCell>
                      <TableCell>{item.newStock}</TableCell>
                      <TableCell>
                        {item.success ? (
                          <Badge className="bg-green-500">Éxito</Badge>
                        ) : (
                          <Badge className="bg-red-500">Error</Badge>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
