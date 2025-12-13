import { NextRequest, NextResponse } from 'next/server'
import { executeQuery } from '@/lib/db-retry'
import { requireAdmin } from '@/lib/auth-simple'

export const DELETE = requireAdmin(async (request: NextRequest, adminUser: any, { params }: { params: { id: string } }) => {
  try {
    const userId = Number.parseInt(params.id, 10)

    if (!userId) {
      return NextResponse.json({ success: false, error: 'ID inválido' }, { status: 400 })
    }

    if (adminUser?.id === userId) {
      return NextResponse.json({ success: false, error: 'No puedes eliminar tu propia cuenta' }, { status: 400 })
    }

    const existing = await executeQuery('SELECT id FROM users WHERE id = ?', [userId]) as any[]
    if (existing.length === 0) {
      return NextResponse.json({ success: false, error: 'Usuario no encontrado' }, { status: 404 })
    }

    await executeQuery('DELETE FROM users WHERE id = ?', [userId])

    return NextResponse.json({ success: true, message: 'Usuario eliminado exitosamente' })
  } catch (error: any) {
    console.error('Error al eliminar usuario:', error)
    return NextResponse.json(
      { success: false, error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
})