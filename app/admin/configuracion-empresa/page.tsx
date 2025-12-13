'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { 
  Settings, 
  Save, 
  Building2, 
  Phone, 
  MapPin, 
  Globe, 
  Instagram,
  Loader2,
  CheckCircle,
  Printer,
  Upload,
  Image as ImageIcon,
  X,
  Bot,
  Brain,
  Key
} from 'lucide-react'
import { useToast } from '@/hooks/use-notifications'

interface BusinessInfo {
  name: string
  slogan: string
  address: string
  phone: string
  email: string
  website: string
  instagram: string
  facebook: string
  whatsapp: string
  logo_url: string | null
  google_maps_api_key: string | null
  enable_driver_tracking: boolean
  delivery_radius_km: number
  openai_api_key: string | null
  openai_model: string
  enable_ai_reports: boolean
}

export default function ConfiguracionEmpresaPage() {
  const toast = useToast()
  const [businessInfo, setBusinessInfo] = useState<BusinessInfo>({
    name: 'SUPER NOVA',
    slogan: 'Restaurante & Delivery',
    address: 'Av. Principal #123',
    phone: '(555) 123-4567',
    email: 'info@supernova.com',
    website: 'www.supernova-delivery.com',
    instagram: '@SuperNovaRestaurante',
    facebook: '@SuperNovaOficial',
    whatsapp: '+52 555 123 4567',
    logo_url: null,
    google_maps_api_key: null,
    enable_driver_tracking: true,
    delivery_radius_km: 10.0,
    openai_api_key: null,
    openai_model: 'gpt-3.5-turbo',
    enable_ai_reports: false
  });
  
  const [loading, setLoading] = useState(false)
  const [saved, setSaved] = useState(false)
  const [uploadingLogo, setUploadingLogo] = useState(false)
  const [logoPreview, setLogoPreview] = useState<string | null>(null)

  // Cargar configuración existente
  useEffect(() => {
    loadBusinessInfo()
  }, [])

  const loadBusinessInfo = async () => {
    try {
      const res = await fetch('/api/admin/business-info', { credentials: 'include' })
      const data = await res.json()
      if (data.success && data.businessInfo) {
        setBusinessInfo(data.businessInfo)
      }
    } catch (error) {
      console.log('No se pudo cargar info empresarial, usando valores por defecto')
    }
  }

  const handleSave = async () => {
    setLoading(true)
    setSaved(false)
    
    try {
      const res = await fetch('/api/admin/business-info', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ businessInfo })
      })

      const data = await res.json()
      
      if (data.success) {
        toast.success('¡Guardado!', 'Información empresarial actualizada correctamente')
        setSaved(true)
        setTimeout(() => setSaved(false), 3000)
      } else {
        toast.error('Error', data.error || 'No se pudo guardar la información')
      }
    } catch (error) {
      toast.error('Error', 'Error al guardar la información')
    } finally {
      setLoading(false)
    }
  }

  const generatePreviewTicket = () => {
    const now = new Date().toLocaleString()
    
    return `
      <html>
        <head>
          <title>Vista Previa - Ticket</title>
          <style>
            body { 
              font-family: 'Courier New', monospace; 
              width: 320px; 
              margin: 20px auto; 
              padding: 15px; 
              background: white;
              color: black;
              border: 1px solid #ddd;
              box-shadow: 0 4px 8px rgba(0,0,0,0.1);
            }
            .header { 
              text-align: center; 
              border-bottom: 2px dashed #000; 
              padding-bottom: 15px; 
              margin-bottom: 15px; 
            }
            .logo {
              width: 80px;
              height: 80px;
              margin: 0 auto 10px auto;
              background: white;
              border-radius: 50%;
              display: flex;
              align-items: center;
              justify-content: center;
              border: 2px solid #000;
              font-size: 24px;
              font-weight: bold;
              overflow: hidden;
            }
            .logo img {
              width: 100%;
              height: 100%;
              object-fit: cover;
              border-radius: 50%;
            }
            .business-name {
              font-size: 18px;
              font-weight: bold;
              margin: 10px 0 5px 0;
              letter-spacing: 1px;
            }
            .business-info {
              font-size: 11px;
              margin: 2px 0;
              color: #333;
            }
            .table-info {
              font-size: 14px;
              font-weight: bold;
              margin: 10px 0;
              padding: 5px;
              background: #f5f5f5;
              border: 1px solid #ddd;
            }
            .item { 
              display: flex; 
              justify-content: space-between; 
              margin: 5px 0; 
              padding: 2px 0;
              border-bottom: 1px dotted #ccc;
            }
            .total { 
              border-top: 2px dashed #000; 
              padding-top: 10px; 
              margin-top: 15px; 
              font-weight: bold; 
              font-size: 16px;
            }
            .footer { 
              text-align: center; 
              margin-top: 20px; 
              font-size: 12px;
              border-top: 1px dashed #000;
              padding-top: 15px;
            }
            .thank-you {
              font-size: 14px;
              font-weight: bold;
              margin: 10px 0;
            }
            .social {
              font-size: 10px;
              margin: 5px 0;
              color: #666;
            }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="logo">
              ${businessInfo.logo_url 
                ? `<img src="http://localhost:3000${businessInfo.logo_url}" alt="Logo" />` 
                : '⭐🚀'
              }
            </div>
            <div class="business-name">${businessInfo.name}</div>
            <div class="business-info">${businessInfo.slogan}</div>
            <div class="business-info">📍 ${businessInfo.address}</div>
            <div class="business-info">📞 ${businessInfo.phone}</div>
            ${businessInfo.email ? `<div class="business-info">✉️ ${businessInfo.email}</div>` : ''}
            
            <div class="table-info">
              <div><strong>Mesa: Mesa 1</strong></div>
              <div>${now}</div>
              <div>Pedidos: 2</div>
            </div>
          </div>
          
          <div class="items">
            <div class="item">
              <span>2x Pizza Margherita</span>
              <span>$350.00</span>
            </div>
            <div class="item">
              <span>2x Coca Cola</span>
              <span>$80.00</span>
            </div>
            <div class="item">
              <span>1x Ensalada César</span>
              <span>$120.00</span>
            </div>
          </div>
          
          <div class="total">
            <div class="item">
              <span>TOTAL:</span>
              <span>$550.00</span>
            </div>
          </div>
          
          <div class="footer">
            <div class="thank-you">¡Gracias por su visita!</div>
            <div class="social">Síguenos en redes sociales</div>
            ${businessInfo.instagram ? `<div class="social">${businessInfo.instagram}</div>` : ''}
            ${businessInfo.facebook ? `<div class="social">${businessInfo.facebook}</div>` : ''}
            ${businessInfo.website ? `<div class="social">${businessInfo.website}</div>` : ''}
            ${businessInfo.whatsapp ? `<div class="social">WhatsApp: ${businessInfo.whatsapp}</div>` : ''}
            <div style="margin-top: 15px; font-size: 10px;">
              Ticket #PREVIEW123
            </div>
          </div>
        </body>
      </html>
    `
  }

  const showPreview = () => {
    const previewContent = generatePreviewTicket()
    const previewWindow = window.open('', '_blank', 'width=400,height=700')
    if (previewWindow) {
      previewWindow.document.write(previewContent)
      previewWindow.document.close()
    }
  }

  const handleLogoUpload = async (file: File) => {
    if (!file) return

    // Validar tipo de archivo
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']
    if (!allowedTypes.includes(file.type)) {
      toast.error('Error', 'Solo se permiten archivos JPG, PNG, GIF o WEBP')
      return
    }

    // Validar tamaño (máximo 2MB)
    if (file.size > 2 * 1024 * 1024) {
      toast.error('Error', 'El archivo no puede ser mayor a 2MB')
      return
    }

    setUploadingLogo(true)

    try {
      const formData = new FormData()
      formData.append('logo', file)

      const res = await fetch('/api/admin/upload-logo', {
        method: 'POST',
        body: formData,
      })

      const data = await res.json()

      if (data.success) {
        setBusinessInfo(prev => ({ ...prev, logo_url: data.logoUrl }))
        toast.success('¡Éxito!', 'Logo subido correctamente')
      } else {
        toast.error('Error', data.error || 'No se pudo subir el logo')
      }
    } catch (error) {
      toast.error('Error', 'Error al subir el logo')
    } finally {
      setUploadingLogo(false)
    }
  }

  const handleLogoRemove = () => {
    setBusinessInfo(prev => ({ ...prev, logo_url: null }))
    toast.success('Logo eliminado', 'El logo ha sido eliminado. Recuerda guardar los cambios.')
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-100 via-white to-purple-100 py-4 sm:py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">Configuración Empresarial</h1>
          <p className="text-gray-600">Edita la información que aparecerá en los tickets</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Formulario de configuración */}
          <div className="space-y-6">
            <Card className="backdrop-blur-md bg-white/80 border-none shadow-lg">
              <CardHeader>
                <CardTitle className="text-gray-800 flex items-center">
                  <Building2 className="h-5 w-5 mr-2" />
                  Información Básica
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="name" className="text-gray-700 font-semibold">
                    Nombre del Negocio
                  </Label>
                  <Input
                    id="name"
                    value={businessInfo.name}
                    onChange={(e) => setBusinessInfo(prev => ({ ...prev, name: e.target.value }))}
                    className="mt-1"
                    placeholder="Ej: SUPER NOVA"
                  />
                </div>

                <div>
                  <Label htmlFor="slogan" className="text-gray-700 font-semibold">
                    Eslogan/Descripción
                  </Label>
                  <Input
                    id="slogan"
                    value={businessInfo.slogan}
                    onChange={(e) => setBusinessInfo(prev => ({ ...prev, slogan: e.target.value }))}
                    className="mt-1"
                    placeholder="Ej: Restaurante & Delivery"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Sección de Logo */}
            <Card className="backdrop-blur-md bg-white/80 border-none shadow-lg">
              <CardHeader>
                <CardTitle className="text-gray-800 flex items-center">
                  <ImageIcon className="h-5 w-5 mr-2" />
                  Logo del Negocio
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {businessInfo.logo_url ? (
                  <div className="flex flex-col items-center space-y-4">
                    <div className="relative">
                      <img
                        src={businessInfo.logo_url}
                        alt="Logo actual"
                        className="w-32 h-32 object-cover rounded-lg border-2 border-gray-200"
                      />
                      <button
                        onClick={handleLogoRemove}
                        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center hover:bg-red-600 transition-colors"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                    <p className="text-sm text-gray-600 text-center">
                      Logo actual - Haz clic en la X para eliminarlo
                    </p>
                  </div>
                ) : (
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                    <div className="space-y-2">
                      <ImageIcon className="h-12 w-12 text-gray-400 mx-auto" />
                      <p className="text-gray-500">No hay logo configurado</p>
                    </div>
                  </div>
                )}

                <div>
                  <Label htmlFor="logo-upload" className="text-gray-700 font-semibold">
                    {businessInfo.logo_url ? 'Cambiar Logo' : 'Subir Logo'}
                  </Label>
                  <div className="mt-2">
                    <label
                      htmlFor="logo-upload"
                      className="cursor-pointer inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {uploadingLogo ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-600 mr-2"></div>
                          Subiendo...
                        </>
                      ) : (
                        <>
                          <Upload className="h-4 w-4 mr-2" />
                          Seleccionar archivo
                        </>
                      )}
                    </label>
                    <input
                      id="logo-upload"
                      type="file"
                      accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
                      onChange={(e) => {
                        const file = e.target.files?.[0]
                        if (file) {
                          handleLogoUpload(file)
                        }
                      }}
                      className="hidden"
                      disabled={uploadingLogo}
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    JPG, PNG, GIF o WEBP. Máximo 2MB.
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card className="backdrop-blur-md bg-white/80 border-none shadow-lg">
              <CardHeader>
                <CardTitle className="text-gray-800 flex items-center">
                  <MapPin className="h-5 w-5 mr-2" />
                  Información de Contacto
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="address" className="text-gray-700 font-semibold">
                    Dirección
                  </Label>
                  <Textarea
                    id="address"
                    value={businessInfo.address}
                    onChange={(e) => setBusinessInfo(prev => ({ ...prev, address: e.target.value }))}
                    className="mt-1"
                    placeholder="Ej: Av. Principal #123, Col. Centro"
                    rows={2}
                  />
                </div>

                <div>
                  <Label htmlFor="phone" className="text-gray-700 font-semibold">
                    Teléfono
                  </Label>
                  <Input
                    id="phone"
                    value={businessInfo.phone}
                    onChange={(e) => setBusinessInfo(prev => ({ ...prev, phone: e.target.value }))}
                    className="mt-1"
                    placeholder="Ej: (555) 123-4567"
                  />
                </div>

                <div>
                  <Label htmlFor="email" className="text-gray-700 font-semibold">
                    Email
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    value={businessInfo.email}
                    onChange={(e) => setBusinessInfo(prev => ({ ...prev, email: e.target.value }))}
                    className="mt-1"
                    placeholder="Ej: info@supernova.com"
                  />
                </div>

                <div>
                  <Label htmlFor="whatsapp" className="text-gray-700 font-semibold">
                    WhatsApp
                  </Label>
                  <Input
                    id="whatsapp"
                    value={businessInfo.whatsapp}
                    onChange={(e) => setBusinessInfo(prev => ({ ...prev, whatsapp: e.target.value }))}
                    className="mt-1"
                    placeholder="Ej: +52 555 123 4567"
                  />
                </div>
              </CardContent>
            </Card>

            <Card className="backdrop-blur-md bg-white/80 border-none shadow-lg">
              <CardHeader>
                <CardTitle className="text-gray-800 flex items-center">
                  <Globe className="h-5 w-5 mr-2" />
                  Redes Sociales
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="website" className="text-gray-700 font-semibold">
                    Sitio Web
                  </Label>
                  <Input
                    id="website"
                    value={businessInfo.website}
                    onChange={(e) => setBusinessInfo(prev => ({ ...prev, website: e.target.value }))}
                    className="mt-1"
                    placeholder="Ej: www.supernova-delivery.com"
                  />
                </div>

                <div>
                  <Label htmlFor="instagram" className="text-gray-700 font-semibold">
                    Instagram
                  </Label>
                  <Input
                    id="instagram"
                    value={businessInfo.instagram}
                    onChange={(e) => setBusinessInfo(prev => ({ ...prev, instagram: e.target.value }))}
                    className="mt-1"
                    placeholder="Ej: @SuperNovaRestaurante"
                  />
                </div>

                <div>
                  <Label htmlFor="facebook" className="text-gray-700 font-semibold">
                    Facebook
                  </Label>
                  <Input
                    id="facebook"
                    value={businessInfo.facebook}
                    onChange={(e) => setBusinessInfo(prev => ({ ...prev, facebook: e.target.value }))}
                    className="mt-1"
                    placeholder="Ej: @SuperNovaOficial"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Sección de Google Maps y Tracking */}
            <Card className="backdrop-blur-md bg-white/80 border-none shadow-lg">
              <CardHeader>
                <CardTitle className="text-gray-800 flex items-center">
                  <MapPin className="h-5 w-5 mr-2" />
                  Google Maps & Tracking
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="google_maps_api_key" className="text-gray-700 font-semibold">
                    Google Maps API Key
                  </Label>
                  <Input
                    id="google_maps_api_key"
                    type="password"
                    value={businessInfo.google_maps_api_key || ''}
                    onChange={(e) => setBusinessInfo(prev => ({ ...prev, google_maps_api_key: e.target.value }))}
                    className="mt-1"
                    placeholder="Ingresa tu clave API de Google Maps"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Se usa para validar direcciones y tracking de drivers
                  </p>
                </div>

                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="enable_driver_tracking"
                    checked={businessInfo.enable_driver_tracking}
                    onChange={(e) => setBusinessInfo(prev => ({ ...prev, enable_driver_tracking: e.target.checked }))}
                    className="rounded"
                  />
                  <Label htmlFor="enable_driver_tracking" className="text-gray-700 font-semibold">
                    Habilitar tracking de repartidores
                  </Label>
                </div>

                <div>
                  <Label htmlFor="delivery_radius_km" className="text-gray-700 font-semibold">
                    Radio de entrega (km)
                  </Label>
                  <Input
                    id="delivery_radius_km"
                    type="number"
                    min="1"
                    max="50"
                    step="0.1"
                    value={businessInfo.delivery_radius_km}
                    onChange={(e) => setBusinessInfo(prev => ({ ...prev, delivery_radius_km: parseFloat(e.target.value) || 10.0 }))}
                    className="mt-1"
                    placeholder="10.0"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Distancia máxima para entregas a domicilio
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Configuración de OpenAI */}
            <Card className="backdrop-blur-md bg-white/80 border-none shadow-lg">
              <CardHeader>
                <CardTitle className="text-gray-800 flex items-center">
                  <Bot className="h-5 w-5 mr-2 text-purple-600" />
                  Inteligencia Artificial (OpenAI)
                  <Badge variant="secondary" className="ml-2 bg-purple-100 text-purple-700">
                    BETA
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="enable_ai_reports"
                    checked={businessInfo.enable_ai_reports}
                    onChange={(e) => setBusinessInfo(prev => ({ ...prev, enable_ai_reports: e.target.checked }))}
                    className="rounded"
                  />
                  <Label htmlFor="enable_ai_reports" className="text-gray-700 font-semibold">
                    Habilitar reportes con IA
                  </Label>
                </div>

                <div>
                  <Label htmlFor="openai_api_key" className="text-gray-700 font-semibold flex items-center">
                    <Key className="h-4 w-4 mr-1" />
                    API Key de OpenAI
                  </Label>
                  <Input
                    id="openai_api_key"
                    type="password"
                    value={businessInfo.openai_api_key || ''}
                    onChange={(e) => setBusinessInfo(prev => ({ ...prev, openai_api_key: e.target.value || null }))}
                    className="mt-1"
                    placeholder="sk-proj-..."
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Tu API key de OpenAI para generar insights inteligentes
                  </p>
                </div>

                <div>
                  <Label htmlFor="openai_model" className="text-gray-700 font-semibold flex items-center">
                    <Brain className="h-4 w-4 mr-1" />
                    Modelo de IA
                  </Label>
                  <select
                    id="openai_model"
                    value={businessInfo.openai_model}
                    onChange={(e) => setBusinessInfo(prev => ({ ...prev, openai_model: e.target.value }))}
                    className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="gpt-3.5-turbo">GPT-3.5 Turbo (Rápido y económico)</option>
                    <option value="gpt-4">GPT-4 (Más inteligente)</option>
                    <option value="gpt-4-turbo">GPT-4 Turbo (Balance perfecto)</option>
                  </select>
                  <p className="text-xs text-gray-500 mt-1">
                    Modelo de IA para generar análisis y predicciones
                  </p>
                </div>

                {businessInfo.enable_ai_reports && !businessInfo.openai_api_key && (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                    <p className="text-sm text-yellow-800">
                      ⚠️ <strong>API Key requerida:</strong> Para usar reportes con IA necesitas configurar tu API key de OpenAI.
                      <br />
                      <a 
                        href="https://platform.openai.com/api-keys" 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-yellow-700 underline hover:text-yellow-900"
                      >
                        Obtén tu API key aquí →
                      </a>
                    </p>
                  </div>
                )}

                {businessInfo.enable_ai_reports && businessInfo.openai_api_key && (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                    <p className="text-sm text-green-800">
                      ✅ <strong>IA configurada:</strong> Los reportes inteligentes están habilitados.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Panel de acciones y vista previa */}
          <div className="space-y-6">
            <Card className="backdrop-blur-md bg-white/80 border-none shadow-lg">
              <CardHeader>
                <CardTitle className="text-gray-800 flex items-center">
                  <Settings className="h-5 w-5 mr-2" />
                  Acciones
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Button
                  onClick={handleSave}
                  disabled={loading}
                  className="w-full bg-green-600 hover:bg-green-700 text-white"
                >
                  {loading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      Guardando...
                    </>
                  ) : saved ? (
                    <>
                      <CheckCircle className="h-4 w-4 mr-2" />
                      ¡Guardado!
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4 mr-2" />
                      Guardar Configuración
                    </>
                  )}
                </Button>

                <Button
                  onClick={showPreview}
                  variant="outline"
                  className="w-full border-blue-500 text-blue-600 hover:bg-blue-50"
                >
                  <Printer className="h-4 w-4 mr-2" />
                  Vista Previa del Ticket
                </Button>

                {saved && (
                  <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                    <div className="flex items-center text-green-700">
                      <CheckCircle className="h-4 w-4 mr-2" />
                      <span className="text-sm font-medium">
                        Configuración guardada correctamente
                      </span>
                    </div>
                    <p className="text-xs text-green-600 mt-1">
                      Los nuevos tickets mostrarán la información actualizada
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="backdrop-blur-md bg-white/80 border-none shadow-lg">
              <CardHeader>
                <CardTitle className="text-gray-800">
                  Información del Ticket
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">Logo</Badge>
                    <span>⭐🚀 (Estrella y cohete)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">Formato</Badge>
                    <span>320px - Impresoras térmicas</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">Colores</Badge>
                    <span>Blanco y negro</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">Fuente</Badge>
                    <span>Courier New (Monospace)</span>
                  </div>
                </div>

                <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-sm text-blue-700">
                    💡 <strong>Tip:</strong> La vista previa te muestra exactamente cómo se verá el ticket impreso.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}