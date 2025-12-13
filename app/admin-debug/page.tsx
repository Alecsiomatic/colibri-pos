"use client"

import AdminLayout from "@/components/admin/admin-layout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Construction } from "lucide-react"
import Link from "next/link"

export default function AdminDebugPage() {
  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
            Debug de Administración
          </h1>
          <p className="text-muted-foreground">
            Panel de debug y diagnóstico del sistema
          </p>
        </div>

        <Card className="border-yellow-200 bg-yellow-50 dark:border-yellow-800 dark:bg-yellow-950">
          <CardContent className="p-8 text-center">
            <Construction className="h-16 w-16 mx-auto mb-4 text-yellow-600 dark:text-yellow-400" />
            <h3 className="text-xl font-semibold mb-2 text-yellow-800 dark:text-yellow-200">
              En Construcción
            </h3>
            <p className="text-yellow-700 dark:text-yellow-300 mb-6">
              Esta página está siendo migrada de Supabase a MySQL. 
              Próximamente tendrás acceso completo a las herramientas de debug.
            </p>
            <div className="flex gap-4 justify-center">
              <Button asChild variant="outline" className="border-yellow-600 text-yellow-700 hover:bg-yellow-100">
                <Link href="/admin/dashboard">Ir al Dashboard</Link>
              </Button>
              <Button asChild className="bg-yellow-600 hover:bg-yellow-700">
                <Link href="/admin/products">Gestionar Productos</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  )
}