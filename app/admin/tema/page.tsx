'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import {
  Palette, RotateCcw, Save, Check, Eye, Loader2, ArrowLeft, Sparkles,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { applyThemeToDOM, type ThemeColors } from '@/components/theme-loader'

const DEFAULT_THEME: ThemeColors = {
  primary_color: '#1f4f37',
  secondary_color: '#ab9976',
  accent_color: '#6c222a',
  background_color: '#d9d5c8',
}

const PRESETS: { name: string; colors: ThemeColors }[] = [
  { name: 'Colibrí Clásico', colors: { ...DEFAULT_THEME } },
  { name: 'Océano', colors: { primary_color: '#1a365d', secondary_color: '#63b3ed', accent_color: '#e53e3e', background_color: '#e2e8f0' } },
  { name: 'Atardecer', colors: { primary_color: '#744210', secondary_color: '#ed8936', accent_color: '#c53030', background_color: '#fffaf0' } },
  { name: 'Bosque Oscuro', colors: { primary_color: '#1a3a2a', secondary_color: '#68d391', accent_color: '#805ad5', background_color: '#f0fff4' } },
  { name: 'Elegante Negro', colors: { primary_color: '#1a202c', secondary_color: '#d69e2e', accent_color: '#b91c1c', background_color: '#f7fafc' } },
  { name: 'Rosa Moderno', colors: { primary_color: '#702459', secondary_color: '#d53f8c', accent_color: '#2b6cb0', background_color: '#fff5f7' } },
  { name: 'Terracota', colors: { primary_color: '#6b3a2a', secondary_color: '#c8956c', accent_color: '#2d5a3d', background_color: '#fdf2e9' } },
  { name: 'Noche Dorada', colors: { primary_color: '#0f172a', secondary_color: '#f59e0b', accent_color: '#dc2626', background_color: '#f8fafc' } },
]

const COLOR_LABELS: { key: keyof ThemeColors; label: string; desc: string }[] = [
  { key: 'primary_color', label: 'Primario', desc: 'Fondos principales, bordes, navegación' },
  { key: 'secondary_color', label: 'Secundario', desc: 'Iconos, badges, texto destacado' },
  { key: 'accent_color', label: 'Acento', desc: 'Alertas, botones de acción, énfasis' },
  { key: 'background_color', label: 'Fondo Claro', desc: 'Fondos claros, texto suave' },
]

export default function TemaPage() {
  const router = useRouter()
  const [colors, setColors] = useState<ThemeColors>({ ...DEFAULT_THEME })
  const [savedColors, setSavedColors] = useState<ThemeColors>({ ...DEFAULT_THEME })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    fetch('/api/theme')
      .then(r => r.json())
      .then(data => {
        if (data.success && data.theme) {
          setColors(data.theme)
          setSavedColors(data.theme)
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const handleColorChange = useCallback((key: keyof ThemeColors, value: string) => {
    const next = { ...colors, [key]: value }
    setColors(next)
    applyThemeToDOM(next)
    setSaved(false)
  }, [colors])

  const handlePreset = useCallback((preset: ThemeColors) => {
    setColors({ ...preset })
    applyThemeToDOM(preset)
    setSaved(false)
  }, [])

  const handleReset = useCallback(() => {
    setColors({ ...savedColors })
    applyThemeToDOM(savedColors)
    setSaved(false)
  }, [savedColors])

  const handleSave = useCallback(async () => {
    setSaving(true)
    try {
      const res = await fetch('/api/theme', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(colors),
      })
      const data = await res.json()
      if (data.success) {
        setSavedColors({ ...colors })
        localStorage.setItem('colibri-theme', JSON.stringify(colors))
        setSaved(true)
        setTimeout(() => setSaved(false), 3000)
      }
    } catch { /* handle error silently */ }
    setSaving(false)
  }, [colors])

  const hasChanges = JSON.stringify(colors) !== JSON.stringify(savedColors)

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-colibri-gold" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white">
      <div className="max-w-6xl mx-auto p-4 md:p-6 space-y-6">

        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => router.push('/admin/dashboard')} className="text-colibri-beige hover:text-white">
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-2">
                <Palette className="h-7 w-7 text-colibri-gold" />
                Tema y Colores
              </h1>
              <p className="text-colibri-beige/70 text-sm mt-1">
                Personaliza la paleta de colores de todo el sistema
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={handleReset}
              disabled={!hasChanges}
              className="border-colibri-gold/30 text-colibri-beige hover:bg-colibri-green/20"
            >
              <RotateCcw className="h-4 w-4 mr-2" />
              Deshacer
            </Button>
            <Button
              onClick={handleSave}
              disabled={saving || !hasChanges}
              className="bg-colibri-green hover:bg-colibri-green/80 text-white"
            >
              {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : saved ? <Check className="h-4 w-4 mr-2" /> : <Save className="h-4 w-4 mr-2" />}
              {saving ? 'Guardando...' : saved ? '¡Guardado!' : 'Guardar Tema'}
            </Button>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">

          {/* Column 1: Color Pickers */}
          <div className="lg:col-span-1 space-y-4">
            <Card className="bg-slate-900/80 border-colibri-green/30">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg text-colibri-gold flex items-center gap-2">
                  <Eye className="h-5 w-5" />
                  Selector de Colores
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-5">
                {COLOR_LABELS.map(({ key, label, desc }) => (
                  <div key={key} className="space-y-2">
                    <label className="text-sm font-medium text-colibri-beige">{label}</label>
                    <div className="flex items-center gap-3">
                      <div className="relative">
                        <input
                          type="color"
                          value={colors[key]}
                          onChange={e => handleColorChange(key, e.target.value)}
                          className="w-12 h-12 rounded-lg cursor-pointer border-2 border-white/20 bg-transparent"
                        />
                      </div>
                      <input
                        type="text"
                        value={colors[key]}
                        onChange={e => {
                          const v = e.target.value
                          if (/^#[0-9a-fA-F]{0,6}$/.test(v)) {
                            setColors(prev => ({ ...prev, [key]: v }))
                            if (/^#[0-9a-fA-F]{6}$/.test(v)) {
                              handleColorChange(key, v)
                            }
                          }
                        }}
                        className="flex-1 bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 font-mono text-sm text-white focus:border-colibri-gold/50 focus:outline-none"
                        maxLength={7}
                      />
                    </div>
                    <p className="text-xs text-slate-500">{desc}</p>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>

          {/* Column 2: Presets */}
          <div className="lg:col-span-1 space-y-4">
            <Card className="bg-slate-900/80 border-colibri-green/30">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg text-colibri-gold flex items-center gap-2">
                  <Sparkles className="h-5 w-5" />
                  Temas Prediseñados
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {PRESETS.map((preset) => {
                  const isActive = JSON.stringify(preset.colors) === JSON.stringify(colors)
                  return (
                    <button
                      key={preset.name}
                      onClick={() => handlePreset(preset.colors)}
                      className={`w-full flex items-center gap-3 p-3 rounded-lg border transition-all ${
                        isActive
                          ? 'border-colibri-gold bg-colibri-green/20'
                          : 'border-slate-700 hover:border-slate-500 bg-slate-800/50 hover:bg-slate-800'
                      }`}
                    >
                      {/* Color circles preview */}
                      <div className="flex -space-x-1">
                        {Object.values(preset.colors).map((color, i) => (
                          <div
                            key={i}
                            className="w-7 h-7 rounded-full border-2 border-slate-900"
                            style={{ backgroundColor: color }}
                          />
                        ))}
                      </div>
                      <span className="text-sm font-medium text-white flex-1 text-left">{preset.name}</span>
                      {isActive && <Check className="h-4 w-4 text-colibri-gold" />}
                    </button>
                  )
                })}
              </CardContent>
            </Card>
          </div>

          {/* Column 3: Live Preview */}
          <div className="lg:col-span-1 space-y-4">
            <Card className="bg-slate-900/80 border-colibri-green/30">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg text-colibri-gold flex items-center gap-2">
                  <Eye className="h-5 w-5" />
                  Vista Previa
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">

                {/* Mini card preview */}
                <div className="rounded-xl overflow-hidden border border-white/10">
                  {/* Gradient header */}
                  <div
                    className="p-4"
                    style={{ background: `linear-gradient(135deg, ${colors.primary_color} 0%, ${colors.secondary_color} 100%)` }}
                  >
                    <p className="text-white font-bold text-sm">Mi Restaurante</p>
                    <p className="text-white/70 text-xs">Bienvenido</p>
                  </div>
                  {/* Body */}
                  <div className="p-4" style={{ backgroundColor: colors.background_color }}>
                    <div className="flex gap-2 mb-3">
                      <span
                        className="px-2 py-1 rounded text-xs font-medium text-white"
                        style={{ backgroundColor: colors.primary_color }}
                      >
                        Entradas
                      </span>
                      <span
                        className="px-2 py-1 rounded text-xs font-medium text-white"
                        style={{ backgroundColor: colors.accent_color }}
                      >
                        Nuevo
                      </span>
                      <span
                        className="px-2 py-1 rounded text-xs font-medium"
                        style={{ backgroundColor: `${colors.secondary_color}30`, color: colors.primary_color }}
                      >
                        $149
                      </span>
                    </div>
                    <div className="flex gap-2">
                      <button
                        className="flex-1 py-2 rounded-lg text-xs font-bold text-white"
                        style={{ backgroundColor: colors.primary_color }}
                      >
                        Agregar
                      </button>
                      <button
                        className="flex-1 py-2 rounded-lg text-xs font-bold border"
                        style={{ borderColor: colors.accent_color, color: colors.accent_color }}
                      >
                        Cancelar
                      </button>
                    </div>
                  </div>
                </div>

                {/* Glass preview */}
                <div className="relative rounded-xl overflow-hidden h-28" style={{ background: `linear-gradient(135deg, ${colors.primary_color}, ${colors.accent_color})` }}>
                  <div className="absolute inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center">
                    <div className="text-center">
                      <p className="font-bold" style={{ color: colors.secondary_color }}>Glass Effect</p>
                      <p className="text-xs text-white/70">Overlay sobre primario</p>
                    </div>
                  </div>
                </div>

                {/* Color swatches */}
                <div className="grid grid-cols-4 gap-2">
                  {COLOR_LABELS.map(({ key, label }) => (
                    <div key={key} className="text-center">
                      <div
                        className="w-full h-10 rounded-lg border border-white/20 mb-1"
                        style={{ backgroundColor: colors[key] }}
                      />
                      <span className="text-[10px] text-slate-400">{label}</span>
                    </div>
                  ))}
                </div>

                {/* Nav preview */}
                <div className="rounded-lg overflow-hidden border border-white/10">
                  <div className="p-3 space-y-1" style={{ backgroundColor: `${colors.primary_color}dd` }}>
                    {['Dashboard', 'Pedidos', 'Productos'].map((item, i) => (
                      <div
                        key={item}
                        className={`px-3 py-2 rounded-md text-xs font-medium flex items-center gap-2 ${
                          i === 0 ? 'text-white' : 'text-white/60'
                        }`}
                        style={i === 0 ? {
                          background: `linear-gradient(to right, ${colors.primary_color}80, ${colors.accent_color}40)`,
                          borderLeft: `2px solid ${colors.secondary_color}`
                        } : {}}
                      >
                        <div
                          className="w-4 h-4 rounded"
                          style={{ backgroundColor: i === 0 ? colors.secondary_color : `${colors.secondary_color}60` }}
                        />
                        {item}
                      </div>
                    ))}
                  </div>
                </div>

              </CardContent>
            </Card>
          </div>

        </div>

        {/* Info footer */}
        <Card className="bg-slate-900/50 border-colibri-green/20">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <Badge className="bg-colibri-green/20 text-colibri-gold border-colibri-gold/30 shrink-0">
                INFO
              </Badge>
              <p className="text-sm text-slate-400">
                Los cambios de color se aplican <strong className="text-white">en tiempo real</strong> mientras seleccionas.
                Al guardar, todos los usuarios verán los nuevos colores en su próxima carga de página.
                El sistema actualiza <strong className="text-white">1,700+ elementos</strong> automáticamente.
              </p>
            </div>
          </CardContent>
        </Card>

      </div>
    </div>
  )
}
