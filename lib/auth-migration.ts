import { createClient } from "@/lib/supabase/server"
import { cookies } from "next/headers"
import { getAllUsers } from "@/lib/db"

// Función para migrar un usuario del sistema legacy a Supabase
export async function migrateUserToSupabase(username: string, password: string) {
  try {
    const cookieStore = cookies()
    const supabase = createClient(cookieStore)

    // Verificar si el usuario ya existe en Supabase
    const { data: existingUser, error: checkError } = await supabase.auth.admin.getUserByEmail(
      `${username}@restaurante.local`,
    )

    if (existingUser) {
      return { success: true, message: "El usuario ya existe en Supabase" }
    }

    // Crear usuario en Supabase
    const { data, error } = await supabase.auth.admin.createUser({
      email: `${username}@restaurante.local`,
      password: password,
      email_confirm: true,
      app_metadata: {
        source: "legacy_migration",
        legacy_username: username,
      },
    })

    if (error) {
      throw error
    }

    return { success: true, user: data.user }
  } catch (error: any) {
    console.error("Error al migrar usuario:", error)
    return { success: false, error: error.message }
  }
}

// Función para migrar todos los usuarios
export async function migrateAllUsers() {
  try {
    const users = await getAllUsers()
    const results = []

    for (const user of users) {
      // Nota: Esto es solo un ejemplo, en un caso real necesitaríamos
      // las contraseñas originales o un método para resetearlas
      const result = await migrateUserToSupabase(user.username, `temp_password_${user.id}`)

      results.push({
        username: user.username,
        success: result.success,
        message: result.error || "Migrado correctamente",
      })
    }

    return { success: true, results }
  } catch (error: any) {
    console.error("Error al migrar todos los usuarios:", error)
    return { success: false, error: error.message }
  }
}
