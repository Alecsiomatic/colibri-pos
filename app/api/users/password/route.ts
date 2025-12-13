import { type NextRequest, NextResponse } from "next/server"
import { changePassword } from "@/lib/db"
import { requireAuth } from "@/lib/auth"

// Cambiar contraseña de usuario
export const POST = requireAuth(async (request: NextRequest, user: any) => {
  const body = await request.json()
  const { currentPassword, newPassword } = body

  if (!currentPassword || !newPassword) {
    return NextResponse.json({ success: false, message: "Contraseña actual y nueva son requeridas" }, { status: 400 })
  }

  if (newPassword.length < 6) {
    return NextResponse.json(
      { success: false, message: "La nueva contraseña debe tener al menos 6 caracteres" },
      { status: 400 },
    )
  }

  const result = await changePassword(user.id, currentPassword, newPassword)

  if (!result.success) {
    return NextResponse.json({ success: false, message: result.message }, { status: 400 })
  }

  return NextResponse.json({ success: true, message: result.message })
})
