"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Loader2, CheckCircle, AlertCircle, AlertTriangle } from "lucide-react"

export default function ProcessOrdersPage() {
  const [isProcessing, setIsProcessing] = useState(false)
  const [result, setResult] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)

  const processOrders = async () => {
    setIsProcessing(true)
    setError(null)
    setResult(null)

    try {
      const response = await fetch("/api/admin/stock/process-existing-orders", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Error al procesar pedidos")
      }

      setResult(data)
    } catch (err) {
      console.error("Error:", err)
      setError(err instanceof Error ? err.message : "Error desconocido")
    } finally {
      setIsProcessing(false)
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "success":
        return <Badge className="bg-green-500">Éxito</Badge>
      case "failed":
        return <Badge className="bg-red-500">Fallido</Badge>
      case "skipped":
        return <Badge className="bg-yellow-500">Omitido</Badge>
      case "error":
        return <Badge className="bg-red-500">Error</Badge>
      default:
        return <Badge className="bg-gray-500">{status}</Badge>
    }
  }

  return (
    <div className="container mx-auto py-8">
      <Card>
        <CardHeader>
          <CardTitle>Procesar Pedidos Existentes</CardTitle>
          <CardDescription>
            Esta herramienta procesará todos los pedidos existentes que aún no han actualizado el stock de productos.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {result && !result.processed && !result.failed && (
            <Alert className="mb-4">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Información</AlertTitle>
              <AlertDescription>{result.message}</AlertDescription>
            </Alert>
          )}

          {result && (result.processed > 0 || result.failed > 0) && (
            <div className="space-y-4">
              <Alert className={result.failed > 0 ? "bg-yellow-50" : "bg-green-50"}>
                {result.failed > 0 ? (
                  <AlertTriangle className="h-4 w-4 text-yellow-500" />
                ) : (
                  <CheckCircle className="h-4 w-4 text-green-500" />
                )}
                <AlertTitle>Resultado del procesamiento</AlertTitle>
                <AlertDescription>
                  Se procesaron {result.processed} de {result.total} pedidos.
                  {result.failed > 0 && ` ${result.failed} pedidos fallaron.`}
                </AlertDescription>
              </Alert>

              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>ID Pedido</TableHead>
                      <TableHead>Estado</TableHead>
                      <TableHead>Razón</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {result.results.map((item: any, index: number) => (
                      <TableRow key={index}>
                        <TableCell>{item.orderId}</TableCell>
                        <TableCell>{getStatusBadge(item.status)}</TableCell>
                        <TableCell>{item.reason || "-"}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          )}
        </CardContent>
        <CardFooter>
          <Button onClick={processOrders} disabled={isProcessing} className="w-full md:w-auto">
            {isProcessing ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Procesando...
              </>
            ) : (
              "Procesar Pedidos"
            )}
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}
