'use client'

import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import {
  FileText,
  DollarSign,
  Clock,
  Calendar,
  Upload,
  CreditCard,
  TrendingUp,
  Eye,
  RefreshCw
} from 'lucide-react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Alert } from '@/components/ui/Alert'
import { useAuth } from '@/hooks/useAuth'
import { formatCurrency, formatDate } from '@/lib/utils'

// Move interface outside of component
interface Stats {
  totalReports: number
  totalAmount: number
  pendingAmount: number
  thisMonthReports: number
  trends?: {
    reportsMonthlyGrowth: number
    paymentsWeeklyGrowth: number
    pendingPaymentsCount: number
    thisMonthMessage: string
  }
}

interface RecentReport {
  id: string
  filename: string
  total_amount: number
  status: string
  payment_status: string
  created_at: string
  report_date: string
}

interface RecentPayment {
  id: string
  amount: number
  payment_method: string
  payment_status: string
  transaction_id?: string
  created_at: string
  reports: {
    id: string
    filename: string
  }
}

// Global refresh function that can be called from other components
export const refreshUserDashboard = () => {
  // Trigger a custom event that the dashboard can listen to
  window.dispatchEvent(new CustomEvent('refreshDashboard'))
}

// Use default export for React components
function UserDashboard() {
  const { user } = useAuth()
  const router = useRouter()
  const [stats, setStats] = useState<Stats>({
    totalReports: 0,
    totalAmount: 0,
    pendingAmount: 0,
    thisMonthReports: 0
  })
  const [recentReports, setRecentReports] = useState<RecentReport[]>([])
  const [recentPayments, setRecentPayments] = useState<RecentPayment[]>([])
  const [loading, setLoading] = useState(true)
  const [recentLoading, setRecentLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchDashboardDataLocal = async () => {
    try {
      // Check if user is authenticated via Supabase session
      if (!user) {
        setError('Authentication required')
        setLoading(false)
        return
      }

      // Fetch all data in parallel (no auth headers needed with Supabase session)
      const [statsRes, reportsRes, paymentsRes] = await Promise.all([
        fetch('/api/user/dashboard-stats', {
          method: 'GET',
          credentials: 'include' // Include cookies for Supabase session
        }),
        fetch('/api/user/recent-reports', {
          method: 'GET',
          credentials: 'include'
        }),
        fetch('/api/user/recent-payments', {
          method: 'GET',
          credentials: 'include'
        })
      ])

      // Handle stats response
      if (statsRes.ok) {
        const statsData = await statsRes.json()
        if (statsData.success) {
          setStats(statsData.data.stats)
          setError(null)
        }
      } else if (statsRes.status === 401) {
        setError('Session expired. Please login again.')
        router.push('/')
        return
      }

      // Handle recent reports response (always return empty array on error)
      if (reportsRes.ok) {
        const reportsData = await reportsRes.json()
        setRecentReports(reportsData.reports || [])
      } else {
        setRecentReports([]) // Empty array instead of error
      }

      // Handle recent payments response (always return empty array on error)
      if (paymentsRes.ok) {
        const paymentsData = await paymentsRes.json()
        setRecentPayments(paymentsData.payments || [])
      } else {
        setRecentPayments([]) // Empty array instead of error
      }

    } catch (error: unknown) {
      console.error('Error fetching dashboard data:', error)
      const errorMessage = error instanceof Error ? error.message : 'Failed to load dashboard data. Please try refreshing the page.'
      setError(errorMessage)
      // Set empty arrays for recent data
      setRecentReports([])
      setRecentPayments([])
    } finally {
      setLoading(false)
      setRecentLoading(false)
    }
  }

  useEffect(() => {
    if (user) {
      fetchDashboardDataLocal()
    }

    // Listen for refresh events from other components
    const handleRefreshEvent = () => {
      if (user) {
        setLoading(true)
        setRecentLoading(true)
        fetchDashboardDataLocal()
      }
    }

    window.addEventListener('refreshDashboard', handleRefreshEvent)
    return () => window.removeEventListener('refreshDashboard', handleRefreshEvent)
  }, [user, router])

  const handleNavigation = (path: string) => {
    router.push(path)
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="loading-glass">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <div className="text-gray-600">Loading user dashboard…</div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="space-y-6 mobile-friendly">
        <Alert
          variant="error"
          title="Error Loading Dashboard"
          message={error}
          glass
          dismissible
          onClose={() => setError(null)}
        />
        <div className="text-center">
          <Button 
            variant="primary"
            onClick={fetchDashboardDataLocal}
            withArrow
            animated
          >
            Retry
          </Button>
        </div>
      </div>
    )
  }

  const statCards = [
    {
      title: 'Total Reports',
      value: stats.totalReports,
      icon: FileText,
      color: 'text-blue-600',
      bgColor: 'glass-blue',
      trend: stats.trends ? 
        (stats.trends.reportsMonthlyGrowth > 0 
          ? `+${stats.trends.reportsMonthlyGrowth}% this month` 
          : stats.trends.reportsMonthlyGrowth < 0 
            ? `${stats.trends.reportsMonthlyGrowth}% this month`
            : 'No change this month'
        ) : 
        (stats.totalReports > 0 ? 'Active' : 'No reports yet')
    },
    {
      title: 'Total Payments', 
      value: formatCurrency(stats.totalAmount),
      icon: DollarSign,
      color: 'text-green-600',
      bgColor: 'glass-green',
      trend: stats.trends ? 
        (stats.trends.paymentsWeeklyGrowth > 0 
          ? `+${stats.trends.paymentsWeeklyGrowth}% from last week` 
          : stats.trends.paymentsWeeklyGrowth < 0 
            ? `${stats.trends.paymentsWeeklyGrowth}% from last week`
            : 'No change from last week'
        ) : 
        (stats.totalAmount > 0 ? 'Payments received' : 'No payments yet')
    },
    {
      title: 'Pending Payments',
      value: formatCurrency(stats.pendingAmount),
      icon: Clock,
      color: 'text-amber-600',
      bgColor: 'bg-yellow-500/10',
      trend: stats.trends ? 
        `${stats.trends.pendingPaymentsCount} pending approvals` :
        (stats.pendingAmount > 0 ? 'Awaiting approval' : 'No pending payments')
    },
    {
      title: 'This Month',
      value: stats.thisMonthReports,
      icon: Calendar,
      color: 'text-purple-600',
      bgColor: 'bg-purple-500/10',
      trend: stats.trends ? stats.trends.thisMonthMessage : 
        (stats.thisMonthReports > 0 ? 'Great progress!' : 'Start uploading')
    }
  ]

  return (
    <div className="space-y-6 mobile-friendly">
      {/* Welcome Header with glassmorphism */}
      <div className="glass rounded-xl p-6 text-white relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-indigo-700 opacity-90"></div>
        <div className="relative">
          <h2 className="text-2xl font-bold mb-2">Welcome, {user?.fullName}!</h2>
          <p className="text-blue-100">
            Manage your reports and track payments here.
          </p>
          <div className="flex items-center gap-2 mt-4">
            <Badge glass className="bg-white/20 text-white border-white/30">
              <TrendingUp className="w-3 h-3 mr-1" />
              Active User
            </Badge>
          </div>
        </div>
      </div>

      {/* Stats Cards with staggered animations */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat, i) => (
          <Card key={i} glass hover animated className={`animate-fade-up-delay-${i + 1}`}>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className={`${stat.bgColor} p-3 rounded-lg shadow-sm backdrop-blur-md`}>
                  <stat.icon className={`w-6 h-6 ${stat.color}`} />
                </div>
                <div className="ml-4 flex-1">
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">{stat.title}</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {stat.value}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    {stat.trend}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Quick Actions & Recent Activity with glassmorphism */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card glass className="shadow-md animate-fade-up">
          <CardHeader className="border-b border-white/10">
            <CardTitle className="text-lg font-semibold text-gray-900 dark:text-white flex items-center">
              <Upload className="w-5 h-5 mr-2" />
              Quick Actions
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="space-y-3">
              <Button 
                glass
                animated
                withArrow
                className="w-full justify-start bg-blue-600 hover:bg-blue-700 text-white" 
                size="lg" 
                onClick={() => handleNavigation('/user/upload')}
              >
                <Upload className="w-5 h-5 mr-3" /> 
                Upload Report
              </Button>
              
              <Button 
                variant="secondary" 
                glass
                animated
                className="w-full justify-start hover:bg-white/10" 
                size="lg" 
                onClick={() => handleNavigation('/user/reports')}
              >
                <Eye className="w-5 h-5 mr-3" /> 
                View Reports
              </Button>
              
              <Button 
                variant="secondary" 
                glass
                animated
                className="w-full justify-start hover:bg-white/10" 
                size="lg" 
                onClick={() => handleNavigation('/user/payments')}
              >
                <CreditCard className="w-5 h-5 mr-3" /> 
                View Payments
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Enhanced Recent Activity Card */}
        <Card glass className="shadow-md animate-fade-up-delay-1">
          <CardHeader className="border-b border-white/10">
            <CardTitle className="text-lg font-semibold text-gray-900 dark:text-white flex items-center">
              <Clock className="w-5 h-5 mr-2" />
              Recent Activity
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="space-y-4">
              {stats.totalReports === 0 ? (
                <div className="text-center py-4">
                  <FileText className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                  <p className="text-sm text-gray-500 dark:text-gray-400">No recent activity</p>
                  <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">Start by uploading your first report</p>
                  <Button 
                    variant="primary" 
                    size="sm" 
                    className="mt-3"
                    onClick={() => handleNavigation('/user/upload')}
                    glass
                    withArrow
                  >
                    Get Started
                  </Button>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 glass rounded-lg">
                    <div className="flex items-center">
                      <div className="w-2 h-2 bg-green-500 rounded-full mr-3"></div>
                      <div>
                        <p className="text-sm font-medium text-gray-900 dark:text-white">
                          {stats.totalReports} reports submitted
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          Total value: {formatCurrency(stats.totalAmount)}
                        </p>
                      </div>
                    </div>
                    <Badge glass variant="success" size="sm">
                      Active
                    </Badge>
                  </div>
                  
                  {stats.pendingAmount > 0 && (
                    <div className="flex items-center justify-between p-3 glass rounded-lg">
                      <div className="flex items-center">
                        <div className="w-2 h-2 bg-yellow-500 rounded-full mr-3"></div>
                        <div>
                          <p className="text-sm font-medium text-gray-900 dark:text-white">
                            Pending payments
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            Amount: {formatCurrency(stats.pendingAmount)}
                          </p>
                        </div>
                      </div>
                      <Badge glass variant="warning" size="sm">
                        Pending
                      </Badge>
                    </div>
                  )}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Reports and Payments */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Reports */}
        <Card glass className="shadow-md animate-fade-up-delay-2">
          <CardHeader className="border-b border-white/10">
            <CardTitle className="text-lg font-semibold text-gray-900 dark:text-white flex items-center justify-between">
              <span className="flex items-center">
                <FileText className="w-5 h-5 mr-2" />
                Recent Reports
              </span>
              {recentLoading && <RefreshCw className="w-4 h-4 animate-spin" />}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="space-y-3">
              {recentReports.length === 0 ? (
                <div className="text-center py-4">
                  <FileText className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                  <p className="text-sm text-gray-500 dark:text-gray-400">No recent reports</p>
                  <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">Your uploaded reports will appear here</p>
                </div>
              ) : (
                recentReports.map((report) => (
                  <div key={report.id} className="flex items-center justify-between p-3 glass rounded-lg hover:bg-white/10 transition-colors">
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                        {report.filename}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {formatCurrency(report.total_amount)}
                        </p>
                        <span className="text-xs text-gray-400">•</span>
                        <p className="text-xs text-gray-400 dark:text-gray-500">
                          {formatDate(report.report_date)}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge 
                        glass 
                        variant={report.status === 'approved' ? 'success' : report.status === 'rejected' ? 'danger' : 'warning'} 
                        size="sm"
                      >
                        {report.status.replace('_', ' ').toUpperCase()}
                      </Badge>
                    </div>
                  </div>
                ))
              )}
              {recentReports.length > 0 && (
                <div className="pt-2">
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="w-full"
                    onClick={() => handleNavigation('/user/reports')}
                  >
                    View All Reports
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Recent Payments */}
        <Card glass className="shadow-md animate-fade-up-delay-3">
          <CardHeader className="border-b border-white/10">
            <CardTitle className="text-lg font-semibold text-gray-900 dark:text-white flex items-center justify-between">
              <span className="flex items-center">
                <CreditCard className="w-5 h-5 mr-2" />
                Recent Payments
              </span>
              {recentLoading && <RefreshCw className="w-4 h-4 animate-spin" />}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="space-y-3">
              {recentPayments.length === 0 ? (
                <div className="text-center py-4">
                  <CreditCard className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                  <p className="text-sm text-gray-500 dark:text-gray-400">No recent payments</p>
                  <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">Your payments will appear here</p>
                </div>
              ) : (
                recentPayments.map((payment) => (
                  <div key={payment.id} className="flex items-center justify-between p-3 glass rounded-lg hover:bg-white/10 transition-colors">
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                        {payment.reports.filename}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {formatCurrency(payment.amount)}
                        </p>
                        <span className="text-xs text-gray-400">•</span>
                        <p className="text-xs text-gray-400 dark:text-gray-500">
                          {payment.payment_method?.replace('_', ' ').toUpperCase() || 'N/A'}
                        </p>
                        <span className="text-xs text-gray-400">•</span>
                        <p className="text-xs text-gray-400 dark:text-gray-500">
                          {formatDate(payment.created_at)}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge 
                        glass 
                        variant={payment.payment_status === 'completed' ? 'success' : payment.payment_status === 'failed' ? 'danger' : 'warning'} 
                        size="sm"
                      >
                        {payment.payment_status.toUpperCase()}
                      </Badge>
                    </div>
                  </div>
                ))
              )}
              {recentPayments.length > 0 && (
                <div className="pt-2">
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="w-full"
                    onClick={() => handleNavigation('/user/payments')}
                  >
                    View All Payments
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

// Use default export for React components
export default UserDashboard
