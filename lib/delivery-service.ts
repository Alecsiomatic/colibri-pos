import { executeQuery, executeTransaction } from "./mysql-db"
import type { DeliveryAssignment, DeliveryDriver, LatLng, OrderStatus } from "./types"
import { calculateDistance, geocodeAddress } from "./google-maps"

type DriverRow = {
  id: number | string
  name: string
  phone: string
  email: string
  is_active?: number | boolean
  current_location?: string | LatLng | null
  last_updated?: string | Date | null
  current_order_id?: number | null
  rating?: number | null
}

type AssignmentRow = {
  id: number | string
  order_id: number
  driver_id: string
  status: string
  assigned_at?: string | Date | null
  accepted_at?: string | Date | null
  completed_at?: string | Date | null
  start_location?: string | LatLng | null
  delivery_location?: string | LatLng | null
  estimated_distance?: number | null
  estimated_duration?: number | null
}

const DRIVER_FREE_CONDITION = "(current_order_id IS NULL OR current_order_id = '' OR current_order_id = 0)"

function toISO(value?: string | Date | null): string | undefined {
  if (!value) return undefined
  if (value instanceof Date) return value.toISOString()
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? undefined : date.toISOString()
}

function parseLatLng(value?: string | LatLng | null): LatLng | undefined {
  if (!value) return undefined
  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value)
      if (parsed && typeof parsed.lat === "number" && typeof parsed.lng === "number") {
        return { lat: parsed.lat, lng: parsed.lng }
      }
    } catch (error) {
      console.warn("No se pudo parsear LatLng", error)
      return undefined
    }
  }
  if (typeof value === "object" && value && typeof value.lat === "number" && typeof value.lng === "number") {
    return { lat: value.lat, lng: value.lng }
  }
  return undefined
}

function mapDriverRow(row: DriverRow): DeliveryDriver {
  return {
    id: row.id?.toString() ?? "",
    name: row.name,
    phone: row.phone,
    email: row.email,
    isActive: Boolean(row.is_active ?? true),
    currentLocation: parseLatLng(row.current_location),
    lastUpdated: toISO(row.last_updated),
    currentOrderId: row.current_order_id != null ? Number(row.current_order_id) : null,
    rating: row.rating != null ? Number(row.rating) : undefined,
  }
}

function mapAssignmentRow(row: AssignmentRow): DeliveryAssignment {
  return {
    id: row.id?.toString() ?? "",
    orderId: Number(row.order_id),
    driverId: row.driver_id?.toString() ?? "",
    status: row.status as DeliveryAssignment["status"],
    assignedAt: toISO(row.assigned_at) ?? new Date().toISOString(),
    acceptedAt: toISO(row.accepted_at),
    completedAt: toISO(row.completed_at),
    startLocation: parseLatLng(row.start_location) ?? { lat: 0, lng: 0 },
    deliveryLocation: parseLatLng(row.delivery_location) ?? { lat: 0, lng: 0 },
    estimatedDistance: row.estimated_distance != null ? Number(row.estimated_distance) : undefined,
    estimatedDuration: row.estimated_duration != null ? Number(row.estimated_duration) : undefined,
  }
}

function ensureLatLngJSON(value: LatLng | undefined): string | null {
  if (!value) return null
  return JSON.stringify({ lat: Number(value.lat), lng: Number(value.lng) })
}

async function selectSingle<T = any>(query: string, params: any[]): Promise<T | null> {
  const rows = (await executeQuery(query, params)) as any[]
  return rows.length ? (rows[0] as T) : null
}

async function selectMany<T = any>(query: string, params: any[] = []): Promise<T[]> {
  return (await executeQuery(query, params)) as T[]
}

async function insertStatusUpdate(
  orderId: number,
  status: OrderStatus,
  note?: string,
  driverId?: string,
): Promise<void> {
  await executeQuery(
    `INSERT INTO order_status_updates (order_id, status, note, driver_id, timestamp)
     VALUES (?, ?, ?, ?, NOW())`,
    [orderId, status, note ?? null, driverId ?? null],
  )
}

async function notifyOrderStatus(orderId: number, status: OrderStatus): Promise<void> {
  const row = await selectSingle<{ user_id: string | number }>(
    "SELECT user_id FROM orders WHERE id = ?",
    [orderId],
  )

  if (row && row.user_id != null) {
    await NotificationService.notifyOrderStatusChange(orderId, status, row.user_id.toString())
  }
}

export const DriverService = {
  async getActiveDrivers(): Promise<DeliveryDriver[]> {
    const rows = await selectMany<DriverRow>(
      "SELECT * FROM delivery_drivers WHERE is_active = 1 ORDER BY name",
    )
    return rows.map(mapDriverRow)
  },

  async getDriverById(id: string): Promise<DeliveryDriver | null> {
    const row = await selectSingle<DriverRow>(
      "SELECT * FROM delivery_drivers WHERE id = ?",
      [id],
    )
    return row ? mapDriverRow(row) : null
  },

  async getDriverByUserId(userId: string): Promise<DeliveryDriver | null> {
    const row = await selectSingle<DriverRow>(
      "SELECT * FROM delivery_drivers WHERE user_id = ?",
      [userId],
    )
    return row ? mapDriverRow(row) : null
  },

  async updateDriverLocation(driverId: string, location: LatLng): Promise<boolean> {
    await executeQuery(
      `UPDATE delivery_drivers
         SET current_location = ?, last_updated = NOW()
       WHERE id = ?`,
      [ensureLatLngJSON(location), driverId],
    )
    return true
  },

  async createDriver(driver: Omit<DeliveryDriver, "id" | "created_at">): Promise<DeliveryDriver | null> {
    const result = (await executeQuery(
      `INSERT INTO delivery_drivers (name, phone, email, is_active, current_location, last_updated, current_order_id, rating)
       VALUES (?, ?, ?, ?, ?, NOW(), ?, ?)`
       ,
      [
        driver.name,
        driver.phone,
        driver.email,
        driver.isActive ? 1 : 0,
        ensureLatLngJSON(driver.currentLocation),
        driver.currentOrderId ?? null,
        driver.rating ?? null,
      ],
    )) as any

    const inserted = await selectSingle<DriverRow>(
      "SELECT * FROM delivery_drivers WHERE id = ?",
      [result.insertId],
    )
    return inserted ? mapDriverRow(inserted) : null
  },
}

export const DeliveryService = {
  async getPendingAssignments(): Promise<DeliveryAssignment[]> {
    const rows = await selectMany<AssignmentRow>(
      `SELECT * FROM delivery_assignments WHERE status = 'pending' ORDER BY assigned_at DESC`,
    )
    return rows.map(mapAssignmentRow)
  },

  async getDriverAssignments(driverId: string): Promise<DeliveryAssignment[]> {
    const rows = await selectMany<AssignmentRow>(
      `SELECT * FROM delivery_assignments WHERE driver_id = ? ORDER BY assigned_at DESC`,
      [driverId],
    )
    return rows.map(mapAssignmentRow)
  },

  async getAssignmentByOrderId(orderId: number): Promise<DeliveryAssignment | null> {
    const row = await selectSingle<AssignmentRow>(
      "SELECT * FROM delivery_assignments WHERE order_id = ?",
      [orderId],
    )
    return row ? mapAssignmentRow(row) : null
  },

  async createAssignment(
    orderId: number,
    driverId: string,
    startLocation: LatLng,
    deliveryLocation: LatLng,
  ): Promise<DeliveryAssignment | null> {
    try {
      const { distance, duration } = await calculateDistance(startLocation, deliveryLocation)
      const distanceKm = distance / 1000

      const insertResult = (await executeQuery(
        `INSERT INTO delivery_assignments (
            order_id,
            driver_id,
            status,
            start_location,
            delivery_location,
            estimated_distance,
            estimated_duration,
            assigned_at
          ) VALUES (?, ?, 'pending', ?, ?, ?, ?, NOW())`,
        [
          orderId,
          driverId,
          ensureLatLngJSON(startLocation),
          ensureLatLngJSON(deliveryLocation),
          distanceKm,
          duration,
        ],
      )) as any

      await executeTransaction([
        {
          query: "UPDATE orders SET status = ? WHERE id = ?",
          params: ["asignado_repartidor", orderId],
        },
        {
          query: `INSERT INTO order_status_updates (order_id, status, driver_id, timestamp)
                  VALUES (?, ?, ?, NOW())`,
          params: [orderId, "asignado_repartidor", driverId],
        },
      ])

      await notifyOrderStatus(orderId, "asignado_repartidor")

      const inserted = await selectSingle<AssignmentRow>(
        "SELECT * FROM delivery_assignments WHERE id = ?",
        [insertResult.insertId],
      )
      return inserted ? mapAssignmentRow(inserted) : null
    } catch (error) {
      console.error("Error al crear asignación:", error)
      return null
    }
  },

  async acceptAssignment(assignmentId: string, driverId: string): Promise<boolean> {
    try {
      const assignment = await selectSingle<{ order_id: number }>(
        "SELECT order_id FROM delivery_assignments WHERE id = ?",
        [assignmentId],
      )
      if (!assignment) return false

      await executeTransaction([
        {
          query: `UPDATE delivery_assignments
                    SET status = 'accepted', accepted_at = NOW()
                  WHERE id = ?`,
          params: [assignmentId],
        },
        {
          query: "UPDATE delivery_drivers SET current_order_id = ? WHERE id = ?",
          params: [assignment.order_id, driverId],
        },
        {
          query: `INSERT INTO order_status_updates (order_id, status, driver_id, note, timestamp)
                  VALUES (?, 'asignado_repartidor', ?, ?, NOW())`,
          params: [assignment.order_id, driverId, "Repartidor aceptó el pedido"],
        },
      ])

      await notifyOrderStatus(assignment.order_id, "asignado_repartidor")
      return true
    } catch (error) {
      console.error("Error al aceptar asignación:", error)
      return false
    }
  },

  async rejectAssignment(assignmentId: string, driverId: string): Promise<boolean> {
    try {
      const assignment = await selectSingle<{ order_id: number }>(
        "SELECT order_id FROM delivery_assignments WHERE id = ?",
        [assignmentId],
      )
      if (!assignment) return false

      await executeTransaction([
        {
          query: "UPDATE delivery_assignments SET status = 'rejected' WHERE id = ?",
          params: [assignmentId],
        },
        {
          query: `INSERT INTO order_status_updates (order_id, status, driver_id, note, timestamp)
                  VALUES (?, 'listo_para_recoger', ?, ?, NOW())`,
          params: [assignment.order_id, driverId, "Repartidor rechazó el pedido"],
        },
      ])

      await notifyOrderStatus(assignment.order_id, "listo_para_recoger")
      return true
    } catch (error) {
      console.error("Error al rechazar asignación:", error)
      return false
    }
  },

  async startDelivery(assignmentId: string, driverId: string): Promise<boolean> {
    try {
      const assignment = await selectSingle<{ order_id: number }>(
        "SELECT order_id FROM delivery_assignments WHERE id = ?",
        [assignmentId],
      )
      if (!assignment) return false

      await executeTransaction([
        {
          query: "UPDATE orders SET status = 'en_camino' WHERE id = ?",
          params: [assignment.order_id],
        },
        {
          query: `INSERT INTO order_status_updates (order_id, status, driver_id, timestamp)
                  VALUES (?, 'en_camino', ?, NOW())`,
          params: [assignment.order_id, driverId],
        },
      ])

      await notifyOrderStatus(assignment.order_id, "en_camino")
      return true
    } catch (error) {
      console.error("Error al iniciar entrega:", error)
      return false
    }
  },

  async completeDelivery(assignmentId: string, driverId: string): Promise<boolean> {
    try {
      const assignment = await selectSingle<{ order_id: number }>(
        "SELECT order_id FROM delivery_assignments WHERE id = ?",
        [assignmentId],
      )
      if (!assignment) return false

      await executeTransaction([
        {
          query: `UPDATE delivery_assignments
                    SET status = 'completed', completed_at = NOW()
                  WHERE id = ?`,
          params: [assignmentId],
        },
        {
          query: "UPDATE orders SET status = 'entregado' WHERE id = ?",
          params: [assignment.order_id],
        },
        {
          query: "UPDATE delivery_drivers SET current_order_id = NULL WHERE id = ?",
          params: [driverId],
        },
        {
          query: `INSERT INTO order_status_updates (order_id, status, driver_id, timestamp)
                  VALUES (?, 'entregado', ?, NOW())`,
          params: [assignment.order_id, driverId],
        },
      ])

      await notifyOrderStatus(assignment.order_id, "entregado")
      return true
    } catch (error) {
      console.error("Error al completar entrega:", error)
      return false
    }
  },

  async findNearestDriver(location: LatLng): Promise<DeliveryDriver | null> {
    try {
      const rows = await selectMany<DriverRow>(
        `SELECT *
           FROM delivery_drivers
          WHERE is_active = 1 AND ${DRIVER_FREE_CONDITION}`,
      )

      let nearest: DriverRow | null = null
      let shortest = Number.POSITIVE_INFINITY

      for (const row of rows) {
        const driverLocation = parseLatLng(row.current_location)
        if (!driverLocation) continue

        try {
          const { distance } = await calculateDistance(location, driverLocation)
          if (distance < shortest) {
            shortest = distance
            nearest = row
          }
        } catch (error) {
          console.error("Error al calcular distancia con repartidor", error)
        }
      }

      return nearest ? mapDriverRow(nearest) : null
    } catch (error) {
      console.error("Error al buscar repartidor cercano:", error)
      return null
    }
  },

  async autoAssignDriver(orderId: number, deliveryAddress: string): Promise<boolean> {
    try {
      const restaurantLocation: LatLng = { lat: 22.1565, lng: -100.9855 }
      const deliveryLocation = await geocodeAddress(deliveryAddress)

      await executeQuery(
        "UPDATE orders SET delivery_coordinates = ?, updated_at = NOW() WHERE id = ?",
        [ensureLatLngJSON(deliveryLocation), orderId],
      )

      const driver = await DeliveryService.findNearestDriver(restaurantLocation)
      if (!driver) return false

      const assignment = await DeliveryService.createAssignment(
        orderId,
        driver.id,
        restaurantLocation,
        deliveryLocation,
      )

      return Boolean(assignment)
    } catch (error) {
      console.error("Error al asignar repartidor automáticamente:", error)
      return false
    }
  },
}

export const NotificationService = {
  async createNotification(
    userId: string,
    type: string,
    title: string,
    message: string,
    data?: any,
  ): Promise<boolean> {
    await executeQuery(
      `INSERT INTO notifications (user_id, type, title, message, data, read, created_at)
       VALUES (?, ?, ?, ?, ?, 0, NOW())`,
      [userId, type, title, message, data ? JSON.stringify(data) : null],
    )
    return true
  },

  async getUserNotifications(userId: string): Promise<any[]> {
    const rows = await selectMany(
      `SELECT * FROM notifications WHERE user_id = ? ORDER BY id DESC`,
      [userId],
    )
    return rows
  },

  async markAsRead(notificationId: string): Promise<boolean> {
    await executeQuery(
      "UPDATE notifications SET read = 1, read_at = NOW() WHERE id = ?",
      [notificationId],
    )
    return true
  },

  async notifyOrderStatusChange(orderId: number, status: OrderStatus, userId: string): Promise<boolean> {
    let title = ""
    let message = ""

    switch (status) {
      case "preparando":
        title = "¡Tu pedido está en preparación!"
        message = `El pedido #${orderId} está siendo preparado por nuestro equipo.`
        break
      case "listo_para_recoger":
        title = "¡Tu pedido está listo!"
        message = `El pedido #${orderId} está listo para ser recogido por un repartidor.`
        break
      case "asignado_repartidor":
        title = "¡Repartidor asignado!"
        message = `Un repartidor ha sido asignado a tu pedido #${orderId}.`
        break
      case "en_camino":
        title = "¡Tu pedido está en camino!"
        message = `El pedido #${orderId} está en camino a tu dirección.`
        break
      case "entregado":
        title = "¡Pedido entregado!"
        message = `El pedido #${orderId} ha sido entregado. ¡Buen provecho!`
        break
      default:
        title = `Actualización de pedido #${orderId}`
        message = `El estado de tu pedido ha cambiado a: ${status}`
    }

    await NotificationService.createNotification(userId, "order_status", title, message, {
      orderId,
      status,
    })
    return true
  },
}

export const OrderStatusService = {
  async updateOrderStatus(
    orderId: number,
    status: OrderStatus,
    note?: string,
    driverId?: string,
  ): Promise<boolean> {
    try {
      await executeTransaction([
        {
          query: "UPDATE orders SET status = ? WHERE id = ?",
          params: [status, orderId],
        },
        {
          query: `INSERT INTO order_status_updates (order_id, status, note, driver_id, timestamp)
                  VALUES (?, ?, ?, ?, NOW())`,
          params: [orderId, status, note ?? null, driverId ?? null],
        },
      ])

      await notifyOrderStatus(orderId, status)
      return true
    } catch (error) {
      console.error("Error al actualizar estado del pedido:", error)
      return false
    }
  },

  async getOrderStatusHistory(orderId: number): Promise<any[]> {
    const rows = await selectMany(
      `SELECT osu.*, dd.name as driver_name
         FROM order_status_updates osu
         LEFT JOIN delivery_drivers dd ON osu.driver_id = dd.id
        WHERE osu.order_id = ?
        ORDER BY osu.timestamp ASC`,
      [orderId],
    )

    return rows.map((row: any) => ({
      ...row,
      driver_id: row.driver_id ?? null,
      timestamp: toISO(row.timestamp),
      delivery_drivers: row.driver_name ? { name: row.driver_name } : null,
    }))
  },
}
