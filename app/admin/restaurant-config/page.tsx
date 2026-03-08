'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { useToast } from '@/hooks/use-notifications'
import { MapPin, DollarSign, Ruler, Clock, Gift, Radio, Loader2, Save } from 'lucide-react'

interface RestaurantConfig {
  id: number
  name: string
  address: string
  latitude: number
  longitude: number
  phone: string
  email: string
  delivery_base_fee: number
  delivery_per_km_fee: number
  delivery_time_fee: number
  delivery_free_threshold: number
  delivery_radius_km: number
}

export default function RestaurantConfigPage() {
  const toast = useToast()
  const [config, setConfig] = useState<RestaurantConfig>({
    id: 1,
    name: '',
    address: '',
    latitude: 0,
    longitude: 0,
    phone: '',
    email: '',
    delivery_base_fee: 50,
    delivery_per_km_fee: 15,
    delivery_time_fee: 5,
    delivery_free_threshold: 500,
    delivery_radius_km: 10
  })
  
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  
  useEffect(() => {
    fetchConfig()
  }, [])
  
  const fetchConfig = async () => {
    try {
      const res = await fetch('/api/restaurant-config')
      const data = await res.json()
      
      if (data.success && data.config) {
        setConfig(data.config)
      }
    } catch (error) {
      toast.error('Error al cargar configuración')
    } finally {
      setLoading(false)
    }
  }
  
  const handleSave = async () => {
    setSaving(true)
    try {
      const res = await fetch('/api/restaurant-config', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config)
      })
      
      const data = await res.json()
      
      if (res.ok && data.success) {
        toast.success('✅ Configuración guardada exitosamente')
      } else {
        toast.error(data.error || 'Error al guardar')
      }
    } catch (error) {
      toast.error('Error al guardar configuración')
    } finally {
      setSaving(false)
    }
  }
  
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-black p-8 flex items-center justify-center">
        <Loader2 className="w-12 h-12 text-colibri-gold animate-spin" />
      </div>
    )
  }
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-black p-4 md:p-8">
      <div className="max-w-5xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl md:text-4xl font-black text-white mb-2">
            ⚙️ Configuración del Restaurante
          </h1>
          <p className="text-colibri-beige">
            Administra la información y tarifas de delivery
          </p>
        </div>
        
        {/* Información General */}
        <Card className="bg-slate-900/90 backdrop-blur-xl border-colibri-gold/30">
          <CardHeader>
            <CardTitle className="text-2xl font-bold text-white flex items-center gap-2">
              <MapPin className="text-colibri-gold" />
              Información General
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label className="text-colibri-beige">Nombre del Restaurante</Label>
                <Input
                  value={config.name}
                  onChange={(e) => setConfig({...config, name: e.target.value})}
                  className="bg-slate-800 border-colibri-gold/40 text-white"
                  placeholder="Mi Restaurante"
                />
              </div>
              
              <div>
                <Label className="text-colibri-beige">Teléfono</Label>
                <Input
                  value={config.phone}
                  onChange={(e) => setConfig({...config, phone: e.target.value})}
                  className="bg-slate-800 border-colibri-gold/40 text-white"
                  placeholder="+52 444 123 4567"
                />
              </div>
              
              <div>
                <Label className="text-colibri-beige">Email</Label>
                <Input
                  value={config.email}
                  onChange={(e) => setConfig({...config, email: e.target.value})}
                  className="bg-slate-800 border-colibri-gold/40 text-white"
                  placeholder="contacto@restaurante.com"
                />
              </div>
              
              <div className="md:col-span-2">
                <Label className="text-colibri-beige">Dirección Completa</Label>
                <Input
                  value={config.address}
                  onChange={(e) => setConfig({...config, address: e.target.value})}
                  className="bg-slate-800 border-colibri-gold/40 text-white"
                  placeholder="Calle Nombre 123, Ciudad, Estado, México"
                />
                <p className="text-xs text-slate-400 mt-1">
                  Esta dirección se usará para calcular costos de delivery
                </p>
              </div>
              
              <div>
                <Label className="text-colibri-beige">Latitud</Label>
                <Input
                  type="number"
                  step="0.000001"
                  value={config.latitude}
                  onChange={(e) => setConfig({...config, latitude: parseFloat(e.target.value) || 0})}
                  className="bg-slate-800 border-colibri-gold/40 text-white"
                  placeholder="22.156500"
                />
                <p className="text-xs text-slate-400 mt-1">
                  <a href="https://www.google.com/maps" target="_blank" className="text-colibri-gold hover:underline">
                    Obtener coordenadas en Google Maps
                  </a>
                </p>
              </div>
              
              <div>
                <Label className="text-colibri-beige">Longitud</Label>
                <Input
                  type="number"
                  step="0.000001"
                  value={config.longitude}
                  onChange={(e) => setConfig({...config, longitude: parseFloat(e.target.value) || 0})}
                  className="bg-slate-800 border-colibri-gold/40 text-white"
                  placeholder="-100.985500"
                />
              </div>
            </div>
          </CardContent>
        </Card>
        
        {/* Tarifas de Delivery */}
        <Card className="bg-slate-900/90 backdrop-blur-xl border-colibri-gold/30">
          <CardHeader>
            <CardTitle className="text-2xl font-bold text-white flex items-center gap-2">
              <DollarSign className="text-colibri-gold" />
              Tarifas de Delivery
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label className="text-colibri-beige flex items-center gap-2">
                  <DollarSign className="w-4 h-4" />
                  Tarifa Base ($)
                </Label>
                <Input
                  type="number"
                  step="0.01"
                  value={config.delivery_base_fee}
                  onChange={(e) => setConfig({...config, delivery_base_fee: parseFloat(e.target.value) || 0})}
                  className="bg-slate-800 border-colibri-gold/40 text-white"
                />
                <p className="text-xs text-slate-400 mt-1">
                  Costo mínimo de entrega
                </p>
              </div>
              
              <div>
                <Label className="text-colibri-beige flex items-center gap-2">
                  <Ruler className="w-4 h-4" />
                  Costo por Kilómetro ($)
                </Label>
                <Input
                  type="number"
                  step="0.01"
                  value={config.delivery_per_km_fee}
                  onChange={(e) => setConfig({...config, delivery_per_km_fee: parseFloat(e.target.value) || 0})}
                  className="bg-slate-800 border-colibri-gold/40 text-white"
                />
                <p className="text-xs text-slate-400 mt-1">
                  Se cobra por cada km de distancia
                </p>
              </div>
              
              <div>
                <Label className="text-colibri-beige flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  Cargo por Tiempo ($)
                </Label>
                <Input
                  type="number"
                  step="0.01"
                  value={config.delivery_time_fee}
                  onChange={(e) => setConfig({...config, delivery_time_fee: parseFloat(e.target.value) || 0})}
                  className="bg-slate-800 border-colibri-gold/40 text-white"
                />
                <p className="text-xs text-slate-400 mt-1">
                  Por cada 5 minutos de viaje
                </p>
              </div>
              
              <div>
                <Label className="text-colibri-beige flex items-center gap-2">
                  <Gift className="w-4 h-4" />
                  Envío Gratis Desde ($)
                </Label>
                <Input
                  type="number"
                  step="0.01"
                  value={config.delivery_free_threshold}
                  onChange={(e) => setConfig({...config, delivery_free_threshold: parseFloat(e.target.value) || 0})}
                  className="bg-slate-800 border-colibri-gold/40 text-white"
                />
                <p className="text-xs text-slate-400 mt-1">
                  Pedidos mayores tienen envío gratis
                </p>
              </div>
              
              <div>
                <Label className="text-colibri-beige flex items-center gap-2">
                  <Radio className="w-4 h-4" />
                  Radio Máximo (km)
                </Label>
                <Input
                  type="number"
                  step="0.1"
                  value={config.delivery_radius_km}
                  onChange={(e) => setConfig({...config, delivery_radius_km: parseFloat(e.target.value) || 0})}
                  className="bg-slate-800 border-colibri-gold/40 text-white"
                />
                <p className="text-xs text-slate-400 mt-1">
                  Distancia máxima para entregas
                </p>
              </div>
            </div>
            
            {/* Preview de cálculo */}
            <div className="mt-6 p-4 bg-slate-800/60 rounded-lg border border-colibri-gold/20">
              <h3 className="text-sm font-semibold text-colibri-gold mb-2">
                📊 Ejemplo de Cálculo (5 km, 25 min)
              </h3>
              <div className="text-xs text-slate-300 space-y-1">
                <div>• Tarifa base: ${config.delivery_base_fee.toFixed(2)}</div>
                <div>• Distancia (5 km × ${config.delivery_per_km_fee}): ${(5 * config.delivery_per_km_fee).toFixed(2)}</div>
                <div>• Tiempo (5 bloques × ${config.delivery_time_fee}): ${(5 * config.delivery_time_fee).toFixed(2)}</div>
                <div className="border-t border-slate-600 pt-1 font-semibold text-colibri-gold">
                  Total estimado: ${(config.delivery_base_fee + (5 * config.delivery_per_km_fee) + (5 * config.delivery_time_fee)).toFixed(2)}
                </div>
                <div className="text-colibri-beige">
                  • Pedidos ≥ ${config.delivery_free_threshold} → <span className="text-green-400 font-semibold">Envío GRATIS 🎁</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
        
        {/* Botón Guardar */}
        <Button
          onClick={handleSave}
          disabled={saving}
          className="w-full h-14 text-lg font-bold bg-gradient-to-r from-colibri-green to-colibri-wine hover:opacity-90 text-white"
        >
          {saving ? (
            <>
              <Loader2 className="w-5 h-5 mr-2 animate-spin" />
              Guardando...
            </>
          ) : (
            <>
              <Save className="w-5 h-5 mr-2" />
              Guardar Configuración
            </>
          )}
        </Button>
      </div>
    </div>
  )
}
