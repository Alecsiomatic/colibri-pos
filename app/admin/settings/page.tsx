"use client"

import { useState, useEffect } from "react"
import AdminLayout from "@/components/admin/admin-layout"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { Save, Eye, EyeOff } from "lucide-react"
import { toast } from "sonner"

export default function SettingsPage() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [showToken, setShowToken] = useState(false)
  
  const [settings, setSettings] = useState({
    mercadopago_public_key: '',
    mercadopago_access_token: '',
    mercadopago_enabled: false
  })

  useEffect(() => {
    fetchSettings()
  }, [])

  async function fetchSettings() {
    try {
      setLoading(true)
      const response = await fetch('/api/admin/settings', {
        credentials: 'include'
      })
      
      if (!response.ok) throw new Error('Error al cargar configuración')
      
      const data = await response.json()
      setSettings({
        mercadopago_public_key: data.mercadopago_public_key || '',
        mercadopago_access_token: data.mercadopago_access_token || '',
        mercadopago_enabled: data.mercadopago_enabled === 'true'
      })
    } catch (error) {
      console.error('Error:', error)
      toast.error('Error al cargar configuración')
    } finally {
      setLoading(false)
    }
  }

  async function handleSave() {
    try {
      setSaving(true)
      
      const response = await fetch('/api/admin/settings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(settings)
      })
      
      if (!response.ok) throw new Error('Error al guardar')
      
      toast.success('Configuración guardada exitosamente')
    } catch (error) {
      console.error('Error:', error)
      toast.error('Error al guardar configuración')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-96">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-purple-600"></div>
        </div>
      </AdminLayout>
    )
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h2 className="text-3xl font-bold text-purple-900">Configuración del Sistema</h2>
          <p className="text-gray-600 mt-2">Gestiona las credenciales y ajustes de pago</p>
        </div>

        {/* Mercado Pago */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Mercado Pago</CardTitle>
                <CardDescription>
                  Configura tus credenciales de Mercado Pago para aceptar pagos con tarjeta
                </CardDescription>
              </div>
              <div className="flex items-center space-x-2">
                <Label htmlFor="mp-enabled">Habilitado</Label>
                <Switch
                  id="mp-enabled"
                  checked={settings.mercadopago_enabled}
                  onCheckedChange={(checked) => 
                    setSettings({ ...settings, mercadopago_enabled: checked })
                  }
                />
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="public-key">Public Key</Label>
              <Input
                id="public-key"
                type="text"
                placeholder="APP_USR-xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
                value={settings.mercadopago_public_key}
                onChange={(e) => 
                  setSettings({ ...settings, mercadopago_public_key: e.target.value })
                }
              />
              <p className="text-sm text-gray-500 mt-1">
                Obtén tus credenciales en: 
                <a 
                  href="https://www.mercadopago.com.mx/developers/panel/credentials" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-purple-600 hover:underline ml-1"
                >
                  Panel de Desarrolladores de Mercado Pago
                </a>
              </p>
            </div>

            <div>
              <Label htmlFor="access-token">Access Token</Label>
              <div className="relative">
                <Input
                  id="access-token"
                  type={showToken ? "text" : "password"}
                  placeholder="APP_USR-xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
                  value={settings.mercadopago_access_token}
                  onChange={(e) => 
                    setSettings({ ...settings, mercadopago_access_token: e.target.value })
                  }
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowToken(!showToken)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                >
                  {showToken ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              <p className="text-sm text-gray-500 mt-1">
                ⚠️ Este token es confidencial, manténlo seguro
              </p>
            </div>

            <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
              <h4 className="font-semibold text-purple-900 mb-2">📝 Cómo obtener tus credenciales:</h4>
              <ol className="text-sm text-purple-800 space-y-1 list-decimal list-inside">
                <li>Ve a <a href="https://www.mercadopago.com.mx/developers/panel" target="_blank" rel="noopener noreferrer" className="underline">tu cuenta de Mercado Pago</a></li>
                <li>Accede a "Tus integraciones" → "Credenciales"</li>
                <li>Copia el Public Key y el Access Token</li>
                <li>Pégalos aquí y habilita la integración</li>
              </ol>
            </div>
          </CardContent>
        </Card>

        {/* Botón guardar */}
        <div className="flex justify-end">
          <Button
            onClick={handleSave}
            disabled={saving}
            className="bg-purple-600 hover:bg-purple-700"
          >
            {saving ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                Guardando...
              </>
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                Guardar Configuración
              </>
            )}
          </Button>
        </div>
      </div>
    </AdminLayout>
  )
}
