"use client""use client""use client"



import { useRef } from "react"

import { MapPin } from "lucide-react"

import { useEffect, useRef, useState } from "react"import { useEffect, useRef, useState } from "react"

interface Location {

  lat: number;import { MapPin, Navigation } from "lucide-react"import { useGoogleMaps } from "./google-maps-loader"

  lng: number;

}import { realTimeLocationService, type Location } from "@/lib/real-time-location"



interface RealTimeTrackingMapProps {interface Location {import { MapPin, Navigation } from "lucide-react"

  driverId?: string

  orderId?: number  lat: number;

  restaurantLocation: Location

  deliveryLocation: Location  lng: number;// Declarar tipos para Google Maps usando any para evitar errores

  className?: string

  onMapReady?: () => void}declare global {

  showDriverLocation?: boolean

  showRoute?: boolean  interface Window {

}

interface RealTimeTrackingMapProps {    google: any;

export function RealTimeTrackingMap({

  driverId,  driverId?: string  }

  orderId,

  restaurantLocation,  orderId?: number}

  deliveryLocation,

  className = "",  restaurantLocation: Location

  onMapReady,

  showDriverLocation = true,  deliveryLocation: Locationinterface RealTimeTrackingMapProps {

  showRoute = true

}: RealTimeTrackingMapProps) {  className?: string  driverId?: string

  const mapRef = useRef<HTMLDivElement>(null)

  onMapReady?: () => void  orderId?: number

  // Simplified placeholder component for now

  return (  showDriverLocation?: boolean  restaurantLocation: Location

    <div className={`relative w-full h-full bg-slate-100 rounded-lg ${className}`}>

      <div ref={mapRef} className="w-full h-full rounded-lg">  showRoute?: boolean  deliveryLocation: Location

        <div className="flex items-center justify-center h-full text-slate-500">

          <div className="text-center">}  className?: string

            <MapPin className="w-8 h-8 mx-auto mb-2" />

            <p>Mapa de tracking en tiempo real</p>  showControls?: boolean

            <p className="text-sm">Funcionalidad disponible próximamente</p>

          </div>export function RealTimeTrackingMap({  onMapLoaded?: () => void

        </div>

      </div>  driverId,}

    </div>

  )  orderId,

}
  restaurantLocation,export function RealTimeTrackingMap({

  deliveryLocation,  driverId,

  className = "",  orderId,

  onMapReady,  restaurantLocation,

  showDriverLocation = true,  deliveryLocation,

  showRoute = true  className = "w-full h-64 md:h-96",

}: RealTimeTrackingMapProps) {  showControls = true,

  const mapRef = useRef<HTMLDivElement>(null)  onMapLoaded,

  }: RealTimeTrackingMapProps) {

  const [mapInstance, setMapInstance] = useState<any | null>(null)  const mapRef = useRef<HTMLDivElement>(null)

  const [driverLocation, setDriverLocation] = useState<Location | null>(null)  const { isLoaded, maps } = useGoogleMaps()

  const [isTracking, setIsTracking] = useState(false)  const [mapInstance, setMapInstance] = useState<google.maps.Map | null>(null)

  const [directionsRenderer, setDirectionsRenderer] = useState<google.maps.DirectionsRenderer | null>(null)

  // Simplified placeholder component for now  const [driverMarker, setDriverMarker] = useState<google.maps.Marker | null>(null)

  return (  const [driverLocation, setDriverLocation] = useState<Location | null>(null)

    <div className={`relative w-full h-full bg-slate-100 rounded-lg ${className}`}>  const [isFollowingDriver, setIsFollowingDriver] = useState(true)

      <div ref={mapRef} className="w-full h-full rounded-lg">  const [estimatedTime, setEstimatedTime] = useState<string | null>(null)

        <div className="flex items-center justify-center h-full text-slate-500">  const [estimatedDistance, setEstimatedDistance] = useState<string | null>(null)

          <div className="text-center">  const [error, setError] = useState<string | null>(null)

            <MapPin className="w-8 h-8 mx-auto mb-2" />

            <p>Mapa de tracking en tiempo real</p>  // Inicializar mapa cuando Google Maps se carga

            <p className="text-sm">Funcionalidad disponible próximamente</p>  useEffect(() => {

          </div>    if (!isLoaded || !maps || !mapRef.current) return

        </div>

      </div>    try {

    </div>      // Crear instancia del mapa

  )      const mapOptions: google.maps.MapOptions = {

}        center: restaurantLocation,
        zoom: 15,
        mapTypeControl: false,
        fullscreenControl: showControls,
        streetViewControl: false,
        zoomControl: showControls,
        styles: [
          {
            featureType: "poi",
            elementType: "labels",
            stylers: [{ visibility: "off" }],
          },
        ],
      }

      const map = new maps.Map(mapRef.current, mapOptions)
      setMapInstance(map)

      // Crear marcadores
      const restaurantMarker = new maps.Marker({
        position: restaurantLocation,
        map,
        title: "Restaurante",
        icon: {
          path: maps.SymbolPath.CIRCLE,
          scale: 10,
          fillColor: "#ef4444",
          fillOpacity: 1,
          strokeWeight: 2,
          strokeColor: "#ffffff",
        },
      })

      // Añadir etiqueta al marcador del restaurante
      const restaurantInfoWindow = new maps.InfoWindow({
        content: `
          <div class="p-2">
            <p class="font-bold">Restaurante</p>
            <p class="text-sm">Punto de recogida</p>
          </div>
        `,
        pixelOffset: new maps.Size(0, -30),
      })

      restaurantMarker.addListener("click", () => {
        restaurantInfoWindow.open(map, restaurantMarker)
      })

      const destinationMarker = new maps.Marker({
        position: deliveryLocation,
        map,
        title: "Destino",
        icon: {
          path: maps.SymbolPath.CIRCLE,
          scale: 10,
          fillColor: "#22c55e",
          fillOpacity: 1,
          strokeWeight: 2,
          strokeColor: "#ffffff",
        },
      })

      // Añadir etiqueta al marcador de destino
      const destinationInfoWindow = new maps.InfoWindow({
        content: `
          <div class="p-2">
            <p class="font-bold">Destino</p>
            <p class="text-sm">Punto de entrega</p>
          </div>
        `,
        pixelOffset: new maps.Size(0, -30),
      })

      destinationMarker.addListener("click", () => {
        destinationInfoWindow.open(map, destinationMarker)
      })

      // Configurar renderer de direcciones
      const renderer = new maps.DirectionsRenderer({
        map,
        suppressMarkers: true,
        polylineOptions: {
          strokeColor: "#3b82f6",
          strokeWeight: 5,
          strokeOpacity: 0.7,
        },
      })
      setDirectionsRenderer(renderer)

      // Ajustar mapa para mostrar todos los puntos
      const bounds = new maps.LatLngBounds()
      bounds.extend(restaurantLocation)
      bounds.extend(deliveryLocation)
      map.fitBounds(bounds, { padding: 50 })

      // Notificar que el mapa se ha cargado
      if (onMapLoaded) onMapLoaded()
    } catch (err) {
      console.error("Error inicializando mapa:", err)
      setError("Error al inicializar el mapa")
    }
  }, [isLoaded, maps, restaurantLocation, deliveryLocation, showControls, onMapLoaded])

  // Suscribirse a actualizaciones de ubicación del repartidor
  useEffect(() => {
    if (!driverId) return

    // Obtener última ubicación conocida
    realTimeLocationService.getLastKnownDriverLocation(driverId).then((driverData) => {
      if (driverData) {
        setDriverLocation(driverData.location)
      }
    })

    // Suscribirse a actualizaciones
    const unsubscribe = realTimeLocationService.subscribeToDriverLocation(driverId, (driverData) => {
      setDriverLocation(driverData.location)
    })

    return () => {
      unsubscribe()
    }
  }, [driverId])

  // Actualizar marcador del repartidor cuando cambia su ubicación
  useEffect(() => {
    if (!maps || !mapInstance || !driverLocation) return

    try {
      // Si no existe el marcador, crearlo
      if (!driverMarker) {
        const marker = new maps.Marker({
          position: driverLocation,
          map: mapInstance,
          title: "Repartidor",
          icon: {
            path: maps.SymbolPath.FORWARD_CLOSED_ARROW,
            scale: 6,
            fillColor: "#3b82f6",
            fillOpacity: 1,
            strokeWeight: 2,
            strokeColor: "#ffffff",
            rotation: 0,
          },
          animation: maps.Animation.DROP,
          zIndex: 10,
        })
        setDriverMarker(marker)
      } else {
        // Animar movimiento del marcador
        animateMarkerMovement(driverMarker, driverMarker.getPosition()!, driverLocation, 1500)
      }

      // Centrar mapa en el repartidor si está en modo seguimiento
      if (isFollowingDriver) {
        mapInstance.panTo(driverLocation)
      }

      // Actualizar ruta
      updateRoute()
    } catch (err) {
      console.error("Error actualizando marcador del repartidor:", err)
    }
  }, [maps, mapInstance, driverLocation, driverMarker, isFollowingDriver])

  // Función para animar el movimiento del marcador
  const animateMarkerMovement = (
    marker: google.maps.Marker,
    startPosition: google.maps.LatLng,
    endPosition: google.maps.LatLng,
    duration: number,
  ) => {
    if (!maps) return

    const startTime = new Date().getTime()
    const startLat = startPosition.lat()
    const startLng = startPosition.lng()
    const endLat = endPosition.lat
    const endLng = endPosition.lng

    // Calcular rotación (dirección)
    const heading = maps.geometry.spherical.computeHeading(
      new maps.LatLng(startLat, startLng),
      new maps.LatLng(endLat, endLng),
    )

    // Actualizar icono con la nueva rotación
    const icon = marker.getIcon() as google.maps.Symbol
    if (icon) {
      icon.rotation = heading
      marker.setIcon(icon)
    }

    const animate = () => {
      const elapsed = new Date().getTime() - startTime
      const progress = Math.min(elapsed / duration, 1)

      // Función de easing para movimiento más natural
      const easeInOut = (t: number) => (t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t)
      const smoothProgress = easeInOut(progress)

      const lat = startLat + (endLat - startLat) * smoothProgress
      const lng = startLng + (endLng - startLng) * smoothProgress

      marker.setPosition(new maps.LatLng(lat, lng))

      if (progress < 1) {
        requestAnimationFrame(animate)
      }
    }

    requestAnimationFrame(animate)
  }

  // Actualizar ruta cuando cambia la ubicación del repartidor
  const updateRoute = () => {
    if (!maps || !mapInstance || !directionsRenderer || !driverLocation) return

    try {
      const directionsService = new maps.DirectionsService()

      directionsService.route(
        {
          origin: driverLocation,
          destination: deliveryLocation,
          travelMode: maps.TravelMode.DRIVING,
          optimizeWaypoints: true,
          avoidHighways: false,
          avoidTolls: false,
        },
        (result, status) => {
          if (status === "OK" && result) {
            directionsRenderer.setDirections(result)

            // Actualizar tiempo y distancia estimados
            if (result.routes.length > 0 && result.routes[0].legs.length > 0) {
              const leg = result.routes[0].legs[0]
              setEstimatedTime(leg.duration?.text || null)
              setEstimatedDistance(leg.distance?.text || null)
            }
          } else {
            console.error("Error obteniendo ruta:", status)
          }
        },
      )
    } catch (err) {
      console.error("Error actualizando ruta:", err)
    }
  }

  // Alternar modo de seguimiento
  const toggleFollowMode = () => {
    setIsFollowingDriver((prev) => !prev)

    // Si se activa el seguimiento y hay ubicación del repartidor, centrar mapa
    if (!isFollowingDriver && driverLocation && mapInstance) {
      mapInstance.panTo(driverLocation)
      mapInstance.setZoom(16)
    }
  }

  // Si hay un error, mostrar mensaje
  if (error) {
    return (
      <div className="p-4 bg-red-50 rounded-lg border border-red-200 text-red-800">
        <p>{error}</p>
      </div>
    )
  }

  return (
    <div className="relative">
      <div ref={mapRef} className={className}></div>

      {/* Información de tiempo estimado */}
      {estimatedTime && (
        <div className="absolute top-4 left-4 bg-white bg-opacity-90 p-2 rounded-lg shadow-md z-10">
          <div className="text-sm font-medium">Tiempo estimado: {estimatedTime}</div>
          {estimatedDistance && <div className="text-xs text-gray-600">Distancia: {estimatedDistance}</div>}
        </div>
      )}

      {/* Controles del mapa */}
      {showControls && (
        <div className="absolute bottom-4 right-4 flex flex-col gap-2">
          <button
            onClick={toggleFollowMode}
            className={`p-2 rounded-full shadow-md ${
              isFollowingDriver ? "bg-blue-600 text-white" : "bg-white text-blue-600"
            }`}
            title={isFollowingDriver ? "Dejar de seguir al repartidor" : "Seguir al repartidor"}
          >
            <Navigation size={20} />
          </button>

          <button
            onClick={() => {
              if (mapInstance) {
                const bounds = new google.maps.LatLngBounds()
                bounds.extend(restaurantLocation)
                bounds.extend(deliveryLocation)
                if (driverLocation) bounds.extend(driverLocation)
                mapInstance.fitBounds(bounds, { padding: 50 })
              }
            }}
            className="p-2 rounded-full shadow-md bg-white text-amber-600"
            title="Ver toda la ruta"
          >
            <MapPin size={20} />
          </button>
        </div>
      )}

      {/* Leyenda */}
      <div className="absolute bottom-4 left-4 bg-white bg-opacity-90 p-2 rounded-lg shadow-md z-10">
        <div className="flex items-center gap-2 text-xs">
          <div className="w-3 h-3 rounded-full bg-red-500"></div>
          <span>Restaurante</span>
        </div>
        <div className="flex items-center gap-2 text-xs">
          <div className="w-3 h-3 rounded-full bg-green-500"></div>
          <span>Destino</span>
        </div>
        <div className="flex items-center gap-2 text-xs">
          <div className="w-3 h-3 rounded-full bg-blue-500"></div>
          <span>Repartidor</span>
        </div>
      </div>
    </div>
  )
}
