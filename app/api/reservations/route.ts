/**
 * FASE 11 — API de Reservaciones
 */
import { NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth-simple'
import {
  ensureReservationTables,
  getConfig, updateConfig,
  getTables, createTable, updateTable, deleteTable,
  getAvailableSlots,
  createReservation, getReservations, getReservationByCode,
  updateReservationStatus, updateReservation, deleteReservation,
  getReservationStats,
} from '@/lib/reservations'

export const dynamic = 'force-dynamic'

// ─── GET ──────────────────────────────────────────────────────
export async function GET(req: Request) {
  try {
    await ensureReservationTables()
    const { searchParams } = new URL(req.url)
    const action = searchParams.get('action') || 'config'

    switch (action) {
      // Public: reservation config (hours, party size, etc)
      case 'config': {
        const config = await getConfig()
        return NextResponse.json({
          success: true,
          config: {
            is_active: config.is_active,
            min_party_size: config.min_party_size,
            max_party_size: config.max_party_size,
            opening_time: config.opening_time,
            closing_time: config.closing_time,
            advance_days: config.advance_days,
            slot_interval_minutes: config.slot_interval_minutes,
          },
        })
      }

      // Public: available time slots for a date
      case 'slots': {
        const date = searchParams.get('date')
        const partySize = Number(searchParams.get('party_size') || 2)
        if (!date) return NextResponse.json({ error: 'Fecha requerida' }, { status: 400 })
        const slots = await getAvailableSlots(date, partySize)
        return NextResponse.json({ success: true, slots })
      }

      // Public: check reservation by code
      case 'check': {
        const code = searchParams.get('code')
        if (!code) return NextResponse.json({ error: 'Código requerido' }, { status: 400 })
        const res = await getReservationByCode(code.toUpperCase().trim())
        if (!res) return NextResponse.json({ success: false, error: 'Reservación no encontrada' })
        return NextResponse.json({ success: true, reservation: res })
      }

      // Admin: full config
      case 'admin-config': {
        const user = await getCurrentUser(req)
        if (!user?.is_admin) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
        const config = await getConfig()
        return NextResponse.json({ success: true, config })
      }

      // Admin: tables
      case 'tables': {
        const user = await getCurrentUser(req)
        if (!user?.is_admin) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
        const tables = await getTables()
        return NextResponse.json({ success: true, tables })
      }

      // Admin: list reservations
      case 'list': {
        const user = await getCurrentUser(req)
        if (!user?.is_admin) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
        const date = searchParams.get('date') || undefined
        const status = searchParams.get('status') as any || undefined
        const search = searchParams.get('search') || undefined
        const reservations = await getReservations({ date, status, search, limit: 200 })
        return NextResponse.json({ success: true, reservations })
      }

      // Admin: stats
      case 'stats': {
        const user = await getCurrentUser(req)
        if (!user?.is_admin) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
        const stats = await getReservationStats()
        const config = await getConfig()
        return NextResponse.json({ success: true, stats, config })
      }

      default:
        return NextResponse.json({ error: 'Acción no válida' }, { status: 400 })
    }
  } catch (e: any) {
    console.error('[Reservations GET]', e)
    return NextResponse.json({ error: e.message || 'Error interno' }, { status: 500 })
  }
}

// ─── POST ─────────────────────────────────────────────────────
export async function POST(req: Request) {
  try {
    await ensureReservationTables()
    const body = await req.json()
    const action = body.action || 'create'

    switch (action) {
      // Public: create reservation
      case 'create': {
        const { customer_name, customer_phone, customer_email, party_size, reservation_date, reservation_time, notes, special_requests } = body
        if (!customer_name || !customer_phone || !party_size || !reservation_date || !reservation_time) {
          return NextResponse.json({ error: 'Faltan campos requeridos' }, { status: 400 })
        }
        const result = await createReservation({
          customer_name, customer_phone, customer_email,
          party_size, reservation_date, reservation_time,
          notes, special_requests, source: body.source || 'web',
        })
        return NextResponse.json({ success: true, ...result })
      }

      // Public: cancel by code
      case 'cancel': {
        const { code, reason } = body
        if (!code) return NextResponse.json({ error: 'Código requerido' }, { status: 400 })
        const res = await getReservationByCode(code.toUpperCase().trim())
        if (!res) return NextResponse.json({ error: 'Reservación no encontrada' }, { status: 404 })
        if (['cancelled', 'completed', 'no_show'].includes(res.status)) {
          return NextResponse.json({ error: 'Esta reservación ya no puede cancelarse' }, { status: 400 })
        }
        await updateReservationStatus(res.id, 'cancelled', reason || 'Cancelada por cliente')
        return NextResponse.json({ success: true })
      }

      // Admin: update status
      case 'update-status': {
        const user = await getCurrentUser(req)
        if (!user?.is_admin) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
        const { id, status, reason } = body
        if (!id || !status) return NextResponse.json({ error: 'ID y status requeridos' }, { status: 400 })
        await updateReservationStatus(id, status, reason)
        return NextResponse.json({ success: true })
      }

      // Admin: update reservation details
      case 'update': {
        const user = await getCurrentUser(req)
        if (!user?.is_admin) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
        const { id, ...data } = body
        if (!id) return NextResponse.json({ error: 'ID requerido' }, { status: 400 })
        delete data.action
        await updateReservation(id, data)
        return NextResponse.json({ success: true })
      }

      // Admin: delete reservation
      case 'delete': {
        const user = await getCurrentUser(req)
        if (!user?.is_admin) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
        if (!body.id) return NextResponse.json({ error: 'ID requerido' }, { status: 400 })
        await deleteReservation(body.id)
        return NextResponse.json({ success: true })
      }

      // Admin: update config
      case 'update-config': {
        const user = await getCurrentUser(req)
        if (!user?.is_admin) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
        await updateConfig(body.config || {})
        return NextResponse.json({ success: true })
      }

      // Admin: create table
      case 'create-table': {
        const user = await getCurrentUser(req)
        if (!user?.is_admin) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
        const tableId = await createTable(body)
        return NextResponse.json({ success: true, id: tableId })
      }

      // Admin: update table
      case 'update-table': {
        const user = await getCurrentUser(req)
        if (!user?.is_admin) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
        if (!body.id) return NextResponse.json({ error: 'ID requerido' }, { status: 400 })
        await updateTable(body.id, body)
        return NextResponse.json({ success: true })
      }

      // Admin: delete table
      case 'delete-table': {
        const user = await getCurrentUser(req)
        if (!user?.is_admin) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
        if (!body.id) return NextResponse.json({ error: 'ID requerido' }, { status: 400 })
        await deleteTable(body.id)
        return NextResponse.json({ success: true })
      }

      // Admin: create reservation from admin panel
      case 'admin-create': {
        const user = await getCurrentUser(req)
        if (!user?.is_admin) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
        const result = await createReservation({ ...body, source: 'admin' })
        return NextResponse.json({ success: true, ...result })
      }

      default:
        return NextResponse.json({ error: 'Acción no válida' }, { status: 400 })
    }
  } catch (e: any) {
    console.error('[Reservations POST]', e)
    return NextResponse.json({ error: e.message || 'Error interno' }, { status: 500 })
  }
}
