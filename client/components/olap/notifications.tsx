'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { X, AlertCircle, CheckCircle, InfoIcon } from 'lucide-react'

interface Notification {
  id: string
  type: 'error' | 'success' | 'info'
  message: string
  timestamp: string
  read: boolean
}

export function Notifications() {
  const [notifications, setNotifications] = useState<Notification[]>([])

  useEffect(() => {
    let isMounted = true

    const loadNotifications = async () => {
      try {
        const response = await fetch('/api/notifications', { cache: 'no-store' })
        const payload = await response.json()
        if (!response.ok || !payload?.success) {
          throw new Error(payload?.error || 'Failed to load notifications')
        }

        if (isMounted) {
          setNotifications(Array.isArray(payload.data) ? payload.data : [])
        }
      } catch (_error) {
        if (isMounted) {
          setNotifications([])
        }
      }
    }

    loadNotifications()
    const interval = setInterval(loadNotifications, 30000)

    return () => {
      isMounted = false
      clearInterval(interval)
    }
  }, [])

  const removeNotification = async (id: string) => {
    const previous = notifications
    setNotifications(notifications.filter((n) => n.id !== id))

    try {
      const response = await fetch(`/api/notifications/${id}`, { method: 'DELETE' })
      const payload = await response.json()
      if (!response.ok || !payload?.success) {
        throw new Error(payload?.error || 'Failed to delete notification')
      }
    } catch (_error) {
      setNotifications(previous)
    }
  }

  const getIcon = (type: string) => {
    switch (type) {
      case 'error':
        return <AlertCircle className="h-4 w-4 text-destructive" />
      case 'success':
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case 'info':
      default:
        return <InfoIcon className="h-4 w-4 text-blue-500" />
    }
  }

  const getTimeDiff = (timestamp: string) => {
    const now = new Date()
    const notifyTime = new Date(timestamp)
    const diffMs = now.getTime() - notifyTime.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    
    if (diffMins < 1) return 'Just now'
    if (diffMins < 60) return `${diffMins}m ago`
    const diffHours = Math.floor(diffMins / 60)
    if (diffHours < 24) return `${diffHours}h ago`
    return new Date(timestamp).toLocaleDateString()
  }

  if (notifications.length === 0) return null

  return (
    <div className="fixed bottom-4 right-4 space-y-2 max-w-sm z-50">
      {notifications.map(notification => (
        <Card
          key={notification.id}
          className={`border-l-4 transition-all hover:shadow-lg ${
            notification.type === 'error'
              ? 'border-l-destructive bg-destructive/10'
              : notification.type === 'success'
              ? 'border-l-green-500 bg-green-500/10'
              : 'border-l-blue-500 bg-blue-500/10'
          }`}
        >
          <CardContent className="pt-4 pb-4 flex items-start gap-3">
            <div className="mt-0.5">
              {getIcon(notification.type)}
            </div>
            <div className="flex-1">
              <p className="text-sm text-foreground">{notification.message}</p>
              <p className="text-xs text-muted-foreground mt-1">
                {getTimeDiff(notification.timestamp)}
              </p>
            </div>
            <button
              onClick={() => removeNotification(notification.id)}
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
