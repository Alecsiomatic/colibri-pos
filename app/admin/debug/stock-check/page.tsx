"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Loader2 } from "lucide-react"

export default function StockCheckPage() {
  const [productId, setProductId] = useState("")
  const [productData, setProductData] = useState<any>(null)
  const [lowStockProducts, setLowStockProducts] = useState<any[]>([])
  const [recentChanges, setRecentChanges] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  // Cargar datos generales al iniciar
  useEffect(() => {
    fetchGeneralData()
  }, [])

  // Función para cargar datos generales
  const fetchGeneralData = async () => {
    setLoading(true)
    setError("")
    try {
      const response = await fetch("/api/debug/stock-check")
      const data = await response.json()

      if (data.error) {
        setError(data.error)
      } else {
        setLowStockProducts(data.lowStockProducts || [])
        setRecentChanges(data.recentChanges || [])
      }
    } catch (err: any) {
      setError(err.message || "Error al cargar datos")
    } finally {
      setLoading(false)
    }
  }

  // Función para buscar un producto específico
  const fetchProductData = async () => {
    if (!productId) {
      setError("Ingrese un ID de producto")
      return
    }

    setLoading(true)
    setError("")
    setProductData(null)

    try {
      const response = await fetch(`/api/debug/stock-check?productId=${productId}`)
      const data = await response.json()

      if (data.error) {
        setError(data.error)
      } else {
        setProductData(data)
      }
    } catch (err: any) {
      setError(err.message || "Error al cargar datos del producto")
    } finally {
      setLoading(false)
    }
  }

  // Formatear fecha
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString()
  }

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-6">Verificación de Stock</h1>

      <Tabs defaultValue="general">
        <TabsList className="mb-4">
          <TabsTrigger value="general">Visión General</TabsTrigger>
          <TabsTrigger value="product">Buscar Producto</TabsTrigger>
        </TabsList>

        <TabsContent value="general">
          <div className="grid gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Productos con Stock Bajo</CardTitle>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="flex justify-center p-4">
                    <Loader2 className="h-8 w-8 animate-spin text-gray-500" />
                  </div>
                ) : lowStockProducts.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>ID</TableHead>
                        <TableHead>Nombre</TableHead>
                        <TableHead>Precio</TableHead>
                        <TableHead>Stock</TableHead>
                        <TableHead>Acciones</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {lowStockProducts.map((product) => (
                        <TableRow key={product.id}>
                          <TableCell>{product.id}</TableCell>
                          <TableCell>{product.name}</TableCell>
                          <TableCell>${product.price.toFixed(2)}</TableCell>
                          <TableCell className={product.stock < 5 ? "text-red-500 font-bold" : ""}>
                            {product.stock}
                          </TableCell>
                          <TableCell>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setProductId(product.id.toString())
                                fetchProductData()
                                document.querySelector('[data-value="product"]')?.click()
                              }}
                            >
                              Ver Detalles
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <p className="text-center py-4">No hay productos con stock bajo</p>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Cambios Recientes de Stock</CardTitle>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="flex justify-center p-4">
                    <Loader2 className="h-8 w-8 animate-spin text-gray-500" />
                  </div>
                ) : recentChanges.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Producto ID</TableHead>
                        <TableHead>Tipo</TableHead>
                        <TableHead>Stock Anterior</TableHead>
                        <TableHead>Nuevo Stock</TableHead>
                        <TableHead>Cambio</TableHead>
                        <TableHead>Fecha</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {recentChanges.map((change, index) => (
                        <TableRow key={index}>
                          <TableCell>{change.product_id}</TableCell>
                          <TableCell>{change.change_type}</TableCell>
                          <TableCell>{change.previous_stock}</TableCell>
                          <TableCell>{change.new_stock}</TableCell>
                          <TableCell className={change.change_amount < 0 ? "text-red-500" : "text-green-500"}>
                            {change.change_amount > 0 ? `+${change.change_amount}` : change.change_amount}
                          </TableCell>
                          <TableCell>{formatDate(change.timestamp)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <p className="text-center py-4">No hay cambios recientes de stock</p>
                )}
              </CardContent>
            </Card>

            <Button onClick={fetchGeneralData}>Actualizar Datos</Button>
          </div>
        </TabsContent>

        <TabsContent value="product">
          <Card>
            <CardHeader>
              <CardTitle>Buscar Producto por ID</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex gap-4 mb-6">
                <Input
                  type="number"
                  placeholder="ID del producto"
                  value={productId}
                  onChange={(e) => setProductId(e.target.value)}
                />
                <Button onClick={fetchProductData}>Buscar</Button>
              </div>

              {error && (
                <Alert variant="destructive" className="mb-4">
                  <AlertTitle>Error</AlertTitle>
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              {loading ? (
                <div className="flex justify-center p-4">
                  <Loader2 className="h-8 w-8 animate-spin text-gray-500" />
                </div>
              ) : productData ? (
                <div className="space-y-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>Información del Producto</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-sm font-medium">ID</p>
                          <p>{productData.product.id}</p>
                        </div>
                        <div>
                          <p className="text-sm font-medium">Nombre</p>
                          <p>{productData.product.name}</p>
                        </div>
                        <div>
                          <p className="text-sm font-medium">Precio</p>
                          <p>${productData.product.price.toFixed(2)}</p>
                        </div>
                        <div>
                          <p className="text-sm font-medium">Stock Actual</p>
                          <p className={productData.product.stock < 5 ? "text-red-500 font-bold" : ""}>
                            {productData.product.stock}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Historial de Cambios de Stock</CardTitle>
                    </CardHeader>
                    <CardContent>
                      {productData.stockChanges && productData.stockChanges.length > 0 ? (
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Tipo</TableHead>
                              <TableHead>Stock Anterior</TableHead>
                              <TableHead>Nuevo Stock</TableHead>
                              <TableHead>Cambio</TableHead>
                              <TableHead>Referencia</TableHead>
                              <TableHead>Fecha</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {productData.stockChanges.map((change: any, index: number) => (
                              <TableRow key={index}>
                                <TableCell>{change.change_type}</TableCell>
                                <TableCell>{change.previous_stock}</TableCell>
                                <TableCell>{change.new_stock}</TableCell>
                                <TableCell className={change.change_amount < 0 ? "text-red-500" : "text-green-500"}>
                                  {change.change_amount > 0 ? `+${change.change_amount}` : change.change_amount}
                                </TableCell>
                                <TableCell>{change.reference_id ? `#${change.reference_id}` : "-"}</TableCell>
                                <TableCell>{formatDate(change.timestamp)}</TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      ) : (
                        <p className="text-center py-4">No hay historial de cambios para este producto</p>
                      )}
                    </CardContent>
                  </Card>
                </div>
              ) : null}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
