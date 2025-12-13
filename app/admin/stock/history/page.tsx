"use client"

import AdminLayout from "@/components/admin/admin-layout"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Construction, History } from "lucide-react"
import Link from "next/link"

export default function StockHistoryPage() {
  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
            Historial de Stock
          </h1>
          <p className="text-muted-foreground">
            Registro completo de movimientos de inventario
          </p>
        </div>

        <Card className="border-indigo-200 bg-indigo-50 dark:border-indigo-800 dark:bg-indigo-950">
          <CardContent className="p-8 text-center">
            <History className="h-16 w-16 mx-auto mb-4 text-indigo-600 dark:text-indigo-400" />
            <h3 className="text-xl font-semibold mb-2 text-indigo-800 dark:text-indigo-200">
              Historial Avanzado
            </h3>
            <p className="text-indigo-700 dark:text-indigo-300 mb-6">
              El historial de movimientos está siendo actualizado con 
              mejores filtros y reportes detallados.
            </p>
            <div className="flex gap-4 justify-center">
              <Button asChild variant="outline" className="border-indigo-600 text-indigo-700 hover:bg-indigo-100">
                <Link href="/admin/inventory">Panel de Inventario</Link>
              </Button>
              <Button asChild className="bg-indigo-600 hover:bg-indigo-700">
                <Link href="/admin/products">Gestionar Productos</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  )
}