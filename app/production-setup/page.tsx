"use client"

import { useState } from "react"

export default function ProductionSetupPage() {
  const [serviceKey, setServiceKey] = useState("")
  const [result, setResult] = useState<any>(null)
  const [loading, setLoading] = useState(false)

  const handleSetup = async () => {
    if (!serviceKey) {
      setResult({ success: false, message: "Ingresa los primeros 10 caracteres de la clave de servicio" })
      return
    }

    setLoading(true)
    setResult(null)

    try {
      const response = await fetch("/api/admin/setup-production", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          authorization: serviceKey,
        }),
      })

      const data = await response.json()
      setResult(data)
    } catch (error: any) {
      setResult({
        success: false,
        message: "Error al realizar la configuración",
        error: error.message,
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-100 p-4">
      <div className="max-w-md mx-auto bg-white rounded-lg shadow-md p-6">
        <h1 className="text-2xl font-bold mb-6 text-center">Configuración de Producción</h1>

        <div className="mb-6">
          <p className="text-gray-700 mb-4">
            Esta herramienta te ayudará a configurar un usuario administrador en el entorno de producción. Esto es útil
            cuando despliegas la aplicación por primera vez o cuando tienes problemas con las credenciales.
          </p>
        </div>

        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Primeros 10 caracteres de SUPABASE_SERVICE_ROLE_KEY
          </label>
          <input
            type="text"
            value={serviceKey}
            onChange={(e) => setServiceKey(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md"
            placeholder="eyJhbGciOi..."
          />
          <p className="text-xs text-gray-500 mt-1">
            Por seguridad, solo ingresa los primeros 10 caracteres de la clave de servicio.
          </p>
        </div>

        <button
          onClick={handleSetup}
          disabled={loading}
          className="w-full bg-amber-700 hover:bg-amber-800 text-white py-2 px-4 rounded-md transition-colors disabled:opacity-50"
        >
          {loading ? "Configurando..." : "Configurar Usuario Administrador"}
        </button>

        {result && (
          <div
            className={`mt-4 p-4 rounded ${
              result.success ? "bg-green-100 border border-green-400" : "bg-red-100 border border-red-400"
            }`}
          >
            <h3 className={`font-medium ${result.success ? "text-green-800" : "text-red-800"}`}>
              {result.success ? "Éxito" : "Error"}
            </h3>
            <p className={result.success ? "text-green-700" : "text-red-700"}>{result.message}</p>
            {result.user && (
              <div className="mt-2 p-2 bg-gray-50 rounded">
                <p className="font-medium">Credenciales:</p>
                <p>Email: {result.user.email}</p>
                <p>Contraseña: {result.user.password || "Admin123! (cambiar después del primer inicio de sesión)"}</p>
              </div>
            )}
          </div>
        )}

        <div className="mt-6 text-center">
          <a href="/login" className="text-amber-700 hover:underline">
            Volver a la página de inicio de sesión
          </a>
        </div>
      </div>
    </div>
  )
}
