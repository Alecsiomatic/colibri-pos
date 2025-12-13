import { NextRequest, NextResponse } from 'next/server'
import { executeQuery } from '@/lib/db-retry'
import { requireAdmin } from '@/lib/auth-simple'

import { updateUserRole } from '@/lib/db'

export const PATCH = requireAdmin(async (request: NextRequest, adminUser: any, { params }: { params: { id: string } }) => {
  try {
    const userId = Number.parseInt(params.id, 10)
    const { role } = await request.json()

    if (!userId || !role || !['admin', 'driver', 'waiter', 'customer'].includes(role)) {
      return NextResponse.json({ success: false, error: 'Datos inválidos' }, { status: 400 })
    }

    if (adminUser?.id === userId) {
      return NextResponse.json({ success: false, error: 'No puedes cambiar tu propio rol' }, { status: 400 })
    }

    const users = await executeQuery('SELECT id FROM users WHERE id = ?', [userId]) as any[]
    if (users.length === 0) {
      return NextResponse.json({ success: false, error: 'Usuario no encontrado' }, { status: 404 })
    }

    const result = await updateUserRole(userId, role)
    if (result.success) {
      return NextResponse.json({ success: true, message: 'Rol actualizado exitosamente' })
    } else {
      return NextResponse.json({ success: false, error: result.message }, { status: 500 })
    }
  } catch (error: any) {
    console.error('Error al actualizar rol:', error)
    return NextResponse.json(
      { success: false, error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
})