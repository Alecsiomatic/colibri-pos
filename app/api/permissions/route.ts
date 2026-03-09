import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth-simple'
import {
  getAllRolePermissions,
  setRolePermissions,
  resetRoleToDefaults,
  getUserEffectivePermissions,
  setUserOverrides,
  setUserRole,
  hasPermission,
  ALL_PERMISSIONS,
  PERMISSION_GROUPS,
  ROLES,
  DEFAULT_ROLE_PERMISSIONS,
  ensurePermissionTables,
} from '@/lib/permissions'
import { executeQuery } from '@/lib/db-retry'

export const dynamic = 'force-dynamic'

// GET /api/permissions
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser(request)
    if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

    let canManage = false
    try {
      canManage = await hasPermission(user.id, 'permissions.manage')
    } catch (e: any) {
      console.error('hasPermission error (GET):', e.message)
    }
    if (!canManage && (user.is_admin || user.isAdmin)) canManage = true
    if (!canManage) return NextResponse.json({ error: 'Sin permisos' }, { status: 403 })

    const action = request.nextUrl.searchParams.get('action') || 'roles'

    if (action === 'roles') {
      const rolePermissions = await getAllRolePermissions()
      return NextResponse.json({
        success: true,
        roles: ROLES,
        permissions: ALL_PERMISSIONS,
        groups: PERMISSION_GROUPS,
        defaults: DEFAULT_ROLE_PERMISSIONS,
        rolePermissions,
      })
    }

    if (action === 'user') {
      const userId = Number(request.nextUrl.searchParams.get('user_id'))
      if (!userId) return NextResponse.json({ error: 'user_id requerido' }, { status: 400 })
      const effective = await getUserEffectivePermissions(userId)
      return NextResponse.json({ success: true, ...effective })
    }

    if (action === 'users') {
      await ensurePermissionTables()
      let users: any[] = []
      try {
        users = await executeQuery(
          `SELECT id, username, email, role, is_admin, is_driver, is_waiter
           FROM users ORDER BY username`,
          []
        ) as any[]
      } catch (e: any) {
        // Fallback if role column doesn't exist yet
        if (e.message?.includes('Unknown column')) {
          users = await executeQuery(
            `SELECT id, username, email, is_admin, is_driver, is_waiter
             FROM users ORDER BY username`,
            []
          ) as any[]
          users = users.map((u: any) => ({
            ...u,
            role: u.is_admin ? 'owner' : u.is_waiter ? 'waiter' : u.is_driver ? 'driver' : 'customer'
          }))
        } else {
          throw e
        }
      }
      return NextResponse.json({ success: true, users })
    }

    return NextResponse.json({ error: 'Acción no válida' }, { status: 400 })
  } catch (error: any) {
    console.error('Error in permissions API:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// POST /api/permissions
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser(request)
    if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

    let canManage = false
    try {
      canManage = await hasPermission(user.id, 'permissions.manage')
    } catch (e: any) {
      console.error('hasPermission error (POST):', e.message)
    }
    if (!canManage && (user.is_admin || user.isAdmin)) canManage = true
    if (!canManage) return NextResponse.json({ error: 'Sin permisos' }, { status: 403 })

    const body = await request.json()
    const { action } = body

    if (action === 'set_role_permissions') {
      const { role, permissions } = body
      if (!role || !ROLES[role]) return NextResponse.json({ error: 'Rol inválido' }, { status: 400 })
      if (!Array.isArray(permissions)) return NextResponse.json({ error: 'permissions debe ser array' }, { status: 400 })
      await setRolePermissions(role, permissions)
      return NextResponse.json({ success: true, message: `Permisos de ${ROLES[role]} actualizados` })
    }

    if (action === 'reset_role') {
      const { role } = body
      if (!role || !ROLES[role]) return NextResponse.json({ error: 'Rol inválido' }, { status: 400 })
      await resetRoleToDefaults(role)
      return NextResponse.json({ success: true, message: `${ROLES[role]} restaurado a defaults` })
    }

    if (action === 'set_user_role') {
      const { user_id, role } = body
      if (!user_id || !role) return NextResponse.json({ error: 'user_id y role requeridos' }, { status: 400 })
      await setUserRole(user_id, role)
      return NextResponse.json({ success: true, message: 'Rol actualizado' })
    }

    if (action === 'set_user_overrides') {
      const { user_id, overrides } = body
      if (!user_id || !Array.isArray(overrides)) return NextResponse.json({ error: 'Datos inválidos' }, { status: 400 })
      await setUserOverrides(user_id, overrides)
      return NextResponse.json({ success: true, message: 'Overrides actualizados' })
    }

    return NextResponse.json({ error: 'Acción no válida' }, { status: 400 })
  } catch (error: any) {
    console.error('Error in permissions API:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
