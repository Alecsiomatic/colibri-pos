"use client"

import AdminLayout from "@/components/admin/admin-layout"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Construction, Package } from "lucide-react"
import Link from "next/link"

export default function StockPage() {
  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
            Gestión de Stock
          </h1>
          <p className="text-muted-foreground">
            Control avanzado de stock y movimientos de inventario
          </p>
        </div>

        <Card className="border-orange-200 bg-orange-50 dark:border-orange-800 dark:bg-orange-950">
          <CardContent className="p-8 text-center">
            <Package className="h-16 w-16 mx-auto mb-4 text-orange-600 dark:text-orange-400" />
            <h3 className="text-xl font-semibold mb-2 text-orange-800 dark:text-orange-200">
              Control de Stock
            </h3>
            <p className="text-orange-700 dark:text-orange-300 mb-6">
              El sistema de stock está siendo migrado con nuevas funcionalidades. 
              Usa el panel de inventario principal mientras tanto.
            </p>
            <div className="flex gap-4 justify-center">
              <Button asChild variant="outline" className="border-orange-600 text-orange-700 hover:bg-orange-100">
                <Link href="/admin/inventory">Panel de Inventario</Link>
              </Button>
              <Button asChild className="bg-orange-600 hover:bg-orange-700">
                <Link href="/admin/products">Gestionar Productos</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  )
}