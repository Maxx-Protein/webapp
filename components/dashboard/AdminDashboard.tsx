import React, { useState, useEffect } from 'react'
import {
  Users,
  FileText,
  DollarSign,
  TrendingUp,
  Activity,
  UserPlus,
  BarChart3,
  RefreshCw
} from 'lucide-react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import Link from 'next/link'
import { formatCurrency } from '@/lib/utils'

interface RecentActivityLog {
  action: string
  user: string
  timestamp: string
}

interface AdminStats {
  totalUsers: number
  totalReports: number
  totalRevenue: number
  pendingPayments: number
  monthlyGrowth: number
  activeUsers: number
}

// Global refresh function that can be called from other components
export const refreshAdminDashboard = () => {
  // Trigger a custom event that the dashboard can listen to
  window.dispatchEvent(new CustomEvent('refreshAdminDashboard'))
}

export function AdminDashboard() {
  const [stats, setStats] = useState<AdminStats>({
    totalUsers: 0,
    totalReports: 0,
    totalRevenue: 0,
    pendingPayments: 0,
    monthlyGrowth: 0,
    activeUsers: 0
  })
  const [recentActivity, setRecentActivity] = useState<RecentActivityLog[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/admin/dashboard-stats')
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setStats(data.stats)
          setRecentActivity(data.recentActivity || [])
        }
      })
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="loading-glass">
          <RefreshCw className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400">Loading admin dashboard...</p>
        </div>
      </div>
    )
  }

  const statCards = [
    {
      title: 'Total Users',
      value: stats.totalUsers,
      icon: Users,
      color: 'text-blue-600',
      bgColor: 'glass-blue',
      change: stats.monthlyGrowth ? 
        (stats.monthlyGrowth > 0 
          ? `+${stats.monthlyGrowth}% from last month` 
          : stats.monthlyGrowth < 0 
            ? `${stats.monthlyGrowth}% from last month`
            : 'No change from last month'
        ) : 'No data available',
      trend: stats.monthlyGrowth > 0 ? 'positive' : stats.monthlyGrowth < 0 ? 'negative' : 'neutral'
    },
    {
      title: 'Total Reports',
      value: stats.totalReports,
      icon: FileText,
      color: 'text-green-600',
      bgColor: 'glass-green',
      change: stats.monthlyGrowth ? 
        (stats.monthlyGrowth > 0 
          ? `+${stats.monthlyGrowth}% from last month` 
          : stats.monthlyGrowth < 0 
            ? `${stats.monthlyGrowth}% from last month`
            : 'No change from last month'
        ) : 'No data available',
      trend: stats.monthlyGrowth > 0 ? 'positive' : stats.monthlyGrowth < 0 ? 'negative' : 'neutral'
    },
    {
      title: 'Total Revenue',
      value: formatCurrency(stats.totalRevenue),
      icon: DollarSign,
      color: 'text-purple-600',
      bgColor: 'bg-purple-500/10',
      change: `${stats.totalReports} reports processed`,
      trend: 'neutral'
    },
    {
      title: 'Pending Payments',
      value: formatCurrency(stats.pendingPayments),
      icon: TrendingUp,
      color: 'text-orange-600',
      bgColor: 'bg-orange-500/10',
      change: 'Awaiting processing',
      trend: 'neutral'
    }
  ]

  return (
    <div className="space-y-6 mobile-friendly pt-[80px]">
      {/* Header with glassmorphism */}
      <div className="glass rounded-xl p-6 text-white relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-purple-600 to-blue-600 opacity-90"></div>
        <div className="relative">
          <h2 className="text-2xl font-bold mb-2">Admin Dashboard</h2>
          <p className="text-purple-100">
            Monitor system performance and manage all operations.
          </p>
          <div className="flex items-center gap-2 mt-4">
            <Badge glass className="bg-white/20 text-white border-white/30">
              <Activity className="w-3 h-3 mr-1" />
              System Active
            </Badge>
          </div>
        </div>
      </div>

      {/* Stats Cards with glassmorphism */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat, i) => (
          <Card key={i} glass hover animated className={`animate-fade-up-delay-${i + 1}`}>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className={`${stat.bgColor} p-3 rounded-lg backdrop-blur-md`}>
                  <stat.icon className={`w-6 h-6 ${stat.color}`} />
                </div>
                <div className="ml-4 flex-1">
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">{stat.title}</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">{stat.value}</p>
                  <p className={`text-xs mt-1 ${
                    stat.trend === 'positive' ? 'text-green-500' : 
                    stat.trend === 'negative' ? 'text-red-500' : 
                    'text-gray-500'
                  }`}>{stat.change}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Enhanced Action Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card glass className="animate-fade-up">
          <CardHeader>
            <CardTitle className="flex items-center">
              <UserPlus className="w-5 h-5 mr-2" />
              Quick Actions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 gap-4">
              <Link href="/admin/users">
                <Button glass animated withArrow className="w-full justify-start" size="lg">
                  <UserPlus className="w-5 h-5 mr-3" /> Create New User
                </Button>
              </Link>
              <Link href="/admin/reports">
                <Button
                  variant="secondary"
                  glass
                  animated
                  className="w-full justify-start"
                  size="lg"
                >
                  <FileText className="w-5 h-5 mr-3" /> View All Reports
                </Button>
              </Link>
              <Link href="/admin/analytics">
                <Button
                  variant="secondary"
                  glass
                  animated
                  className="w-full justify-start"
                  size="lg"
                >
                  <BarChart3 className="w-5 h-5 mr-3" /> System Analytics
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>

        <Card glass className="animate-fade-up-delay-1">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Activity className="w-5 h-5 mr-2" /> Recent Activity
            </CardTitle>
          </CardHeader>
          <CardContent>
            {recentActivity.length === 0 ? (
              <div className="text-center py-8">
                <Activity className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500 dark:text-gray-400">No recent activity</p>
                <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                  Activity will appear here as users interact with the system
                </p>
              </div>
            ) : (
              <ul className="space-y-3">
                {recentActivity.slice(0, 5).map((log, i) => (
                  <li key={i} className="flex items-start space-x-3 p-3 glass rounded-lg">
                    <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0" />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        {log.action}
                      </p>
                      <p className="text-xs text-gray-600 dark:text-gray-400">
                        {log.user} • {log.timestamp}
                      </p>
                    </div>
                    <Badge glass variant="info" size="sm">
                      New
                    </Badge>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
