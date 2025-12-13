"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Construction, Shield } from "lucide-react"
import Link from "next/link"

export default function AuthDebugPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-black to-indigo-900 flex items-center justify-center p-4">
      <Card className="w-full max-w-md border-purple-800 bg-black/50 backdrop-blur">
        <CardContent className="p-8 text-center">
          <Shield className="h-16 w-16 mx-auto mb-4 text-purple-400" />
          <h1 className="text-2xl font-bold mb-2 text-white">
            Debug de Autenticación
          </h1>
          <p className="text-gray-400 mb-6">
            Esta página está siendo migrada de Supabase a MySQL. 
            Próximamente con nuevas funcionalidades.
          </p>
          <div className="space-y-3">
            <Button asChild className="w-full bg-colibri-green hover:bg-colibri-green/90">
              <Link href="/login">🚀 Ir a Login</Link>
            </Button>
            <Button asChild variant="outline" className="w-full border-colibri-green text-colibri-green">
              <Link href="/admin/dashboard">Panel Admin</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}