/**
 * Inventory Service — Single source of truth for all stock operations.
 *
 * Rules:
 * 1. `products.stock` is the canonical stock column.
 * 2. Every change goes through this module so we always log a movement.
 * 3. The `stock_movements` table is the audit trail.
 * 4. Auto-disable products when stock hits 0 (optional per business_info).
 */

import { executeQuery } from '@/lib/db-retry'

// ─── Types ─────────────────────────────────
export type MovementType = 'sale' | 'cancel_restore' | 'manual_add' | 'manual_reduce' | 'manual_set' | 'waste' | 'restock' | 'adjustment'

export interface StockMovement {
  product_id: number
  previous_stock: number
  new_stock: number
  change_amount: number
  change_type: MovementType
  reference_id?: string | null
  notes?: string | null
  created_by?: number | null
}

// ─── Migration (idempotent) ────────────────
let _migrated = false
export async function ensureInventoryTables() {
  if (_migrated) return
  try {
    await executeQuery(`
      CREATE TABLE IF NOT EXISTS stock_movements (
        id INT AUTO_INCREMENT PRIMARY KEY,
        product_id INT NOT NULL,
        previous_stock INT NOT NULL DEFAULT 0,
        new_stock INT NOT NULL DEFAULT 0,
        change_amount INT NOT NULL DEFAULT 0,
        change_type VARCHAR(30) NOT NULL,
        reference_id VARCHAR(50) DEFAULT NULL,
        notes TEXT DEFAULT NULL,
        created_by INT DEFAULT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_product (product_id),
        INDEX idx_type (change_type),
        INDEX idx_created (created_at)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    `, [])

    // Ensure products has cost_price column
    await executeQuery(`ALTER TABLE products ADD COLUMN IF NOT EXISTS cost_price DECIMAL(10,2) DEFAULT 0`, []).catch(() => {})
    // Ensure products has stock_threshold
    await executeQuery(`ALTER TABLE products ADD COLUMN IF NOT EXISTS stock_threshold INT DEFAULT 10`, []).catch(() => {})

    _migrated = true
  } catch (e: any) {
    // Table already exists is fine
    if (!e.message?.includes('already exists')) console.error('Migration error:', e.message)
    _migrated = true
  }
}

// ─── Core: adjust stock ────────────────────
export async function adjustStock(
  productId: number,
  changeAmount: number,
  changeType: MovementType,
  opts: { referenceId?: string; notes?: string; userId?: number; absoluteSet?: number } = {}
): Promise<{ success: boolean; previousStock: number; newStock: number }> {
  await ensureInventoryTables()

  // Get current stock
  const rows = await executeQuery('SELECT stock FROM products WHERE id = ?', [productId]) as any[]
  if (!rows.length) throw new Error(`Product ${productId} not found`)

  const previousStock = Number(rows[0].stock) || 0
  let newStock: number

  if (opts.absoluteSet !== undefined) {
    newStock = Math.max(0, opts.absoluteSet)
  } else {
    newStock = Math.max(0, previousStock + changeAmount)
  }

  // Update product stock
  await executeQuery('UPDATE products SET stock = ? WHERE id = ?', [newStock, productId])

  // Also sync inventory table (if it exists) — gracefully ignore
  await executeQuery('UPDATE inventory SET quantity = ? WHERE product_id = ?', [newStock, productId]).catch(() => {})

  // Log movement
  await executeQuery(
    `INSERT INTO stock_movements (product_id, previous_stock, new_stock, change_amount, change_type, reference_id, notes, created_by)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [productId, previousStock, newStock, changeAmount, changeType, opts.referenceId || null, opts.notes || null, opts.userId || null]
  )

  return { success: true, previousStock, newStock }
}

// ─── Deduct stock for an order ─────────────
export async function deductStockForOrder(orderId: number, items: any[], userId?: number) {
  await ensureInventoryTables()
  for (const item of items) {
    const productId = item.id || item.product_id
    if (!productId) continue
    const qty = Number(item.quantity) || 1
    await adjustStock(productId, -qty, 'sale', {
      referenceId: `order-${orderId}`,
      notes: `Venta pedido #${orderId}`,
      userId
    })
  }
}

// ─── Restore stock on cancellation ─────────
export async function restoreStockForOrder(orderId: number, items: any[], userId?: number) {
  await ensureInventoryTables()
  for (const item of items) {
    const productId = item.id || item.product_id
    if (!productId) continue
    const qty = Number(item.quantity) || 1
    await adjustStock(productId, qty, 'cancel_restore', {
      referenceId: `order-${orderId}`,
      notes: `Cancelación pedido #${orderId}`,
      userId
    })
  }
}

// ─── Query movements ───────────────────────
export async function getStockMovements(opts: {
  productId?: number; type?: string; limit?: number; offset?: number
  startDate?: string; endDate?: string
} = {}) {
  await ensureInventoryTables()
  let query = `
    SELECT sm.*, p.name as product_name, p.image_url
    FROM stock_movements sm
    LEFT JOIN products p ON sm.product_id = p.id
    WHERE 1=1`
  const params: any[] = []

  if (opts.productId) { query += ' AND sm.product_id = ?'; params.push(opts.productId) }
  if (opts.type) { query += ' AND sm.change_type = ?'; params.push(opts.type) }
  if (opts.startDate) { query += ' AND sm.created_at >= ?'; params.push(opts.startDate) }
  if (opts.endDate) { query += ' AND DATE(sm.created_at) <= ?'; params.push(opts.endDate) }

  query += ' ORDER BY sm.created_at DESC LIMIT ? OFFSET ?'
  params.push(opts.limit || 100, opts.offset || 0)

  return await executeQuery(query, params) as any[]
}

// ─── Inventory summary ─────────────────────
export async function getInventorySummary() {
  await ensureInventoryTables()

  const products = await executeQuery(`
    SELECT p.id, p.name, p.price, p.cost_price, p.stock, p.stock_threshold, p.is_available, p.image_url,
           c.name as category_name
    FROM products p
    LEFT JOIN categories c ON p.category_id = c.id
    ORDER BY p.stock ASC
  `, []) as any[]

  const totals = {
    total_products: products.length,
    out_of_stock: 0,
    low_stock: 0,
    healthy_stock: 0,
    total_stock_units: 0,
    total_stock_value: 0, // at sale price
    total_cost_value: 0,  // at cost price
    potential_profit: 0,
  }

  for (const p of products) {
    const stock = Number(p.stock) || 0
    const threshold = Number(p.stock_threshold) || 10
    const price = Number(p.price) || 0
    const cost = Number(p.cost_price) || 0

    totals.total_stock_units += stock
    totals.total_stock_value += stock * price
    totals.total_cost_value += stock * cost
    totals.potential_profit += stock * (price - cost)

    if (stock <= 0) totals.out_of_stock++
    else if (stock <= threshold) totals.low_stock++
    else totals.healthy_stock++
  }

  return { products, totals }
}

// ─── Valuation report ──────────────────────
export async function getValuationReport() {
  await ensureInventoryTables()
  const rows = await executeQuery(`
    SELECT 
      c.name as category_name,
      COUNT(p.id) as product_count,
      SUM(p.stock) as total_units,
      SUM(p.stock * p.price) as sale_value,
      SUM(p.stock * COALESCE(p.cost_price, 0)) as cost_value,
      SUM(p.stock * (p.price - COALESCE(p.cost_price, 0))) as profit_margin
    FROM products p
    LEFT JOIN categories c ON p.category_id = c.id
    GROUP BY c.id, c.name
    ORDER BY sale_value DESC
  `, []) as any[]

  return rows
}

// ─── Movement analytics ────────────────────
export async function getMovementAnalytics(days: number = 30) {
  await ensureInventoryTables()

  const [byType, byDay, topMovers] = await Promise.all([
    // Movements grouped by type
    executeQuery(`
      SELECT change_type, COUNT(*) as count, SUM(ABS(change_amount)) as total_units
      FROM stock_movements
      WHERE created_at >= DATE_SUB(CURDATE(), INTERVAL ? DAY)
      GROUP BY change_type
      ORDER BY total_units DESC
    `, [days]),

    // Movements by day
    executeQuery(`
      SELECT DATE(created_at) as date, 
             SUM(CASE WHEN change_amount < 0 THEN ABS(change_amount) ELSE 0 END) as units_out,
             SUM(CASE WHEN change_amount > 0 THEN change_amount ELSE 0 END) as units_in,
             COUNT(*) as movements
      FROM stock_movements
      WHERE created_at >= DATE_SUB(CURDATE(), INTERVAL ? DAY)
      GROUP BY DATE(created_at)
      ORDER BY date ASC
    `, [days]),

    // Top movers (most stock consumed)
    executeQuery(`
      SELECT sm.product_id, p.name as product_name, p.stock as current_stock,
             SUM(CASE WHEN sm.change_amount < 0 THEN ABS(sm.change_amount) ELSE 0 END) as total_consumed,
             SUM(CASE WHEN sm.change_amount > 0 THEN sm.change_amount ELSE 0 END) as total_restocked,
             COUNT(*) as movement_count
      FROM stock_movements sm
      LEFT JOIN products p ON sm.product_id = p.id
      WHERE sm.created_at >= DATE_SUB(CURDATE(), INTERVAL ? DAY)
      GROUP BY sm.product_id, p.name, p.stock
      ORDER BY total_consumed DESC
      LIMIT 20
    `, [days]),
  ])

  return { byType, byDay, topMovers }
}
