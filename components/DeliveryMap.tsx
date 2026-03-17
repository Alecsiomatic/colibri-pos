'use client'

import { useEffect, useRef, useState } from 'react'

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

const isValidLoc = (loc?: Location) =>
  loc && typeof loc.lat === 'number' && typeof loc.lng === 'number' &&
  isFinite(loc.lat) && isFinite(loc.lng) && (loc.lat !== 0 || loc.lng !== 0)

export default function DeliveryMap({
  driverLocation,
  restaurantLocation,
  deliveryLocation,
  route,
  height = '400px',
  className = ''
}: DeliveryMapProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<any>(null)
  const markersRef = useRef<any[]>([])
  const polylineRef = useRef<any>(null)
  const [ready, setReady] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const LRef = useRef<any>(null)

  // 1. Import leaflet and create map — once
  useEffect(() => {
    if (!containerRef.current) return
    let cancelled = false

    import('leaflet').then((mod) => {
      if (cancelled) return
      const L = mod.default || mod

      // CSS
      if (!document.querySelector('link[href*="leaflet.css"]')) {
        const link = document.createElement('link')
        link.rel = 'stylesheet'
        link.href = 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.css'
        document.head.appendChild(link)
      }

      // Fix default icons
      delete (L.Icon.Default.prototype as any)._getIconUrl
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
        iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
        shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
      })

      LRef.current = L

      const map = L.map(containerRef.current!, {
        center: [22.1565, -100.9855],
        zoom: 13,
      })

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
      }).addTo(map)

      mapRef.current = map
      setReady(true)

      // Fix tiles not loading on dynamic containers
      setTimeout(() => map.invalidateSize(), 200)
    }).catch((err) => {
      if (!cancelled) setError(err?.message || 'Error cargando mapa')
    })

    return () => {
      cancelled = true
      if (mapRef.current) {
        mapRef.current.remove()
        mapRef.current = null
      }
    }
  }, [])

  // 2. Sync markers + polyline on prop changes
  useEffect(() => {
    if (!ready || !mapRef.current || !LRef.current) return
    const L = LRef.current
    const map = mapRef.current

    // Clear old markers
    markersRef.current.forEach(m => m.remove())
    markersRef.current = []
    if (polylineRef.current) {
      polylineRef.current.remove()
      polylineRef.current = null
    }

    const makeIcon = (emoji: string, color: string) =>
      L.divIcon({
        html: `<div style="background:${color};width:40px;height:40px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:24px;border:3px solid white;box-shadow:0 2px 8px rgba(0,0,0,.3)">${emoji}</div>`,
        className: '',
        iconSize: [40, 40],
        iconAnchor: [20, 40],
        popupAnchor: [0, -40]
      })

    const points: [number, number][] = []

    if (isValidLoc(driverLocation)) {
      const m = L.marker([driverLocation!.lat, driverLocation!.lng], { icon: makeIcon('🚗', '#1f4f37') })
        .addTo(map).bindPopup(`<b>🚗 Repartidor</b>${driverLocation!.label ? `<br/>${driverLocation!.label}` : ''}`)
      markersRef.current.push(m)
      points.push([driverLocation!.lat, driverLocation!.lng])
    }

    if (isValidLoc(restaurantLocation)) {
      const m = L.marker([restaurantLocation!.lat, restaurantLocation!.lng], { icon: makeIcon('🍽️', '#ab9976') })
        .addTo(map).bindPopup(`<b>🍽️ Restaurante</b>${restaurantLocation!.label ? `<br/>${restaurantLocation!.label}` : ''}`)
      markersRef.current.push(m)
      points.push([restaurantLocation!.lat, restaurantLocation!.lng])
    }

    if (isValidLoc(deliveryLocation)) {
      const m = L.marker([deliveryLocation!.lat, deliveryLocation!.lng], { icon: makeIcon('🏠', '#6c222a') })
        .addTo(map).bindPopup(`<b>🏠 Destino</b>${deliveryLocation!.label ? `<br/>${deliveryLocation!.label}` : ''}`)
      markersRef.current.push(m)
      points.push([deliveryLocation!.lat, deliveryLocation!.lng])
    }

    // Route polyline — GeoJSON format: coordinates are [lng, lat]
    if (route && route.coordinates && Array.isArray(route.coordinates)) {
      const positions = route.coordinates.map((c: number[]) => [c[1], c[0]])
      polylineRef.current = L.polyline(positions, { color: '#1f4f37', weight: 4, opacity: 0.7 }).addTo(map)
    }

    // Fit bounds
    if (points.length > 0) {
      try {
        map.fitBounds(L.latLngBounds(points), { padding: [50, 50] })
      } catch {}
    }
  }, [ready, driverLocation, restaurantLocation, deliveryLocation, route])

  if (error) {
    return (
      <div className={`bg-slate-800/60 rounded-lg flex flex-col items-center justify-center gap-2 ${className}`} style={{ height }}>
        <p className="text-colibri-beige text-sm">No se pudo cargar el mapa</p>
        <p className="text-red-400 text-xs">{error}</p>
      </div>
    )
  }

  return (
    <div
      ref={containerRef}
      className={className}
      style={{ height, width: '100%', borderRadius: '0.5rem' }}
    />
  )
}
