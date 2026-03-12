import { NextRequest, NextResponse } from "next/server"
import { executeQuery } from "@/lib/mysql-db"
import { getCurrentUser } from "@/lib/auth-simple"

// GET - Obtener lista de repartidores (solo admins)
export async function GET(request: NextRequest) {
  try {
    console.log('🔍 [Admin Drivers API] Iniciando...')
    const user = await getCurrentUser(request)
    
    console.log('🔐 User:', { id: user?.id, isAdmin: user?.is_admin })
    
    if (!user || !user.is_admin) {
      console.log('❌ No autorizado')
      return NextResponse.json(
        { error: "No autorizado" },
        { status: 401 }
      )
    }

    console.log('📊 Consultando repartidores en BD...')
    // Obtener todos los repartidores con su información básica
    const drivers: any = await executeQuery(
      `SELECT 
        dd.id,
        dd.user_id,
        dd.name,
        dd.phone,
        dd.email,
        dd.vehicle_type,
        dd.is_available,
        dd.is_active
      FROM delivery_drivers dd
      WHERE dd.is_active = 1
      ORDER BY dd.is_available DESC, dd.name ASC`,
      []
    )

    console.log('✅ Repartidores encontrados:', drivers.length)
    console.log('📋 Drivers:', JSON.stringify(drivers, null, 2))
    return NextResponse.json({
      success: true,
      drivers: drivers || []
    })

  } catch (error) {
    console.error('❌ Error fetching drivers:', error)
    return NextResponse.json(
      { error: "Error al obtener repartidores" },
      { status: 500 }
    )
  }
}
