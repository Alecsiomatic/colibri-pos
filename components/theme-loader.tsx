'use client'

import { useEffect } from 'react'

// ── Conversión hex → canales RGB (para Tailwind) ──────────────
export function hexToRgbChannels(hex: string): string {
  const c = hex.replace('#', '')
  return `${parseInt(c.slice(0, 2), 16)} ${parseInt(c.slice(2, 4), 16)} ${parseInt(c.slice(4, 6), 16)}`
}

// ── Conversión hex → HSL string (para shadcn CSS vars) ────────
export function hexToHslChannels(hex: string): string {
  const c = hex.replace('#', '')
  let r = parseInt(c.slice(0, 2), 16) / 255
  let g = parseInt(c.slice(2, 4), 16) / 255
  let b = parseInt(c.slice(4, 6), 16) / 255
  const max = Math.max(r, g, b), min = Math.min(r, g, b)
  let h = 0, s = 0
  const l = (max + min) / 2
  if (max !== min) {
    const d = max - min
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min)
    switch (max) {
      case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break
      case g: h = ((b - r) / d + 2) / 6; break
      case b: h = ((r - g) / d + 4) / 6; break
    }
  }
  return `${Math.round(h * 360)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%`
}

export interface ThemeColors {
  primary_color: string
  secondary_color: string
  accent_color: string
  background_color: string
}

/** Aplica un tema al DOM actualizando CSS variables en :root */
export function applyThemeToDOM(theme: ThemeColors) {
  const root = document.documentElement
  // Colibri brand vars (RGB channels para Tailwind alpha)
  root.style.setProperty('--colibri-green', hexToRgbChannels(theme.primary_color))
  root.style.setProperty('--colibri-gold', hexToRgbChannels(theme.secondary_color))
  root.style.setProperty('--colibri-wine', hexToRgbChannels(theme.accent_color))
  root.style.setProperty('--colibri-beige', hexToRgbChannels(theme.background_color))
  // shadcn semantic vars (HSL)
  root.style.setProperty('--primary', hexToHslChannels(theme.primary_color))
  root.style.setProperty('--primary-foreground', hexToHslChannels(theme.background_color))
  root.style.setProperty('--secondary', hexToHslChannels(theme.secondary_color))
  root.style.setProperty('--secondary-foreground', hexToHslChannels(theme.primary_color))
  root.style.setProperty('--accent', hexToHslChannels(theme.accent_color))
  root.style.setProperty('--ring', hexToHslChannels(theme.primary_color))
  // Hex format for JS consumption
  root.style.setProperty('--colibri-green-hex', theme.primary_color)
  root.style.setProperty('--colibri-gold-hex', theme.secondary_color)
  root.style.setProperty('--colibri-wine-hex', theme.accent_color)
  root.style.setProperty('--colibri-beige-hex', theme.background_color)
}

/**
 * Componente que carga el tema desde localStorage (instantáneo)
 * y luego valida contra la API.
 */
export default function ThemeLoader() {
  useEffect(() => {
    // 1. Aplicar desde localStorage inmediatamente
    try {
      const cached = localStorage.getItem('colibri-theme')
      if (cached) {
        applyThemeToDOM(JSON.parse(cached))
      }
    } catch { /* ignorar */ }

    // 2. Validar contra API (single row query ≈ 20ms)
    fetch('/api/theme')
      .then(r => r.json())
      .then(data => {
        if (data.success && data.theme) {
          applyThemeToDOM(data.theme)
          localStorage.setItem('colibri-theme', JSON.stringify(data.theme))
        }
      })
      .catch(() => { /* defaults from CSS take over */ })
  }, [])

  return null
}
