"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Loader2, AlertCircle, RefreshCw } from "lucide-react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

export default function StockManagerPage() {
  const [isProcessingAll, setIsProcessingAll] = useState(false)
  const [isProcessingSingle, setIsProcessingSingle] = useState(false)
  const [orderId, setOrderId] = useState("")
  const [resultAll, setResultAll] = useState<any>(null)
  const [resultSingle, setResultSingle] = useState<any>(null)
  const [errorAll, setErrorAll] = useState<string | null>(null)
  const [errorSingle, setErrorSingle] = useState<string | null>(null)

  const updateStockFromAllOrders = async () => {
    setIsProcessingAll(true)
    setErrorAll(null)
    setResultAll(null)

    try {
      const response = await fetch("/api/admin/stock/update-from-all-orders", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Error al actualizar stock")
      }

      setResultAll(data)
    } catch (err) {
      console.error("Error:", err)
      setErrorAll(err instanceof Error ? err.message : "Error desconocido")
    } finally {
      setIsProcessingAll(false)
    }
  }

  const updateStockFromOrder = async () => {
    if (!orderId) {
      setErrorSingle("ID de pedido requerido")
      return
    }

    setIsProcessingSingle(true)
    setErrorSingle(null)
    setResultSingle(null)

    try {
      const response = await fetch("/api/admin/stock/update-from-order", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ orderId: Number(orderId) }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Error al actualizar stock")
      }

      setResultSingle(data)
    } catch (err) {
      console.error("Error:", err)
      setErrorSingle(err instanceof Error ? err.message : "Error desconocido")
    } finally {
      setIsProcessingSingle(false)
    }
  }

  return (
    <div className="container mx-auto py-8 space-y-8">
      <h1 className="text-3xl font-bold">Gestor de Stock</h1>

      <Tabs defaultValue="all">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="all">Procesar Todos los Pedidos</TabsTrigger>
          <TabsTrigger value="single">Procesar Pedido Individual</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Actualizar Stock desde Todos los Pedidos</CardTitle>
              <CardDescription>
                Esta herramienta actualizará el stock de todos los productos basado en los pedidos no procesados.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Alert className="mb-4">
                <RefreshCw className="h-4 w-4" />
                <AlertTitle>Información</AlertTitle>
                <AlertDescription>
                  Esta operación procesará todos los pedidos que aún no han sido procesados para actualizar el stock.
                </AlertDescription>
              </Alert>
            </CardContent>
            <CardFooter>
              <Button onClick={updateStockFromAllOrders} disabled={isProcessingAll} className="w-full">
                {isProcessingAll ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Procesando...
                  </>
                ) : (
                  "Procesar Todos los Pedidos"
                )}
              </Button>
            </CardFooter>
          </Card>

          {errorAll && (
            <Alert variant="destructive" className="mt-4">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{errorAll}</AlertDescription>
            </Alert>
          )}

          {resultAll && (
            <Card className="mt-4">
              <CardHeader>
                <CardTitle>Resultado</CardTitle>
                <CardDescription>{resultAll.message}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <p>Pedidos procesados: {resultAll.processedOrders}</p>
                  <p>Pedidos fallidos: {resultAll.failedOrders}</p>
                </div>

                {resultAll.details && resultAll.details.length > 0 && (
                  <div className="mt-4 rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Pedido ID</TableHead>
                          <TableHead>Estado</TableHead>
                          <TableHead>Mensaje</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {resultAll.details.map((detail: any, index: number) => (
                          <TableRow key={index}>
                            <TableCell>{detail.orderId}</TableCell>
                            <TableCell>
                              {detail.success ? (
                                <Badge className="bg-green-500">Éxito</Badge>
                              ) : (
                                <Badge className="bg-red-500">Error</Badge>
                              )}
                            </TableCell>
                            <TableCell>{detail.message}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="single" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Actualizar Stock desde un Pedido Específico</CardTitle>
              <CardDescription>Esta herramienta actualizará el stock basado en un pedido específico.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid w-full items-center gap-1.5">
                  <Input
                    type="number"
                    placeholder="ID del Pedido"
                    value={orderId}
                    onChange={(e) => setOrderId(e.target.value)}
                  />
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <Button onClick={updateStockFromOrder} disabled={isProcessingSingle} className="w-full">
                {isProcessingSingle ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Procesando...
                  </>
                ) : (
                  "Procesar Pedido"
                )}
              </Button>
            </CardFooter>
          </Card>

          {errorSingle && (
            <Alert variant="destructive" className="mt-4">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{errorSingle}</AlertDescription>
            </Alert>
          )}

          {resultSingle && (
            <Card className="mt-4">
              <CardHeader>
                <CardTitle>Resultado</CardTitle>
                <CardDescription>{resultSingle.message}</CardDescription>
              </CardHeader>
              <CardContent>
                {resultSingle.updatedProducts && resultSingle.updatedProducts.length > 0 && (
                  <div className="rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>ID</TableHead>
                          <TableHead>Producto</TableHead>
                          <TableHead>Stock Anterior</TableHead>
                          <TableHead>Cantidad</TableHead>
                          <TableHead>Nuevo Stock</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {resultSingle.updatedProducts.map((product: any, index: number) => (
                          <TableRow key={index}>
                            <TableCell>{product.id}</TableCell>
                            <TableCell>{product.name}</TableCell>
                            <TableCell>{product.previousStock}</TableCell>
                            <TableCell>{product.quantity}</TableCell>
                            <TableCell>{product.newStock}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
