/**
 * Sistema de Tema Dinámico — Colibrí-REST
 * Permite cambiar los colores del sistema desde el admin sin rebuild.
 */
import { executeQuery } from '@/lib/db'

export interface ThemeSettings {
  primary_color: string    // colibri-green
  secondary_color: string  // colibri-gold
  accent_color: string     // colibri-wine
  background_color: string // colibri-beige
}

export const DEFAULT_THEME: ThemeSettings = {
  primary_color: '#1f4f37',
  secondary_color: '#ab9976',
  accent_color: '#6c222a',
  background_color: '#d9d5c8',
}

export const THEME_PRESETS: { name: string; colors: ThemeSettings }[] = [
  { name: 'Colibrí Clásico', colors: { ...DEFAULT_THEME } },
  { name: 'Océano', colors: { primary_color: '#1a365d', secondary_color: '#63b3ed', accent_color: '#e53e3e', background_color: '#e2e8f0' } },
  { name: 'Atardecer', colors: { primary_color: '#744210', secondary_color: '#ed8936', accent_color: '#c53030', background_color: '#fffaf0' } },
  { name: 'Bosque Oscuro', colors: { primary_color: '#1a3a2a', secondary_color: '#68d391', accent_color: '#805ad5', background_color: '#f0fff4' } },
  { name: 'Elegante Negro', colors: { primary_color: '#1a202c', secondary_color: '#d69e2e', accent_color: '#b91c1c', background_color: '#f7fafc' } },
  { name: 'Rosa Moderno', colors: { primary_color: '#702459', secondary_color: '#d53f8c', accent_color: '#2b6cb0', background_color: '#fff5f7' } },
  { name: 'Terracota', colors: { primary_color: '#6b3a2a', secondary_color: '#c8956c', accent_color: '#2d5a3d', background_color: '#fdf2e9' } },
  { name: 'Noche Dorada', colors: { primary_color: '#0f172a', secondary_color: '#f59e0b', accent_color: '#dc2626', background_color: '#f8fafc' } },
]

function isValidHex(hex: string): boolean {
  return /^#[0-9a-fA-F]{6}$/.test(hex)
}

export function sanitizeTheme(input: any): ThemeSettings {
  return {
    primary_color: isValidHex(input?.primary_color) ? input.primary_color.toLowerCase() : DEFAULT_THEME.primary_color,
    secondary_color: isValidHex(input?.secondary_color) ? input.secondary_color.toLowerCase() : DEFAULT_THEME.secondary_color,
    accent_color: isValidHex(input?.accent_color) ? input.accent_color.toLowerCase() : DEFAULT_THEME.accent_color,
    background_color: isValidHex(input?.background_color) ? input.background_color.toLowerCase() : DEFAULT_THEME.background_color,
  }
}

export function hexToRgb(hex: string): string {
  const c = hex.replace('#', '')
  return `${parseInt(c.slice(0, 2), 16)} ${parseInt(c.slice(2, 4), 16)} ${parseInt(c.slice(4, 6), 16)}`
}

export function hexToHsl(hex: string): string {
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

// ── DB operations ─────────────────────────────────────────────

export async function ensureThemeTable(): Promise<void> {
  try {
    await executeQuery(`
      CREATE TABLE IF NOT EXISTS theme_settings (
        id INT PRIMARY KEY DEFAULT 1,
        primary_color VARCHAR(7) NOT NULL DEFAULT '#1f4f37',
        secondary_color VARCHAR(7) NOT NULL DEFAULT '#ab9976',
        accent_color VARCHAR(7) NOT NULL DEFAULT '#6c222a',
        background_color VARCHAR(7) NOT NULL DEFAULT '#d9d5c8',
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `)
    await executeQuery(`INSERT IGNORE INTO theme_settings (id) VALUES (1)`)
  } catch (e) {
    console.error('[theme] Error creating table:', e)
  }
}

export async function getThemeSettings(): Promise<ThemeSettings> {
  try {
    await ensureThemeTable()
    const rows = await executeQuery('SELECT primary_color, secondary_color, accent_color, background_color FROM theme_settings WHERE id = 1') as any[]
    if (rows.length > 0) return sanitizeTheme(rows[0])
  } catch (e) {
    console.error('[theme] Error reading:', e)
  }
  return DEFAULT_THEME
}

export async function saveThemeSettings(theme: ThemeSettings): Promise<boolean> {
  const safe = sanitizeTheme(theme)
  try {
    await ensureThemeTable()
    await executeQuery(
      `UPDATE theme_settings SET primary_color = ?, secondary_color = ?, accent_color = ?, background_color = ? WHERE id = 1`,
      [safe.primary_color, safe.secondary_color, safe.accent_color, safe.background_color]
    )
    return true
  } catch (e) {
    console.error('[theme] Error saving:', e)
    return false
  }
}
