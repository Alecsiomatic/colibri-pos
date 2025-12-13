"use client"

import { useState } from "react"
import { toast } from "sonner"
import Link from "next/link"

export default function FixPermissionsPage() {
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)

  async function fixPermissions() {
    try {
      setLoading(true)
      setError(null)

      const response = await fetch("/api/admin/fix-permissions")
      const data = await response.json()

      setResult(data)

      if (data.success) {
        toast.success(data.message)
      } else {
        setError(data.message || "Error desconocido")
        toast.error(data.message || "Error desconocido")
      }
    } catch (err: any) {
      setError(err.message || "Error desconocido")
      toast.error(err.message || "Error desconocido")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-md p-6 w-full max-w-md">
        <h1 className="text-2xl font-bold text-amber-900 mb-6 text-center">Corregir Permisos de Administrador</h1>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            <p className="font-bold">Error</p>
            <p>{error}</p>
          </div>
        )}

        {result?.success && (
          <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
            <p className="font-bold">Éxito</p>
            <p>{result.message}</p>
          </div>
        )}

        <div className="space-y-4">
          <p className="text-gray-700">
            Esta herramienta corrige los permisos de administrador para tu cuenta. Úsala si estás experimentando
            problemas de acceso a funciones administrativas.
          </p>

          <button
            onClick={fixPermissions}
            disabled={loading}
            className="w-full bg-amber-600 text-white py-2 px-4 rounded hover:bg-amber-700 transition-colors disabled:opacity-50"
          >
            {loading ? "Corrigiendo permisos..." : "Corregir permisos"}
          </button>

          {result?.success && (
            <div className="text-center mt-4">
              <Link href="/admin/products" className="text-amber-600 hover:underline">
                Volver a la gestión de productos
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
