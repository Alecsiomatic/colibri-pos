"use client"

import { useState, useEffect } from "react"
import AdminLayout from "@/components/admin/admin-layout"

export default function AuthCheckPage() {
  const [authData, setAuthData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function checkAuth() {
      try {
        setLoading(true)
        const response = await fetch("/api/debug/auth-check")
        const data = await response.json()
        setAuthData(data)
      } catch (err: any) {
        setError(err.message || "Error al verificar autenticación")
      } finally {
        setLoading(false)
      }
    }

    checkAuth()
  }, [])

  return (
    <AdminLayout>
      <div className="bg-white rounded-lg shadow-md p-6">
        <h1 className="text-2xl font-bold text-amber-900 mb-6">Verificación de Autenticación</h1>

        {loading ? (
          <p className="text-center py-4">Verificando autenticación...</p>
        ) : error ? (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
            <p className="font-bold">Error</p>
            <p>{error}</p>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="bg-amber-50 p-4 rounded-lg">
              <h2 className="text-lg font-semibold text-amber-900 mb-2">Estado de Autenticación</h2>
              <p className="mb-2">
                <span className="font-medium">Autenticado: </span>
                <span className={authData?.authenticated ? "text-green-600" : "text-red-600"}>
                  {authData?.authenticated ? "Sí" : "No"}
                </span>
              </p>
              <p className="mb-2">
                <span className="font-medium">Sesión activa: </span>
                <span className={authData?.session?.exists ? "text-green-600" : "text-red-600"}>
                  {authData?.session?.exists ? "Sí" : "No"}
                </span>
              </p>
              <p className="mb-2">
                <span className="font-medium">Token JWT: </span>
                <span className={authData?.jwt?.exists ? "text-green-600" : "text-red-600"}>
                  {authData?.jwt?.exists ? "Presente" : "No encontrado"}
                </span>
              </p>
            </div>

            {authData?.user && (
              <div className="bg-amber-50 p-4 rounded-lg">
                <h2 className="text-lg font-semibold text-amber-900 mb-2">Información del Usuario</h2>
                <p className="mb-2">
                  <span className="font-medium">ID: </span>
                  {authData.user.id}
                </p>
                <p className="mb-2">
                  <span className="font-medium">Email: </span>
                  {authData.user.email}
                </p>
                <p className="mb-2">
                  <span className="font-medium">Rol: </span>
                  {authData.user.role || "No especificado"}
                </p>
              </div>
            )}

            <div className="bg-amber-50 p-4 rounded-lg">
              <h2 className="text-lg font-semibold text-amber-900 mb-2">Permisos de Administrador</h2>
              <p className="mb-2">
                <span className="font-medium">Es administrador: </span>
                <span className={authData?.admin?.isAdmin ? "text-green-600" : "text-red-600"}>
                  {authData?.admin?.isAdmin ? "Sí" : "No"}
                </span>
              </p>
              {authData?.admin?.error && <p className="text-red-600">Error: {authData.admin.error}</p>}
            </div>

            <div className="bg-amber-50 p-4 rounded-lg">
              <h2 className="text-lg font-semibold text-amber-900 mb-2">Cookies</h2>
              <ul className="list-disc list-inside">
                {authData?.cookies?.names.map((name: string) => (
                  <li key={name}>{name}</li>
                ))}
              </ul>
            </div>

            <div className="bg-amber-50 p-4 rounded-lg">
              <h2 className="text-lg font-semibold text-amber-900 mb-2">Datos Completos</h2>
              <pre className="bg-gray-100 p-4 rounded overflow-auto max-h-96 text-xs">
                {JSON.stringify(authData, null, 2)}
              </pre>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  )
}
