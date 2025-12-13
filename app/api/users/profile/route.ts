import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { executeQuery } from "@/lib/mysql-db"
import { verifyAccessToken, getSessionByToken } from "@/lib/auth-mysql"

// GET - Obtener perfil del usuario
export async function GET(request: NextRequest) {
  try {
    const authToken = request.cookies.get('auth-token')?.value
    if (!authToken) {
      return NextResponse.json({ success: false, error: "No autorizado" }, { status: 401 })
    }

    // Intentar verificar el token
    let user = null
    try {
      user = verifyAccessToken(authToken)
    } catch (error) {
      console.log('⚠️ Token inválido o expirado, intentando buscar sesión...')
    }

    // Si el token falló, intentar buscar por sesión
    if (!user) {
      try {
        user = await getSessionByToken(authToken)
      } catch (error) {
        console.log('⚠️ Sesión no encontrada')
      }
    }

    if (!user) {
      return NextResponse.json({ success: false, error: "Sesión inválida o expirada" }, { status: 401 })
    }

    // Obtener información completa del usuario
    const users = await executeQuery(
      'SELECT id, email, username, is_admin, is_waiter, created_at FROM users WHERE id = ?',
      [user.id]
    ) as any[]

    if (users.length === 0) {
      return NextResponse.json(
        { error: "Usuario no encontrado" },
        { status: 404 }
      )
    }

    const userData = users[0]
  userData.is_admin = Boolean(userData.is_admin)
  userData.is_waiter = Boolean(userData.is_waiter)

    // Si es repartidor, obtener información adicional
    if (!userData.is_admin) {
      const drivers = await executeQuery(
        'SELECT * FROM delivery_drivers WHERE user_id = ?',
        [user.id]
      ) as any[]

      if (drivers.length > 0) {
        userData.driver_info = drivers[0]
        if (userData.driver_info?.is_available !== undefined) {
          userData.driver_info.is_available = Boolean(userData.driver_info.is_available)
        }
        if (userData.driver_info.current_location) {
          try {
            userData.driver_info.current_location = JSON.parse(userData.driver_info.current_location)
          } catch (e) {
            userData.driver_info.current_location = null
          }
        }
      }
    }

    return NextResponse.json({
      success: true,
      user: userData
    })
  } catch (error: any) {
    console.error("Error al obtener perfil:", error)
    return NextResponse.json(
      { error: "Error al obtener perfil" },
      { status: 500 }
    )
  }
}

// PUT - Actualizar perfil del usuario
export async function PUT(request: NextRequest) {
  try {
    const authToken = request.cookies.get('auth-token')?.value
    if (!authToken) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    const user = verifyAccessToken(authToken) || await getSessionByToken(authToken)
    if (!user) {
      return NextResponse.json({ error: "Sesión inválida" }, { status: 401 })
    }

    const { username, email, driver_info } = await request.json()

    // Actualizar información básica del usuario
    if (username || email) {
      const updates: string[] = []
      const params: any[] = []

      if (username) {
        updates.push('username = ?')
        params.push(username)
      }

      if (email) {
        updates.push('email = ?')
        params.push(email)
      }

      updates.push('updated_at = NOW()')
      params.push(user.id)

      await executeQuery(
        `UPDATE users SET ${updates.join(', ')} WHERE id = ?`,
        params
      )
    }

    // Si es repartidor y se proporciona driver_info, actualizarlo
    if (driver_info) {
      const drivers = await executeQuery(
        'SELECT id FROM delivery_drivers WHERE user_id = ?',
        [user.id]
      ) as any[]

      if (drivers.length > 0) {
        const driverUpdates: string[] = []
        const driverParams: any[] = []

        if (driver_info.name) {
          driverUpdates.push('name = ?')
          driverParams.push(driver_info.name)
        }

        if (driver_info.phone) {
          driverUpdates.push('phone = ?')
          driverParams.push(driver_info.phone)
        }

        if (driver_info.vehicle_type) {
          driverUpdates.push('vehicle_type = ?')
          driverParams.push(driver_info.vehicle_type)
        }

        if (driver_info.license_plate) {
          driverUpdates.push('license_plate = ?')
          driverParams.push(driver_info.license_plate)
        }

        if (driver_info.current_location) {
          driverUpdates.push('current_location = ?')
          driverParams.push(JSON.stringify(driver_info.current_location))
        }

        if (driver_info.is_available !== undefined) {
          driverUpdates.push('is_available = ?')
          driverParams.push(driver_info.is_available)
        }

        if (driverUpdates.length > 0) {
          driverUpdates.push('updated_at = NOW()')
          driverParams.push(drivers[0].id)

          await executeQuery(
            `UPDATE delivery_drivers SET ${driverUpdates.join(', ')} WHERE id = ?`,
            driverParams
          )
        }
      }
    }

    return NextResponse.json({
      success: true,
      message: "Perfil actualizado exitosamente"
    })
  } catch (error: any) {
    console.error("Error al actualizar perfil:", error)
    return NextResponse.json(
      { error: "Error al actualizar perfil" },
      { status: 500 }
    )
  }
}