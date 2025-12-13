import { NextRequest, NextResponse } from 'next/server'
import { executeQuery } from '@/lib/mysql-db'
import { requireAdmin } from '@/lib/auth-simple'

export const GET = requireAdmin(async (request: NextRequest) => {
  try {
    // Obtener estadísticas de todos los repartidores
    const drivers = await executeQuery(`
      SELECT 
        dd.id as driver_id,
        dd.user_id,
        dd.name,
        dd.email,
        dd.phone,
        dd.is_available,
        dd.is_active,
        COALESCE(u.username, dd.name) as username,
        
        -- Total de entregas
        COUNT(DISTINCT CASE WHEN o.status = 'delivered' THEN da.order_id END) as total_deliveries,
        
        -- Entregas activas (en camino)
        COUNT(DISTINCT CASE WHEN o.status IN ('assigned_to_driver', 'accepted_by_driver', 'in_delivery') THEN da.order_id END) as active_deliveries,
        
        -- Completadas hoy
        COUNT(DISTINCT CASE 
          WHEN o.status = 'delivered' 
          AND DATE(da.completed_at) = CURDATE() 
          THEN da.order_id 
        END) as completed_today,
        
        -- Completadas esta semana
        COUNT(DISTINCT CASE 
          WHEN o.status = 'delivered' 
          AND YEARWEEK(da.completed_at, 1) = YEARWEEK(CURDATE(), 1)
          THEN da.order_id 
        END) as completed_this_week,
        
        -- Completadas este mes
        COUNT(DISTINCT CASE 
          WHEN o.status = 'delivered' 
          AND MONTH(da.completed_at) = MONTH(CURDATE())
          AND YEAR(da.completed_at) = YEAR(CURDATE())
          THEN da.order_id 
        END) as completed_this_month,
        
        -- Tiempo promedio de entrega (en minutos)
        COALESCE(AVG(
          CASE 
            WHEN da.completed_at IS NOT NULL AND da.assigned_at IS NOT NULL
            THEN TIMESTAMPDIFF(MINUTE, da.assigned_at, da.completed_at)
          END
        ), 0) as avg_delivery_time_minutes,
        
        -- Tasa de éxito (entregas completadas vs asignadas)
        CASE 
          WHEN COUNT(DISTINCT da.order_id) > 0 
          THEN ROUND(
            (COUNT(DISTINCT CASE WHEN o.status = 'delivered' THEN da.order_id END) * 100.0) / 
            COUNT(DISTINCT da.order_id)
          , 0)
          ELSE 0
        END as success_rate,
        
        -- Total ganado (suma de órdenes entregadas)
        COALESCE(SUM(CASE WHEN o.status = 'delivered' THEN o.total END), 0) as total_earnings,
        
        -- Última entrega
        MAX(CASE WHEN o.status = 'delivered' THEN da.completed_at END) as last_delivery
        
      FROM delivery_drivers dd
      LEFT JOIN users u ON dd.user_id = u.id
      LEFT JOIN delivery_assignments da ON dd.id = da.driver_id
      LEFT JOIN orders o ON da.order_id = o.id
      WHERE dd.is_active = 1
      GROUP BY dd.id, dd.user_id, dd.name, dd.email, dd.phone, dd.is_available, dd.is_active, u.username
      ORDER BY total_deliveries DESC
    `) as any[]

    return NextResponse.json({
      success: true,
      drivers: drivers,
      total_drivers: drivers.length,
      active_drivers: drivers.filter(d => d.active_deliveries > 0).length
    })

  } catch (error) {
    console.error('Error al obtener estadísticas de repartidores:', error)
    return NextResponse.json(
      { error: 'Error al cargar estadísticas' },
      { status: 500 }
    )
  }
})
