import { NextResponse } from 'next/server'
import { executeQuery } from '@/lib/mysql-db'
import { requireAdmin } from '@/lib/auth-simple'

export const POST = requireAdmin(async (request) => {
  try {
    // Buscar usuarios con is_driver=1 que NO tienen registro en delivery_drivers
    const driversWithoutRecord = await executeQuery(`
      SELECT u.id, u.username, u.email, u.phone
      FROM users u
      LEFT JOIN delivery_drivers dd ON u.id = dd.user_id
      WHERE u.is_driver = 1 
      AND dd.id IS NULL
    `) as any[]

    if (driversWithoutRecord.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No hay drivers para migrar',
        migrated: 0,
        drivers: []
      })
    }

    const migratedDrivers = []
    const errors = []

    // Crear registro en delivery_drivers para cada usuario driver
    for (const user of driversWithoutRecord) {
      try {
        const result = await executeQuery(
          `INSERT INTO delivery_drivers 
           (user_id, name, phone, email, is_available, is_active, created_at) 
           VALUES (?, ?, ?, ?, 1, 1, NOW())`,
          [
            user.id,
            user.username,
            user.phone || null,
            user.email || null
          ]
        ) as any

        migratedDrivers.push({
          userId: user.id,
          username: user.username,
          driverId: result.insertId
        })

        console.log(`✅ Driver migrado: ${user.username} (user_id: ${user.id}, driver_id: ${result.insertId})`)
      } catch (error: any) {
        console.error(`❌ Error migrando driver ${user.username}:`, error)
        errors.push({
          userId: user.id,
          username: user.username,
          error: error.message
        })
      }
    }

    return NextResponse.json({
      success: true,
      message: `Migración completada: ${migratedDrivers.length} drivers migrados`,
      migrated: migratedDrivers.length,
      drivers: migratedDrivers,
      errors: errors.length > 0 ? errors : undefined
    })
  } catch (error: any) {
    console.error('Error en migración de drivers:', error)
    return NextResponse.json(
      { success: false, message: 'Error en migración: ' + error.message },
      { status: 500 }
    )
  }
})
