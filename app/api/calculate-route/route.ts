import { NextRequest, NextResponse } from 'next/server'

interface Location {
  lat: number
  lng: number
}

interface OSRMResponse {
  routes: Array<{
    distance: number
    duration: number
    geometry: {
      coordinates: Array<[number, number]>
    }
  }>
}

export async function POST(request: NextRequest) {
  try {
    const { origin, destination } = await request.json()

    if (!origin?.lat || !origin?.lng || !destination?.lat || !destination?.lng) {
      return NextResponse.json(
        { error: 'Origin y destination son requeridos con lat/lng' },
        { status: 400 }
      )
    }

    // Llamar a OSRM para calcular la ruta
    const url = `https://router.project-osrm.org/route/v1/driving/${origin.lng},${origin.lat};${destination.lng},${destination.lat}?overview=full&geometries=geojson`
    
    const response = await fetch(url)
    
    if (!response.ok) {
      throw new Error(`OSRM error: ${response.status}`)
    }

    const data: OSRMResponse = await response.json()
    
    if (!data.routes || data.routes.length === 0) {
      return NextResponse.json(
        { error: 'No se encontró ruta' },
        { status: 404 }
      )
    }

    const route = data.routes[0]
    
    // Convertir coordenadas de [lng, lat] a [lat, lng] para Leaflet
    const routeCoordinates: Array<[number, number]> = route.geometry.coordinates.map(
      coord => [coord[1], coord[0]]
    )

    return NextResponse.json({
      route: routeCoordinates,
      distance: (route.distance / 1000).toFixed(2), // metros a km
      duration: Math.ceil(route.duration / 60), // segundos a minutos
      origin,
      destination
    })

  } catch (error) {
    console.error('Error calculando ruta:', error)
    return NextResponse.json(
      { error: 'Error al calcular ruta' },
      { status: 500 }
    )
  }
}
