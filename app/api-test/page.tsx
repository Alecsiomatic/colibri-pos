"use client"

import { useState, useEffect } from "react"

export default function ApiTestPage() {
  const [testResult, setTestResult] = useState<any>(null)
  const [apiStatus, setApiStatus] = useState<{ configured: boolean } | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function runTest() {
      try {
        setLoading(true)
        setError(null)

        // Primero verificamos el estado de la API key
        const statusResponse = await fetch("/api/openai-status")
        const statusData = await statusResponse.json()
        setApiStatus(statusData)

        // Solo hacemos la prueba si la API key está configurada
        if (statusData.configured) {
          const response = await fetch("/api/openai-simple-test")
          const data = await response.json()
          setTestResult(data)
        }
      } catch (err: any) {
        setError(err.message || "Error desconocido")
      } finally {
        setLoading(false)
      }
    }

    runTest()
  }, [])

  return (
    <div className="container mx-auto p-4 max-w-3xl">
      <h1 className="text-2xl font-bold mb-4">Prueba de API de OpenAI</h1>

      {loading && (
        <div className="bg-blue-50 p-4 rounded-md mb-4">
          <p className="text-blue-700">Cargando...</p>
        </div>
      )}

      {error && (
        <div className="bg-red-50 p-4 rounded-md mb-4 border-l-4 border-red-500">
          <h2 className="text-lg font-semibold text-red-700 mb-2">Error</h2>
          <p className="text-red-700">{error}</p>
        </div>
      )}

      {apiStatus && !apiStatus.configured && (
        <div className="bg-yellow-50 p-4 rounded-md mb-4 border-l-4 border-yellow-500">
          <h2 className="text-lg font-semibold text-yellow-700 mb-2">API Key no configurada</h2>
          <p className="text-yellow-700">
            La API Key de OpenAI no está configurada en el servidor. Por favor, configura la variable de entorno
            OPENAI_API_KEY.
          </p>
        </div>
      )}

      {testResult && (
        <div className={`p-4 rounded-md mb-4 ${testResult.success ? "bg-green-50" : "bg-red-50"}`}>
          <h2 className="text-lg font-semibold mb-2">{testResult.success ? "Éxito" : "Error"}</h2>
          <pre className="bg-gray-100 p-4 rounded-md overflow-auto text-sm">{JSON.stringify(testResult, null, 2)}</pre>
        </div>
      )}

      <div className="mt-6">
        <h2 className="text-xl font-semibold mb-2">Información de depuración</h2>
        <div className="bg-gray-100 p-4 rounded-md">
          <p className="mb-2">
            <strong>API Key configurada en el servidor:</strong> {apiStatus?.configured ? "Sí" : "No"}
          </p>
          <p className="mb-2">
            <strong>Entorno:</strong> {process.env.NODE_ENV}
          </p>
          <div className="flex space-x-4 mt-4">
            <a
              href="/menu"
              className="bg-gold-DEFAULT text-white px-4 py-2 rounded-md hover:bg-gold-dark transition-colors"
              style={{ backgroundColor: "#D4AF37" }}
            >
              Ir al Menú
            </a>
            <button
              onClick={() => window.location.reload()}
              className="bg-gray-200 text-gray-800 px-4 py-2 rounded-md hover:bg-gray-300 transition-colors"
            >
              Volver a probar
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
