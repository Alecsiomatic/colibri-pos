'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useToast } from '@/hooks/use-notifications'
import { Shield, Users, RotateCcw, Save, ChevronDown, ChevronUp, User, Crown } from 'lucide-react'

const ROLE_COLORS: Record<string, string> = {
  owner: 'bg-amber-600',
  manager: 'bg-blue-600',
  cashier: 'bg-green-600',
  waiter: 'bg-purple-600',
  kitchen: 'bg-orange-600',
  driver: 'bg-cyan-600',
  customer: 'bg-gray-600',
}

export default function PermissionsPage() {
  const toast = useToast()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  // Role permissions tab
  const [roles, setRoles] = useState<Record<string, string>>({})
  const [permissions, setPermissions] = useState<Record<string, string>>({})
  const [groups, setGroups] = useState<Record<string, string[]>>({})
  const [defaults, setDefaults] = useState<Record<string, string[]>>({})
  const [rolePermissions, setRolePermissions] = useState<Record<string, string[]>>({})
  const [expandedGroup, setExpandedGroup] = useState<string | null>(null)

  // User tab
  const [users, setUsers] = useState<any[]>([])
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null)
  const [userRole, setUserRole] = useState('')
  const [userPermissions, setUserPermissions] = useState<string[]>([])
  const [userOverrides, setUserOverrides] = useState<{ permission: string; granted: boolean }[]>([])
  const [userRolePerms, setUserRolePerms] = useState<string[]>([])

  useEffect(() => { loadRoleData() }, [])

  const loadRoleData = async () => {
    try {
      const [rolesRes, usersRes] = await Promise.all([
        fetch('/api/permissions?action=roles'),
        fetch('/api/permissions?action=users'),
      ])
      const rolesData = await rolesRes.json()
      const usersData = await usersRes.json()

      if (rolesData.success) {
        setRoles(rolesData.roles)
        setPermissions(rolesData.permissions)
        setGroups(rolesData.groups)
        setDefaults(rolesData.defaults)
        setRolePermissions(rolesData.rolePermissions)
      }
      if (usersData.success) {
        setUsers(usersData.users || [])
      }
    } catch (error) {
      toast.error('Error', 'No se pudieron cargar los permisos')
    } finally {
      setLoading(false)
    }
  }

  const toggleRolePerm = (role: string, perm: string) => {
    setRolePermissions(prev => {
      const current = prev[role] || []
      const has = current.includes(perm)
      return {
        ...prev,
        [role]: has ? current.filter(p => p !== perm) : [...current, perm],
      }
    })
  }

  const saveRolePermissions = async (role: string) => {
    setSaving(true)
    try {
      const res = await fetch('/api/permissions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'set_role_permissions',
          role,
          permissions: rolePermissions[role] || [],
        }),
      })
      const data = await res.json()
      if (data.success) toast.success('Guardado', data.message)
      else toast.error('Error', data.error)
    } catch {
      toast.error('Error', 'No se pudieron guardar los permisos')
    } finally {
      setSaving(false)
    }
  }

  const resetRole = async (role: string) => {
    if (!confirm(`¿Restaurar permisos de "${roles[role]}" a los valores por defecto?`)) return
    try {
      const res = await fetch('/api/permissions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'reset_role', role }),
      })
      const data = await res.json()
      if (data.success) {
        toast.success('Restaurado', data.message)
        setRolePermissions(prev => ({ ...prev, [role]: [...(defaults[role] || [])] }))
      }
    } catch {
      toast.error('Error', 'No se pudo restaurar')
    }
  }

  const loadUserPermissions = async (userId: number) => {
    setSelectedUserId(userId)
    try {
      const res = await fetch(`/api/permissions?action=user&user_id=${userId}`)
      const data = await res.json()
      if (data.success) {
        setUserRole(data.role)
        setUserPermissions(data.permissions)
        setUserOverrides(data.overrides)
        // Get the role's base permissions for comparison
        setUserRolePerms(rolePermissions[data.role] || [])
      }
    } catch {
      toast.error('Error', 'No se pudieron cargar permisos del usuario')
    }
  }

  const changeUserRole = async (userId: number, newRole: string) => {
    try {
      const res = await fetch('/api/permissions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'set_user_role', user_id: userId, role: newRole }),
      })
      const data = await res.json()
      if (data.success) {
        toast.success('Actualizado', `Rol cambiado a ${roles[newRole]}`)
        setUsers(prev => prev.map(u => u.id === userId ? { ...u, role: newRole } : u))
        await loadUserPermissions(userId)
      }
    } catch {
      toast.error('Error', 'No se pudo cambiar el rol')
    }
  }

  const toggleUserOverride = (perm: string) => {
    const roleHas = userRolePerms.includes(perm)
    setUserOverrides(prev => {
      const existing = prev.find(o => o.permission === perm)
      if (existing) {
        // Remove override → revert to role default
        return prev.filter(o => o.permission !== perm)
      }
      // Add override: if role has it → deny; if role doesn't → grant
      return [...prev, { permission: perm, granted: !roleHas }]
    })
  }

  const saveUserOverrides = async () => {
    if (!selectedUserId) return
    setSaving(true)
    try {
      const res = await fetch('/api/permissions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'set_user_overrides',
          user_id: selectedUserId,
          overrides: userOverrides,
        }),
      })
      const data = await res.json()
      if (data.success) {
        toast.success('Guardado', 'Overrides del usuario actualizados')
        await loadUserPermissions(selectedUserId)
      }
    } catch {
      toast.error('Error', 'No se pudieron guardar')
    } finally {
      setSaving(false)
    }
  }

  const getEffectiveForUser = (perm: string): boolean => {
    const override = userOverrides.find(o => o.permission === perm)
    if (override) return override.granted
    return userRolePerms.includes(perm)
  }

  const getOverrideStatus = (perm: string): 'none' | 'granted' | 'denied' => {
    const override = userOverrides.find(o => o.permission === perm)
    if (!override) return 'none'
    return override.granted ? 'granted' : 'denied'
  }

  if (loading) {
    return <div className="flex items-center justify-center h-screen text-colibri-beige">Cargando permisos...</div>
  }

  const roleKeys = Object.keys(roles)

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <Shield className="h-8 w-8 text-colibri-gold" />
          <h1 className="text-3xl font-bold text-colibri-gold">Permisos y Roles</h1>
        </div>

        <Tabs defaultValue="roles" className="w-full">
          <TabsList className="bg-slate-800/50 mb-4">
            <TabsTrigger value="roles" className="data-[state=active]:bg-colibri-wine">
              <Shield className="h-4 w-4 mr-2" />
              Permisos por Rol
            </TabsTrigger>
            <TabsTrigger value="users" className="data-[state=active]:bg-colibri-wine">
              <Users className="h-4 w-4 mr-2" />
              Permisos por Usuario
            </TabsTrigger>
          </TabsList>

          {/* ═══════ TAB 1: PERMISOS POR ROL ═══════ */}
          <TabsContent value="roles">
            <Card className="bg-white/10 backdrop-blur-md border-2 border-colibri-green/30">
              <CardHeader>
                <CardTitle className="text-white">Matriz de Permisos</CardTitle>
                <p className="text-sm text-gray-400">
                  Activa/desactiva permisos para cada rol. Los cambios se guardan por rol.
                </p>
              </CardHeader>
              <CardContent>
                {/* Role headers */}
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-slate-700">
                        <th className="text-left text-colibri-beige py-2 px-2 min-w-[200px]">Permiso</th>
                        {roleKeys.map(role => (
                          <th key={role} className="text-center px-1 py-2 min-w-[80px]">
                            <div className="flex flex-col items-center gap-1">
                              <Badge className={`${ROLE_COLORS[role]} text-white text-xs`}>{roles[role]}</Badge>
                              <div className="flex gap-1">
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="h-5 px-1 text-[10px] text-green-400 hover:bg-green-900/30"
                                  onClick={() => saveRolePermissions(role)}
                                  disabled={saving}
                                >
                                  <Save className="h-3 w-3" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="h-5 px-1 text-[10px] text-amber-400 hover:bg-amber-900/30"
                                  onClick={() => resetRole(role)}
                                >
                                  <RotateCcw className="h-3 w-3" />
                                </Button>
                              </div>
                            </div>
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {Object.entries(groups).map(([groupName, groupPerms]) => (
                        <>
                          <tr
                            key={`group-${groupName}`}
                            className="cursor-pointer hover:bg-slate-800/50"
                            onClick={() => setExpandedGroup(expandedGroup === groupName ? null : groupName)}
                          >
                            <td className="py-2 px-2" colSpan={roleKeys.length + 1}>
                              <div className="flex items-center gap-2 text-colibri-gold font-semibold text-sm">
                                {expandedGroup === groupName ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                                {groupName}
                                <span className="text-gray-500 font-normal text-xs">({groupPerms.length})</span>
                              </div>
                            </td>
                          </tr>
                          {expandedGroup === groupName && groupPerms.map(perm => (
                            <tr key={perm} className="border-b border-slate-800/50 hover:bg-slate-800/30">
                              <td className="py-1.5 px-2 pl-8">
                                <div>
                                  <span className="text-colibri-beige text-sm">{permissions[perm]}</span>
                                  <span className="text-gray-500 text-xs ml-1">({perm})</span>
                                </div>
                              </td>
                              {roleKeys.map(role => (
                                <td key={`${role}-${perm}`} className="text-center py-1.5 px-1">
                                  <Switch
                                    checked={(rolePermissions[role] || []).includes(perm)}
                                    onCheckedChange={() => toggleRolePerm(role, perm)}
                                    className="scale-75"
                                  />
                                </td>
                              ))}
                            </tr>
                          ))}
                        </>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ═══════ TAB 2: PERMISOS POR USUARIO ═══════ */}
          <TabsContent value="users">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              {/* User list */}
              <Card className="bg-white/10 backdrop-blur-md border-2 border-colibri-green/30">
                <CardHeader>
                  <CardTitle className="text-white text-lg">Usuarios</CardTitle>
                </CardHeader>
                <CardContent className="space-y-1 max-h-[70vh] overflow-y-auto">
                  {users.map(u => (
                    <button
                      key={u.id}
                      onClick={() => loadUserPermissions(u.id)}
                      className={`w-full text-left p-2.5 rounded-lg transition flex items-center justify-between ${
                        selectedUserId === u.id
                          ? 'bg-colibri-wine border border-colibri-gold'
                          : 'bg-slate-800/50 hover:bg-slate-750 border border-transparent'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        {u.role === 'owner' ? <Crown className="h-4 w-4 text-amber-400" /> : <User className="h-4 w-4 text-gray-400" />}
                        <div>
                          <div className="text-colibri-beige text-sm font-medium">{u.username}</div>
                          <div className="text-gray-500 text-xs">{u.email}</div>
                        </div>
                      </div>
                      <Badge className={`${ROLE_COLORS[u.role || 'customer']} text-white text-[10px]`}>
                        {roles[u.role || 'customer'] || u.role}
                      </Badge>
                    </button>
                  ))}
                </CardContent>
              </Card>

              {/* User permissions detail */}
              <Card className="lg:col-span-2 bg-white/10 backdrop-blur-md border-2 border-colibri-green/30">
                <CardHeader>
                  <CardTitle className="text-white text-lg">
                    {selectedUserId ? `Permisos de ${users.find(u => u.id === selectedUserId)?.username}` : 'Selecciona un usuario'}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {!selectedUserId ? (
                    <div className="text-center py-12 text-gray-500">
                      <Users className="h-16 w-16 mx-auto mb-4 opacity-50" />
                      <p>Selecciona un usuario de la lista</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {/* Role selector */}
                      <div className="flex items-center gap-3 p-3 bg-slate-800/50 rounded-lg border border-slate-700">
                        <span className="text-colibri-beige font-medium text-sm">Rol:</span>
                        <select
                          value={userRole}
                          onChange={(e) => changeUserRole(selectedUserId, e.target.value)}
                          className="flex-1 p-2 bg-slate-900 border border-colibri-green/40 rounded text-colibri-beige text-sm"
                        >
                          {roleKeys.map(role => (
                            <option key={role} value={role}>{roles[role]}</option>
                          ))}
                        </select>
                        <Button
                          size="sm"
                          onClick={saveUserOverrides}
                          disabled={saving}
                          className="bg-green-600 hover:bg-green-700"
                        >
                          <Save className="h-4 w-4 mr-1" />
                          Guardar Overrides
                        </Button>
                      </div>

                      <p className="text-xs text-gray-400">
                        🟢 = del rol &nbsp; 🔵 = override concedido &nbsp; 🔴 = override denegado &nbsp; Click para toggle override
                      </p>

                      {/* Permissions grid */}
                      <div className="space-y-3 max-h-[55vh] overflow-y-auto">
                        {Object.entries(groups).map(([groupName, groupPerms]) => (
                          <div key={groupName} className="border border-slate-700 rounded-lg overflow-hidden">
                            <div className="bg-slate-800/80 px-3 py-1.5">
                              <span className="text-colibri-gold font-semibold text-sm">{groupName}</span>
                            </div>
                            <div className="p-2 space-y-1">
                              {groupPerms.map(perm => {
                                const effective = getEffectiveForUser(perm)
                                const overrideStatus = getOverrideStatus(perm)
                                const roleHas = userRolePerms.includes(perm)

                                return (
                                  <button
                                    key={perm}
                                    onClick={() => toggleUserOverride(perm)}
                                    className={`w-full flex items-center justify-between p-1.5 rounded text-sm transition ${
                                      effective
                                        ? 'bg-green-900/20 hover:bg-green-900/30'
                                        : 'bg-red-900/10 hover:bg-red-900/20'
                                    }`}
                                  >
                                    <div className="flex items-center gap-2">
                                      <span className={`w-2 h-2 rounded-full ${
                                        overrideStatus === 'granted' ? 'bg-blue-400' :
                                        overrideStatus === 'denied' ? 'bg-red-400' :
                                        effective ? 'bg-green-400' : 'bg-gray-600'
                                      }`} />
                                      <span className={effective ? 'text-colibri-beige' : 'text-gray-500'}>
                                        {permissions[perm]}
                                      </span>
                                    </div>
                                    <div className="flex items-center gap-1">
                                      {overrideStatus !== 'none' && (
                                        <Badge variant="outline" className={`text-[9px] px-1 ${
                                          overrideStatus === 'granted'
                                            ? 'text-blue-400 border-blue-400/50'
                                            : 'text-red-400 border-red-400/50'
                                        }`}>
                                          {overrideStatus === 'granted' ? '+override' : '-override'}
                                        </Badge>
                                      )}
                                      <span className={`text-xs ${effective ? 'text-green-400' : 'text-red-400'}`}>
                                        {effective ? '✓' : '✗'}
                                      </span>
                                    </div>
                                  </button>
                                )
                              })}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
