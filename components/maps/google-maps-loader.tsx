"use client"

import { useState, useEffect, createContext, useContext, type ReactNode } from "react"
import { AlertCircle, RefreshCw } from "lucide-react"

// Contexto para Google Maps
type GoogleMapsContextType = {
  isLoaded: boolean
  isError: boolean
  maps: any | null // Changed type to 'any' to avoid TypeScript errors
  retryLoading: () => void
}

const GoogleMapsContext = createContext<GoogleMapsContextType>({
  isLoaded: false,
  isError: false,
  maps: null,
  retryLoading: () => {},
})

// Hook personalizado para usar Google Maps
export const useGoogleMaps = () => useContext(GoogleMapsContext)

interface GoogleMapsLoaderProps {
  children: ReactNode
  fallback?: ReactNode
}

export function GoogleMapsLoader({ children, fallback }: GoogleMapsLoaderProps) {
  const [isLoaded, setIsLoaded] = useState(false)
  const [isError, setIsError] = useState(false)
  const [errorMessage, setErrorMessage] = useState("")
  const [maps, setMaps] = useState<any | null>(null) // Changed type to 'any' to avoid TypeScript errors
  const [loadAttempts, setLoadAttempts] = useState(0)

  // Cargar Google Maps
  useEffect(() => {
    let isMounted = true

    const loadMaps = async () => {
      try {
        // Verificar si ya está cargado
        if (window.google && window.google.maps) {
          setMaps(window.google.maps)
          setIsLoaded(true)
          return
        }

        setIsError(false)
        setErrorMessage("")

        // Definir callback para cuando se cargue la API
        window.initGoogleMaps = () => {
          if (isMounted && window.google && window.google.maps) {
            setMaps(window.google.maps)
            setIsLoaded(true)
          }
        }

        // Obtener token JWT para la API de Google Maps
        const tokenResponse = await fetch("/api/maps/url")

        if (!tokenResponse.ok) {
          throw new Error(`Error obteniendo token: ${tokenResponse.status} ${tokenResponse.statusText}`)
        }

        const tokenData = await tokenResponse.json()

        if (!tokenData.token) {
          throw new Error("Token no encontrado en la respuesta")
        }

        // Obtener URL del script con el token
        const scriptResponse = await fetch("/api/maps/script", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            token: tokenData.token,
            libraries: "places,geometry",
          }),
        })

        if (!scriptResponse.ok) {
          throw new Error(`Error obteniendo script: ${scriptResponse.status} ${scriptResponse.statusText}`)
        }

        const scriptData = await scriptResponse.json()

        if (!scriptData.url) {
          throw new Error("URL del script no encontrada en la respuesta")
        }

        // Eliminar script anterior si existe
        const existingScript = document.getElementById("google-maps-script")
        if (existingScript) {
          existingScript.remove()
        }

        // Crear script con los atributos recomendados
        const script = document.createElement("script")
        script.id = "google-maps-script"
        script.src = `${scriptData.url}&callback=initGoogleMaps`
        script.async = true
        script.defer = true

        // Manejar errores
        script.onerror = (error) => {
          if (isMounted) {
            console.error("Error cargando Google Maps:", error)
            setIsError(true)
            setErrorMessage("Error al cargar el script de Google Maps")
          }
        }

        // Añadir script al DOM
        document.head.appendChild(script)
      } catch (error: any) {
        console.error("Error cargando Google Maps:", error)

        if (isMounted) {
          setIsError(true)
          setErrorMessage(error.message || "Error al cargar Google Maps")

          // Intentar obtener más información sobre el error
          fetch("/api/maps/debug")
            .then((res) => res.json())
            .then((data) => {
              if (isMounted && data.error) {
                setErrorMessage((prev) => `${prev}\n${data.error}`)
              }
            })
            .catch((err) => {
              console.error("Error obteniendo información de depuración:", err)
            })
        }
      }
    }

    if (!isLoaded && !isError) {
      loadMaps()
    }

    return () => {
      isMounted = false
    }
  }, [loadAttempts, isLoaded, isError])

  // Función para reintentar la carga
  const retryLoading = () => {
    setLoadAttempts((prev) => prev + 1)
  }

  // Si hay un error, mostrar mensaje y mapa estático alternativo
  if (isError) {
    return (
      <div className="p-4 bg-amber-50 rounded-lg border border-amber-200 text-amber-800">
        <div className="flex items-center mb-2">
          <AlertCircle className="h-5 w-5 text-amber-600 mr-2" />
          <h3 className="font-medium">Error al cargar el mapa interactivo</h3>
        </div>

        {/* Mapa estático como alternativa */}
        <div className="mb-4 overflow-hidden rounded-lg shadow-md">
          <a
            href="https://www.google.com/maps/search/?api=1&query=Av.+Coral+1140,+Valle+dorado,+San+Luis+Potosí"
            target="_blank"
            rel="noopener noreferrer"
            className="block"
          >
            <img
              src="https://maps.googleapis.com/maps/api/staticmap?center=Av.+Coral+1140,+Valle+dorado,+San+Luis+Potosí&zoom=15&size=600x300&maptype=roadmap&markers=color:red%7CAv.+Coral+1140,+Valle+dorado,+San+Luis+Potosí&key=AIzaSyDLzlvA6LLbYiY35Ch5XgJJmNp5VGBjmYQ"
              alt="Ubicación de Comedero Tus Tías"
              className="w-full h-64 object-cover"
            />
          </a>
        </div>

        {/* Información de ubicación del restaurante */}
        <div className="mb-4 p-3 bg-white rounded-lg shadow-sm">
          <h4 className="font-medium text-amber-900 mb-2">Comedero Tus Tías</h4>
          <p className="text-sm mb-1">
            <strong>Dirección:</strong> Av. Coral #1140, Valle dorado, San Luis Potosí
          </p>
          <p className="text-sm mb-1">
            <strong>Referencia:</strong> Cerca del estadio lastras
          </p>
          <p className="text-sm mb-3">
            <strong>Horario:</strong> Martes a sábado: 1:00 PM a 9:00 PM
          </p>
          <div className="flex flex-wrap gap-2">
            <a
              href="https://www.google.com/maps/dir/?api=1&destination=Av.+Coral+1140,+Valle+dorado,+San+Luis+Potosí"
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm bg-amber-600 hover:bg-amber-700 text-white py-2 px-4 rounded inline-flex items-center"
            >
              Cómo llegar
            </a>
            <button
              onClick={retryLoading}
              className="flex items-center text-sm border border-amber-600 text-amber-700 hover:bg-amber-50 py-2 px-4 rounded transition-colors"
            >
              <RefreshCw className="h-4 w-4 mr-1" />
              Reintentar
            </button>
          </div>
        </div>

        {/* Error técnico (colapsado por defecto) */}
        <details className="mt-2">
          <summary className="text-xs cursor-pointer hover:text-amber-900">Detalles técnicos del error</summary>
          <pre className="text-xs bg-amber-100 p-2 rounded mt-2 max-h-24 overflow-auto">{errorMessage}</pre>
        </details>
      </div>
    )
  }

  // Si está cargando y hay un fallback, mostrarlo
  if (!isLoaded && fallback) {
    return <>{fallback}</>
  }

  // Proporcionar el contexto
  return (
    <GoogleMapsContext.Provider value={{ isLoaded, isError, maps, retryLoading }}>
      {isLoaded ? (
        children
      ) : (
        <div className="flex items-center justify-center p-8 bg-amber-50 rounded-lg border border-amber-200 text-amber-800">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-700 mr-3"></div>
          <p>Cargando mapa...</p>
        </div>
      )}
    </GoogleMapsContext.Provider>
  )
}
