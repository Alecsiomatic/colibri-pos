"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { Bell } from "lucide-react"

export default function NotificationBell() {
  const [notifications, setNotifications] = useState<any[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [showDropdown, setShowDropdown] = useState(false)
  const supabase = createClient()

  useEffect(() => {
    // Cargar notificaciones al montar el componente
    loadNotifications()

    // Suscribirse a nuevas notificaciones
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_IN" && session) {
        loadNotifications()
      } else if (event === "SIGNED_OUT") {
        setNotifications([])
        setUnreadCount(0)
      }
    })

    // Suscribirse a cambios en la tabla de notificaciones
    const notificationSubscription = supabase
      .channel("notifications-channel")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "notifications",
        },
        (payload) => {
          // Verificar si la notificación es para el usuario actual
          checkAndAddNotification(payload.new)
        },
      )
      .subscribe()

    return () => {
      subscription.unsubscribe()
      notificationSubscription.unsubscribe()
    }
  }, [supabase])

  const loadNotifications = async () => {
    try {
      // Verificar si hay un usuario autenticado
      const {
        data: { session },
      } = await supabase.auth.getSession()

      if (!session) return

      // Obtener notificaciones del usuario
      const { data } = await supabase
        .from("notifications")
        .select("*")
        .eq("user_id", session.user.id)
        .order("timestamp", { ascending: false })
        .limit(10)

      if (data) {
        setNotifications(data)
        setUnreadCount(data.filter((n) => !n.read).length)
      }
    } catch (error) {
      console.error("Error al cargar notificaciones:", error)
    }
  }

  const checkAndAddNotification = async (notification: any) => {
    try {
      // Verificar si hay un usuario autenticado
      const {
        data: { session },
      } = await supabase.auth.getSession()

      if (!session) return

      // Verificar si la notificación es para el usuario actual
      if (notification.user_id === session.user.id) {
        setNotifications((prev) => [notification, ...prev.slice(0, 9)])
        setUnreadCount((prev) => prev + 1)

        // Mostrar notificación del navegador
        if (Notification.permission === "granted") {
          new Notification(notification.title, {
            body: notification.message,
          })
        }
      }
    } catch (error) {
      console.error("Error al procesar nueva notificación:", error)
    }
  }

  const markAsRead = async (notificationId: string) => {
    try {
      const { error } = await supabase.from("notifications").update({ read: true }).eq("id", notificationId)

      if (!error) {
        setNotifications((prev) => prev.map((n) => (n.id === notificationId ? { ...n, read: true } : n)))
        setUnreadCount((prev) => Math.max(0, prev - 1))
      }
    } catch (error) {
      console.error("Error al marcar notificación como leída:", error)
    }
  }

  const markAllAsRead = async () => {
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession()

      if (!session) return

      const { error } = await supabase
        .from("notifications")
        .update({ read: true })
        .eq("user_id", session.user.id)
        .eq("read", false)

      if (!error) {
        setNotifications((prev) => prev.map((n) => ({ ...n, read: true })))
        setUnreadCount(0)
      }
    } catch (error) {
      console.error("Error al marcar todas las notificaciones como leídas:", error)
    }
  }

  const toggleDropdown = () => {
    setShowDropdown(!showDropdown)
  }

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.round(diffMs / 60000)
    const diffHours = Math.round(diffMs / 3600000)
    const diffDays = Math.round(diffMs / 86400000)

    if (diffMins < 60) {
      return `Hace ${diffMins} ${diffMins === 1 ? "minuto" : "minutos"}`
    } else if (diffHours < 24) {
      return `Hace ${diffHours} ${diffHours === 1 ? "hora" : "horas"}`
    } else {
      return `Hace ${diffDays} ${diffDays === 1 ? "día" : "días"}`
    }
  }

  return (
    <div className="relative">
      <button
        onClick={toggleDropdown}
        className="relative p-2 rounded-full hover:bg-amber-100 transition-colors"
        aria-label="Notificaciones"
      >
        <Bell className="h-5 w-5 text-amber-900" />
        {unreadCount > 0 && (
          <span className="absolute top-0 right-0 bg-red-500 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {showDropdown && (
        <div className="absolute right-0 mt-2 w-80 bg-white rounded-md shadow-lg overflow-hidden z-50">
          <div className="p-3 bg-amber-50 border-b border-amber-200 flex justify-between items-center">
            <h3 className="font-medium text-amber-900">Notificaciones</h3>
            {unreadCount > 0 && (
              <button onClick={markAllAsRead} className="text-xs text-amber-700 hover:text-amber-900 transition-colors">
                Marcar todas como leídas
              </button>
            )}
          </div>

          <div className="max-h-96 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="p-4 text-center text-amber-700">No tienes notificaciones</div>
            ) : (
              <ul>
                {notifications.map((notification) => (
                  <li
                    key={notification.id}
                    className={`border-b border-amber-100 last:border-b-0 ${!notification.read ? "bg-amber-50" : ""}`}
                  >
                    <button
                      onClick={() => markAsRead(notification.id)}
                      className="p-3 w-full text-left hover:bg-amber-50 transition-colors"
                    >
                      <div className="flex justify-between items-start">
                        <h4 className="font-medium text-amber-900">{notification.title}</h4>
                        <span className="text-xs text-amber-700">{formatTime(notification.timestamp)}</span>
                      </div>
                      <p className="text-sm text-amber-800 mt-1">{notification.message}</p>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
