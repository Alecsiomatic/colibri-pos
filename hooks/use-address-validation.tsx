import { useState, useCallback } from 'react'

interface AddressValidationResult {
  isValid: boolean
  formattedAddress?: string
  coordinates?: { lat: number; lng: number }
  error?: string
}

export const useAddressValidation = () => {
  const [isValidating, setIsValidating] = useState(false)

  const validateAddress = useCallback(async (address: string): Promise<AddressValidationResult> => {
    if (!address.trim()) {
      return { isValid: false, error: 'La dirección es requerida' }
    }

    setIsValidating(true)

    try {
      // Obtener la API key desde la configuración empresarial
      const configResponse = await fetch('/api/admin/business-info', {
        credentials: 'include'
      })
      
      if (!configResponse.ok) {
        throw new Error('No se pudo obtener la configuración')
      }

      const configData = await configResponse.json()
      const apiKey = configData.businessInfo?.google_maps_api_key

      if (!apiKey) {
        return {
          isValid: false,
          error: 'Google Maps API no está configurado. Contacta al administrador.'
        }
      }

      const response = await fetch(
        `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&key=${apiKey}`
      )

      const data = await response.json()

      if (data.status === 'OK' && data.results && data.results.length > 0) {
        const result = data.results[0]
        return {
          isValid: true,
          formattedAddress: result.formatted_address,
          coordinates: {
            lat: result.geometry.location.lat,
            lng: result.geometry.location.lng
          }
        }
      } else {
        return {
          isValid: false,
          error: 'No se pudo encontrar la dirección. Verifica que sea correcta.'
        }
      }
    } catch (error) {
      console.error('Error validating address:', error)
      return {
        isValid: false,
        error: 'Error al validar la dirección. Inténtalo de nuevo.'
      }
    } finally {
      setIsValidating(false)
    }
  }, [])

  return { validateAddress, isValidating }
}