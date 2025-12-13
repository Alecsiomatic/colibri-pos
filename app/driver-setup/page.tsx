"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Truck, Check, AlertCircle, Users } from "lucide-react"
import { useRouter } from "next/navigation"

type UserProfile = {
  id: number
  username: string
  is_admin: boolean
  is_driver: boolean
  created_at: string
}

export default function DriverSetupPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [loadingUsers, setLoadingUsers] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [users, setUsers] = useState<UserProfile[]>([])
  const [selectedUserId, setSelectedUserId] = useState<number | "">("")
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null)
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    email: "",
  })

  // Cargar usuarios al iniciar
  useEffect(() => {
    const fetchUsers = async () => {
      try {
  const response = await fetch("/api/admin/users", { credentials: "include" })
        if (!response.ok) {
          throw new Error("No se pudieron cargar los usuarios")
        }
        const data = await response.json()
        if (!data.success) {
          throw new Error(data.error || "No se pudieron cargar los usuarios")
        }
        setUsers(data.users || [])

        // Intentar obtener el usuario actual
        const currentUserResponse = await fetch("/api/users/profile", { credentials: "include" })
        if (currentUserResponse.ok) {
          const currentUserData = await currentUserResponse.json()
          if (currentUserData.success && currentUserData.user) {
            const currentUserProfile = data.users.find((u: UserProfile) => Number(u.id) === Number(currentUserData.user.id))
            if (currentUserProfile) {
              setCurrentUser(currentUserProfile)
              setSelectedUserId(currentUserProfile.id)
              setFormData({
                name: currentUserData.user.username || currentUserProfile.username,
                email: currentUserData.user.email || "",
                phone: currentUserData.user.driver_info?.phone || "",
              })
            }
          }
        }
      } catch (err: any) {
        console.error("Error al cargar usuarios:", err)
        setError("No se pudieron cargar los usuarios. Verifica que tienes permisos de administrador.")
      } finally {
        setLoadingUsers(false)
      }
    }

    fetchUsers()
  }, [])

  // Actualizar formulario cuando se selecciona un usuario
  useEffect(() => {
    if (selectedUserId) {
  const selectedUser = users.find((u) => u.id === selectedUserId)
      if (selectedUser) {
        setFormData({
          name: selectedUser.username,
          email: selectedUser.username.includes("@") ? selectedUser.username : "",
          phone: "",
        })
      }
    }
  }, [selectedUserId, users])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setSuccess(false)

  if (!selectedUserId) {
      setError("Debes seleccionar un usuario")
      setLoading(false)
      return
    }

    if (!formData.name || !formData.phone || !formData.email) {
      setError("Todos los campos son obligatorios")
      setLoading(false)
      return
    }

    try {
      const response = await fetch("/api/admin/create-driver", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          userId: selectedUserId,
          name: formData.name,
          phone: formData.phone,
          email: formData.email,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Error al crear el repartidor")
      }

      setSuccess(true)

      // Actualizar la lista de usuarios para reflejar el cambio
      setUsers((prevUsers) =>
        prevUsers.map((user) => (user.id === selectedUserId ? { ...user, is_driver: true } : user)),
      )

      // Esperar 2 segundos y redirigir al panel de administración
      setTimeout(() => {
        router.push("/admin/delivery")
      }, 2000)
    } catch (err: any) {
      console.error("Error:", err)
      setError(err.message || "Error al crear el repartidor")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-amber-50 flex flex-col items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8">
        <div className="flex items-center justify-center mb-6">
          <Truck className="h-12 w-12 text-amber-700" />
        </div>
        <h1 className="text-2xl font-bold text-center text-amber-900 mb-2">Configuración de Repartidor</h1>
        <p className="text-amber-700 text-center mb-6">Asigna el rol de repartidor a un usuario existente.</p>

        {error && (
          <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-6 rounded">
            <div className="flex items-center">
              <AlertCircle className="h-5 w-5 mr-2" />
              <p>{error}</p>
            </div>
          </div>
        )}

        {success && (
          <div className="bg-green-100 border-l-4 border-green-500 text-green-700 p-4 mb-6 rounded">
            <div className="flex items-center mb-2">
              <Check className="h-5 w-5 mr-2" />
              <p className="font-medium">¡Repartidor creado con éxito!</p>
            </div>
            <p className="text-sm">Redirigiendo al panel de administración...</p>
          </div>
        )}

        {loadingUsers ? (
          <div className="flex justify-center items-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-700"></div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Seleccionar Usuario</label>
              <div className="relative">
                <select
                  value={selectedUserId === "" ? "" : String(selectedUserId)}
                  onChange={(e) => setSelectedUserId(e.target.value ? Number(e.target.value) : "")}
                  className="block w-full pl-3 pr-10 py-2 text-base border border-gray-300 focus:outline-none focus:ring-amber-500 focus:border-amber-500 rounded-md"
                  required
                >
                  <option value="">Selecciona un usuario</option>
                  {currentUser && (
                    <option value={currentUser.id} className="font-medium">
                      {currentUser.username} (Tú) {currentUser.is_driver ? "- Ya es repartidor" : ""}
                    </option>
                  )}
                  <optgroup label="Otros usuarios">
                    {users
                      .filter((user) => !currentUser || user.id !== currentUser.id)
                      .map((user) => (
                        <option key={user.id} value={user.id} disabled={user.is_driver}>
                          {user.username} {user.is_admin ? "(Admin)" : ""} {user.is_driver ? "- Ya es repartidor" : ""}
                        </option>
                      ))}
                  </optgroup>
                </select>
                <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none">
                  <Users className="h-4 w-4 text-gray-400" />
                </div>
              </div>
            </div>

            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                Nombre Completo
              </label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-amber-500 focus:border-amber-500"
                required
              />
            </div>

            <div>
              <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
                Teléfono
              </label>
              <input
                type="tel"
                id="phone"
                name="phone"
                value={formData.phone}
                onChange={handleInputChange}
                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-amber-500 focus:border-amber-500"
                required
              />
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                Correo Electrónico
              </label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-amber-500 focus:border-amber-500"
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading || !selectedUserId}
              className="w-full bg-amber-700 hover:bg-amber-800 text-white py-3 px-4 rounded-md font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Procesando..." : "Designar como Repartidor"}
            </button>
          </form>
        )}

        <div className="mt-6 text-center">
          <a href="/admin/delivery" className="text-amber-700 hover:text-amber-900 text-sm">
            Volver al panel de reparto
          </a>
        </div>
      </div>
    </div>
  )
}
