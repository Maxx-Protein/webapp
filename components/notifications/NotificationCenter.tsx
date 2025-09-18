import React, { useState, useEffect, useCallback } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { Card, CardContent } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { 
  Bell, 
  X, 
  Check, 
  Clock,
  CheckCircle,
  XCircle,
  DollarSign
} from 'lucide-react'
import { formatDate } from '@/lib/utils'

interface Notification {
  id: string
  type: string
  title: string
  message: string
  data?: Record<string, unknown>
  read: boolean
  created_at: string
}

interface NotificationCenterProps {
  onClose?: () => void
}

export function NotificationCenter({ onClose }: NotificationCenterProps) {
  const { user } = useAuth()
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'unread' | 'read'>('all')

  useEffect(() => {
    if (user) {
      fetchNotifications()
      // Set up polling for real-time updates
      const interval = setInterval(fetchNotifications, 30000) // Poll every 30 seconds
      return () => clearInterval(interval)
    }
  }, [user])

  const fetchNotifications = useCallback(async () => {
    try {
      // Remove Authorization header - let Supabase handle auth through cookies
      const response = await fetch('/api/notifications/list')

      if (response.ok) {
        const data = await response.json()
        setNotifications(data.notifications || [])
      }
    } catch (error) {
      console.error('Failed to fetch notifications:', error)
    } finally {
      setLoading(false)
    }
  }, [])

  const markAsRead = async (notificationId: string) => {
    try {
      // Remove Authorization header - let Supabase handle auth through cookies
      const response = await fetch('/api/notifications/mark-read', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ notificationId })
      })

      if (response.ok) {
        setNotifications(prev => 
          prev.map(n => n.id === notificationId ? { ...n, read: true } : n)
        )
      }
    } catch (error) {
      console.error('Failed to mark notification as read:', error)
    }
  }

  const markAllAsRead = async () => {
    try {
      // Remove Authorization header - let Supabase handle auth through cookies
      const response = await fetch('/api/notifications/mark-all-read', {
        method: 'POST'
      })

      if (response.ok) {
        setNotifications(prev => prev.map(n => ({ ...n, read: true })))
      }
    } catch (error) {
      console.error('Failed to mark all notifications as read:', error)
    }
  }

  const deleteNotification = async (notificationId: string) => {
    try {
      // Remove Authorization header - let Supabase handle auth through cookies
      const response = await fetch('/api/notifications/delete', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ notificationId })
      })

      if (response.ok) {
        setNotifications(prev => prev.filter(n => n.id !== notificationId))
      }
    } catch (error) {
      console.error('Failed to delete notification:', error)
    }
  }

  const getNotificationIcon = (type: string) => {
    const iconMap = {
      report_approved: CheckCircle,
      report_rejected: XCircle,
      payment_proof_uploaded: DollarSign,
      payment_proof_approved: CheckCircle,
      payment_proof_rejected: XCircle,
      payment_cleared: Clock,
      general: Bell,
      default: Bell
    }
    
    const Icon = iconMap[type as keyof typeof iconMap] || iconMap.default
    return <Icon className="w-5 h-5" />
  }

  const getNotificationColor = (type: string) => {
    const colorMap = {
      report_approved: 'text-green-600',
      report_rejected: 'text-red-600',
      payment_proof_uploaded: 'text-blue-600',
      payment_proof_approved: 'text-green-600',
      payment_proof_rejected: 'text-red-600',
      payment_cleared: 'text-yellow-600',
      general: 'text-gray-600',
      default: 'text-gray-600'
    }
    
    return colorMap[type as keyof typeof colorMap] || colorMap.default
  }

  const filteredNotifications = notifications.filter(notification => {
    if (filter === 'unread') return !notification.read
    if (filter === 'read') return notification.read
    return true
  })

  const unreadCount = notifications.filter(n => !n.read).length

  if (loading) {
    return (
      <Card className="w-96 max-h-96">
        <CardContent className="p-4">
          <div className="flex items-center justify-center h-32">
            <Clock className="w-6 h-6 animate-spin text-blue-600" />
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="w-96 max-h-96 shadow-lg">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b">
        <div className="flex items-center gap-2">
          <Bell className="w-5 h-5 text-blue-600" />
          <h3 className="font-semibold text-gray-900 dark:text-white">
            Notifications
          </h3>
          {unreadCount > 0 && (
            <Badge className="bg-red-100 text-red-800">
              {unreadCount}
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-2">
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={markAllAsRead}
              title="Mark all as read"
            >
              <Check className="w-4 h-4" />
            </Button>
          )}
          {onClose && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
            >
              <X className="w-4 h-4" />
            </Button>
          )}
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex border-b">
        {(['all', 'unread', 'read'] as const).map(filterType => (
          <button
            key={filterType}
            onClick={() => setFilter(filterType)}
            className={`flex-1 px-4 py-2 text-sm font-medium capitalize transition-colors ${
              filter === filterType
                ? 'text-blue-600 bg-blue-50 dark:bg-blue-900/20 border-b-2 border-blue-600'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            {filterType}
            {filterType === 'unread' && unreadCount > 0 && (
              <span className="ml-1 text-xs">({unreadCount})</span>
            )}
          </button>
        ))}
      </div>

      {/* Notifications List */}
      <CardContent className="p-0">
        <div className="max-h-64 overflow-y-auto">
          {filteredNotifications.length === 0 ? (
            <div className="text-center py-8">
              <Bell className="w-8 h-8 text-gray-400 mx-auto mb-2" />
              <p className="text-gray-500 dark:text-gray-400">
                {filter === 'unread' 
                  ? 'No unread notifications'
                  : filter === 'read'
                  ? 'No read notifications'
                  : 'No notifications yet'}
              </p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200 dark:divide-gray-700">
              {filteredNotifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`p-4 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors ${
                    !notification.read ? 'bg-blue-50 dark:bg-blue-900/10' : ''
                  }`}
                >
                  <div className="flex items-start gap-3">
                    {/* Icon */}
                    <div className={`flex-shrink-0 ${getNotificationColor(notification.type)}`}>
                      {getNotificationIcon(notification.type)}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1">
                          <h4 className={`text-sm font-medium ${
                            !notification.read 
                              ? 'text-gray-900 dark:text-white' 
                              : 'text-gray-700 dark:text-gray-300'
                          }`}>
                            {notification.title}
                          </h4>
                          <p className={`text-sm mt-1 ${
                            !notification.read
                              ? 'text-gray-700 dark:text-gray-300'
                              : 'text-gray-500 dark:text-gray-400'
                          }`}>
                            {notification.message}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                            {formatDate(notification.created_at)}
                          </p>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-1">
                          {!notification.read && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => markAsRead(notification.id)}
                              title="Mark as read"
                            >
                              <Check className="w-3 h-3" />
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => deleteNotification(notification.id)}
                            title="Delete notification"
                          >
                            <X className="w-3 h-3" />
                          </Button>
                        </div>
                      </div>

                      {/* Additional Data */}
                      {notification.data && notification.data.reportId && (
                        <div className="mt-2 text-xs text-blue-600 dark:text-blue-400">
                          Report ID: {String(notification.data.reportId)}
                        </div>
                      )}
                    </div>

                    {/* Unread Indicator */}
                    {!notification.read && (
                      <div className="w-2 h-2 bg-blue-600 rounded-full flex-shrink-0 mt-2" />
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </CardContent>

      {/* Footer */}
      {filteredNotifications.length > 0 && (
        <div className="p-4 border-t text-center">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              // Navigate to full notifications page
              window.location.href = '/notifications'
            }}
            className="text-blue-600 hover:text-blue-700"
          >
            View All Notifications
          </Button>
        </div>
      )}
    </Card>
  )
}

// Hook for managing notification state
export function useNotifications() {
  const { user } = useAuth()
  const [unreadCount, setUnreadCount] = useState(0)
  const [latestNotifications, setLatestNotifications] = useState<Notification[]>([])

  const fetchUnreadCount = useCallback(async () => {
    if (!user) return

    try {
      // Remove Authorization header - let Supabase handle auth through cookies
      const response = await fetch('/api/notifications/unread-count')

      if (response.ok) {
        const data = await response.json()
        setUnreadCount(data.count || 0)
      }
    } catch (error) {
      console.error('Failed to fetch unread count:', error)
    }
  }, [user])

  const fetchLatestNotifications = useCallback(async (limit = 5) => {
    if (!user) return

    try {
      // Remove Authorization header - let Supabase handle auth through cookies
      const response = await fetch(`/api/notifications/latest?limit=${limit}`)

      if (response.ok) {
        const data = await response.json()
        setLatestNotifications(data.notifications || [])
      }
    } catch (error) {
      console.error('Failed to fetch latest notifications:', error)
    }
  }, [user])

  useEffect(() => {
    if (user) {
      fetchUnreadCount()
      fetchLatestNotifications()
      
      // Set up polling
      const interval = setInterval(() => {
        fetchUnreadCount()
        fetchLatestNotifications()
      }, 30000) // Poll every 30 seconds

      return () => clearInterval(interval)
    }
  }, [user, fetchUnreadCount, fetchLatestNotifications])

  return {
    unreadCount,
    latestNotifications,
    refresh: () => {
      fetchUnreadCount()
      fetchLatestNotifications()
    }
  }
}