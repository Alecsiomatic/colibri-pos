/**
 * Loyalty Program Service — FASE 10
 *
 * Points earn on every purchase, redeem for discounts.
 * Tiers: Bronce (0), Plata (500), Oro (2000), Diamante (5000)
 * Default: 1 point per $10 spent. Configurable multiplier per tier.
 */

import { executeQuery } from '@/lib/db-retry'

// ─── Types ─────────────────────────────────

export type TierName = 'bronce' | 'plata' | 'oro' | 'diamante'
export type TransactionType = 'earn' | 'redeem' | 'bonus' | 'expire' | 'adjustment'

export interface LoyaltyTier {
  name: TierName
  label: string
  min_points: number
  multiplier: number  // earn multiplier (e.g. 1.5x for plata)
  color: string
  icon: string
}

export interface PointTransaction {
  id: number
  user_id: number
  type: TransactionType
  points: number       // positive for earn, negative for redeem
  balance_after: number
  order_id: number | null
  description: string
  created_at: string
}

export interface UserLoyalty {
  user_id: number
  total_points: number
  lifetime_points: number
  tier: TierName
  tier_label: string
  tier_color: string
  tier_multiplier: number
  next_tier: TierName | null
  points_to_next: number
  transactions?: PointTransaction[]
}

export interface LoyaltyConfig {
  points_per_currency: number   // points earned per $X spent
  currency_per_point: number    // $X spent to earn 1 point
  redemption_value: number      // 1 point = $X discount
  min_redeem: number            // minimum points to redeem
  is_active: boolean
}

// ─── Constants ─────────────────────────────

export const TIERS: LoyaltyTier[] = [
  { name: 'bronce',   label: 'Bronce',   min_points: 0,    multiplier: 1.0, color: '#CD7F32', icon: '🥉' },
  { name: 'plata',    label: 'Plata',    min_points: 500,  multiplier: 1.25, color: '#C0C0C0', icon: '🥈' },
  { name: 'oro',      label: 'Oro',      min_points: 2000, multiplier: 1.5,  color: '#FFD700', icon: '🥇' },
  { name: 'diamante', label: 'Diamante', min_points: 5000, multiplier: 2.0,  color: '#B9F2FF', icon: '💎' },
]

const DEFAULT_CONFIG: LoyaltyConfig = {
  points_per_currency: 1,   // earn 1 point
  currency_per_point: 10,   // per $10 spent
  redemption_value: 0.10,   // 1 point = $0.10 discount
  min_redeem: 50,           // need at least 50 points to redeem
  is_active: true,
}

// ─── Migration (idempotent) ────────────────

let _migrated = false
export async function ensureLoyaltyTables() {
  if (_migrated) return
  try {
    await executeQuery(`
      CREATE TABLE IF NOT EXISTS loyalty_points (
        user_id INT PRIMARY KEY,
        total_points INT NOT NULL DEFAULT 0,
        lifetime_points INT NOT NULL DEFAULT 0,
        tier ENUM('bronce','plata','oro','diamante') NOT NULL DEFAULT 'bronce',
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    `, [])

    await executeQuery(`
      CREATE TABLE IF NOT EXISTS point_transactions (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        type ENUM('earn','redeem','bonus','expire','adjustment') NOT NULL,
        points INT NOT NULL,
        balance_after INT NOT NULL DEFAULT 0,
        order_id INT DEFAULT NULL,
        description VARCHAR(255) NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_user (user_id),
        INDEX idx_order (order_id),
        INDEX idx_type (type),
        INDEX idx_created (created_at),
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    `, [])

    await executeQuery(`
      CREATE TABLE IF NOT EXISTS loyalty_config (
        id INT PRIMARY KEY DEFAULT 1,
        points_per_currency INT NOT NULL DEFAULT 1,
        currency_per_point DECIMAL(10,2) NOT NULL DEFAULT 10,
        redemption_value DECIMAL(10,4) NOT NULL DEFAULT 0.10,
        min_redeem INT NOT NULL DEFAULT 50,
        is_active TINYINT(1) NOT NULL DEFAULT 1,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    `, [])

    // Seed default config if empty
    await executeQuery(`
      INSERT IGNORE INTO loyalty_config (id, points_per_currency, currency_per_point, redemption_value, min_redeem, is_active)
      VALUES (1, ?, ?, ?, ?, ?)
    `, [
      DEFAULT_CONFIG.points_per_currency,
      DEFAULT_CONFIG.currency_per_point,
      DEFAULT_CONFIG.redemption_value,
      DEFAULT_CONFIG.min_redeem,
      DEFAULT_CONFIG.is_active ? 1 : 0,
    ])

    // Add points_redeemed column to orders if it doesn't exist
    await executeQuery(`ALTER TABLE orders ADD COLUMN IF NOT EXISTS points_redeemed INT NOT NULL DEFAULT 0`, []).catch(() => {})
    await executeQuery(`ALTER TABLE orders ADD COLUMN IF NOT EXISTS points_discount DECIMAL(10,2) NOT NULL DEFAULT 0`, []).catch(() => {})

    _migrated = true
  } catch (e: any) {
    if (!e.message?.includes('already exists')) console.error('[Loyalty] Migration error:', e.message)
    _migrated = true
  }
}

// ─── Config ────────────────────────────────

export async function getLoyaltyConfig(): Promise<LoyaltyConfig> {
  await ensureLoyaltyTables()
  const rows = await executeQuery('SELECT * FROM loyalty_config WHERE id = 1', []) as any[]
  if (!rows.length) return DEFAULT_CONFIG
  const c = rows[0]
  return {
    points_per_currency: c.points_per_currency,
    currency_per_point: Number(c.currency_per_point),
    redemption_value: Number(c.redemption_value),
    min_redeem: c.min_redeem,
    is_active: !!c.is_active,
  }
}

export async function updateLoyaltyConfig(data: Partial<LoyaltyConfig>): Promise<void> {
  await ensureLoyaltyTables()
  const fields: string[] = []
  const values: any[] = []
  if (data.points_per_currency !== undefined) { fields.push('points_per_currency = ?'); values.push(data.points_per_currency) }
  if (data.currency_per_point !== undefined) { fields.push('currency_per_point = ?'); values.push(data.currency_per_point) }
  if (data.redemption_value !== undefined) { fields.push('redemption_value = ?'); values.push(data.redemption_value) }
  if (data.min_redeem !== undefined) { fields.push('min_redeem = ?'); values.push(data.min_redeem) }
  if (data.is_active !== undefined) { fields.push('is_active = ?'); values.push(data.is_active ? 1 : 0) }
  if (fields.length > 0) {
    await executeQuery(`UPDATE loyalty_config SET ${fields.join(', ')} WHERE id = 1`, values)
  }
}

// ─── User Points ───────────────────────────

function getTierForPoints(lifetime: number): LoyaltyTier {
  // Find highest tier the user qualifies for
  for (let i = TIERS.length - 1; i >= 0; i--) {
    if (lifetime >= TIERS[i].min_points) return TIERS[i]
  }
  return TIERS[0]
}

function getNextTier(current: TierName): LoyaltyTier | null {
  const idx = TIERS.findIndex(t => t.name === current)
  return idx < TIERS.length - 1 ? TIERS[idx + 1] : null
}

async function ensureUserLoyalty(userId: number): Promise<void> {
  await ensureLoyaltyTables()
  await executeQuery(
    'INSERT IGNORE INTO loyalty_points (user_id, total_points, lifetime_points, tier) VALUES (?, 0, 0, ?)',
    [userId, 'bronce']
  )
}

export async function getUserLoyalty(userId: number): Promise<UserLoyalty> {
  await ensureUserLoyalty(userId)
  const rows = await executeQuery(
    'SELECT * FROM loyalty_points WHERE user_id = ?', [userId]
  ) as any[]
  const row = rows[0]
  const tier = getTierForPoints(row.lifetime_points)
  const next = getNextTier(tier.name)

  return {
    user_id: userId,
    total_points: row.total_points,
    lifetime_points: row.lifetime_points,
    tier: tier.name,
    tier_label: tier.label,
    tier_color: tier.color,
    tier_multiplier: tier.multiplier,
    next_tier: next?.name || null,
    points_to_next: next ? Math.max(0, next.min_points - row.lifetime_points) : 0,
  }
}

export async function getUserTransactions(
  userId: number,
  opts: { limit?: number; offset?: number } = {}
): Promise<PointTransaction[]> {
  await ensureLoyaltyTables()
  const limit = opts.limit || 50
  const offset = opts.offset || 0
  return await executeQuery(
    'SELECT * FROM point_transactions WHERE user_id = ? ORDER BY created_at DESC LIMIT ? OFFSET ?',
    [userId, limit, offset]
  ) as PointTransaction[]
}

// ─── Earn Points ───────────────────────────

export async function earnPoints(
  userId: number,
  orderTotal: number,
  orderId: number,
  description?: string
): Promise<{ pointsEarned: number; newBalance: number; tier: TierName } | null> {
  const config = await getLoyaltyConfig()
  if (!config.is_active) return null

  await ensureUserLoyalty(userId)

  // Get current user data for tier multiplier
  const loyalty = await getUserLoyalty(userId)
  const tierMultiplier = loyalty.tier_multiplier

  // Calculate points: (total / currency_per_point) * points_per_currency * tier_multiplier
  const basePoints = Math.floor(orderTotal / config.currency_per_point) * config.points_per_currency
  const pointsEarned = Math.floor(basePoints * tierMultiplier)

  if (pointsEarned <= 0) return null

  // Update balance
  await executeQuery(
    `UPDATE loyalty_points 
     SET total_points = total_points + ?, 
         lifetime_points = lifetime_points + ?
     WHERE user_id = ?`,
    [pointsEarned, pointsEarned, userId]
  )

  // Get new balance
  const [updated] = await executeQuery(
    'SELECT total_points, lifetime_points FROM loyalty_points WHERE user_id = ?',
    [userId]
  ) as any[]

  // Update tier if needed
  const newTier = getTierForPoints(updated.lifetime_points)
  if (newTier.name !== loyalty.tier) {
    await executeQuery(
      'UPDATE loyalty_points SET tier = ? WHERE user_id = ?',
      [newTier.name, userId]
    )
  }

  // Record transaction
  await executeQuery(
    `INSERT INTO point_transactions (user_id, type, points, balance_after, order_id, description)
     VALUES (?, 'earn', ?, ?, ?, ?)`,
    [userId, pointsEarned, updated.total_points, orderId,
     description || `Puntos por pedido #${orderId} (${tierMultiplier}x)`]
  )

  return {
    pointsEarned,
    newBalance: updated.total_points,
    tier: newTier.name,
  }
}

// ─── Redeem Points ─────────────────────────

export async function redeemPoints(
  userId: number,
  pointsToRedeem: number,
  orderId?: number,
  description?: string
): Promise<{ discount: number; newBalance: number } | { error: string }> {
  const config = await getLoyaltyConfig()
  if (!config.is_active) return { error: 'Programa de lealtad no está activo' }

  await ensureUserLoyalty(userId)
  const loyalty = await getUserLoyalty(userId)

  if (pointsToRedeem < config.min_redeem) {
    return { error: `Mínimo ${config.min_redeem} puntos para canjear` }
  }
  if (pointsToRedeem > loyalty.total_points) {
    return { error: 'No tienes suficientes puntos' }
  }

  const discount = Math.round(pointsToRedeem * config.redemption_value * 100) / 100

  // Deduct points
  await executeQuery(
    'UPDATE loyalty_points SET total_points = total_points - ? WHERE user_id = ?',
    [pointsToRedeem, userId]
  )

  // Get new balance
  const [updated] = await executeQuery(
    'SELECT total_points FROM loyalty_points WHERE user_id = ?',
    [userId]
  ) as any[]

  // Record transaction
  await executeQuery(
    `INSERT INTO point_transactions (user_id, type, points, balance_after, order_id, description)
     VALUES (?, 'redeem', ?, ?, ?, ?)`,
    [userId, -pointsToRedeem, updated.total_points, orderId || null,
     description || `Canje de ${pointsToRedeem} puntos (-$${discount.toFixed(2)})`]
  )

  return { discount, newBalance: updated.total_points }
}

// ─── Bonus Points (admin) ──────────────────

export async function addBonusPoints(
  userId: number,
  points: number,
  description: string
): Promise<{ newBalance: number }> {
  await ensureUserLoyalty(userId)

  const isPositive = points > 0
  if (isPositive) {
    await executeQuery(
      `UPDATE loyalty_points 
       SET total_points = total_points + ?, lifetime_points = lifetime_points + ?
       WHERE user_id = ?`,
      [points, points, userId]
    )
  } else {
    await executeQuery(
      `UPDATE loyalty_points 
       SET total_points = GREATEST(0, total_points + ?)
       WHERE user_id = ?`,
      [points, userId]
    )
  }

  const [updated] = await executeQuery(
    'SELECT total_points, lifetime_points FROM loyalty_points WHERE user_id = ?',
    [userId]
  ) as any[]

  // Update tier
  const newTier = getTierForPoints(updated.lifetime_points)
  await executeQuery('UPDATE loyalty_points SET tier = ? WHERE user_id = ?', [newTier.name, userId])

  await executeQuery(
    `INSERT INTO point_transactions (user_id, type, points, balance_after, description)
     VALUES (?, ?, ?, ?, ?)`,
    [userId, isPositive ? 'bonus' : 'adjustment', points, updated.total_points, description]
  )

  return { newBalance: updated.total_points }
}

// ─── Admin Stats ───────────────────────────

export async function getLoyaltyStats(): Promise<{
  totalMembers: number
  totalPointsInCirculation: number
  pointsEarnedToday: number
  pointsRedeemedToday: number
  tierDistribution: { tier: string; count: number }[]
  topMembers: { user_id: number; username: string; email: string; total_points: number; lifetime_points: number; tier: string }[]
  recentActivity: PointTransaction[]
}> {
  await ensureLoyaltyTables()

  const [members] = await executeQuery(
    'SELECT COUNT(*) as c FROM loyalty_points WHERE lifetime_points > 0', []
  ) as any[]

  const [circulation] = await executeQuery(
    'SELECT COALESCE(SUM(total_points), 0) as c FROM loyalty_points', []
  ) as any[]

  const [earnedToday] = await executeQuery(
    `SELECT COALESCE(SUM(points), 0) as c FROM point_transactions 
     WHERE type = 'earn' AND DATE(created_at) = CURDATE()`, []
  ) as any[]

  const [redeemedToday] = await executeQuery(
    `SELECT COALESCE(SUM(ABS(points)), 0) as c FROM point_transactions 
     WHERE type = 'redeem' AND DATE(created_at) = CURDATE()`, []
  ) as any[]

  const tierDist = await executeQuery(
    'SELECT tier, COUNT(*) as count FROM loyalty_points GROUP BY tier ORDER BY FIELD(tier, "bronce","plata","oro","diamante")', []
  ) as any[]

  const topMembers = await executeQuery(`
    SELECT lp.user_id, u.username, u.email, lp.total_points, lp.lifetime_points, lp.tier
    FROM loyalty_points lp
    JOIN users u ON u.id = lp.user_id
    WHERE lp.lifetime_points > 0
    ORDER BY lp.lifetime_points DESC
    LIMIT 10
  `, []) as any[]

  const recentActivity = await executeQuery(`
    SELECT pt.*, u.username
    FROM point_transactions pt
    JOIN users u ON u.id = pt.user_id
    ORDER BY pt.created_at DESC
    LIMIT 20
  `, []) as any[]

  return {
    totalMembers: members?.c || 0,
    totalPointsInCirculation: Number(circulation?.c) || 0,
    pointsEarnedToday: Number(earnedToday?.c) || 0,
    pointsRedeemedToday: Number(redeemedToday?.c) || 0,
    tierDistribution: tierDist,
    topMembers,
    recentActivity,
  }
}

// ─── Calculate points preview (no side effects) ──

export async function previewEarnPoints(orderTotal: number, userId?: number): Promise<{
  pointsWouldEarn: number
  tierMultiplier: number
  tier: string
}> {
  const config = await getLoyaltyConfig()
  if (!config.is_active) return { pointsWouldEarn: 0, tierMultiplier: 1, tier: 'bronce' }

  let tierMultiplier = 1
  let tier = 'bronce'

  if (userId) {
    const loyalty = await getUserLoyalty(userId)
    tierMultiplier = loyalty.tier_multiplier
    tier = loyalty.tier
  }

  const basePoints = Math.floor(orderTotal / config.currency_per_point) * config.points_per_currency
  const pointsWouldEarn = Math.floor(basePoints * tierMultiplier)

  return { pointsWouldEarn, tierMultiplier, tier }
}
