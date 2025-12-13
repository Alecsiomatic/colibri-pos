import { NextRequest, NextResponse } from 'next/server'
import { executeQuery } from '@/lib/db-retry'
import { requireAdmin } from '@/lib/auth-simple'

export const PATCH = requireAdmin(async (request: NextRequest, adminUser: any, { params }: { params: { id: string } }) => {
  try {
    const userId = Number.parseInt(params.id, 10)
    const { active } = await request.json()

    if (!userId || typeof active !== 'boolean') {
      return NextResponse.json({ success: false, error: 'Datos inválidos' }, { status: 400 })
    }

    if (adminUser?.id === userId && !active) {
      return NextResponse.json({ success: false, error: 'No puedes desactivar tu propia cuenta' }, { status: 400 })
    }

    const users = await executeQuery('SELECT id FROM users WHERE id = ?', [userId]) as any[]
    if (users.length === 0) {
      return NextResponse.json({ success: false, error: 'Usuario no encontrado' }, { status: 404 })
    }

    await executeQuery('UPDATE users SET active = ? WHERE id = ?', [active, userId])

    return NextResponse.json({ success: true, message: `Usuario ${active ? 'activado' : 'desactivado'} exitosamente` })
  } catch (error: any) {
    console.error('Error al actualizar estado:', error)
    return NextResponse.json(
      { success: false, error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
})