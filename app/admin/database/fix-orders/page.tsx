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

export default function FixOrdersStructurePage() {
  const [isProcessing, setIsProcessing] = useState(false)
  const [result, setResult] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)
  const [orderId, setOrderId] = useState<string>("")

  const fixOrdersStructure = async (fixAll: boolean, specificOrderId?: string) => {
    setIsProcessing(true)
    setError(null)
    setResult(null)

    try {
      const response = await fetch("/api/admin/database/fix-orders-structure", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          fixAll,
          orderId: specificOrderId ? Number.parseInt(specificOrderId) : undefined,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Error al corregir la estructura de pedidos")
      }

      setResult(data)
    } catch (err) {
      console.error("Error:", err)
      setError(err instanceof Error ? err.message : "Error desconocido")
    } finally {
      setIsProcessing(false)
    }
  }

  const handleFixAllOrders = () => {
    fixOrdersStructure(true)
  }

  const handleFixSpecificOrder = () => {
    if (!orderId || isNaN(Number.parseInt(orderId))) {
      setError("Por favor, ingresa un ID de pedido válido")
      return
    }
    fixOrdersStructure(false, orderId)
  }

  return (
    <div className="container mx-auto py-8 space-y-8">
      <Card>
        <CardHeader>
          <CardTitle>Corregir Estructura de Pedidos</CardTitle>
          <CardDescription>
            Esta herramienta corrige la estructura de los pedidos para asegurar que los items estén almacenados
            correctamente.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Alert variant="warning" className="mb-4">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Advertencia</AlertTitle>
            <AlertDescription>
              Esta operación modificará la estructura de los pedidos. Asegúrate de tener una copia de seguridad de la
              base de datos.
            </AlertDescription>
          </Alert>
        </CardContent>
        <CardFooter>
          <Button onClick={handleFixAllOrders} disabled={isProcessing} variant="destructive" className="w-full">
            {isProcessing ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Corrigiendo...
              </>
            ) : (
              "Corregir Todos los Pedidos"
            )}
          </Button>
        </CardFooter>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Corregir un Pedido Específico</CardTitle>
          <CardDescription>Corrige la estructura de un pedido específico.</CardDescription>
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
          <Button onClick={handleFixSpecificOrder} disabled={isProcessing || !orderId} className="w-full">
            {isProcessing ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Corrigiendo...
              </>
            ) : (
              "Corregir este Pedido"
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
            <CardTitle>Resultado de la Corrección</CardTitle>
            <CardDescription>{result.message}</CardDescription>
          </CardHeader>
          <CardContent>
            <Alert className={result.failed_count > 0 ? "bg-yellow-50" : "bg-green-50"}>
              {result.failed_count > 0 ? (
                <AlertTriangle className="h-4 w-4 text-yellow-500" />
              ) : (
                <CheckCircle className="h-4 w-4 text-green-500" />
              )}
              <AlertTitle>Resumen</AlertTitle>
              <AlertDescription>
                Se corrigieron {result.fixed_count} pedidos correctamente.
                {result.failed_count > 0 && ` ${result.failed_count} pedidos fallaron.`}
              </AlertDescription>
            </Alert>

            {result.results && result.results.length > 0 && (
              <div className="mt-4 rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>ID</TableHead>
                      <TableHead>Estado</TableHead>
                      <TableHead>Descripción</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {result.results.map((item: any, index: number) => (
                      <TableRow key={index}>
                        <TableCell>{item.id}</TableCell>
                        <TableCell>
                          {item.success ? (
                            <Badge className="bg-green-500">Éxito</Badge>
                          ) : (
                            <Badge className="bg-red-500">Error</Badge>
                          )}
                        </TableCell>
                        <TableCell>{item.description || item.error || "-"}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
