"use client"

import { useState, useEffect } from "react"
import AdminLayout from "@/components/admin/admin-layout"
import { Users, Search, Shield, Truck, UserCheck, UserX, Eye, Edit, Trash2, Plus, Mail, Phone, Calendar, MoreHorizontal } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useAuth } from "@/hooks/use-auth"
import { useToast } from "@/hooks/use-notifications"
import { cn } from "@/lib/utils"

interface User {
  id: number
  username: string
  email: string
  full_name?: string
  phone?: string
  is_admin: boolean
  is_driver: boolean
  is_waiter: boolean
  active: boolean
  created_at: string
  last_login?: string
  orders_count?: number
}

export default function AdminUsersPage() {
  const { user: currentUser } = useAuth()
  const toast = useToast()
  
  // Estado local
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [roleFilter, setRoleFilter] = useState<string>("all")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isCreating, setIsCreating] = useState(false)
  const [isUpdating, setIsUpdating] = useState(false)

  // Cargar usuarios
  const fetchUsers = async () => {
    console.log('[Users Page] Starting fetch...')
    setLoading(true)
    try {
      const response = await fetch('/api/admin/users', {
        credentials: 'include'
      })
      
      console.log('[Users Page] Response status:', response.status)
      
      if (!response.ok) {
        const errorText = await response.text()
        console.error('[Users Page] Error response:', errorText)
        throw new Error('Error al cargar usuarios')
      }
      
      const data = await response.json()
      console.log('[Users Page] Response data:', data)
      
      if (!data.success) {
        throw new Error(data.error || 'Error al cargar usuarios')
      }
      
      console.log('[Users Page] Users loaded:', data.users?.length || 0)
      setUsers(data.users || [])
    } catch (error) {
      console.error('[Users Page] Fetch error:', error)
      // Error state is handled by loading/empty state in UI
    } finally {
      setLoading(false)
      console.log('[Users Page] Loading complete')
    }
  }

  useEffect(() => {
    fetchUsers()
  }, [])

  // Filtrar usuarios
  const filteredUsers = users.filter(user => {
    const matchesSearch = user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (user.full_name && user.full_name.toLowerCase().includes(searchTerm.toLowerCase()))
    
  const matchesRole = roleFilter === "all" || 
             (roleFilter === "admin" && user.is_admin) ||
             (roleFilter === "driver" && user.is_driver) ||
             (roleFilter === "waiter" && user.is_waiter) ||
             (roleFilter === "customer" && !user.is_admin && !user.is_driver && !user.is_waiter)
    
    const matchesStatus = statusFilter === "all" ||
                         (statusFilter === "active" && user.active) ||
                         (statusFilter === "inactive" && !user.active)
    
    return matchesSearch && matchesRole && matchesStatus
  })

  // Estadísticas
  const stats = {
    total: users.length,
    admins: users.filter(u => u.is_admin).length,
    drivers: users.filter(u => u.is_driver).length,
    waiters: users.filter(u => u.is_waiter).length,
    customers: users.filter(u => !u.is_admin && !u.is_driver && !u.is_waiter).length,
    active: users.filter(u => u.active).length,
    inactive: users.filter(u => !u.active).length
  }

  // Actualizar rol de usuario
  const updateUserRole = async (userId: number, role: string) => {
    try {
      const response = await fetch(`/api/admin/users/${userId}/role`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ role })
      })

      if (!response.ok) {
        throw new Error('Error al actualizar rol')
      }

      await fetchUsers()
      toast.success("Rol actualizado", "El rol del usuario se ha actualizado exitosamente")
    } catch (error) {
      console.error('Error updating user role:', error)
      toast.error("Error", "No se pudo actualizar el rol del usuario")
    }
  }

  // Alternar estado activo
  const toggleUserStatus = async (userId: number, currentStatus: boolean) => {
    try {
      const response = await fetch(`/api/admin/users/${userId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ active: !currentStatus })
      })

      if (!response.ok) {
        throw new Error('Error al actualizar estado')
      }

      await fetchUsers()
      toast.success(
        !currentStatus ? "Usuario activado" : "Usuario desactivado",
        `El usuario ahora está ${!currentStatus ? "activo" : "inactivo"}`
      )
    } catch (error) {
      console.error('Error updating user status:', error)
      toast.error("Error", "No se pudo actualizar el estado del usuario")
    }
  }

  // Eliminar usuario
  const deleteUser = async (userId: number, username: string) => {
    if (!confirm(`¿Estás seguro de que quieres eliminar al usuario "${username}"?`)) {
      return
    }

    try {
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: 'DELETE',
        credentials: 'include'
      })

      if (!response.ok) {
        throw new Error('Error al eliminar usuario')
      }

      await fetchUsers()
      toast.success("Usuario eliminado", "El usuario se ha eliminado exitosamente")
    } catch (error) {
      console.error('Error deleting user:', error)
      toast.error("Error", "No se pudo eliminar el usuario")
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getRoleBadge = (user: User) => {
    if (user.is_admin) {
      return <Badge className="bg-colibri-wine/20 text-colibri-wine dark:bg-colibri-wine/30 dark:text-colibri-gold">Admin</Badge>
    }
    if (user.is_driver) {
      return <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">Driver</Badge>
    }
    if (user.is_waiter) {
      return <Badge className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">Mesero</Badge>
    }
    return <Badge variant="outline">Customer</Badge>
  }

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-96">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-purple-600"></div>
        </div>
      </AdminLayout>
    )
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
              Gestión de Usuarios
            </h1>
            <p className="text-muted-foreground">
              Administra usuarios, roles y permisos del sistema
            </p>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
          <Card className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950 dark:to-blue-900">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-blue-600 dark:text-blue-400">Total</p>
                  <p className="text-2xl font-bold text-blue-900 dark:text-blue-100">{stats.total}</p>
                </div>
                <Users className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-950 dark:to-purple-900">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-colibri-wine dark:text-colibri-wine">Admins</p>
                  <p className="text-2xl font-bold text-colibri-wine dark:text-colibri-wine">{stats.admins}</p>
                </div>
                <Shield className="h-6 w-6 text-colibri-wine dark:text-colibri-wine" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-indigo-50 to-indigo-100 dark:from-indigo-950 dark:to-indigo-900">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-indigo-600 dark:text-indigo-400">Drivers</p>
                  <p className="text-2xl font-bold text-indigo-900 dark:text-indigo-100">{stats.drivers}</p>
                </div>
                <Truck className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-yellow-50 to-yellow-100 dark:from-yellow-950 dark:to-yellow-900">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-yellow-600 dark:text-yellow-400">Meseros</p>
                  <p className="text-2xl font-bold text-yellow-900 dark:text-yellow-100">{stats.waiters}</p>
                </div>
                <UserCheck className="h-6 w-6 text-yellow-600 dark:text-yellow-400" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950 dark:to-green-900">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-green-600 dark:text-green-400">Customers</p>
                  <p className="text-2xl font-bold text-green-900 dark:text-green-100">{stats.customers}</p>
                </div>
                <UserCheck className="h-6 w-6 text-green-600 dark:text-green-400" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-emerald-50 to-emerald-100 dark:from-emerald-950 dark:to-emerald-900">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-emerald-600 dark:text-emerald-400">Activos</p>
                  <p className="text-2xl font-bold text-emerald-900 dark:text-emerald-100">{stats.active}</p>
                </div>
                <UserCheck className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="p-6">
            <div className="flex flex-col lg:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                  <Input
                    placeholder="Buscar usuarios..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <Select value={roleFilter} onValueChange={setRoleFilter}>
                <SelectTrigger className="w-full lg:w-40">
                  <SelectValue placeholder="Rol" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los roles</SelectItem>
                  <SelectItem value="admin">Administradores</SelectItem>
                  <SelectItem value="driver">Drivers</SelectItem>
                  <SelectItem value="waiter">Meseros</SelectItem>
                  <SelectItem value="customer">Clientes</SelectItem>
                </SelectContent>
              </Select>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full lg:w-40">
                  <SelectValue placeholder="Estado" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los estados</SelectItem>
                  <SelectItem value="active">Activos</SelectItem>
                  <SelectItem value="inactive">Inactivos</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Users Table */}
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Usuario</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Rol</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Registro</TableHead>
                  <TableHead>Último acceso</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell>
                      <div className="flex items-center space-x-3">
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={`https://api.dicebear.com/7.x/initials/svg?seed=${user.username}`} />
                          <AvatarFallback>
                            {user.username.slice(0, 2).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium">{user.username}</p>
                          {user.full_name && (
                            <p className="text-sm text-muted-foreground">{user.full_name}</p>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-1">
                        <Mail className="h-4 w-4 text-muted-foreground" />
                        <span>{user.email}</span>
                      </div>
                      {user.phone && (
                        <div className="flex items-center space-x-1 mt-1">
                          <Phone className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm text-muted-foreground">{user.phone}</span>
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      {getRoleBadge(user)}
                    </TableCell>
                    <TableCell>
                      <Badge variant={user.active ? "default" : "secondary"} className={cn(
                        user.active 
                          ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200" 
                          : "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200"
                      )}>
                        {user.active ? "Activo" : "Inactivo"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-1">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">{formatDate(user.created_at)}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      {user.last_login ? (
                        <span className="text-sm">{formatDate(user.last_login)}</span>
                      ) : (
                        <span className="text-sm text-muted-foreground">Nunca</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => {
                            setSelectedUser(user)
                            setIsViewDialogOpen(true)
                          }}>
                            <Eye className="h-4 w-4 mr-2" />
                            Ver detalles
                          </DropdownMenuItem>
                          
                          {currentUser?.id !== user.id && (
                            <>
                              <DropdownMenuItem onClick={() => toggleUserStatus(user.id, user.active)}>
                                {user.active ? (
                                  <>
                                    <UserX className="h-4 w-4 mr-2" />
                                    Desactivar
                                  </>
                                ) : (
                                  <>
                                    <UserCheck className="h-4 w-4 mr-2" />
                                    Activar
                                  </>
                                )}
                              </DropdownMenuItem>
                              
                              {/* Opción para hacer/quitar admin */}
                              <DropdownMenuItem 
                                onClick={() => updateUserRole(user.id, user.is_admin ? 'customer' : 'admin')}
                                className={user.is_admin ? "text-orange-600 hover:text-orange-700" : "text-colibri-green hover:text-colibri-green/80"}
                              >
                                <Shield className="h-4 w-4 mr-2" />
                                {user.is_admin ? 'Quitar admin' : 'Hacer admin'}
                              </DropdownMenuItem>
                              
                              {!user.is_admin && (
                                <>
                                  <DropdownMenuItem onClick={() => updateUserRole(user.id, user.is_driver ? 'customer' : 'driver')}>
                                    <Truck className="h-4 w-4 mr-2" />
                                    {user.is_driver ? 'Quitar driver' : 'Hacer driver'}
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => updateUserRole(user.id, user.is_waiter ? 'customer' : 'waiter')}>
                                    <UserCheck className="h-4 w-4 mr-2 text-yellow-500" />
                                    {user.is_waiter ? 'Quitar mesero' : 'Hacer mesero'}
                                  </DropdownMenuItem>
                                </>
                              )}
                              
                              <DropdownMenuItem 
                                onClick={() => deleteUser(user.id, user.username)}
                                className="text-red-600 hover:text-red-700"
                              >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Eliminar
                              </DropdownMenuItem>
                            </>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            {filteredUsers.length === 0 && (
              <div className="p-12 text-center">
                <Users className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-lg font-semibold mb-2">No se encontraron usuarios</h3>
                <p className="text-muted-foreground">
                  {searchTerm || roleFilter !== "all" || statusFilter !== "all"
                    ? "Prueba ajustando los filtros de búsqueda"
                    : "No hay usuarios registrados en el sistema"
                  }
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* View User Dialog */}
        <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Detalles del Usuario</DialogTitle>
            </DialogHeader>
            {selectedUser && (
              <div className="space-y-6">
                <div className="flex items-center space-x-4">
                  <Avatar className="h-16 w-16">
                    <AvatarImage src={`https://api.dicebear.com/7.x/initials/svg?seed=${selectedUser.username}`} />
                    <AvatarFallback className="text-lg">
                      {selectedUser.username.slice(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h3 className="text-xl font-semibold">{selectedUser.username}</h3>
                    {selectedUser.full_name && (
                      <p className="text-muted-foreground">{selectedUser.full_name}</p>
                    )}
                    <div className="flex gap-2 mt-2">
                      {getRoleBadge(selectedUser)}
                      <Badge variant={selectedUser.active ? "default" : "secondary"}>
                        {selectedUser.active ? "Activo" : "Inactivo"}
                      </Badge>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Email</Label>
                    <p className="mt-1">{selectedUser.email}</p>
                  </div>
                  {selectedUser.phone && (
                    <div>
                      <Label className="text-sm font-medium text-muted-foreground">Teléfono</Label>
                      <p className="mt-1">{selectedUser.phone}</p>
                    </div>
                  )}
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Fecha de registro</Label>
                    <p className="mt-1">{formatDate(selectedUser.created_at)}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Último acceso</Label>
                    <p className="mt-1">
                      {selectedUser.last_login ? formatDate(selectedUser.last_login) : "Nunca"}
                    </p>
                  </div>
                  {selectedUser.orders_count !== undefined && (
                    <div>
                      <Label className="text-sm font-medium text-muted-foreground">Total de órdenes</Label>
                      <p className="mt-1">{selectedUser.orders_count}</p>
                    </div>
                  )}
                </div>
              </div>
            )}
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsViewDialogOpen(false)}>
                Cerrar
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  )
}