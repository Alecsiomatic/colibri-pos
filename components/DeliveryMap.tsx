'use client'

import { useEffect, useState } from 'react'
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

// Fix para iconos de Leaflet en Next.js
if (typeof window !== 'undefined') {
  delete (L.Icon.Default.prototype as any)._getIconUrl
  L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  })
}

interface Location {
  lat: number
  lng: number
  label?: string
}

interface DeliveryMapProps {
  driverLocation?: Location
  restaurantLocation?: Location
  deliveryLocation?: Location
  route?: any
  height?: string
  className?: string
}

// Componente para ajustar el zoom automáticamente
function AutoFitBounds({ locations }: { locations: Location[] }) {
  const map = useMap()
  
  useEffect(() => {
    if (locations.length > 0) {
      const bounds = L.latLngBounds(
        locations.map(loc => [loc.lat, loc.lng])
      )
      map.fitBounds(bounds, { padding: [50, 50] })
    }
  }, [locations, map])
  
  return null
}

export default function DeliveryMap({
  driverLocation,
  restaurantLocation,
  deliveryLocation,
  route,
  height = '400px',
  className = ''
}: DeliveryMapProps) {
  const [mounted, setMounted] = useState(false)
  
  // Evitar error de hidratación en Next.js
  useEffect(() => {
    setMounted(true)
  }, [])
  
  if (!mounted) {
    return (
      <div 
        className={`bg-slate-800/60 animate-pulse rounded-lg flex items-center justify-center ${className}`}
        style={{ height }}
      >
        <div className="text-colibri-beige text-sm">Cargando mapa...</div>
      </div>
    )
  }
  
  // Iconos personalizados con emojis SVG
  const createCustomIcon = (emoji: string, color: string) => {
    return L.divIcon({
      html: `<div style="background: ${color}; width: 40px; height: 40px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 24px; border: 3px solid white; box-shadow: 0 2px 8px rgba(0,0,0,0.3);">${emoji}</div>`,
      className: '',
      iconSize: [40, 40],
      iconAnchor: [20, 40],
      popupAnchor: [0, -40]
    })
  }
  
  const driverIcon = createCustomIcon('🚗', '#1f4f37')
  const restaurantIcon = createCustomIcon('🍽️', '#ab9976')
  const homeIcon = createCustomIcon('🏠', '#6c222a')
  
  const locations = [
    driverLocation,
    restaurantLocation,
    deliveryLocation
  ].filter(Boolean) as Location[]
  
  const center = locations[0] || { lat: 22.1565, lng: -100.9855 } // SLP por defecto
  
  return (
    <MapContainer
      center={[center.lat, center.lng]}
      zoom={13}
      style={{ height, width: '100%', borderRadius: '0.5rem' }}
      className={className}
    >
      {/* Tiles de OpenStreetMap */}
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      
      {/* Auto ajustar zoom */}
      <AutoFitBounds locations={locations} />
      
      {/* Marcador del Driver */}
      {driverLocation && (
        <Marker position={[driverLocation.lat, driverLocation.lng]} icon={driverIcon}>
          <Popup>
            <div className="font-semibold text-sm">🚗 Repartidor</div>
            {driverLocation.label && <div className="text-xs">{driverLocation.label}</div>}
          </Popup>
        </Marker>
      )}
      
      {/* Marcador del Restaurante */}
      {restaurantLocation && (
        <Marker position={[restaurantLocation.lat, restaurantLocation.lng]} icon={restaurantIcon}>
          <Popup>
            <div className="font-semibold text-sm">🍽️ Restaurante</div>
            {restaurantLocation.label && <div className="text-xs">{restaurantLocation.label}</div>}
          </Popup>
        </Marker>
      )}
      
      {/* Marcador de Entrega */}
      {deliveryLocation && (
        <Marker position={[deliveryLocation.lat, deliveryLocation.lng]} icon={homeIcon}>
          <Popup>
            <div className="font-semibold text-sm">🏠 Destino</div>
            {deliveryLocation.label && <div className="text-xs">{deliveryLocation.label}</div>}
          </Popup>
        </Marker>
      )}
      
      {/* Ruta */}
      {route && route.coordinates && (
        <Polyline
          positions={route.coordinates.map((coord: number[]) => [coord[1], coord[0]])}
          color="#1f4f37"
          weight={4}
          opacity={0.7}
        />
      )}
    </MapContainer>
  )
}
