// Declarar el tipo global para la función de callback
declare global {
  interface Window {
    initMap: () => void
  }
}

// Declarar google para que TypeScript no muestre errores
declare let google: any

// Función para cargar la API de Google Maps
let mapsPromise: Promise<typeof google.maps> | null = null

export const loadGoogleMaps = () => {
  if (!mapsPromise) {
    mapsPromise = new Promise((resolve, reject) => {
      // Si ya está cargado, resolvemos inmediatamente
      if (window.google && window.google.maps) {
        resolve(google.maps)
        return
      }

      // Función callback para cuando la API se carga
      window.initMap = () => {
        resolve(google.maps)
      }

      // Proceso de dos pasos para obtener la URL del script
      async function loadMapsScript() {
        try {
          // Paso 1: Obtener un token de acceso
          const tokenResponse = await fetch("/api/maps/url")

          if (!tokenResponse.ok) {
            const errorText = await tokenResponse.text()
            reject(new Error(`Error al obtener token (${tokenResponse.status}): ${errorText}`))
            return
          }

          let tokenData
          try {
            tokenData = await tokenResponse.json()
          } catch (e) {
            reject(new Error(`Error al parsear respuesta JSON: ${await tokenResponse.text()}`))
            return
          }

          if (!tokenData.token) {
            reject(new Error("No se pudo obtener el token para Google Maps"))
            return
          }

          // Paso 2: Usar el token para obtener la URL del script
          const scriptResponse = await fetch("/api/maps/script", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              token: tokenData.token,
              libraries: tokenData.libraries,
            }),
          })

          if (!scriptResponse.ok) {
            const errorText = await scriptResponse.text()
            reject(new Error(`Error al obtener URL del script (${scriptResponse.status}): ${errorText}`))
            return
          }

          let scriptData
          try {
            scriptData = await scriptResponse.json()
          } catch (e) {
            reject(new Error(`Error al parsear respuesta JSON: ${await scriptResponse.text()}`))
            return
          }

          if (scriptData.url) {
            // Cargar el script de la API con la URL obtenida
            const script = document.createElement("script")
            script.src = `${scriptData.url}&callback=initMap`
            script.async = true
            script.defer = true
            script.onerror = (e) => {
              reject(new Error("Error al cargar el script de Google Maps"))
            }
            document.head.appendChild(script)
          } else {
            reject(new Error(`Error al obtener la URL del script: ${scriptData.error || "Error desconocido"}`))
          }
        } catch (err) {
          reject(err)
        }
      }

      loadMapsScript()
    })
  }
  return mapsPromise
}

// Función para calcular la distancia entre dos puntos
export const calculateDistance = (
  origin: google.maps.LatLngLiteral,
  destination: google.maps.LatLngLiteral,
): Promise<{
  distance: number // en metros
  duration: number // en segundos
}> => {
  return new Promise((resolve, reject) => {
    loadGoogleMaps().then((maps) => {
      const service = new maps.DistanceMatrixService()
      service.getDistanceMatrix(
        {
          origins: [origin],
          destinations: [destination],
          travelMode: maps.TravelMode.DRIVING,
        },
        (response, status) => {
          if (status === "OK" && response) {
            const result = response.rows[0].elements[0]
            if (result.status === "OK") {
              resolve({
                distance: result.distance.value,
                duration: result.duration.value,
              })
            } else {
              reject(new Error("No se pudo calcular la distancia"))
            }
          } else {
            reject(new Error("Error en el servicio de distancia"))
          }
        },
      )
    })
  })
}

// Función para geocodificar una dirección
export const geocodeAddress = (address: string): Promise<google.maps.LatLngLiteral> => {
  return new Promise((resolve, reject) => {
    loadGoogleMaps().then((maps) => {
      const geocoder = new maps.Geocoder()
      geocoder.geocode({ address }, (results, status) => {
        if (status === "OK" && results && results[0]) {
          const location = results[0].geometry.location
          resolve({ lat: location.lat(), lng: location.lng() })
        } else {
          reject(new Error("No se pudo geocodificar la dirección"))
        }
      })
    })
  })
}
