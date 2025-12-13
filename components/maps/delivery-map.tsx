'use client'

import { useEffect, useRef, useState } from 'react'
import { Loader2 } from 'lucide-react'

interface DeliveryMapProps {
  driverLocation?: { lat: number; lng: number } | null
  deliveryAddress: string
  driverName?: string
}

export default function DeliveryMap({ driverLocation, deliveryAddress, driverName }: DeliveryMapProps) {
  const mapRef = useRef<HTMLDivElement>(null)
  const [map, setMap] = useState<google.maps.Map | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string>('')
  const driverMarkerRef = useRef<google.maps.Marker | null>(null)
  const destinationMarkerRef = useRef<google.maps.Marker | null>(null)
  const directionsRendererRef = useRef<google.maps.DirectionsRenderer | null>(null)

  useEffect(() => {
    const loadGoogleMaps = async () => {
      if (typeof window === 'undefined') return

      // Si ya está cargada la API
      if (window.google && window.google.maps) {
        initializeMap()
        return
      }

      // Cargar script de Google Maps
      const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY
      if (!apiKey) {
        setError('API Key de Google Maps no configurada')
        setLoading(false)
        return
      }

      try {
        const script = document.createElement('script')
        script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places`
        script.async = true
        script.defer = true
        script.onload = () => initializeMap()
        script.onerror = () => {
          setError('Error al cargar Google Maps')
          setLoading(false)
        }
        document.head.appendChild(script)
      } catch (err) {
        setError('Error al inicializar el mapa')
        setLoading(false)
      }
    }

    loadGoogleMaps()
  }, [])

  const initializeMap = async () => {
    if (!mapRef.current || !window.google) return

    try {
      // Geocode de la dirección de destino
      const geocoder = new google.maps.Geocoder()
      const result = await geocoder.geocode({ address: deliveryAddress })
      
      if (!result.results || result.results.length === 0) {
        setError('No se pudo encontrar la dirección')
        setLoading(false)
        return
      }

      const destinationLocation = result.results[0].geometry.location

      // Crear el mapa
      const mapInstance = new google.maps.Map(mapRef.current, {
        center: destinationLocation,
        zoom: 14,
        styles: [
          {
            featureType: 'poi',
            elementType: 'labels',
            stylers: [{ visibility: 'off' }]
          }
        ]
      })

      setMap(mapInstance)

      // Marcador de destino (casa del cliente)
      const destinationMarker = new google.maps.Marker({
        position: destinationLocation,
        map: mapInstance,
        title: 'Destino',
        icon: {
          url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
            <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="red" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
              <circle cx="12" cy="10" r="3"></circle>
            </svg>
          `),
          scaledSize: new google.maps.Size(40, 40)
        }
      })

      destinationMarkerRef.current = destinationMarker

      // Si hay ubicación del driver, crear marcador y ruta
      if (driverLocation) {
        updateDriverMarker(mapInstance, driverLocation, destinationLocation)
      }

      setLoading(false)
    } catch (err) {
      console.error('Error inicializando mapa:', err)
      setError('Error al cargar el mapa')
      setLoading(false)
    }
  }

  const updateDriverMarker = async (
    mapInstance: google.maps.Map,
    driverLoc: { lat: number; lng: number },
    destinationLoc: google.maps.LatLng
  ) => {
    if (!window.google) return

    // Actualizar o crear marcador del driver
    if (driverMarkerRef.current) {
      driverMarkerRef.current.setPosition(driverLoc)
    } else {
      const driverMarker = new google.maps.Marker({
        position: driverLoc,
        map: mapInstance,
        title: driverName || 'Repartidor',
        icon: {
          url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
            <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="blue" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <rect x="1" y="3" width="15" height="13"></rect>
              <polygon points="16 8 20 8 23 11 23 16 16 16 16 8"></polygon>
              <circle cx="5.5" cy="18.5" r="2.5"></circle>
              <circle cx="18.5" cy="18.5" r="2.5"></circle>
            </svg>
          `),
          scaledSize: new google.maps.Size(40, 40)
        },
        animation: google.maps.Animation.BOUNCE
      })

      driverMarkerRef.current = driverMarker

      // Después de 2 segundos, quitar la animación
      setTimeout(() => {
        driverMarker.setAnimation(null)
      }, 2000)
    }

    // Dibujar ruta
    if (!directionsRendererRef.current) {
      directionsRendererRef.current = new google.maps.DirectionsRenderer({
        map: mapInstance,
        suppressMarkers: true,
        polylineOptions: {
          strokeColor: '#3B82F6',
          strokeWeight: 4
        }
      })
    }

    const directionsService = new google.maps.DirectionsService()
    try {
      const result = await directionsService.route({
        origin: driverLoc,
        destination: destinationLoc,
        travelMode: google.maps.TravelMode.DRIVING
      })

      directionsRendererRef.current.setDirections(result)

      // Ajustar bounds para mostrar toda la ruta
      const bounds = new google.maps.LatLngBounds()
      bounds.extend(driverLoc)
      bounds.extend(destinationLoc)
      mapInstance.fitBounds(bounds, 50) // 50px de padding
    } catch (err) {
      console.error('Error calculando ruta:', err)
    }
  }

  // Actualizar posición del driver cuando cambie
  useEffect(() => {
    if (map && driverLocation && destinationMarkerRef.current) {
      const destinationLoc = destinationMarkerRef.current.getPosition()
      if (destinationLoc) {
        updateDriverMarker(map, driverLocation, destinationLoc)
      }
    }
  }, [driverLocation, map])

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center rounded-xl bg-amber-50">
        <div className="flex items-center gap-3">
          <Loader2 className="h-6 w-6 animate-spin text-amber-600" />
          <span className="text-amber-700">Cargando mapa...</span>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex h-96 items-center justify-center rounded-xl bg-red-50">
        <div className="text-center">
          <p className="text-red-600 font-medium">{error}</p>
          <p className="text-sm text-red-500 mt-2">El seguimiento seguirá actualizándose</p>
        </div>
      </div>
    )
  }

  return (
    <div className="relative">
      <div 
        ref={mapRef} 
        className="h-96 w-full rounded-xl shadow-lg border-2 border-amber-200"
      />
      {driverLocation && (
        <div className="absolute top-4 left-4 bg-white rounded-lg shadow-lg px-4 py-2 border border-amber-200">
          <p className="text-sm font-medium text-amber-900">
            🚗 {driverName || 'Repartidor'} en camino
          </p>
        </div>
      )}
    </div>
  )
}
