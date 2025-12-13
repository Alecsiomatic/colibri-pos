'use client'

import { useEffect } from 'react'
import { X, CheckCircle, AlertCircle, Info, AlertTriangle, Bell } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { useNotifications } from '@/hooks/use-notifications'

const iconMap = {
  success: CheckCircle,
  error: AlertCircle,
  warning: AlertTriangle,
  info: Info,
}

const colorMap = {
  success: 'bg-green-50 border-green-200 text-green-800 dark:bg-green-950 dark:border-green-800 dark:text-green-200',
  error: 'bg-red-50 border-red-200 text-red-800 dark:bg-red-950 dark:border-red-800 dark:text-red-200',
  warning: 'bg-yellow-50 border-yellow-200 text-yellow-800 dark:bg-yellow-950 dark:border-yellow-800 dark:text-yellow-200',
  info: 'bg-blue-50 border-blue-200 text-blue-800 dark:bg-blue-950 dark:border-blue-800 dark:text-blue-200',
}

export function NotificationToast() {
  const { notifications, removeNotification } = useNotifications()

  // Solo mostrar las primeras 3 notificaciones no leídas
  const visibleNotifications = notifications
    .filter(n => !n.read)
    .slice(0, 3)

  if (visibleNotifications.length === 0) {
    return null
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 space-y-2 max-w-sm">
      {visibleNotifications.map((notification) => {
        const Icon = iconMap[notification.type]
        
        return (
          <div
            key={notification.id}
            className={cn(
              'p-4 rounded-lg border shadow-lg transition-all duration-300 animate-in slide-in-from-right',
              colorMap[notification.type]
            )}
          >
            <div className="flex items-start space-x-3">
              <Icon className="h-5 w-5 flex-shrink-0 mt-0.5" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium">
                  {notification.title}
                </p>
                {notification.message && (
                  <p className="text-sm opacity-90 mt-1">
                    {notification.message}
                  </p>
                )}
                {notification.action && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="mt-2 h-auto p-0 text-xs"
                    onClick={notification.action.onClick}
                  >
                    {notification.action.label}
                  </Button>
                )}
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="h-auto p-0 hover:bg-transparent"
                onClick={() => removeNotification(notification.id)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )
      })}
    </div>
  )
}

export function NotificationCenter() {
  const { notifications, markAsRead, markAllAsRead, removeNotification, clearAll } = useNotifications()

  if (notifications.length === 0) {
    return (
      <div className="p-6 text-center text-muted-foreground">
        <Bell className="h-12 w-12 mx-auto mb-3 opacity-50" />
        <p>No tienes notificaciones</p>
      </div>
    )
  }

  return (
    <div className="max-w-md">
      <div className="flex items-center justify-between p-4 border-b">
        <h3 className="font-semibold">Notificaciones</h3>
        <div className="flex space-x-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={markAllAsRead}
            className="text-xs"
          >
            Marcar todas como leídas
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={clearAll}
            className="text-xs"
          >
            Limpiar todo
          </Button>
        </div>
      </div>
      
      <div className="max-h-96 overflow-y-auto">
        {notifications.map((notification) => {
          const Icon = iconMap[notification.type]
          
          return (
            <div
              key={notification.id}
              className={cn(
                'p-4 border-b hover:bg-muted/50 transition-colors',
                !notification.read && 'bg-muted/20'
              )}
            >
              <div className="flex items-start space-x-3">
                <Icon className={cn(
                  'h-5 w-5 flex-shrink-0 mt-0.5',
                  notification.type === 'success' && 'text-green-600 dark:text-green-400',
                  notification.type === 'error' && 'text-red-600 dark:text-red-400',
                  notification.type === 'warning' && 'text-yellow-600 dark:text-yellow-400',
                  notification.type === 'info' && 'text-blue-600 dark:text-blue-400'
                )} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <p className={cn(
                      'text-sm font-medium',
                      !notification.read && 'font-semibold'
                    )}>
                      {notification.title}
                    </p>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-auto p-0"
                      onClick={() => removeNotification(notification.id)}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                  {notification.message && (
                    <p className="text-sm text-muted-foreground mt-1">
                      {notification.message}
                    </p>
                  )}
                  <p className="text-xs text-muted-foreground mt-2">
                    {notification.timestamp.toLocaleString()}
                  </p>
                  <div className="flex items-center justify-between mt-2">
                    {notification.action && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-xs"
                        onClick={notification.action.onClick}
                      >
                        {notification.action.label}
                      </Button>
                    )}
                    {!notification.read && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-xs ml-auto"
                        onClick={() => markAsRead(notification.id)}
                      >
                        Marcar como leída
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}