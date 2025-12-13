"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Loader2, CheckCircle, AlertCircle, AlertTriangle } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export default function ForceUpdateStockPage() {
  const [isProcessing, setIsProcessing] = useState(false)
  const [result, setResult] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)
  const [orderId, setOrderId] = useState<string>("")

  const updateStock = async (specificOrderId?: string) => {
    setIsProcessing(true)
    setError(null)
    setResult(null)

    try {
      const response = await fetch("/api/admin/stock/force-update", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          orderId: specificOrderId ? Number.parseInt(specificOrderId) : undefined,
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

  const handleUpdateAllStock = () => {
    updateStock()
  }

  const handleUpdateSpecificOrder = () => {
    if (!orderId || isNaN(Number.parseInt(orderId))) {
      setError("Por favor, ingresa un ID de pedido válido")
      return
    }
    updateStock(orderId)
  }

  return (
    <div className="container mx-auto py-8 space-y-8">
      <Card>
        <CardHeader>
          <CardTitle>Actualización Forzada de Stock</CardTitle>
          <CardDescription>
            Esta herramienta recalculará el stock de todos los productos basado en los pedidos existentes.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Alert variant="warning" className="mb-4">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Advertencia</AlertTitle>
            <AlertDescription>
              Esta operación sobrescribirá el stock actual de todos los productos. Úsala solo si el stock actual no es
              correcto.
            </AlertDescription>
          </Alert>
        </CardContent>
        <CardFooter>
          <Button onClick={handleUpdateAllStock} disabled={isProcessing} variant="destructive" className="w-full">
            {isProcessing ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Actualizando...
              </>
            ) : (
              "Actualizar Stock de Todos los Productos"
            )}
          </Button>
        </CardFooter>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Actualizar Stock para un Pedido Específico</CardTitle>
          <CardDescription>Actualiza el stock basado en un pedido específico.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid w-full items-center gap-4">
            <div className="flex flex-col space-y-1.5">
              <Label htmlFor="orderId">ID del Pedido</Label>
              <Input
                id="orderId"
                placeholder="Ingresa el ID del pedido"
                value={orderId}
                onChange={(e) => setOrderId(e.target.value)}
              />
            </div>
          </div>
        </CardContent>
        <CardFooter>
          <Button onClick={handleUpdateSpecificOrder} disabled={isProcessing || !orderId} className="w-full">
            {isProcessing ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Actualizando...
              </>
            ) : (
              "Actualizar Stock para este Pedido"
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
            <Alert className={result.productsFailed > 0 ? "bg-yellow-50" : "bg-green-50"}>
              {result.productsFailed > 0 ? (
                <AlertTriangle className="h-4 w-4 text-yellow-500" />
              ) : (
                <CheckCircle className="h-4 w-4 text-green-500" />
              )}
              <AlertTitle>Resumen</AlertTitle>
              <AlertDescription>
                Se actualizaron {result.productsUpdated} productos correctamente.
                {result.productsFailed > 0 && ` ${result.productsFailed} productos fallaron.`}
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
                      <TableCell>{item.productId}</TableCell>
                      <TableCell>{item.name}</TableCell>
                      <TableCell>{item.initialStock !== undefined ? item.initialStock : "-"}</TableCell>
                      <TableCell>
                        {item.sold !== undefined ? item.sold : item.quantity !== undefined ? item.quantity : "-"}
                      </TableCell>
                      <TableCell>{item.newStock !== undefined ? item.newStock : "-"}</TableCell>
                      <TableCell>
                        {item.status === "success" ? (
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
