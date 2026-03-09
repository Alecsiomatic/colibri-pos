/**
 * RBAC Permissions System
 *
 * Flow:
 * 1. Each user has a `role` column (owner, manager, cashier, waiter, kitchen, driver, customer)
 * 2. Each role has default permissions (seeded in role_permissions table)
 * 3. Individual users can have overrides (grant/deny specific permissions)
 * 4. Final permissions = role permissions ± user overrides
 */

import { executeQuery } from '@/lib/db-retry'
import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth-simple'

// ─── All Permissions ───────────────────────
export const ALL_PERMISSIONS: Record<string, string> = {
  'orders.view': 'Ver pedidos',
  'orders.create': 'Crear pedidos',
  'orders.cancel': 'Cancelar pedidos',
  'orders.edit_status': 'Cambiar estado de pedidos',
  'products.view': 'Ver productos',
  'products.create': 'Crear productos',
  'products.edit': 'Editar productos',
  'products.delete': 'Eliminar productos',
  'categories.manage': 'Gestionar categorías',
  'modifiers.manage': 'Gestionar modificadores',
  'inventory.view': 'Ver inventario',
  'inventory.adjust': 'Ajustar inventario',
  'ingredients.view': 'Ver insumos',
  'ingredients.manage': 'Gestionar insumos y recetas',
  'users.view': 'Ver usuarios',
  'users.manage': 'Gestionar usuarios',
  'reports.view': 'Ver reportes',
  'reports.financial': 'Reportes financieros',
  'shifts.open_close': 'Abrir/cerrar turnos',
  'shifts.view_all': 'Ver todos los turnos',
  'tables.view': 'Ver mesas',
  'tables.manage': 'Gestionar layout de mesas',
  'kitchen.view': 'Ver cocina (KDS)',
  'kitchen.update_status': 'Actualizar estado en cocina',
  'delivery.manage': 'Gestionar entregas',
  'delivery.self_only': 'Ver solo mis entregas',
  'settings.manage': 'Configuración del sistema',
  'business.configure': 'Configuración de empresa',
  'permissions.manage': 'Gestionar permisos y roles',
}

// ─── Permission groups for UI ──────────────
export const PERMISSION_GROUPS: Record<string, string[]> = {
  'Pedidos': ['orders.view', 'orders.create', 'orders.cancel', 'orders.edit_status'],
  'Productos': ['products.view', 'products.create', 'products.edit', 'products.delete'],
  'Categ/Modif': ['categories.manage', 'modifiers.manage'],
  'Inventario': ['inventory.view', 'inventory.adjust'],
  'Insumos': ['ingredients.view', 'ingredients.manage'],
  'Usuarios': ['users.view', 'users.manage'],
  'Reportes': ['reports.view', 'reports.financial'],
  'Turnos': ['shifts.open_close', 'shifts.view_all'],
  'Mesas': ['tables.view', 'tables.manage'],
  'Cocina': ['kitchen.view', 'kitchen.update_status'],
  'Delivery': ['delivery.manage', 'delivery.self_only'],
  'Config': ['settings.manage', 'business.configure', 'permissions.manage'],
}

// ─── Roles ─────────────────────────────────
export const ROLES: Record<string, string> = {
  owner: 'Dueño',
  manager: 'Gerente',
  cashier: 'Cajero',
  waiter: 'Mesero',
  kitchen: 'Cocina',
  driver: 'Repartidor',
  customer: 'Cliente',
}

// ─── Default permissions per role ──────────
const ALL_PERM_KEYS = Object.keys(ALL_PERMISSIONS)

export const DEFAULT_ROLE_PERMISSIONS: Record<string, string[]> = {
  owner: ALL_PERM_KEYS,
  manager: [
    'orders.view', 'orders.create', 'orders.cancel', 'orders.edit_status',
    'products.view', 'products.create', 'products.edit', 'products.delete',
    'categories.manage', 'modifiers.manage',
    'inventory.view', 'inventory.adjust',
    'ingredients.view', 'ingredients.manage',
    'users.view',
    'reports.view', 'reports.financial',
    'shifts.open_close', 'shifts.view_all',
    'tables.view', 'tables.manage',
    'kitchen.view', 'kitchen.update_status',
    'delivery.manage',
  ],
  cashier: [
    'orders.view', 'orders.create',
    'products.view',
    'inventory.view',
    'ingredients.view',
    'reports.view',
    'shifts.open_close',
    'tables.view',
  ],
  waiter: [
    'orders.view', 'orders.create',
    'products.view',
    'tables.view',
    'kitchen.view',
  ],
  kitchen: [
    'orders.view',
    'products.view',
    'ingredients.view',
    'kitchen.view', 'kitchen.update_status',
  ],
  driver: [
    'orders.view',
    'delivery.self_only',
  ],
  customer: [
    'products.view',
  ],
}

// ─── Migration (idempotent) ────────────────
let _permMigrated = false

export async function ensurePermissionTables() {
  if (_permMigrated) return
  try {
    // Add role column to users if missing
    try {
      await executeQuery(`ALTER TABLE users ADD COLUMN role VARCHAR(30) DEFAULT 'customer'`, [])
    } catch (e: any) {
      if (!e.message?.includes('Duplicate column')) throw e
    }

    // Migrate existing boolean flags → role
    await executeQuery(`UPDATE users SET role = 'owner' WHERE is_admin = 1 AND (role IS NULL OR role = 'customer')`, [])
    await executeQuery(`UPDATE users SET role = 'waiter' WHERE is_waiter = 1 AND is_admin = 0 AND (role IS NULL OR role = 'customer')`, [])
    await executeQuery(`UPDATE users SET role = 'driver' WHERE is_driver = 1 AND is_admin = 0 AND is_waiter = 0 AND (role IS NULL OR role = 'customer')`, [])

    // Role permissions table
    await executeQuery(`
      CREATE TABLE IF NOT EXISTS role_permissions (
        id INT AUTO_INCREMENT PRIMARY KEY,
        role VARCHAR(30) NOT NULL,
        permission VARCHAR(60) NOT NULL,
        UNIQUE KEY uk_role_perm (role, permission),
        INDEX idx_role (role)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    `, [])

    // User permission overrides
    await executeQuery(`
      CREATE TABLE IF NOT EXISTS user_permission_overrides (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        permission VARCHAR(60) NOT NULL,
        granted BOOLEAN NOT NULL DEFAULT TRUE,
        UNIQUE KEY uk_user_perm (user_id, permission),
        INDEX idx_user (user_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    `, [])

    // Seed defaults if role_permissions is empty
    const [countRow] = await executeQuery('SELECT COUNT(*) as cnt FROM role_permissions', []) as any[]
    if (Number(countRow?.cnt) === 0) {
      await seedDefaults()
    }

    _permMigrated = true
  } catch (e: any) {
    if (!e.message?.includes('already exists')) console.error('Permissions migration error:', e.message)
    _permMigrated = true
  }
}

async function seedDefaults() {
  for (const [role, perms] of Object.entries(DEFAULT_ROLE_PERMISSIONS)) {
    for (const perm of perms) {
      try {
        await executeQuery(
          'INSERT IGNORE INTO role_permissions (role, permission) VALUES (?, ?)',
          [role, perm]
        )
      } catch {}
    }
  }
}

// ─── Query functions ───────────────────────

export async function getRolePermissions(role: string): Promise<string[]> {
  await ensurePermissionTables()
  const rows = await executeQuery(
    'SELECT permission FROM role_permissions WHERE role = ?', [role]
  ) as any[]
  return rows.map(r => r.permission)
}

export async function getAllRolePermissions(): Promise<Record<string, string[]>> {
  await ensurePermissionTables()
  const rows = await executeQuery('SELECT role, permission FROM role_permissions ORDER BY role', []) as any[]
  const map: Record<string, string[]> = {}
  for (const role of Object.keys(ROLES)) map[role] = []
  for (const r of rows) {
    if (!map[r.role]) map[r.role] = []
    map[r.role].push(r.permission)
  }
  return map
}

export async function setRolePermissions(role: string, permissions: string[]) {
  await ensurePermissionTables()
  await executeQuery('DELETE FROM role_permissions WHERE role = ?', [role])
  for (const perm of permissions) {
    if (ALL_PERMISSIONS[perm]) {
      await executeQuery('INSERT INTO role_permissions (role, permission) VALUES (?, ?)', [role, perm])
    }
  }
}

export async function resetRoleToDefaults(role: string) {
  const defaults = DEFAULT_ROLE_PERMISSIONS[role] || []
  await setRolePermissions(role, defaults)
}

// ─── User overrides ────────────────────────

export async function getUserOverrides(userId: number): Promise<{ permission: string; granted: boolean }[]> {
  await ensurePermissionTables()
  const rows = await executeQuery(
    'SELECT permission, granted FROM user_permission_overrides WHERE user_id = ?', [userId]
  ) as any[]
  return rows.map(r => ({ permission: r.permission, granted: Boolean(r.granted) }))
}

export async function setUserOverrides(userId: number, overrides: { permission: string; granted: boolean }[]) {
  await ensurePermissionTables()
  await executeQuery('DELETE FROM user_permission_overrides WHERE user_id = ?', [userId])
  for (const o of overrides) {
    if (ALL_PERMISSIONS[o.permission]) {
      await executeQuery(
        'INSERT INTO user_permission_overrides (user_id, permission, granted) VALUES (?, ?, ?)',
        [userId, o.permission, o.granted ? 1 : 0]
      )
    }
  }
}

export async function setUserRole(userId: number, role: string) {
  await ensurePermissionTables()
  if (!ROLES[role]) throw new Error(`Invalid role: ${role}`)
  await executeQuery('UPDATE users SET role = ? WHERE id = ?', [role, userId])
  // Clear overrides when changing role
  await executeQuery('DELETE FROM user_permission_overrides WHERE user_id = ?', [userId])
}

// ─── Effective permissions (role + overrides) ──

export async function getUserEffectivePermissions(userId: number): Promise<{
  role: string; permissions: string[]; overrides: { permission: string; granted: boolean }[]
}> {
  await ensurePermissionTables()
  const [userRow] = await executeQuery('SELECT role FROM users WHERE id = ?', [userId]) as any[]
  const role = userRow?.role || 'customer'

  const rolePerms = await getRolePermissions(role)
  const overrides = await getUserOverrides(userId)

  const permSet = new Set(rolePerms)
  for (const o of overrides) {
    if (o.granted) permSet.add(o.permission)
    else permSet.delete(o.permission)
  }

  return { role, permissions: Array.from(permSet), overrides }
}

// ─── Permission check helpers ──────────────

/** Check if user (by id) has a specific permission */
export async function hasPermission(userId: number, permission: string): Promise<boolean> {
  const { permissions } = await getUserEffectivePermissions(userId)
  return permissions.includes(permission)
}

/** Derive role from legacy boolean flags (for backward compat) */
export function deriveRoleFromFlags(user: any): string {
  if (user.role && user.role !== 'customer') return user.role
  if (user.is_admin || user.isAdmin) return 'owner'
  if (user.is_waiter) return 'waiter'
  if (user.is_driver) return 'driver'
  return 'customer'
}

// ─── API middleware wrapper ────────────────

/** Require specific permission to access an API endpoint */
export function requirePermission(permission: string) {
  return (handler: (request: NextRequest, user: any) => Promise<NextResponse>) => {
    return async (request: NextRequest, ...rest: any[]) => {
      const user = await getCurrentUser(request)
      if (!user) {
        return NextResponse.json({ success: false, error: 'No autorizado' }, { status: 401 })
      }
      const allowed = await hasPermission(user.id, permission)
      if (!allowed) {
        return NextResponse.json({ success: false, error: 'Sin permisos' }, { status: 403 })
      }
      return handler(request, user)
    }
  }
}
