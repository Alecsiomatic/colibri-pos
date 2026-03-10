/**
 * Promotions & Discounts Service — FASE 9
 *
 * Supports: percentage, fixed_amount, 2x1/NxM, combo_price, happy_hour
 * Conditions: min purchase, products/categories, time windows, channels, coupon codes
 */

import { executeQuery } from '@/lib/db-retry'

// ─── Types ─────────────────────────────────
export type PromoType = 'percentage' | 'fixed_amount' | '2x1' | 'nxm' | 'combo_price' | 'happy_hour'
export type AppliesTo = 'all' | 'products' | 'categories'
export type ChannelFilter = 'all' | 'web' | 'kiosk' | 'qr' | 'waiter' | 'delivery' | 'caja'

export interface Promotion {
  id: number
  name: string
  description: string
  type: PromoType
  value: number          // % off, $ off, or combo price
  buy_quantity: number   // for NxM: buy X
  get_quantity: number   // for NxM: pay Y (get X-Y free)
  min_purchase: number
  max_discount: number   // 0 = no cap
  applies_to: AppliesTo
  channel: ChannelFilter
  start_date: string | null
  end_date: string | null
  schedule_days: number[] | null // 0=Sun..6=Sat
  schedule_start_time: string | null // HH:mm
  schedule_end_time: string | null   // HH:mm
  is_active: boolean
  is_coupon: boolean
  coupon_code: string | null
  max_uses: number       // 0 = unlimited
  current_uses: number
  stackable: boolean     // can combine with other promos?
  priority: number       // higher = applied first
  created_at: string
  updated_at: string
  // Joined data
  items?: PromotionItem[]
}

export interface PromotionItem {
  id: number
  promotion_id: number
  item_type: 'product' | 'category'
  item_id: number
  item_name?: string
}

export interface AppliedDiscount {
  promotion_id: number
  promotion_name: string
  type: PromoType
  discount_amount: number
  coupon_code?: string
}

export interface CartItemForPromo {
  id: number
  name: string
  price: number
  quantity: number
  category_id?: number
  category_name?: string
}

// ─── Migration (idempotent) ────────────────
let _migrated = false
export async function ensurePromotionTables() {
  if (_migrated) return
  try {
    await executeQuery(`
      CREATE TABLE IF NOT EXISTS promotions (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(200) NOT NULL,
        description TEXT DEFAULT NULL,
        type ENUM('percentage','fixed_amount','2x1','nxm','combo_price','happy_hour') NOT NULL,
        value DECIMAL(10,2) NOT NULL DEFAULT 0,
        buy_quantity INT NOT NULL DEFAULT 2,
        get_quantity INT NOT NULL DEFAULT 1,
        min_purchase DECIMAL(10,2) NOT NULL DEFAULT 0,
        max_discount DECIMAL(10,2) NOT NULL DEFAULT 0,
        applies_to ENUM('all','products','categories') NOT NULL DEFAULT 'all',
        channel ENUM('all','web','kiosk','qr','waiter','delivery','caja') NOT NULL DEFAULT 'all',
        start_date DATE DEFAULT NULL,
        end_date DATE DEFAULT NULL,
        schedule_days JSON DEFAULT NULL,
        schedule_start_time TIME DEFAULT NULL,
        schedule_end_time TIME DEFAULT NULL,
        is_active TINYINT(1) NOT NULL DEFAULT 1,
        is_coupon TINYINT(1) NOT NULL DEFAULT 0,
        coupon_code VARCHAR(50) DEFAULT NULL,
        max_uses INT NOT NULL DEFAULT 0,
        current_uses INT NOT NULL DEFAULT 0,
        stackable TINYINT(1) NOT NULL DEFAULT 0,
        priority INT NOT NULL DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_active (is_active),
        INDEX idx_coupon (coupon_code),
        INDEX idx_dates (start_date, end_date),
        INDEX idx_type (type)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    `, [])

    await executeQuery(`
      CREATE TABLE IF NOT EXISTS promotion_items (
        id INT AUTO_INCREMENT PRIMARY KEY,
        promotion_id INT NOT NULL,
        item_type ENUM('product','category') NOT NULL,
        item_id INT NOT NULL,
        INDEX idx_promo (promotion_id),
        INDEX idx_item (item_type, item_id),
        FOREIGN KEY (promotion_id) REFERENCES promotions(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    `, [])

    await executeQuery(`
      CREATE TABLE IF NOT EXISTS promotion_usage (
        id INT AUTO_INCREMENT PRIMARY KEY,
        promotion_id INT NOT NULL,
        order_id INT NOT NULL,
        user_id INT DEFAULT NULL,
        discount_amount DECIMAL(10,2) NOT NULL DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_promo (promotion_id),
        INDEX idx_order (order_id),
        FOREIGN KEY (promotion_id) REFERENCES promotions(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    `, [])

    // Add discount columns to orders
    await executeQuery(`ALTER TABLE orders ADD COLUMN IF NOT EXISTS discount_amount DECIMAL(10,2) NOT NULL DEFAULT 0`, []).catch(() => {})
    await executeQuery(`ALTER TABLE orders ADD COLUMN IF NOT EXISTS discount_detail JSON DEFAULT NULL`, []).catch(() => {})
    await executeQuery(`ALTER TABLE orders ADD COLUMN IF NOT EXISTS coupon_code VARCHAR(50) DEFAULT NULL`, []).catch(() => {})

    _migrated = true
  } catch (e: any) {
    if (!e.message?.includes('already exists')) console.error('[Promotions] Migration error:', e.message)
    _migrated = true
  }
}

// ─── CRUD ──────────────────────────────────

export async function getPromotions(opts: { activeOnly?: boolean } = {}): Promise<Promotion[]> {
  await ensurePromotionTables()
  const where = opts.activeOnly ? 'WHERE p.is_active = 1' : ''
  const rows = await executeQuery(`
    SELECT p.*,
      GROUP_CONCAT(
        CONCAT(pi.item_type, ':', pi.item_id) SEPARATOR ','
      ) as item_ids
    FROM promotions p
    LEFT JOIN promotion_items pi ON pi.promotion_id = p.id
    ${where}
    GROUP BY p.id
    ORDER BY p.priority DESC, p.created_at DESC
  `, []) as any[]

  return rows.map(r => ({
    ...r,
    is_active: !!r.is_active,
    is_coupon: !!r.is_coupon,
    stackable: !!r.stackable,
    schedule_days: r.schedule_days ? (typeof r.schedule_days === 'string' ? JSON.parse(r.schedule_days) : r.schedule_days) : null,
    items: r.item_ids ? r.item_ids.split(',').map((s: string) => {
      const [item_type, item_id] = s.split(':')
      return { promotion_id: r.id, item_type, item_id: Number(item_id) }
    }) : []
  }))
}

export async function getPromotionById(id: number): Promise<Promotion | null> {
  await ensurePromotionTables()
  const rows = await executeQuery('SELECT * FROM promotions WHERE id = ?', [id]) as any[]
  if (!rows.length) return null

  const items = await executeQuery('SELECT * FROM promotion_items WHERE promotion_id = ?', [id]) as any[]
  const p = rows[0]
  return {
    ...p,
    is_active: !!p.is_active,
    is_coupon: !!p.is_coupon,
    stackable: !!p.stackable,
    schedule_days: p.schedule_days ? (typeof p.schedule_days === 'string' ? JSON.parse(p.schedule_days) : p.schedule_days) : null,
    items
  }
}

export async function createPromotion(data: Partial<Promotion> & { items?: { item_type: string; item_id: number }[] }): Promise<number> {
  await ensurePromotionTables()
  const result = await executeQuery(`
    INSERT INTO promotions 
    (name, description, type, value, buy_quantity, get_quantity, min_purchase, max_discount,
     applies_to, channel, start_date, end_date, schedule_days, schedule_start_time, schedule_end_time,
     is_active, is_coupon, coupon_code, max_uses, stackable, priority)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `, [
    data.name || 'Nueva Promoción',
    data.description || null,
    data.type || 'percentage',
    data.value || 0,
    data.buy_quantity || 2,
    data.get_quantity || 1,
    data.min_purchase || 0,
    data.max_discount || 0,
    data.applies_to || 'all',
    data.channel || 'all',
    data.start_date || null,
    data.end_date || null,
    data.schedule_days ? JSON.stringify(data.schedule_days) : null,
    data.schedule_start_time || null,
    data.schedule_end_time || null,
    data.is_active !== false ? 1 : 0,
    data.is_coupon ? 1 : 0,
    data.coupon_code || null,
    data.max_uses || 0,
    data.stackable ? 1 : 0,
    data.priority || 0,
  ]) as any

  const promoId = result.insertId

  if (data.items && data.items.length > 0) {
    for (const item of data.items) {
      await executeQuery(
        'INSERT INTO promotion_items (promotion_id, item_type, item_id) VALUES (?, ?, ?)',
        [promoId, item.item_type, item.item_id]
      )
    }
  }

  return promoId
}

export async function updatePromotion(id: number, data: Partial<Promotion> & { items?: { item_type: string; item_id: number }[] }): Promise<void> {
  await ensurePromotionTables()
  
  const fields: string[] = []
  const values: any[] = []

  const fieldMap: Record<string, string> = {
    name: 'name', description: 'description', type: 'type', value: 'value',
    buy_quantity: 'buy_quantity', get_quantity: 'get_quantity',
    min_purchase: 'min_purchase', max_discount: 'max_discount',
    applies_to: 'applies_to', channel: 'channel',
    start_date: 'start_date', end_date: 'end_date',
    schedule_start_time: 'schedule_start_time', schedule_end_time: 'schedule_end_time',
    is_active: 'is_active', is_coupon: 'is_coupon',
    coupon_code: 'coupon_code', max_uses: 'max_uses',
    stackable: 'stackable', priority: 'priority',
  }

  for (const [key, col] of Object.entries(fieldMap)) {
    if ((data as any)[key] !== undefined) {
      fields.push(`${col} = ?`)
      let val = (data as any)[key]
      if (key === 'is_active' || key === 'is_coupon' || key === 'stackable') val = val ? 1 : 0
      values.push(val)
    }
  }

  if (data.schedule_days !== undefined) {
    fields.push('schedule_days = ?')
    values.push(data.schedule_days ? JSON.stringify(data.schedule_days) : null)
  }

  if (fields.length > 0) {
    values.push(id)
    await executeQuery(`UPDATE promotions SET ${fields.join(', ')} WHERE id = ?`, values)
  }

  if (data.items !== undefined) {
    await executeQuery('DELETE FROM promotion_items WHERE promotion_id = ?', [id])
    for (const item of data.items) {
      await executeQuery(
        'INSERT INTO promotion_items (promotion_id, item_type, item_id) VALUES (?, ?, ?)',
        [id, item.item_type, item.item_id]
      )
    }
  }
}

export async function deletePromotion(id: number): Promise<void> {
  await ensurePromotionTables()
  await executeQuery('DELETE FROM promotions WHERE id = ?', [id])
}

// ─── Coupon Validation ─────────────────────

export async function validateCoupon(code: string): Promise<{ valid: boolean; promotion?: Promotion; error?: string }> {
  await ensurePromotionTables()
  const rows = await executeQuery(
    'SELECT * FROM promotions WHERE coupon_code = ? AND is_coupon = 1 AND is_active = 1',
    [code.toUpperCase().trim()]
  ) as any[]

  if (!rows.length) return { valid: false, error: 'Cupón no válido' }

  const promo = rows[0]

  // Check max uses
  if (promo.max_uses > 0 && promo.current_uses >= promo.max_uses) {
    return { valid: false, error: 'Este cupón ya alcanzó su límite de usos' }
  }

  // Check dates
  const now = new Date()
  if (promo.start_date && new Date(promo.start_date) > now) {
    return { valid: false, error: 'Este cupón aún no está vigente' }
  }
  if (promo.end_date) {
    const end = new Date(promo.end_date)
    end.setHours(23, 59, 59)
    if (end < now) {
      return { valid: false, error: 'Este cupón ha expirado' }
    }
  }

  const items = await executeQuery('SELECT * FROM promotion_items WHERE promotion_id = ?', [promo.id]) as any[]

  return {
    valid: true,
    promotion: {
      ...promo,
      is_active: !!promo.is_active,
      is_coupon: !!promo.is_coupon,
      stackable: !!promo.stackable,
      schedule_days: promo.schedule_days ? (typeof promo.schedule_days === 'string' ? JSON.parse(promo.schedule_days) : promo.schedule_days) : null,
      items
    }
  }
}

// ─── Active Promotions Engine ──────────────

function isInSchedule(promo: Promotion): boolean {
  const now = new Date()

  // Date range check
  if (promo.start_date && new Date(promo.start_date) > now) return false
  if (promo.end_date) {
    const end = new Date(promo.end_date)
    end.setHours(23, 59, 59)
    if (end < now) return false
  }

  // Day of week check
  if (promo.schedule_days && promo.schedule_days.length > 0) {
    if (!promo.schedule_days.includes(now.getDay())) return false
  }

  // Time window check  
  if (promo.schedule_start_time && promo.schedule_end_time) {
    const hhmm = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`
    if (hhmm < promo.schedule_start_time || hhmm > promo.schedule_end_time) return false
  }

  return true
}

function promoAppliesToItem(promo: Promotion, item: CartItemForPromo): boolean {
  if (promo.applies_to === 'all') return true
  if (!promo.items || promo.items.length === 0) return true

  if (promo.applies_to === 'products') {
    return promo.items.some(pi => pi.item_type === 'product' && pi.item_id === item.id)
  }
  if (promo.applies_to === 'categories') {
    return promo.items.some(pi => pi.item_type === 'category' && pi.item_id === item.category_id)
  }
  return false
}

function calculatePromoDiscount(promo: Promotion, items: CartItemForPromo[], subtotal: number): number {
  const applicableItems = items.filter(item => promoAppliesToItem(promo, item))
  if (applicableItems.length === 0) return 0

  let discount = 0

  switch (promo.type) {
    case 'percentage':
    case 'happy_hour': {
      const applicableTotal = applicableItems.reduce((sum, i) => sum + i.price * i.quantity, 0)
      discount = applicableTotal * (promo.value / 100)
      break
    }

    case 'fixed_amount': {
      discount = promo.value
      break
    }

    case '2x1': {
      // For each applicable item, for every 2 units, 1 is free
      for (const item of applicableItems) {
        const freeItems = Math.floor(item.quantity / 2)
        discount += freeItems * item.price
      }
      break
    }

    case 'nxm': {
      // Buy buy_quantity, pay get_quantity (get the diff free)
      const buyQty = promo.buy_quantity || 2
      const payQty = promo.get_quantity || 1
      for (const item of applicableItems) {
        const groups = Math.floor(item.quantity / buyQty)
        const freePerGroup = buyQty - payQty
        discount += groups * freePerGroup * item.price
      }
      break
    }

    case 'combo_price': {
      // If all required items are in cart, price becomes promo.value
      const applicableTotal = applicableItems.reduce((sum, i) => sum + i.price * i.quantity, 0)
      if (applicableItems.length === (promo.items?.length || 0) && applicableTotal > promo.value) {
        discount = applicableTotal - promo.value
      }
      break
    }
  }

  // Cap discount
  if (promo.max_discount > 0) {
    discount = Math.min(discount, promo.max_discount)
  }

  // Discount can't exceed subtotal
  discount = Math.min(discount, subtotal)

  return Math.round(discount * 100) / 100
}

export async function getActivePromotions(channel: string = 'all'): Promise<Promotion[]> {
  await ensurePromotionTables()
  const all = await getPromotions({ activeOnly: true })

  return all.filter(p => {
    // Skip coupons (must be entered manually)
    if (p.is_coupon) return false
    // Channel filter
    if (p.channel !== 'all' && p.channel !== channel) return false
    // Schedule check
    if (!isInSchedule(p)) return false
    // Max uses
    if (p.max_uses > 0 && p.current_uses >= p.max_uses) return false
    return true
  })
}

export async function applyPromotions(
  items: CartItemForPromo[],
  channel: string = 'all',
  couponCode?: string
): Promise<{ discounts: AppliedDiscount[]; totalDiscount: number }> {
  await ensurePromotionTables()

  const subtotal = items.reduce((sum, i) => sum + i.price * i.quantity, 0)
  const discounts: AppliedDiscount[] = []
  let totalDiscount = 0

  // 1. Get auto-applied promotions
  const activePromos = await getActivePromotions(channel)

  // 2. Add coupon if provided
  if (couponCode) {
    const couponResult = await validateCoupon(couponCode)
    if (couponResult.valid && couponResult.promotion) {
      activePromos.push(couponResult.promotion)
    }
  }

  // Sort by priority (higher first)
  activePromos.sort((a, b) => b.priority - a.priority)

  let hasNonStackable = false

  for (const promo of activePromos) {
    // Min purchase check
    if (promo.min_purchase > 0 && subtotal < promo.min_purchase) continue

    // Stackability: if we already applied a non-stackable promo, skip
    if (hasNonStackable && !promo.stackable) continue

    const discount = calculatePromoDiscount(promo, items, subtotal - totalDiscount)
    if (discount <= 0) continue

    discounts.push({
      promotion_id: promo.id,
      promotion_name: promo.name,
      type: promo.type,
      discount_amount: discount,
      coupon_code: promo.is_coupon ? (promo.coupon_code || undefined) : undefined,
    })

    totalDiscount += discount

    if (!promo.stackable) hasNonStackable = true
  }

  // Total discount can't exceed subtotal
  totalDiscount = Math.min(totalDiscount, subtotal)

  return { discounts, totalDiscount: Math.round(totalDiscount * 100) / 100 }
}

// ─── Record usage after order is placed ─────

export async function recordPromotionUsage(
  discounts: AppliedDiscount[],
  orderId: number,
  userId?: number
): Promise<void> {
  await ensurePromotionTables()
  for (const d of discounts) {
    await executeQuery(
      'INSERT INTO promotion_usage (promotion_id, order_id, user_id, discount_amount) VALUES (?, ?, ?, ?)',
      [d.promotion_id, orderId, userId || null, d.discount_amount]
    )
    await executeQuery(
      'UPDATE promotions SET current_uses = current_uses + 1 WHERE id = ?',
      [d.promotion_id]
    )
  }
}

// ─── Products & Categories for admin picker ──

export async function getProductsForPicker(): Promise<{ id: number; name: string; price: number; category_name: string }[]> {
  await ensurePromotionTables()
  return await executeQuery(`
    SELECT p.id, p.name, p.price, COALESCE(c.name, 'Sin categoría') as category_name
    FROM products p
    LEFT JOIN categories c ON c.id = p.category_id
    WHERE p.is_available = 1
    ORDER BY c.name, p.name
  `, []) as any[]
}

export async function getCategoriesForPicker(): Promise<{ id: number; name: string }[]> {
  await ensurePromotionTables()
  return await executeQuery('SELECT id, name FROM categories ORDER BY name', []) as any[]
}

// ─── Stats ─────────────────────────────────

export async function getPromotionStats(): Promise<{
  totalActive: number
  totalUsesToday: number
  totalDiscountToday: number
  topPromos: { name: string; uses: number; total_discount: number }[]
}> {
  await ensurePromotionTables()

  const [active] = await executeQuery('SELECT COUNT(*) as c FROM promotions WHERE is_active = 1', []) as any[]
  const [today] = await executeQuery(
    `SELECT COUNT(*) as uses, COALESCE(SUM(discount_amount), 0) as total 
     FROM promotion_usage WHERE DATE(created_at) = CURDATE()`,
    []
  ) as any[]

  const topPromos = await executeQuery(`
    SELECT p.name, COUNT(pu.id) as uses, COALESCE(SUM(pu.discount_amount), 0) as total_discount
    FROM promotion_usage pu
    JOIN promotions p ON p.id = pu.promotion_id
    WHERE pu.created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
    GROUP BY pu.promotion_id
    ORDER BY uses DESC
    LIMIT 5
  `, []) as any[]

  return {
    totalActive: active?.c || 0,
    totalUsesToday: today?.uses || 0,
    totalDiscountToday: Number(today?.total) || 0,
    topPromos
  }
}
