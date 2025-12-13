import { type NextRequest, NextResponse } from "next/server"
import { getAllUsers, updateUserAdminStatus } from "@/lib/db"
import { requireAdmin } from "@/lib/auth"

// Obtener todos los usuarios (solo admin)
export const GET = requireAdmin(async () => {
  const users = await getAllUsers()
  return NextResponse.json({ success: true, users })
})

// Actualizar estado de administrador de un usuario (solo admin)
export const PUT = requireAdmin(async (request: NextRequest) => {
  const body = await request.json()
  const { userId, isAdmin } = body

  if (!userId) {
    return NextResponse.json({ success: false, message: "ID de usuario no proporcionado" }, { status: 400 })
  }

  const result = await updateUserAdminStatus(userId, isAdmin)
  return NextResponse.json(result)
})
