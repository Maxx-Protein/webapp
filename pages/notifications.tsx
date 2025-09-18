import React, { useState, useEffect } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { Layout } from '@/components/layout/Layout'
import { Card, CardContent } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { 
  Bell, 
  Check, 
  CheckCheck,
  X,
  Clock,
  CheckCircle,
  XCircle,
  DollarSign,
  FileText,
  ArrowLeft
} from 'lucide-react'
import { formatDate } from '@/lib/utils'
import { useRouter } from 'next/router'

interface Notification {
  id: string
  type: string
  title: string
  message: string
  data?: Record<string, unknown>
  read: boolean
  created_at: string
}

export default function NotificationsPage() {
  const { user } = useAuth()
  const router = useRouter()
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'unread' | 'read'>('all')

  useEffect(() => {
    if (user) {
      fetchNotifications()
    }
  }, [user])

  const fetchNotifications = async () => {
    try {
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
  }

  const markAsRead = async (notificationId: string) => {
    try {
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
      <Layout>
        <div className="container mx-auto py-8">
          <div className="flex items-center justify-center h-64">
            <Clock className="w-8 h-8 animate-spin text-blue-600" />
          </div>
        </div>
      </Layout>
    )
  }

  return (
    <Layout>
      <div className="container mx-auto py-8 px-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              onClick={() => router.back()}
              className="p-2"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div className="flex items-center gap-3">
              <Bell className="w-8 h-8 text-blue-600" />
              <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                  Notifications
                </h1>
                <p className="text-gray-600 dark:text-gray-400">
                  {unreadCount > 0 
                    ? `${unreadCount} unread notification${unreadCount !== 1 ? 's' : ''}`
                    : 'All caught up!'
                  }
                </p>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2">
            {unreadCount > 0 && (
              <Button
                variant="secondary"
                size="sm"
                onClick={markAllAsRead}
              >
                <CheckCheck className="w-4 h-4 mr-2" />
                Mark All Read
              </Button>
            )}
          </div>
        </div>

        <Card>
          {/* Filter Tabs */}
          <div className="flex border-b">
            {(['all', 'unread', 'read'] as const).map(filterType => (
              <button
                key={filterType}
                onClick={() => setFilter(filterType)}
                className={`flex-1 px-6 py-3 text-sm font-medium capitalize transition-colors ${
                  filter === filterType
                    ? 'text-blue-600 bg-blue-50 dark:bg-blue-900/20 border-b-2 border-blue-600'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                }`}
              >
                {filterType}
                {filterType === 'unread' && unreadCount > 0 && (
                  <Badge className="ml-2 bg-red-100 text-red-800">
                    {unreadCount}
                  </Badge>
                )}
              </button>
            ))}
          </div>

          {/* Notifications List */}
          <CardContent className="p-0">
            {filteredNotifications.length === 0 ? (
              <div className="text-center py-16">
                <Bell className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                  {filter === 'unread' 
                    ? 'No unread notifications'
                    : filter === 'read'
                    ? 'No read notifications'
                    : 'No notifications yet'}
                </h3>
                <p className="text-gray-500 dark:text-gray-400">
                  {filter === 'all' 
                    ? 'When you receive notifications, they\'ll appear here.'
                    : 'Switch to "all" to see all notifications.'
                  }
                </p>
              </div>
            ) : (
              <div className="divide-y divide-gray-200 dark:divide-gray-700">
                {filteredNotifications.map((notification) => (
                  <div
                    key={notification.id}
                    className={`p-6 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors ${
                      !notification.read ? 'bg-blue-50 dark:bg-blue-900/10' : ''
                    }`}
                  >
                    <div className="flex items-start gap-4">
                      {/* Icon */}
                      <div className={`flex-shrink-0 ${getNotificationColor(notification.type)}`}>
                        {getNotificationIcon(notification.type)}
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1">
                            <h3 className={`text-lg font-medium ${
                              !notification.read 
                                ? 'text-gray-900 dark:text-white' 
                                : 'text-gray-700 dark:text-gray-300'
                            }`}>
                              {notification.title}
                            </h3>
                            <p className={`text-base mt-2 ${
                              !notification.read
                                ? 'text-gray-700 dark:text-gray-300'
                                : 'text-gray-500 dark:text-gray-400'
                            }`}>
                              {notification.message}
                            </p>
                            <p className="text-sm text-gray-500 dark:text-gray-400 mt-3">
                              {formatDate(notification.created_at)}
                            </p>
                          </div>

                          {/* Actions */}
                          <div className="flex items-center gap-2">
                            {!notification.read && (
                              <Button
                                variant="secondary"
                                size="sm"
                                onClick={() => markAsRead(notification.id)}
                              >
                                <Check className="w-4 h-4 mr-2" />
                                Mark Read
                              </Button>
                            )}
                            <Button
                              variant="danger"
                              size="sm"
                              onClick={() => deleteNotification(notification.id)}
                            >
                              <X className="w-4 h-4 mr-2" />
                              Delete
                            </Button>
                          </div>
                        </div>

                        {/* Additional Data */}
                        {notification.data && typeof notification.data === 'object' && 'reportId' in notification.data && (
                          <div className="mt-3 inline-flex items-center px-3 py-1 rounded-full text-xs bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                            <FileText className="w-3 h-3 mr-1" />
                            Report ID: {String(notification.data.reportId)}
                          </div>
                        )}
                      </div>

                      {/* Unread Indicator */}
                      {!notification.read && (
                        <div className="w-3 h-3 bg-blue-600 rounded-full flex-shrink-0 mt-2" />
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </Layout>
  )
}