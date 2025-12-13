// Simplificar el almacenamiento en memoria para depuración
import bcrypt from "bcryptjs"

// Tipos
export type User = {
  id: number
  username: string
  password: string
  isAdmin: boolean
  createdAt: string
}

export type Order = {
  id: number
  userId: number
  items: string
  total: number
  status: string
  customerInfo: string
  createdAt: string
}

// Almacenamiento en memoria
class MemoryStore {
  private users: Map<number, User> = new Map()
  private orders: Map<number, Order> = new Map()
  private userIdCounter = 1
  private orderIdCounter = 1
  private usernameToId: Map<string, number> = new Map()

  constructor() {
    // Crear usuario admin por defecto
    const adminId = this.userIdCounter++
    const adminUser: User = {
      id: adminId,
      username: "admin",
      // Contraseña: admin123
      password: "$2a$10$mLK.rrdlvx9DCFb6Eck1t.TlltnGulepXnov3bBp5T2TloO1MYj52",
      isAdmin: true,
      createdAt: new Date().toISOString(),
    }

    this.users.set(adminId, adminUser)
    this.usernameToId.set("admin", adminId)

    console.log("Usuario admin creado:", adminId)
  }

  async registerUser(
    username: string,
    password: string,
    isAdmin = false,
  ): Promise<{ success: boolean; message: string; userId?: number }> {
    // Verificar si el usuario ya existe
    if (this.usernameToId.has(username)) {
      return { success: false, message: "El nombre de usuario ya está en uso" }
    }

    // Encriptar contraseña
    const hashedPassword = bcrypt.hashSync(password, 10)

    // Crear nuevo usuario
    const userId = this.userIdCounter++
    const newUser: User = {
      id: userId,
      username,
      password: hashedPassword,
      isAdmin,
      createdAt: new Date().toISOString(),
    }

    // Guardar usuario
    this.users.set(userId, newUser)
    this.usernameToId.set(username, userId)

    console.log("Usuario registrado:", username, "con ID:", userId)
    return { success: true, message: "Usuario registrado correctamente", userId }
  }

  async verifyUser(
    username: string,
    password: string,
  ): Promise<{ id: number; username: string; isAdmin: boolean } | null> {
    console.log("Verificando usuario:", username)

    // Obtener ID del usuario
    const userId = this.usernameToId.get(username)
    if (!userId) {
      console.log("Usuario no encontrado:", username)
      return null
    }

    // Obtener usuario
    const user = this.users.get(userId)
    if (!user) {
      console.log("Usuario no encontrado en el mapa:", userId)
      return null
    }

    // Verificar contraseña
    const passwordMatch = bcrypt.compareSync(password, user.password)
    if (!passwordMatch) {
      console.log("Contraseña incorrecta para usuario:", username)
      return null
    }

    console.log("Usuario verificado correctamente:", username)
    return {
      id: user.id,
      username: user.username,
      isAdmin: user.isAdmin,
    }
  }

  // Resto de métodos para pedidos y usuarios...
  // (Omitidos para simplificar)

  async saveOrder(userId: number, items: string, total: number, customerInfo: string) {
    const orderId = this.orderIdCounter++
    this.orders.set(orderId, {
      id: orderId,
      userId,
      items,
      total,
      status: "pendiente",
      customerInfo,
      createdAt: new Date().toISOString(),
    })
    return { success: true, orderId }
  }

  async getOrder(orderId: number) {
    return this.orders.get(orderId) || null
  }

  async getUserOrders(userId: number) {
    return Array.from(this.orders.values())
      .filter((order) => order.userId === userId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
  }

  async getAllOrders() {
    return Array.from(this.orders.values())
      .map((order) => {
        const user = this.users.get(order.userId)
        return {
          ...order,
          username: user ? user.username : "Usuario desconocido",
        }
      })
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
  }

  async updateOrderStatus(orderId: number, status: string) {
    const order = this.orders.get(orderId)
    if (!order) return { success: false }

    order.status = status
    this.orders.set(orderId, order)
    return { success: true }
  }

  async getAllUsers() {
    return Array.from(this.users.values())
      .map((user) => {
        const orderCount = Array.from(this.orders.values()).filter((order) => order.userId === user.id).length

        return {
          id: user.id,
          username: user.username,
          isAdmin: user.isAdmin,
          createdAt: user.createdAt,
          orderCount,
        }
      })
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
  }

  async changePassword(userId: number, currentPassword: string, newPassword: string) {
    const user = this.users.get(userId)
    if (!user) return { success: false, message: "Usuario no encontrado" }

    const passwordMatch = bcrypt.compareSync(currentPassword, user.password)
    if (!passwordMatch) return { success: false, message: "Contraseña actual incorrecta" }

    user.password = bcrypt.hashSync(newPassword, 10)
    this.users.set(userId, user)
    return { success: true, message: "Contraseña actualizada correctamente" }
  }

  async updateUserAdminStatus(userId: number, isAdmin: boolean) {
    const user = this.users.get(userId)
    if (!user) return { success: false }

    user.isAdmin = isAdmin
    this.users.set(userId, user)
    return { success: true }
  }

  // Método para depuración
  debugUsers() {
    console.log("=== USUARIOS EN MEMORIA ===")
    this.users.forEach((user, id) => {
      console.log(`ID: ${id}, Username: ${user.username}, Admin: ${user.isAdmin}`)
    })
    console.log("=== MAPEO DE USERNAMES A IDS ===")
    this.usernameToId.forEach((id, username) => {
      console.log(`Username: ${username} -> ID: ${id}`)
    })
  }
}

// Exportar una única instancia para toda la aplicación
export const memoryStore = new MemoryStore()

// Depurar usuarios al inicio
console.log("Depurando usuarios al inicializar memory-store:")
memoryStore.debugUsers()
