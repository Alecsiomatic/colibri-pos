'use client'

import { useEffect, useState } from 'react'
import 'leaflet/dist/leaflet.css'

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

export default function DeliveryMap({
  driverLocation,
  restaurantLocation,
  deliveryLocation,
  route,
  height = '400px',
  className = ''
}: DeliveryMapProps) {
  const [mounted, setMounted] = useState(false)
  const [mapError, setMapError] = useState<string | null>(null)
  // Store leaflet modules in state after dynamic import
  const [leafletModules, setLeafletModules] = useState<any>(null)

  useEffect(() => {
    let cancelled = false
    // Import leaflet + react-leaflet only on client side, inside useEffect
    Promise.all([
      import('leaflet'),
      import('react-leaflet')
    ]).then(([L, RL]) => {
      if (cancelled) return
      // Fix default icon paths
      const LDefault = L.default || L
      delete (LDefault.Icon.Default.prototype as any)._getIconUrl
      LDefault.Icon.Default.mergeOptions({
        iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
        iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
        shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
      })
      setLeafletModules({ L: LDefault, RL })
      setMounted(true)
    }).catch((err) => {
      console.error('Error loading leaflet:', err)
      setMapError(err?.message || 'Error cargando módulos del mapa')
    })
    return () => { cancelled = true }
  }, [])

  if (mapError) {
    return (
      <div className={`bg-slate-800/60 rounded-lg flex flex-col items-center justify-center gap-2 ${className}`} style={{ height }}>
        <p className="text-colibri-beige text-sm">No se pudo cargar el mapa</p>
        <p className="text-red-400 text-xs">{mapError}</p>
      </div>
    )
  }

  if (!mounted || !leafletModules) {
    return (
      <div className={`bg-slate-800/60 animate-pulse rounded-lg flex items-center justify-center ${className}`} style={{ height }}>
        <div className="text-colibri-beige text-sm">Cargando mapa...</div>
      </div>
    )
  }

  const { L, RL } = leafletModules
  const { MapContainer, TileLayer, Marker, Popup, Polyline } = RL

  // Iconos personalizados
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

  const isValidLoc = (loc?: Location) =>
    loc && typeof loc.lat === 'number' && typeof loc.lng === 'number' &&
    isFinite(loc.lat) && isFinite(loc.lng) && (loc.lat !== 0 || loc.lng !== 0)

  const locations = [driverLocation, restaurantLocation, deliveryLocation].filter(isValidLoc) as Location[]
  const center = locations[0] || { lat: 22.1565, lng: -100.9855 }

  return (
    <MapContainer
      center={[center.lat, center.lng]}
      zoom={13}
      style={{ height, width: '100%', borderRadius: '0.5rem' }}
      className={className}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

      <AutoFitBoundsInner locations={locations} L={L} />

      {isValidLoc(driverLocation) && (
        <Marker position={[driverLocation!.lat, driverLocation!.lng]} icon={driverIcon}>
          <Popup>
            <div className="font-semibold text-sm">🚗 Repartidor</div>
            {driverLocation!.label && <div className="text-xs">{driverLocation!.label}</div>}
          </Popup>
        </Marker>
      )}

      {isValidLoc(restaurantLocation) && (
        <Marker position={[restaurantLocation!.lat, restaurantLocation!.lng]} icon={restaurantIcon}>
          <Popup>
            <div className="font-semibold text-sm">🍽️ Restaurante</div>
            {restaurantLocation!.label && <div className="text-xs">{restaurantLocation!.label}</div>}
          </Popup>
        </Marker>
      )}

      {isValidLoc(deliveryLocation) && (
        <Marker position={[deliveryLocation!.lat, deliveryLocation!.lng]} icon={homeIcon}>
          <Popup>
            <div className="font-semibold text-sm">🏠 Destino</div>
            {deliveryLocation!.label && <div className="text-xs">{deliveryLocation!.label}</div>}
          </Popup>
        </Marker>
      )}

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

// Inner component that uses useMap — must be child of MapContainer
function AutoFitBoundsInner({ locations, L }: { locations: Location[]; L: any }) {
  // Import useMap dynamically too
  const [useMapHook, setUseMapHook] = useState<any>(null)
  
  useEffect(() => {
    import('react-leaflet').then((mod) => {
      setUseMapHook(() => mod.useMap)
    })
  }, [])

  if (!useMapHook) return null
  return <AutoFitBoundsImpl locations={locations} L={L} useMap={useMapHook} />
}

function AutoFitBoundsImpl({ locations, L, useMap }: { locations: Location[]; L: any; useMap: any }) {
  const map = useMap()
  
  useEffect(() => {
    if (locations.length > 0) {
      try {
        const validLocs = locations.filter((loc: Location) =>
          typeof loc.lat === 'number' && typeof loc.lng === 'number' &&
          isFinite(loc.lat) && isFinite(loc.lng) && (loc.lat !== 0 || loc.lng !== 0)
        )
        if (validLocs.length > 0) {
          const bounds = L.latLngBounds(validLocs.map((loc: Location) => [loc.lat, loc.lng]))
          map.fitBounds(bounds, { padding: [50, 50] })
        }
      } catch (e) {
        console.error('Error in AutoFitBounds:', e)
      }
    }
  }, [locations, map, L])
  
  return null
}
