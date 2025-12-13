"use client"

import { useState, useEffect } from "react"
import AdminLayout from "@/components/admin/admin-layout"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { AlertCircle, CheckCircle, Database, RefreshCw, Terminal, Wrench, ShieldAlert } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useRouter } from "next/navigation"

interface DebugInfo {
  database: {
    stockChangesTable: {
      exists: boolean
      error: string | null
    }
    stockColumn: {
      exists: boolean
      error: string | null
    }
  }
  recentOrders: any[]
  products: any[]
  errors: {
    orders: string | null
    products: string | null
  }
}

export default function StockDebugPage() {
  const router = useRouter()
  const [debugInfo, setDebugInfo] = useState<DebugInfo | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [testProductId, setTestProductId] = useState<number | "">("")
  const [testQuantity, setTestQuantity] = useState<number>(1)
  const [testOrderId, setTestOrderId] = useState<number | "">("")
  const [testResult, setTestResult] = useState<any | null>(null)
  const [isTestLoading, setIsTestLoading] = useState(false)
  const [authError, setAuthError] = useState<boolean>(false)

  // Cargar información de depuración
  useEffect(() => {
    async function loadDebugInfo() {
      setIsLoading(true)
      setError(null)
      setAuthError(false)

      try {
        const response = await fetch("/api/debug/stock")

        if (response.status === 403) {
          setAuthError(true)
          throw new Error("No tienes permisos para acceder a esta información. Debes ser administrador.")
        }

        if (!response.ok) {
          throw new Error(`Error ${response.status}: ${response.statusText}`)
        }

        const data = await response.json()
        setDebugInfo(data)
      } catch (err: any) {
        setError(err.message || "Error al cargar información de depuración")
        console.error("Error al cargar información de depuración:", err)
      } finally {
        setIsLoading(false)
      }
    }

    loadDebugInfo()
  }, [])

  // Probar actualización de stock manualmente
  const testStockUpdate = async () => {
    if (!testProductId) {
      setError("Selecciona un producto para la prueba")
      return
    }

    setIsTestLoading(true)
    setTestResult(null)
    setError(null)

    try {
      const response = await fetch("/api/debug/stock", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          productId: testProductId,
          quantity: testQuantity,
          orderId: testOrderId || undefined,
        }),
      })

      if (response.status === 403) {
        setAuthError(true)
        throw new Error("No tienes permisos para realizar esta acción. Debes ser administrador.")
      }

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || `Error ${response.status}: ${response.statusText}`)
      }

      const result = await response.json()
      setTestResult(result)

      // Recargar información de depuración
      setTimeout(() => {
        window.location.reload()
      }, 2000)
    } catch (err: any) {
      setError(err.message || "Error al probar actualización de stock")
      console.error("Error al probar actualización de stock:", err)
    } finally {
      setIsTestLoading(false)
    }
  }

  // Crear tabla stock_changes si no existe
  const createStockChangesTable = async () => {
    setIsLoading(true)
    setError(null)

    try {
      // Ejecutar SQL para crear la tabla
      const sqlResponse = await fetch("/api/admin/database/execute-sql", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          sql: `
          DO $$
          BEGIN
            IF NOT EXISTS (
              SELECT FROM information_schema.tables 
              WHERE table_schema = 'public' 
              AND table_name = 'stock_changes'
            ) THEN
              CREATE TABLE public.stock_changes (
                id SERIAL PRIMARY KEY,
                product_id INTEGER NOT NULL REFERENCES public.products(id),
                previous_stock INTEGER NOT NULL,
                new_stock INTEGER NOT NULL,
                change_amount INTEGER NOT NULL,
                change_type TEXT NOT NULL,
                reference_id INTEGER,
                notes TEXT,
                timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW()
              );
              
              ALTER TABLE public.stock_changes ENABLE ROW LEVEL SECURITY;
              
              CREATE POLICY "Admins can do everything" ON public.stock_changes
                FOR ALL
                TO authenticated
                USING (EXISTS (
                  SELECT 1 FROM public.users
                  WHERE users.id = auth.uid() AND users.is_admin = true
                ));
                
              CREATE POLICY "Everyone can read" ON public.stock_changes
                FOR SELECT
                TO authenticated
                USING (true);
                
              RAISE NOTICE 'Tabla stock_changes creada correctamente';
            ELSE
              RAISE NOTICE 'La tabla stock_changes ya existe';
            END IF;
          END $$;
          `,
        }),
      })

      if (sqlResponse.status === 403) {
        setAuthError(true)
        throw new Error("No tienes permisos para realizar esta acción. Debes ser administrador.")
      }

      if (!sqlResponse.ok) {
        throw new Error(`Error al ejecutar SQL: ${sqlResponse.statusText}`)
      }

      // Recargar la página
      window.location.reload()
    } catch (err: any) {
      setError(err.message || "Error al crear tabla stock_changes")
      console.error("Error al crear tabla stock_changes:", err)
    } finally {
      setIsLoading(false)
    }
  }

  // Añadir columna stock si no existe
  const addStockColumn = async () => {
    setIsLoading(true)
    setError(null)

    try {
      // Ejecutar SQL para añadir la columna
      const sqlResponse = await fetch("/api/admin/database/execute-sql", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          sql: `
          DO $$
          BEGIN
            IF NOT EXISTS (
              SELECT 1 
              FROM information_schema.columns 
              WHERE table_schema = 'public' 
              AND table_name = 'products' 
              AND column_name = 'stock'
            ) THEN
              ALTER TABLE public.products ADD COLUMN stock INTEGER DEFAULT 10;
              RAISE NOTICE 'Columna stock añadida a la tabla products';
            ELSE
              RAISE NOTICE 'La columna stock ya existe en la tabla products';
            END IF;
            
            -- Actualizar productos con stock NULL o sin valor
            UPDATE public.products 
            SET stock = 10 
            WHERE stock IS NULL OR stock < 0;
          END $$;
          `,
        }),
      })

      if (sqlResponse.status === 403) {
        setAuthError(true)
        throw new Error("No tienes permisos para realizar esta acción. Debes ser administrador.")
      }

      if (!sqlResponse.ok) {
        throw new Error(`Error al ejecutar SQL: ${sqlResponse.statusText}`)
      }

      // Recargar la página
      window.location.reload()
    } catch (err: any) {
      setError(err.message || "Error al añadir columna stock")
      console.error("Error al añadir columna stock:", err)
    } finally {
      setIsLoading(false)
    }
  }

  // Corregir el endpoint de pedidos
  const fixOrdersEndpoint = async () => {
    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch("/api/admin/database/fix-orders-endpoint", {
        method: "POST",
      })

      if (response.status === 403) {
        setAuthError(true)
        throw new Error("No tienes permisos para realizar esta acción. Debes ser administrador.")
      }

      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`)
      }

      // Mostrar mensaje de éxito
      setTestResult({
        success: true,
        message: "Endpoint de pedidos corregido correctamente. Reinicia el servidor para aplicar los cambios.",
      })
    } catch (err: any) {
      setError(err.message || "Error al corregir endpoint de pedidos")
      console.error("Error al corregir endpoint de pedidos:", err)
    } finally {
      setIsLoading(false)
    }
  }

  // Si hay un error de autenticación, mostrar mensaje y opción para ir al login
  if (authError) {
    return (
      <AdminLayout>
        <div className="container mx-auto py-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl flex items-center gap-2 text-red-600">
                <ShieldAlert className="h-6 w-6" />
                Error de Permisos
              </CardTitle>
              <CardDescription>No tienes permisos para acceder a esta página</CardDescription>
            </CardHeader>
            <CardContent>
              <Alert variant="destructive" className="mb-4">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Acceso Denegado</AlertTitle>
                <AlertDescription>
                  Esta página está restringida a usuarios administradores. Si deberías tener acceso, por favor inicia
                  sesión con una cuenta de administrador.
                </AlertDescription>
              </Alert>
              <div className="flex gap-4 mt-6">
                <Button onClick={() => router.push("/login")}>Ir a Iniciar Sesión</Button>
                <Button variant="outline" onClick={() => router.push("/admin/dashboard")}>
                  Volver al Dashboard
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </AdminLayout>
    )
  }

  return (
    <AdminLayout>
      <div className="container mx-auto py-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl flex items-center gap-2">
              <Terminal className="h-6 w-6" />
              Depuración del Sistema de Stock
            </CardTitle>
            <CardDescription>
              Herramientas para diagnosticar y corregir problemas con el sistema de stock
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

            {testResult && (
              <Alert variant={testResult.success ? "default" : "destructive"} className="mb-4">
                {testResult.success ? <CheckCircle className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
                <AlertTitle>{testResult.success ? "Éxito" : "Error"}</AlertTitle>
                <AlertDescription>
                  {testResult.success
                    ? testResult.message ||
                      `Stock del producto "${testResult.product}" actualizado de ${testResult.previousStock} a ${testResult.newStock} (cambio: -${testResult.change})`
                    : testResult.message}
                </AlertDescription>
              </Alert>
            )}

            {isLoading ? (
              <div className="flex justify-center items-center py-8">
                <RefreshCw className="h-8 w-8 animate-spin text-gray-400" />
              </div>
            ) : (
              <Tabs defaultValue="diagnostico">
                <TabsList className="mb-4">
                  <TabsTrigger value="diagnostico">Diagnóstico</TabsTrigger>
                  <TabsTrigger value="pruebas">Pruebas</TabsTrigger>
                  <TabsTrigger value="reparacion">Reparación</TabsTrigger>
                </TabsList>

                <TabsContent value="diagnostico">
                  {debugInfo && (
                    <div className="space-y-6">
                      <div className="rounded-md border p-4">
                        <h3 className="text-lg font-medium mb-2 flex items-center gap-2">
                          <Database className="h-5 w-5" />
                          Estado de la Base de Datos
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="p-3 rounded-md bg-gray-50">
                            <div className="font-medium">Tabla stock_changes</div>
                            <div className="flex items-center mt-1">
                              <div
                                className={`w-3 h-3 rounded-full mr-2 ${
                                  debugInfo.database.stockChangesTable.exists ? "bg-green-500" : "bg-red-500"
                                }`}
                              ></div>
                              <span>{debugInfo.database.stockChangesTable.exists ? "Existe" : "No existe"}</span>
                            </div>
                            {debugInfo.database.stockChangesTable.error && (
                              <div className="text-red-500 text-sm mt-1">
                                Error: {debugInfo.database.stockChangesTable.error}
                              </div>
                            )}
                          </div>

                          <div className="p-3 rounded-md bg-gray-50">
                            <div className="font-medium">Columna stock en products</div>
                            <div className="flex items-center mt-1">
                              <div
                                className={`w-3 h-3 rounded-full mr-2 ${
                                  debugInfo.database.stockColumn.exists ? "bg-green-500" : "bg-red-500"
                                }`}
                              ></div>
                              <span>{debugInfo.database.stockColumn.exists ? "Existe" : "No existe"}</span>
                            </div>
                            {debugInfo.database.stockColumn.error && (
                              <div className="text-red-500 text-sm mt-1">
                                Error: {debugInfo.database.stockColumn.error}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="rounded-md border">
                        <h3 className="text-lg font-medium p-4 border-b">Productos Recientes</h3>
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>ID</TableHead>
                              <TableHead>Nombre</TableHead>
                              <TableHead>Precio</TableHead>
                              <TableHead>Stock</TableHead>
                              <TableHead>Categoría</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {debugInfo.products.length === 0 ? (
                              <TableRow>
                                <TableCell colSpan={5} className="text-center py-4 text-gray-500">
                                  No se encontraron productos
                                </TableCell>
                              </TableRow>
                            ) : (
                              debugInfo.products.map((product) => (
                                <TableRow key={product.id}>
                                  <TableCell>{product.id}</TableCell>
                                  <TableCell>{product.name}</TableCell>
                                  <TableCell>${product.price?.toFixed(2) || "N/A"}</TableCell>
                                  <TableCell>
                                    <span
                                      className={`font-medium ${
                                        product.stock === null || product.stock === undefined
                                          ? "text-red-600"
                                          : product.stock <= 5
                                            ? "text-red-600"
                                            : product.stock <= 10
                                              ? "text-amber-600"
                                              : "text-green-600"
                                      }`}
                                    >
                                      {product.stock === null || product.stock === undefined
                                        ? "Sin valor"
                                        : product.stock}
                                    </span>
                                  </TableCell>
                                  <TableCell>{product.category}</TableCell>
                                </TableRow>
                              ))
                            )}
                          </TableBody>
                        </Table>
                      </div>

                      <div className="rounded-md border">
                        <h3 className="text-lg font-medium p-4 border-b">Pedidos Recientes</h3>
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>ID</TableHead>
                              <TableHead>Usuario</TableHead>
                              <TableHead>Total</TableHead>
                              <TableHead>Estado</TableHead>
                              <TableHead>Fecha</TableHead>
                              <TableHead>Items</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {debugInfo.recentOrders.length === 0 ? (
                              <TableRow>
                                <TableCell colSpan={6} className="text-center py-4 text-gray-500">
                                  No se encontraron pedidos recientes
                                </TableCell>
                              </TableRow>
                            ) : (
                              debugInfo.recentOrders.map((order) => (
                                <TableRow key={order.id}>
                                  <TableCell>{order.id}</TableCell>
                                  <TableCell>{order.user_id}</TableCell>
                                  <TableCell>${order.total?.toFixed(2) || "N/A"}</TableCell>
                                  <TableCell>{order.status || "Pendiente"}</TableCell>
                                  <TableCell>{new Date(order.created_at).toLocaleString()}</TableCell>
                                  <TableCell>
                                    <details>
                                      <summary className="cursor-pointer text-blue-600">Ver items</summary>
                                      <pre className="mt-2 p-2 bg-gray-100 rounded text-xs overflow-auto max-h-40">
                                        {JSON.stringify(
                                          typeof order.items === "string" ? JSON.parse(order.items) : order.items,
                                          null,
                                          2,
                                        )}
                                      </pre>
                                    </details>
                                  </TableCell>
                                </TableRow>
                              ))
                            )}
                          </TableBody>
                        </Table>
                      </div>
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="pruebas">
                  <div className="rounded-md border p-4">
                    <h3 className="text-lg font-medium mb-4">Probar Actualización de Stock</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="productId">Producto</Label>
                        <select
                          id="productId"
                          className="w-full p-2 border rounded-md mt-1"
                          value={testProductId}
                          onChange={(e) => setTestProductId(Number(e.target.value))}
                        >
                          <option value="">Selecciona un producto</option>
                          {debugInfo?.products.map((product) => (
                            <option key={product.id} value={product.id}>
                              {product.name} (Stock actual: {product.stock || 0})
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <Label htmlFor="quantity">Cantidad a descontar</Label>
                        <Input
                          id="quantity"
                          type="number"
                          min="1"
                          value={testQuantity}
                          onChange={(e) => setTestQuantity(Number(e.target.value))}
                          className="mt-1"
                        />
                      </div>

                      <div>
                        <Label htmlFor="orderId">ID de Pedido (opcional)</Label>
                        <Input
                          id="orderId"
                          type="number"
                          min="1"
                          value={testOrderId}
                          onChange={(e) => setTestOrderId(e.target.value ? Number(e.target.value) : "")}
                          className="mt-1"
                          placeholder="Dejar en blanco para prueba manual"
                        />
                      </div>
                    </div>

                    <div className="mt-4">
                      <Button onClick={testStockUpdate} disabled={isTestLoading}>
                        {isTestLoading ? (
                          <>
                            <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                            Probando...
                          </>
                        ) : (
                          <>Probar Actualización</>
                        )}
                      </Button>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="reparacion">
                  <div className="space-y-4">
                    <div className="rounded-md border p-4">
                      <h3 className="text-lg font-medium mb-2 flex items-center gap-2">
                        <Wrench className="h-5 w-5" />
                        Herramientas de Reparación
                      </h3>
                      <p className="text-gray-500 mb-4">
                        Estas herramientas pueden ayudar a corregir problemas con el sistema de stock. Úsalas con
                        precaución.
                      </p>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Card>
                          <CardHeader>
                            <CardTitle>Crear Tabla stock_changes</CardTitle>
                            <CardDescription>
                              Crea la tabla para registrar cambios de stock si no existe
                            </CardDescription>
                          </CardHeader>
                          <CardFooter>
                            <Button
                              onClick={createStockChangesTable}
                              disabled={isLoading || debugInfo?.database.stockChangesTable.exists}
                              variant={debugInfo?.database.stockChangesTable.exists ? "outline" : "default"}
                            >
                              {isLoading ? (
                                <>
                                  <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                                  Procesando...
                                </>
                              ) : debugInfo?.database.stockChangesTable.exists ? (
                                "Ya existe"
                              ) : (
                                "Crear Tabla"
                              )}
                            </Button>
                          </CardFooter>
                        </Card>

                        <Card>
                          <CardHeader>
                            <CardTitle>Añadir Columna stock</CardTitle>
                            <CardDescription>Añade la columna stock a la tabla products si no existe</CardDescription>
                          </CardHeader>
                          <CardFooter>
                            <Button
                              onClick={addStockColumn}
                              disabled={isLoading || debugInfo?.database.stockColumn.exists}
                              variant={debugInfo?.database.stockColumn.exists ? "outline" : "default"}
                            >
                              {isLoading ? (
                                <>
                                  <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                                  Procesando...
                                </>
                              ) : debugInfo?.database.stockColumn.exists ? (
                                "Ya existe"
                              ) : (
                                "Añadir Columna"
                              )}
                            </Button>
                          </CardFooter>
                        </Card>

                        <Card>
                          <CardHeader>
                            <CardTitle>Corregir Endpoint de Pedidos</CardTitle>
                            <CardDescription>
                              Actualiza el código del endpoint de pedidos para manejar correctamente el stock
                            </CardDescription>
                          </CardHeader>
                          <CardFooter>
                            <Button onClick={fixOrdersEndpoint} disabled={isLoading}>
                              {isLoading ? (
                                <>
                                  <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                                  Procesando...
                                </>
                              ) : (
                                "Corregir Endpoint"
                              )}
                            </Button>
                          </CardFooter>
                        </Card>
                      </div>
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
            )}
          </CardContent>

          <CardFooter className="flex justify-between">
            <div className="text-sm text-gray-500">Última actualización: {new Date().toLocaleString()}</div>
            <Button variant="outline" onClick={() => window.location.reload()}>
              Actualizar Datos
            </Button>
          </CardFooter>
        </Card>
      </div>
    </AdminLayout>
  )
}
