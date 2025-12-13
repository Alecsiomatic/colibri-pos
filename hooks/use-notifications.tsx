'use client'

import { createContext, useContext, useEffect, useState, ReactNode } from 'react'

interface Notification {
  id: string
  title: string
  message: string
  type: 'info' | 'success' | 'warning' | 'error'
  timestamp: Date
  read: boolean
  action?: {
    label: string
    onClick: () => void
  }
}

interface NotificationContextType {
  notifications: Notification[]
  unreadCount: number
  addNotification: (notification: Omit<Notification, 'id' | 'timestamp' | 'read'>) => void
  markAsRead: (id: string) => void
  markAllAsRead: () => void
  removeNotification: (id: string) => void
  clearAll: () => void
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined)

export function NotificationProvider({ children }: { children: ReactNode }) {
  const [notifications, setNotifications] = useState<Notification[]>([])

  // Cargar notificaciones del localStorage al iniciar
  useEffect(() => {
    const savedNotifications = localStorage.getItem('notifications')
    if (savedNotifications) {
      try {
        const parsed = JSON.parse(savedNotifications)
        setNotifications(parsed.map((n: any) => ({
          ...n,
          timestamp: new Date(n.timestamp)
        })))
      } catch (error) {
        console.error('Error cargando notificaciones:', error)
      }
    }
  }, [])

  // Guardar notificaciones en localStorage cuando cambien
  useEffect(() => {
    localStorage.setItem('notifications', JSON.stringify(notifications))
  }, [notifications])

  const addNotification = (notification: Omit<Notification, 'id' | 'timestamp' | 'read'>) => {
    // Evitar duplicados del mismo título y tipo en los últimos 5 segundos
    const now = new Date()
    const recentDuplicate = notifications.find(n => 
      n.title === notification.title && 
      n.type === notification.type &&
      (now.getTime() - n.timestamp.getTime()) < 5000
    )

    if (recentDuplicate) {
      console.log('Evitando notificación duplicada:', notification.title)
      return
    }

    const newNotification: Notification = {
      ...notification,
      id: crypto.randomUUID(),
      timestamp: new Date(),
      read: false
    }

    setNotifications(current => [newNotification, ...current])

    // Auto-remove success notifications after 5 seconds
    if (notification.type === 'success') {
      setTimeout(() => {
        removeNotification(newNotification.id)
      }, 5000)
    }
    
    // Auto-remove error notifications after 10 seconds
    if (notification.type === 'error') {
      setTimeout(() => {
        removeNotification(newNotification.id)
      }, 10000)
    }
  }

  const markAsRead = (id: string) => {
    setNotifications(current =>
      current.map(notification =>
        notification.id === id
          ? { ...notification, read: true }
          : notification
      )
    )
  }

  const markAllAsRead = () => {
    setNotifications(current =>
      current.map(notification => ({ ...notification, read: true }))
    )
  }

  const removeNotification = (id: string) => {
    setNotifications(current =>
      current.filter(notification => notification.id !== id)
    )
  }

  const clearAll = () => {
    setNotifications([])
  }

  const unreadCount = notifications.filter(n => !n.read).length

  return (
    <NotificationContext.Provider value={{
      notifications,
      unreadCount,
      addNotification,
      markAsRead,
      markAllAsRead,
      removeNotification,
      clearAll
    }}>
      {children}
    </NotificationContext.Provider>
  )
}

export function useNotifications() {
  const context = useContext(NotificationContext)
  if (context === undefined) {
    throw new Error('useNotifications must be used within a NotificationProvider')
  }
  return context
}

// Hook para notificaciones toast rápidas
export function useToast() {
  const { addNotification } = useNotifications()

  const toast = {
    success: (title: string, message?: string) => {
      addNotification({
        title,
        message: message || '',
        type: 'success'
      })
    },
    error: (title: string, message?: string) => {
      addNotification({
        title,
        message: message || '',
        type: 'error'
      })
    },
    warning: (title: string, message?: string) => {
      addNotification({
        title,
        message: message || '',
        type: 'warning'
      })
    },
    info: (title: string, message?: string) => {
      addNotification({
        title,
        message: message || '',
        type: 'info'
      })
    }
  }

  return toast
}