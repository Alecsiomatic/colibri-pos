/**
 * FASE 11 — Sistema de Reservaciones
 * Motor de reservas: mesas, horarios, confirmación, gestión admin
 */
import { executeQuery } from '@/lib/db-retry'

// ─── Types ───────────────────────────────────────────────────
export type ReservationStatus = 'pending' | 'confirmed' | 'seated' | 'completed' | 'cancelled' | 'no_show'

export interface Reservation {
  id: number
  customer_name: string
  customer_phone: string
  customer_email: string | null
  party_size: number
  reservation_date: string
  reservation_time: string
  duration_minutes: number
  table_id: number | null
  table_name: string | null
  status: ReservationStatus
  notes: string | null
  special_requests: string | null
  source: 'web' | 'phone' | 'walk_in' | 'admin'
  confirmation_code: string
  reminder_sent: boolean
  created_at: string
  updated_at: string
}

export interface ReservationTable {
  id: number
  name: string
  capacity: number
  zone: string
  is_reservable: boolean
  is_active: boolean
  sort_order: number
}

export interface TimeSlot {
  time: string
  available: boolean
  tables_available: number
}

export interface ReservationConfig {
  is_active: boolean
  min_party_size: number
  max_party_size: number
  slot_duration_minutes: number
  advance_days: number
  opening_time: string
  closing_time: string
  slot_interval_minutes: number
  auto_confirm: boolean
  reminder_hours_before: number
  blocked_dates: string | null
  max_reservations_per_slot: number
}

// ─── Migration ───────────────────────────────────────────────
let migrated = false

export async function ensureReservationTables() {
  if (migrated) return
  try {
    await executeQuery(`
      CREATE TABLE IF NOT EXISTS reservation_tables (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        capacity INT NOT NULL DEFAULT 4,
        zone VARCHAR(100) DEFAULT 'General',
        is_reservable TINYINT(1) DEFAULT 1,
        is_active TINYINT(1) DEFAULT 1,
        sort_order INT DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `, [])

    await executeQuery(`
      CREATE TABLE IF NOT EXISTS reservations (
        id INT AUTO_INCREMENT PRIMARY KEY,
        customer_name VARCHAR(200) NOT NULL,
        customer_phone VARCHAR(50) NOT NULL,
        customer_email VARCHAR(200) DEFAULT NULL,
        party_size INT NOT NULL DEFAULT 2,
        reservation_date DATE NOT NULL,
        reservation_time TIME NOT NULL,
        duration_minutes INT DEFAULT 90,
        table_id INT DEFAULT NULL,
        status ENUM('pending','confirmed','seated','completed','cancelled','no_show') DEFAULT 'pending',
        notes TEXT DEFAULT NULL,
        special_requests TEXT DEFAULT NULL,
        source ENUM('web','phone','walk_in','admin') DEFAULT 'web',
        confirmation_code VARCHAR(20) NOT NULL,
        reminder_sent TINYINT(1) DEFAULT 0,
        cancelled_reason TEXT DEFAULT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_date (reservation_date),
        INDEX idx_status (status),
        INDEX idx_code (confirmation_code)
      )
    `, [])

    await executeQuery(`
      CREATE TABLE IF NOT EXISTS reservation_config (
        id INT PRIMARY KEY DEFAULT 1,
        is_active TINYINT(1) DEFAULT 1,
        min_party_size INT DEFAULT 1,
        max_party_size INT DEFAULT 20,
        slot_duration_minutes INT DEFAULT 90,
        advance_days INT DEFAULT 30,
        opening_time TIME DEFAULT '12:00:00',
        closing_time TIME DEFAULT '22:00:00',
        slot_interval_minutes INT DEFAULT 30,
        auto_confirm TINYINT(1) DEFAULT 1,
        reminder_hours_before INT DEFAULT 24,
        blocked_dates TEXT DEFAULT NULL,
        max_reservations_per_slot INT DEFAULT 5,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `, [])

    // Seed default config
    await executeQuery(`
      INSERT IGNORE INTO reservation_config (id) VALUES (1)
    `, [])

    migrated = true
  } catch (e: any) {
    if (e.message?.includes('already exists')) {
      migrated = true
    } else {
      console.error('[Reservations] Migration error:', e.message)
      migrated = true
    }
  }
}

// ─── Config ──────────────────────────────────────────────────
const defaultConfig: ReservationConfig = {
  is_active: true,
  min_party_size: 1,
  max_party_size: 20,
  slot_duration_minutes: 90,
  advance_days: 30,
  opening_time: '12:00:00',
  closing_time: '22:00:00',
  slot_interval_minutes: 30,
  auto_confirm: true,
  reminder_hours_before: 24,
  blocked_dates: null,
  max_reservations_per_slot: 5,
}

export async function getConfig(): Promise<ReservationConfig> {
  await ensureReservationTables()
  const rows = await executeQuery('SELECT * FROM reservation_config WHERE id = 1', [])
  if (!rows.length) return defaultConfig
  const r = rows[0]
  return {
    is_active: !!r.is_active,
    min_party_size: r.min_party_size,
    max_party_size: r.max_party_size,
    slot_duration_minutes: r.slot_duration_minutes,
    advance_days: r.advance_days,
    opening_time: r.opening_time,
    closing_time: r.closing_time,
    slot_interval_minutes: r.slot_interval_minutes,
    auto_confirm: !!r.auto_confirm,
    reminder_hours_before: r.reminder_hours_before,
    blocked_dates: r.blocked_dates,
    max_reservations_per_slot: r.max_reservations_per_slot,
  }
}

export async function updateConfig(data: Partial<ReservationConfig>) {
  await ensureReservationTables()
  const fields: string[] = []
  const values: any[] = []
  const allowed: (keyof ReservationConfig)[] = [
    'is_active', 'min_party_size', 'max_party_size', 'slot_duration_minutes',
    'advance_days', 'opening_time', 'closing_time', 'slot_interval_minutes',
    'auto_confirm', 'reminder_hours_before', 'blocked_dates', 'max_reservations_per_slot',
  ]
  for (const key of allowed) {
    if (data[key] !== undefined) {
      fields.push(`${key} = ?`)
      let val: any = data[key]
      if (key === 'is_active' || key === 'auto_confirm') val = val ? 1 : 0
      values.push(val)
    }
  }
  if (fields.length > 0) {
    await executeQuery(`UPDATE reservation_config SET ${fields.join(', ')} WHERE id = 1`, values)
  }
}

// ─── Tables ──────────────────────────────────────────────────
export async function getTables(activeOnly = false): Promise<ReservationTable[]> {
  await ensureReservationTables()
  let q = 'SELECT * FROM reservation_tables'
  if (activeOnly) q += ' WHERE is_active = 1 AND is_reservable = 1'
  q += ' ORDER BY sort_order, name'
  return await executeQuery(q, [])
}

export async function createTable(data: { name: string; capacity: number; zone?: string }) {
  await ensureReservationTables()
  const result = await executeQuery(
    'INSERT INTO reservation_tables (name, capacity, zone) VALUES (?, ?, ?)',
    [data.name, data.capacity, data.zone || 'General']
  )
  return result.insertId
}

export async function updateTable(id: number, data: Partial<ReservationTable>) {
  await ensureReservationTables()
  const fields: string[] = []
  const values: any[] = []
  for (const [k, v] of Object.entries(data)) {
    if (['name', 'capacity', 'zone', 'is_reservable', 'is_active', 'sort_order'].includes(k)) {
      fields.push(`${k} = ?`)
      values.push((k === 'is_reservable' || k === 'is_active') ? (v ? 1 : 0) : v)
    }
  }
  if (fields.length) {
    values.push(id)
    await executeQuery(`UPDATE reservation_tables SET ${fields.join(', ')} WHERE id = ?`, values)
  }
}

export async function deleteTable(id: number) {
  await ensureReservationTables()
  await executeQuery('DELETE FROM reservation_tables WHERE id = ?', [id])
}

// ─── Helpers ─────────────────────────────────────────────────
function generateCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  let code = ''
  for (let i = 0; i < 8; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return code
}

function timeToMinutes(t: string): number {
  const [h, m] = t.split(':').map(Number)
  return h * 60 + m
}

function minutesToTime(m: number): string {
  const h = Math.floor(m / 60)
  const min = m % 60
  return `${String(h).padStart(2, '0')}:${String(min).padStart(2, '0')}`
}

// ─── Availability ────────────────────────────────────────────
export async function getAvailableSlots(date: string, partySize: number): Promise<TimeSlot[]> {
  await ensureReservationTables()
  const config = await getConfig()
  if (!config.is_active) return []

  // Check blocked dates
  if (config.blocked_dates) {
    const blocked = config.blocked_dates.split(',').map(d => d.trim())
    if (blocked.includes(date)) return []
  }

  const tables = await getTables(true)
  const suitableTables = tables.filter(t => t.capacity >= partySize)
  if (suitableTables.length === 0) return []

  // Get existing reservations for that date
  const existing: any[] = await executeQuery(
    `SELECT reservation_time, duration_minutes, table_id, party_size
     FROM reservations
     WHERE reservation_date = ? AND status NOT IN ('cancelled', 'no_show', 'completed')`,
    [date]
  )

  const openMin = timeToMinutes(config.opening_time)
  const closeMin = timeToMinutes(config.closing_time)
  const slots: TimeSlot[] = []

  for (let m = openMin; m <= closeMin - config.slot_duration_minutes; m += config.slot_interval_minutes) {
    const slotTime = minutesToTime(m)
    const slotEnd = m + config.slot_duration_minutes

    // Count how many reservations overlap this slot
    let overlapping = 0
    const busyTableIds = new Set<number>()

    for (const res of existing) {
      const resStart = timeToMinutes(res.reservation_time)
      const resEnd = resStart + res.duration_minutes
      if (m < resEnd && slotEnd > resStart) {
        overlapping++
        if (res.table_id) busyTableIds.add(res.table_id)
      }
    }

    const freeTables = suitableTables.filter(t => !busyTableIds.has(t.id))
    const available = overlapping < config.max_reservations_per_slot && freeTables.length > 0

    slots.push({
      time: slotTime,
      available,
      tables_available: freeTables.length,
    })
  }

  return slots
}

// ─── CRUD ────────────────────────────────────────────────────
export async function createReservation(data: {
  customer_name: string
  customer_phone: string
  customer_email?: string
  party_size: number
  reservation_date: string
  reservation_time: string
  notes?: string
  special_requests?: string
  source?: 'web' | 'phone' | 'walk_in' | 'admin'
}): Promise<{ id: number; confirmation_code: string; status: ReservationStatus }> {
  await ensureReservationTables()
  const config = await getConfig()

  if (!config.is_active) throw new Error('Las reservaciones están desactivadas')
  if (data.party_size < config.min_party_size || data.party_size > config.max_party_size) {
    throw new Error(`El tamaño del grupo debe ser entre ${config.min_party_size} y ${config.max_party_size}`)
  }

  // Auto-assign best table
  const tables = await getTables(true)
  const suitable = tables
    .filter(t => t.capacity >= data.party_size)
    .sort((a, b) => a.capacity - b.capacity) // smallest that fits

  let tableId: number | null = null
  if (suitable.length > 0) {
    // Check which tables are free at that time
    const existing: any[] = await executeQuery(
      `SELECT table_id, reservation_time, duration_minutes
       FROM reservations
       WHERE reservation_date = ? AND status NOT IN ('cancelled','no_show','completed')`,
      [data.reservation_date]
    )
    const reqStart = timeToMinutes(data.reservation_time)
    const reqEnd = reqStart + config.slot_duration_minutes
    const busyIds = new Set<number>()
    for (const r of existing) {
      if (!r.table_id) continue
      const rStart = timeToMinutes(r.reservation_time)
      const rEnd = rStart + r.duration_minutes
      if (reqStart < rEnd && reqEnd > rStart) busyIds.add(r.table_id)
    }
    const free = suitable.find(t => !busyIds.has(t.id))
    if (free) tableId = free.id
  }

  const code = generateCode()
  const status: ReservationStatus = config.auto_confirm ? 'confirmed' : 'pending'

  const result = await executeQuery(
    `INSERT INTO reservations
      (customer_name, customer_phone, customer_email, party_size,
       reservation_date, reservation_time, duration_minutes,
       table_id, status, notes, special_requests, source, confirmation_code)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      data.customer_name, data.customer_phone, data.customer_email || null,
      data.party_size, data.reservation_date, data.reservation_time,
      config.slot_duration_minutes, tableId, status,
      data.notes || null, data.special_requests || null,
      data.source || 'web', code,
    ]
  )

  return { id: result.insertId, confirmation_code: code, status }
}

export async function getReservations(filters: {
  date?: string
  status?: ReservationStatus
  search?: string
  limit?: number
  offset?: number
} = {}): Promise<Reservation[]> {
  await ensureReservationTables()
  let q = `SELECT r.*, rt.name as table_name
            FROM reservations r
            LEFT JOIN reservation_tables rt ON r.table_id = rt.id
            WHERE 1=1`
  const params: any[] = []

  if (filters.date) {
    q += ' AND r.reservation_date = ?'
    params.push(filters.date)
  }
  if (filters.status) {
    q += ' AND r.status = ?'
    params.push(filters.status)
  }
  if (filters.search) {
    q += ' AND (r.customer_name LIKE ? OR r.customer_phone LIKE ? OR r.confirmation_code LIKE ?)'
    const term = `%${filters.search}%`
    params.push(term, term, term)
  }

  q += ' ORDER BY r.reservation_date ASC, r.reservation_time ASC'

  if (filters.limit) {
    q += ' LIMIT ?'
    params.push(filters.limit)
    if (filters.offset) {
      q += ' OFFSET ?'
      params.push(filters.offset)
    }
  }

  return await executeQuery(q, params)
}

export async function getReservationByCode(code: string): Promise<Reservation | null> {
  await ensureReservationTables()
  const rows = await executeQuery(
    `SELECT r.*, rt.name as table_name
     FROM reservations r
     LEFT JOIN reservation_tables rt ON r.table_id = rt.id
     WHERE r.confirmation_code = ?`,
    [code]
  )
  return rows.length ? rows[0] : null
}

export async function updateReservationStatus(id: number, status: ReservationStatus, reason?: string) {
  await ensureReservationTables()
  if (status === 'cancelled' && reason) {
    await executeQuery('UPDATE reservations SET status = ?, cancelled_reason = ? WHERE id = ?', [status, reason, id])
  } else {
    await executeQuery('UPDATE reservations SET status = ? WHERE id = ?', [status, id])
  }
}

export async function updateReservation(id: number, data: Partial<{
  customer_name: string
  customer_phone: string
  customer_email: string
  party_size: number
  reservation_date: string
  reservation_time: string
  table_id: number | null
  notes: string
  special_requests: string
  status: ReservationStatus
}>) {
  await ensureReservationTables()
  const fields: string[] = []
  const values: any[] = []
  for (const [k, v] of Object.entries(data)) {
    fields.push(`${k} = ?`)
    values.push(v)
  }
  if (fields.length) {
    values.push(id)
    await executeQuery(`UPDATE reservations SET ${fields.join(', ')} WHERE id = ?`, values)
  }
}

export async function deleteReservation(id: number) {
  await ensureReservationTables()
  await executeQuery('DELETE FROM reservations WHERE id = ?', [id])
}

// ─── Stats ───────────────────────────────────────────────────
export async function getReservationStats() {
  await ensureReservationTables()
  const today = new Date().toISOString().split('T')[0]

  const [todayCount] = await executeQuery(
    `SELECT COUNT(*) as c FROM reservations WHERE reservation_date = ? AND status NOT IN ('cancelled','no_show')`,
    [today]
  )
  const [pendingCount] = await executeQuery(
    `SELECT COUNT(*) as c FROM reservations WHERE status = 'pending'`, []
  )
  const [confirmedToday] = await executeQuery(
    `SELECT COUNT(*) as c FROM reservations WHERE reservation_date = ? AND status = 'confirmed'`,
    [today]
  )
  const [totalThisWeek] = await executeQuery(
    `SELECT COUNT(*) as c FROM reservations
     WHERE reservation_date BETWEEN ? AND DATE_ADD(?, INTERVAL 7 DAY)
     AND status NOT IN ('cancelled','no_show')`,
    [today, today]
  )
  const upcoming: Reservation[] = await executeQuery(
    `SELECT r.*, rt.name as table_name
     FROM reservations r
     LEFT JOIN reservation_tables rt ON r.table_id = rt.id
     WHERE r.reservation_date >= ? AND r.status IN ('pending','confirmed')
     ORDER BY r.reservation_date ASC, r.reservation_time ASC
     LIMIT 10`,
    [today]
  )
  const byStatus: any[] = await executeQuery(
    `SELECT status, COUNT(*) as count FROM reservations
     WHERE reservation_date >= DATE_SUB(?, INTERVAL 30 DAY)
     GROUP BY status`,
    [today]
  )

  return {
    todayCount: todayCount?.c || 0,
    pendingCount: pendingCount?.c || 0,
    confirmedToday: confirmedToday?.c || 0,
    thisWeekCount: totalThisWeek?.c || 0,
    upcoming,
    byStatus,
  }
}
