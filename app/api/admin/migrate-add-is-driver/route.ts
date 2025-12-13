import { NextResponse } from 'next/server'
import { executeQuery } from '@/lib/mysql-db'
import { requireAdmin } from '@/lib/auth-simple'

export const POST = requireAdmin(async (request) => {
  try {
    console.log('🔧 [Migración] Agregando columna is_driver a tabla users...')

    // 1. Agregar columna is_driver si no existe
    try {
      await executeQuery(`
        ALTER TABLE users 
        ADD COLUMN is_driver BOOLEAN DEFAULT FALSE AFTER is_admin
      `)
      console.log('✅ Columna is_driver agregada')
    } catch (error: any) {
      if (error.code === 'ER_DUP_FIELDNAME') {
        console.log('ℹ️ Columna is_driver ya existe')
      } else {
        throw error
      }
    }

    // 2. Crear índice
    try {
      await executeQuery(`
        CREATE INDEX idx_is_driver ON users(is_driver)
      `)
      console.log('✅ Índice creado')
    } catch (error: any) {
      if (error.code === 'ER_DUP_KEYNAME') {
        console.log('ℹ️ Índice ya existe')
      } else {
        console.warn('⚠️ No se pudo crear índice:', error.message)
      }
    }

    // 3. Actualizar usuarios existentes con registro en delivery_drivers
    const result: any = await executeQuery(`
      UPDATE users u
      INNER JOIN delivery_drivers dd ON u.id = dd.user_id
      SET u.is_driver = 1
      WHERE dd.is_active = 1
    `)

    console.log(`✅ ${result.affectedRows || 0} usuarios actualizados`)

    // 4. Verificar resultados
    const drivers = await executeQuery(`
      SELECT 
        u.id,
        u.username,
        u.email,
        u.is_driver,
        dd.id as driver_id,
        dd.name as driver_name
      FROM users u
      LEFT JOIN delivery_drivers dd ON u.id = dd.user_id
      WHERE u.is_driver = 1 OR dd.id IS NOT NULL
    `) as any[]

    return NextResponse.json({
      success: true,
      message: 'Migración completada exitosamente',
      updated_users: result.affectedRows || 0,
      drivers: drivers,
      summary: {
        users_with_flag: drivers.filter(d => d.is_driver).length,
        users_in_delivery_drivers: drivers.filter(d => d.driver_id).length,
        total: drivers.length
      }
    })

  } catch (error: any) {
    console.error('❌ Error en migración:', error)
    return NextResponse.json(
      { 
        success: false, 
        message: 'Error en migración: ' + error.message,
        code: error.code 
      },
      { status: 500 }
    )
  }
})
