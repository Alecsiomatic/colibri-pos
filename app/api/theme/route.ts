/**
 * API de Tema / Colores — GET y POST
 */
import { NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth-simple'
import { getThemeSettings, saveThemeSettings, sanitizeTheme, DEFAULT_THEME } from '@/lib/theme'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const theme = await getThemeSettings()
    return NextResponse.json({ success: true, theme })
  } catch {
    return NextResponse.json({ success: true, theme: DEFAULT_THEME })
  }
}

export async function POST(req: Request) {
  try {
    const user = await getCurrentUser()
    if (!user?.is_admin) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
    }
    const body = await req.json()
    const theme = sanitizeTheme(body)
    const saved = await saveThemeSettings(theme)
    if (!saved) {
      return NextResponse.json({ error: 'Error al guardar' }, { status: 500 })
    }
    return NextResponse.json({ success: true, theme })
  } catch {
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}
