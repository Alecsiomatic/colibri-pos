import bcrypt from "bcryptjs"
import {
  executeQuery,
  createUser,
  authenticateUser,
  getUserById,
  getUserByEmail,
  saveOrder,
  getUserOrders,
  getOrder,
  getAllOrders,
  updateOrderStatus,
  changePassword,
} from "./mysql-db"

// Función para registrar usuario (compatible con la interfaz anterior)
export async function registerUser(email: string, passwordPlain: string, username?: string) {
  try {
    const result = await createUser(email, passwordPlain, username)
    
    if (!result.success) {
      return { success: false, message: result.message }
    }
    
    return { 
      success: true, 
      message: "Usuario registrado correctamente.", 
      userId: result.userId,
      username: result.username
    }
    
  } catch (error: any) {
    console.error("Error al registrar usuario:", error)
    return { success: false, message: "Error interno del servidor." }
  }
}

// Re-exportar funciones de MySQL para compatibilidad
export { 
  executeQuery, 
  createUser, 
  authenticateUser, 
  getUserById, 
  getUserByEmail, 
  saveOrder, 
  getUserOrders, 
  getOrder,
  getAllOrders, 
  updateOrderStatus,
  changePassword
}

// Verificar usuario por email o username (compatibilidad legacy)
export async function verifyUser(identifier: string, password: string) {
  try {
    const isEmail = identifier.includes("@")
    const users = (await executeQuery(
      isEmail
        ? "SELECT id, email, username, password, is_admin FROM users WHERE email = ? LIMIT 1"
        : "SELECT id, email, username, password, is_admin FROM users WHERE username = ? LIMIT 1",
      [identifier],
    )) as Array<{ id: number; email: string; username: string | null; password: string; is_admin: boolean | number }>

    if (!users || users.length === 0) {
      return null
    }

    const user = users[0]
    const isValidPassword = await bcrypt.compare(password, user.password)

    if (!isValidPassword) {
      return null
    }

    return {
      id: user.id,
      email: user.email,
      username: user.username || user.email,
      isAdmin: Boolean(user.is_admin),
    }
  } catch (error) {
    console.error("Error verificando usuario legacy:", error)
    return null
  }
}


export async function getAllUsers() {
  try {
    const users = await executeQuery(
      `SELECT id, username, email, full_name, phone, is_admin, is_driver, is_waiter, active, created_at, last_login
       FROM users
       ORDER BY created_at DESC`
    ) as any[]
    return users
  } catch (error) {
    console.error("Error obteniendo usuarios:", error)
    return []
  }
}

// Actualizar rol de usuario (admin, driver, waiter, customer)
export async function updateUserRole(userId: number, role: string) {
  try {
    let is_admin = 0, is_driver = 0, is_waiter = 0;
    if (role === 'admin') is_admin = 1;
    else if (role === 'driver') is_driver = 1;
    else if (role === 'waiter') is_waiter = 1;
    // customer: all zero
    await executeQuery('UPDATE users SET is_admin = ?, is_driver = ?, is_waiter = ? WHERE id = ?', [is_admin, is_driver, is_waiter, userId]);
    return { success: true, message: "Rol actualizado" };
  } catch (error) {
    console.error("Error actualizando rol:", error);
    return { success: false, message: "No se pudo actualizar el rol" };
  }
}

export async function updateUserAdminStatus(userId: number, isAdmin: boolean) {
  try {
    await executeQuery('UPDATE users SET is_admin = ? WHERE id = ?', [isAdmin, userId])
    return { success: true, message: "Rol de administrador actualizado" }
  } catch (error) {
    console.error("Error actualizando rol de administrador:", error)
    return { success: false, message: "No se pudo actualizar el rol" }
  }
}
