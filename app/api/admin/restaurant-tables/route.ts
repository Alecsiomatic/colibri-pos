import { NextRequest, NextResponse } from 'next/server'
import { executeQuery } from '@/lib/mysql-db'
import { getCurrentUser } from '@/lib/auth-simple'

export const dynamic = 'force-dynamic'

// Ensure the restaurant_tables table exists
async function ensureTable() {
  await executeQuery(`
    CREATE TABLE IF NOT EXISTS restaurant_tables (
      id INT AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(64) NOT NULL UNIQUE,
      capacity INT DEFAULT 4,
      shape ENUM('square', 'round', 'rectangle') DEFAULT 'square',
      x FLOAT DEFAULT 0,
      y FLOAT DEFAULT 0,
      width FLOAT DEFAULT 80,
      height FLOAT DEFAULT 80,
      rotation FLOAT DEFAULT 0,
      zone VARCHAR(64) DEFAULT 'Principal',
      is_active TINYINT(1) DEFAULT 1,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    )
  `, [])
}

// GET — list all tables with their current status (open/free)
export async function GET() {
  try {
    await ensureTable()

    // Get all defined tables
    const tables = await executeQuery(
      'SELECT * FROM restaurant_tables WHERE is_active = 1 ORDER BY zone, name',
      []
    ) as any[]

    // Get currently open table names
    const openOrders = await executeQuery(
      "SELECT `table`, COUNT(*) as order_count, SUM(total) as total FROM orders WHERE waiter_order = 1 AND status = 'open_table' GROUP BY `table`",
      []
    ) as any[]

    const openMap = new Map(openOrders.map((o: any) => [o.table, { orderCount: o.order_count, total: parseFloat(o.total) || 0 }]))

    const result = tables.map((t: any) => ({
      ...t,
      status: openMap.has(t.name) ? 'occupied' : 'free',
      orderCount: openMap.get(t.name)?.orderCount || 0,
      currentTotal: openMap.get(t.name)?.total || 0,
    }))

    return NextResponse.json({ success: true, tables: result })
  } catch (error) {
    console.error('Error fetching restaurant tables:', error)
    return NextResponse.json({ success: false, error: 'Error al obtener mesas' }, { status: 500 })
  }
}

// POST — create a new table
export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser(req)
    if (!user || !user.isAdmin) {
      return NextResponse.json({ success: false, error: 'No autorizado' }, { status: 403 })
    }
    await ensureTable()
    const body = await req.json()
    const { name, capacity, shape, x, y, width, height, rotation, zone } = body

    if (!name || !name.trim()) {
      return NextResponse.json({ success: false, error: 'El nombre es requerido' }, { status: 400 })
    }

    await executeQuery(
      `INSERT INTO restaurant_tables (name, capacity, shape, x, y, width, height, rotation, zone)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [name.trim(), capacity || 4, shape || 'square', x || 0, y || 0, width || 80, height || 80, rotation || 0, zone || 'Principal']
    )

    return NextResponse.json({ success: true, message: 'Mesa creada' })
  } catch (error: any) {
    if (error?.code === 'ER_DUP_ENTRY') {
      return NextResponse.json({ success: false, error: 'Ya existe una mesa con ese nombre' }, { status: 409 })
    }
    console.error('Error creating table:', error)
    return NextResponse.json({ success: false, error: 'Error al crear mesa' }, { status: 500 })
  }
}

// PUT — bulk update all table positions (layout save)
export async function PUT(req: NextRequest) {
  try {
    const user = await getCurrentUser(req)
    if (!user || !user.isAdmin) {
      return NextResponse.json({ success: false, error: 'No autorizado' }, { status: 403 })
    }
    await ensureTable()
    const body = await req.json()
    const { tables } = body

    if (!tables || !Array.isArray(tables)) {
      return NextResponse.json({ success: false, error: 'Datos inválidos' }, { status: 400 })
    }

    for (const t of tables) {
      await executeQuery(
        `UPDATE restaurant_tables SET x = ?, y = ?, width = ?, height = ?, rotation = ?, zone = ?, capacity = ?, shape = ?, name = ? WHERE id = ?`,
        [t.x ?? 0, t.y ?? 0, t.width ?? 80, t.height ?? 80, t.rotation ?? 0, t.zone || 'Principal', t.capacity || 4, t.shape || 'square', t.name, t.id]
      )
    }

    return NextResponse.json({ success: true, message: 'Layout guardado' })
  } catch (error) {
    console.error('Error saving layout:', error)
    return NextResponse.json({ success: false, error: 'Error al guardar layout' }, { status: 500 })
  }
}

// DELETE — remove a table by id (in query param)
export async function DELETE(req: NextRequest) {
  try {
    const user = await getCurrentUser(req)
    if (!user || !user.isAdmin) {
      return NextResponse.json({ success: false, error: 'No autorizado' }, { status: 403 })
    }
    const { searchParams } = new URL(req.url)
    const id = searchParams.get('id')
    if (!id) {
      return NextResponse.json({ success: false, error: 'ID requerido' }, { status: 400 })
    }

    await executeQuery('UPDATE restaurant_tables SET is_active = 0 WHERE id = ?', [id])
    return NextResponse.json({ success: true, message: 'Mesa eliminada' })
  } catch (error) {
    console.error('Error deleting table:', error)
    return NextResponse.json({ success: false, error: 'Error al eliminar mesa' }, { status: 500 })
  }
}
