import { getPool } from './mysql-db'

export interface RestaurantConfig {
  id: number
  name: string
  address: string
  latitude: number
  longitude: number
  phone: string | null
  email: string | null
  delivery_base_fee: number
  delivery_per_km_fee: number
  delivery_time_fee: number
  delivery_free_threshold: number
  delivery_radius_km: number
}

export interface GeocodingResult {
  lat: number
  lng: number
  display_name: string
  address: any
}

export interface RouteResult {
  distance: number
  duration: number
  geometry: any
}

export interface DeliveryCostResult {
  cost: number
  distance: number
  duration: number
  breakdown: {
    baseFee: number
    distanceFee: number
    timeFee: number
  }
  route: any
  locations: {
    restaurant: { lat: number; lng: number; address: string }
    delivery: { lat: number; lng: number; address: string }
  }
  isFreeDelivery: boolean
  estimatedDeliveryTime: string
  outOfRange?: boolean
  maxRadius?: number
  errorMessage?: string
}

export async function getRestaurantConfig(): Promise<RestaurantConfig | null> {
  try {
    const pool = getPool()
    const [rows] = await pool.execute<any[]>(
      'SELECT * FROM restaurant_config ORDER BY id DESC LIMIT 1'
    )
    return rows.length > 0 ? rows[0] as RestaurantConfig : null
  } catch (error) {
    console.error('❌ Error fetching restaurant config:', error)
    throw error
  }
}

export async function geocodeAddress(address: string): Promise<GeocodingResult | null> {
  try {
    const encodedAddress = encodeURIComponent(address)
    const url = `https://nominatim.openstreetmap.org/search?q=${encodedAddress}&format=json&addressdetails=1&limit=1&countrycodes=mx`
    
    const response = await fetch(url, {
      headers: { 'User-Agent': 'SupernovaRestaurant/1.0' }
    })
    
    if (!response.ok) throw new Error(`Nominatim API error: ${response.status}`)
    
    const data = await response.json()
    if (!data || data.length === 0) return null
    
    const result = data[0]
    return {
      lat: parseFloat(result.lat),
      lng: parseFloat(result.lon),
      display_name: result.display_name,
      address: result.address || {}
    }
  } catch (error) {
    console.error('❌ Geocoding error:', error)
    throw error
  }
}

export async function reverseGeocode(lat: number, lng: number): Promise<GeocodingResult | null> {
  try {
    const url = `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&addressdetails=1`
    
    const response = await fetch(url, {
      headers: { 'User-Agent': 'SupernovaRestaurant/1.0' }
    })
    
    if (!response.ok) throw new Error(`Nominatim API error: ${response.status}`)
    
    const result = await response.json()
    return {
      lat: parseFloat(result.lat),
      lng: parseFloat(result.lon),
      display_name: result.display_name,
      address: result.address || {}
    }
  } catch (error) {
    console.error('❌ Reverse geocoding error:', error)
    throw error
  }
}

export async function calculateRoute(
  origin: { lat: number; lng: number },
  destination: { lat: number; lng: number }
): Promise<RouteResult | null> {
  try {
    const url = `https://router.project-osrm.org/route/v1/driving/${origin.lng},${origin.lat};${destination.lng},${destination.lat}?overview=full&geometries=geojson`
    
    const response = await fetch(url)
    if (!response.ok) throw new Error(`OSRM API error: ${response.status}`)
    
    const data = await response.json()
    if (!data.routes || data.routes.length === 0) return null
    
    const route = data.routes[0]
    return {
      distance: route.distance,
      duration: route.duration,
      geometry: route.geometry
    }
  } catch (error) {
    console.error('❌ Route calculation error:', error)
    throw error
  }
}

export function calculateDirectDistance(
  lat1: number, lng1: number, lat2: number, lng2: number
): number {
  const R = 6371
  const dLat = toRad(lat2 - lat1)
  const dLng = toRad(lng2 - lng1)
  
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2)
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return R * c
}

function toRad(degrees: number): number {
  return degrees * (Math.PI / 180)
}

export async function calculateDeliveryCost(
  deliveryAddress: string,
  orderTotal: number = 0
): Promise<DeliveryCostResult> {
  try {
    const config = await getRestaurantConfig()
    if (!config) throw new Error('Restaurant configuration not found')
    
    const deliveryGeo = await geocodeAddress(deliveryAddress)
    if (!deliveryGeo) throw new Error('Could not geocode delivery address')
    
    const directDistance = calculateDirectDistance(
      config.latitude, config.longitude,
      deliveryGeo.lat, deliveryGeo.lng
    )
    
    // Si está fuera del radio, retornar información del error en lugar de lanzar excepción
    if (directDistance > config.delivery_radius_km) {
      return {
        cost: 0,
        distance: Math.round(directDistance * 100) / 100,
        duration: 0,
        breakdown: {
          baseFee: 0,
          distanceFee: 0,
          timeFee: 0
        },
        route: null,
        locations: {
          restaurant: {
            lat: config.latitude,
            lng: config.longitude,
            address: config.address
          },
          delivery: {
            lat: deliveryGeo.lat,
            lng: deliveryGeo.lng,
            address: deliveryGeo.display_name
          }
        },
        isFreeDelivery: false,
        estimatedDeliveryTime: '',
        outOfRange: true,
        maxRadius: config.delivery_radius_km,
        errorMessage: `Lo sentimos, esta dirección está fuera de nuestra zona de entrega (${Math.round(directDistance * 100) / 100} km). Nuestro radio máximo es ${config.delivery_radius_km} km.`
      }
    }
    
    let routeData: RouteResult | null = null
    let distance = directDistance
    let duration = Math.ceil((directDistance / 30) * 60)
    
    try {
      routeData = await calculateRoute(
        { lat: config.latitude, lng: config.longitude },
        { lat: deliveryGeo.lat, lng: deliveryGeo.lng }
      )
      
      if (routeData) {
        distance = routeData.distance / 1000
        duration = Math.ceil(routeData.duration / 60)
      }
    } catch (error) {
      console.warn('⚠️  OSRM not available, using direct distance')
    }
    
    const baseFee = config.delivery_base_fee || 0
    const distanceFee = (distance || 0) * (config.delivery_per_km_fee || 0)
    const timeFee = Math.ceil((duration || 0) / 5) * (config.delivery_time_fee || 0)
    
    let totalCost = baseFee + distanceFee + timeFee
    
    // Validar que no haya NaN
    if (isNaN(totalCost)) {
      console.error('⚠️  Total cost is NaN, using fallback')
      totalCost = 50 // Fallback a costo base
    }
    const isFreeDelivery = orderTotal >= config.delivery_free_threshold
    
    if (isFreeDelivery) totalCost = 0
    
    const preparationTime = 20
    const totalTime = preparationTime + duration
    const estimatedDeliveryTime = `${totalTime}-${totalTime + 10} minutos`
    
    return {
      cost: Math.round(totalCost * 100) / 100,
      distance: Math.round(distance * 100) / 100,
      duration,
      breakdown: {
        baseFee,
        distanceFee: Math.round(distanceFee * 100) / 100,
        timeFee: Math.round(timeFee * 100) / 100
      },
      route: routeData?.geometry || null,
      locations: {
        restaurant: {
          lat: config.latitude,
          lng: config.longitude,
          address: config.address
        },
        delivery: {
          lat: deliveryGeo.lat,
          lng: deliveryGeo.lng,
          address: deliveryGeo.display_name
        }
      },
      isFreeDelivery,
      estimatedDeliveryTime
    }
  } catch (error) {
    console.error('❌ Error calculating delivery cost:', error)
    throw error
  }
}
