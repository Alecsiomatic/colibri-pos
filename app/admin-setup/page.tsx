"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Construction, Settings } from "lucide-react"
import Link from "next/link"

export default function AdminSetupPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-black to-indigo-900 flex items-center justify-center p-4">
      <Card className="w-full max-w-md border-purple-800 bg-black/50 backdrop-blur">
        <CardContent className="p-8 text-center">
          <Settings className="h-16 w-16 mx-auto mb-4 text-purple-400" />
          <h1 className="text-2xl font-bold mb-2 text-white">
            Configuración de Admin
          </h1>
          <p className="text-gray-400 mb-6">
            La configuración inicial del administrador está siendo migrada 
            para usar MySQL en lugar de Supabase.
          </p>
          <div className="space-y-3">
            <Button asChild className="w-full bg-purple-600 hover:bg-purple-700">
              <Link href="/admin/dashboard">Panel Admin</Link>
            </Button>
            <Button asChild variant="outline" className="w-full border-purple-600 text-purple-400">
              <Link href="/admin/users">Gestionar Usuarios</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}