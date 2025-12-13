import { createClient } from "@/lib/supabase/client"

// Tipos
export interface Location {
  lat: number
  lng: number
}

export interface DriverLocation {
  driverId: string
  location: Location
  timestamp: string
  heading?: number
  speed?: number
}

// Clase para manejar actualizaciones de ubicación en tiempo real
export class RealTimeLocationService {
  private static instance: RealTimeLocationService
  private supabase = createClient()
  private locationUpdateCallbacks: Map<string, (location: DriverLocation) => void> = new Map()
  private subscriptions: Map<string, { unsubscribe: () => void }> = new Map()
  private updateInterval: NodeJS.Timeout | null = null
  private currentDriverId: string | null = null
  private currentLocation: Location | null = null
  private watchId: number | null = null
  private isTracking = false

  // Singleton
  public static getInstance(): RealTimeLocationService {
    if (!RealTimeLocationService.instance) {
      RealTimeLocationService.instance = new RealTimeLocationService()
    }
    return RealTimeLocationService.instance
  }

  // Iniciar seguimiento de ubicación para un repartidor
  public startDriverTracking(driverId: string): Promise<boolean> {
    return new Promise((resolve) => {
      if (this.isTracking) {
        this.stopDriverTracking()
      }

      this.currentDriverId = driverId
      this.isTracking = true

      // Verificar si el navegador soporta geolocalización
      if (!navigator.geolocation) {
        console.error("Geolocalización no soportada por este navegador")
        this.isTracking = false
        resolve(false)
        return
      }

      // Opciones de alta precisión para el seguimiento
      const options = {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }

      // Iniciar seguimiento continuo
      this.watchId = navigator.geolocation.watchPosition(
        this.handlePositionUpdate.bind(this),
        this.handlePositionError.bind(this),
        options,
      )

      // Configurar intervalo para enviar actualizaciones a la base de datos
      this.updateInterval = setInterval(async () => {
        if (this.currentLocation && this.currentDriverId) {
          await this.updateDriverLocation(this.currentDriverId, this.currentLocation)
        }
      }, 10000) // Actualizar cada 10 segundos

      resolve(true)
    })
  }

  // Detener seguimiento
  public stopDriverTracking(): void {
    if (this.watchId !== null) {
      navigator.geolocation.clearWatch(this.watchId)
      this.watchId = null
    }

    if (this.updateInterval) {
      clearInterval(this.updateInterval)
      this.updateInterval = null
    }

    this.isTracking = false
    this.currentDriverId = null
    this.currentLocation = null
  }

  // Manejar actualización de posición
  private async handlePositionUpdate(position: GeolocationPosition): Promise<void> {
    const { latitude, longitude, heading, speed } = position.coords
    const location: Location = { lat: latitude, lng: longitude }

    // Actualizar ubicación actual
    this.currentLocation = location

    // Si hay un cambio significativo en la ubicación, actualizar inmediatamente
    if (this.currentDriverId && this.hasSignificantChange(location)) {
      await this.updateDriverLocation(this.currentDriverId, location, heading, speed)
    }
  }

  // Determinar si hay un cambio significativo en la ubicación
  private hasSignificantChange(newLocation: Location): boolean {
    // Implementar lógica para determinar si el cambio es significativo
    // Por ejemplo, si la distancia es mayor a 20 metros
    return true
  }

  // Manejar errores de posición
  private handlePositionError(error: GeolocationPositionError): void {
    console.error("Error obteniendo ubicación:", error.message)
  }

  // Actualizar ubicación del repartidor en la base de datos
  public async updateDriverLocation(
    driverId: string,
    location: Location,
    heading?: number,
    speed?: number,
  ): Promise<boolean> {
    try {
      const timestamp = new Date().toISOString()

      // Actualizar en la tabla de repartidores
      const { error } = await this.supabase
        .from("delivery_drivers")
        .update({
          current_location: location,
          heading: heading || null,
          speed: speed || null,
          last_updated: timestamp,
        })
        .eq("id", driverId)

      if (error) {
        console.error("Error actualizando ubicación:", error)
        return false
      }

      // Registrar historial de ubicaciones para análisis y mejoras
      await this.supabase
        .from("driver_location_history")
        .insert({
          driver_id: driverId,
          location,
          heading: heading || null,
          speed: speed || null,
          timestamp,
        })
        .then(({ error }) => {
          if (error) console.error("Error registrando historial:", error)
        })

      return true
    } catch (error) {
      console.error("Error en actualización de ubicación:", error)
      return false
    }
  }

  // Suscribirse a actualizaciones de ubicación de un repartidor
  public subscribeToDriverLocation(driverId: string, callback: (location: DriverLocation) => void): () => void {
    // Guardar callback
    this.locationUpdateCallbacks.set(driverId, callback)

    // Si ya existe una suscripción, cancelarla
    if (this.subscriptions.has(driverId)) {
      this.subscriptions.get(driverId)?.unsubscribe()
    }

    // Crear nueva suscripción
    const subscription = this.supabase
      .channel(`driver-location-${driverId}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "delivery_drivers",
          filter: `id=eq.${driverId}`,
        },
        (payload) => {
          if (payload.new && payload.new.current_location) {
            const driverLocation: DriverLocation = {
              driverId,
              location: payload.new.current_location,
              timestamp: payload.new.last_updated || new Date().toISOString(),
              heading: payload.new.heading,
              speed: payload.new.speed,
            }

            // Ejecutar callback
            const cb = this.locationUpdateCallbacks.get(driverId)
            if (cb) cb(driverLocation)
          }
        },
      )
      .subscribe()

    // Guardar suscripción
    this.subscriptions.set(driverId, subscription)

    // Devolver función para cancelar suscripción
    return () => {
      subscription.unsubscribe()
      this.subscriptions.delete(driverId)
      this.locationUpdateCallbacks.delete(driverId)
    }
  }

  // Obtener la última ubicación conocida de un repartidor
  public async getLastKnownDriverLocation(driverId: string): Promise<DriverLocation | null> {
    try {
      const { data, error } = await this.supabase
        .from("delivery_drivers")
        .select("id, current_location, last_updated, heading, speed")
        .eq("id", driverId)
        .single()

      if (error || !data || !data.current_location) {
        return null
      }

      return {
        driverId: data.id,
        location: data.current_location,
        timestamp: data.last_updated || new Date().toISOString(),
        heading: data.heading,
        speed: data.speed,
      }
    } catch (error) {
      console.error("Error obteniendo ubicación del repartidor:", error)
      return null
    }
  }
}

// Exportar instancia singleton
export const realTimeLocationService = RealTimeLocationService.getInstance()
