"use client"

import { useState, useEffect } from "react"
import { Navigation } from "lucide-react"

interface LocationMapProps {
  address: string
  className?: string
}

export default function LocationMap({ address, className = "" }: LocationMapProps) {
  const [isClient, setIsClient] = useState(false)

  // Coordenadas del restaurante (hardcodeadas)
  const restaurantCoords = "22.1494,-100.9792"
  const encodedAddress = encodeURIComponent(address)

  // Asegurarse de que estamos en el cliente
  useEffect(() => {
    setIsClient(true)
  }, [])

  // Si no estamos en el cliente, mostrar un placeholder
  if (!isClient) {
    return (
      <div className={`flex items-center justify-center bg-amber-50 p-4 rounded-lg ${className}`}>
        <div className="animate-pulse flex flex-col items-center">
          <div className="rounded-full bg-amber-300 h-12 w-12 mb-2"></div>
          <div className="h-4 bg-amber-300 rounded w-3/4 mb-2"></div>
          <div className="h-3 bg-amber-200 rounded w-1/2 mb-4"></div>
          <div className="h-8 bg-amber-400 rounded w-40"></div>
        </div>
      </div>
    )
  }

  // En el cliente, mostrar un iframe de Google Maps
  return (
    <div className={`relative ${className}`}>
      <iframe
        src={`https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3696.6533377911236!2d-100.98138892414062!3d22.149399979478387!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x842aa371dc41b1c9%3A0x4e7c1fe5dcb42780!2sAv.%20Coral%201140%2C%20Valle%20Dorado%2C%2078399%20San%20Luis%2C%20S.L.P.!5e0!3m2!1ses-419!2smx!4v1714693834830!5m2!1ses-419!2smx`}
        width="100%"
        height="100%"
        style={{ border: 0, borderRadius: "0.5rem" }}
        allowFullScreen={false}
        loading="lazy"
        referrerPolicy="no-referrer-when-downgrade"
        title="Ubicación de Comedero Tus Tías"
        className="absolute inset-0"
      ></iframe>

      {/* Botón "Cómo llegar" */}
      <a
        href={`https://www.google.com/maps/dir/?api=1&destination=${restaurantCoords}`}
        target="_blank"
        rel="noopener noreferrer"
        className="absolute bottom-4 right-4 bg-amber-700 hover:bg-amber-800 text-white py-2 px-4 rounded-md shadow-md transition-colors z-10 flex items-center"
      >
        <Navigation className="h-4 w-4 mr-2" />
        Cómo llegar
      </a>
    </div>
  )
}

export { LocationMap }
