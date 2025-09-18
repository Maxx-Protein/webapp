import React, { useState, useEffect } from 'react'
import {
  Users,
  FileText,
  Clock,
  CreditCard,
  Eye,
  CheckSquare,
  AlertTriangle,
  TrendingUp,
  Calendar,
  Download,
  RefreshCw
} from 'lucide-react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import Link from 'next/link'
import { formatCurrency, formatDate } from '@/lib/utils-enhanced'
import type { ManagerStats, Report, PaymentProof } from '@/types'

// Global refresh function that can be called from other components
export const refreshManagerDashboard = () => {
  // Trigger a custom event that the dashboard can listen to
  window.dispatchEvent(new CustomEvent('refreshManagerDashboard'))
}

interface EnhancedManagerStats extends ManagerStats {
  totalUsers: number
  pendingPayments: number
  totalPayments: number
  totalReports: number
  approvalRate: number
  averageApprovalTime: number
  todaySubmissions: number
  thisWeekAmount: number
}

interface RecentActivity {
  pendingReports: Report[]
  pendingProofs: PaymentProof[]
  recentActions: {
    id: string
    type: 'approval' | 'rejection' | 'comment'
    description: string
    timestamp: string
    reportId: string
  }[]
}

export function ManagerDashboard() {
  const [stats, setStats] = useState<EnhancedManagerStats>({
    totalUsers: 0,
    pendingPayments: 0,
    totalPayments: 0,
    totalReports: 0,
    pendingReports: 0,
    pendingPaymentProofs: 0,
    totalReportsToday: 0,
    totalAmountToday: 0,
    rejectionRate: 0,
    todaySubmissions: 0,
    thisWeekAmount: 0,
    approvalRate: 0,
    averageApprovalTime: 0
  })
  const [recentActivity, setRecentActivity] = useState<RecentActivity>({
    pendingReports: [],
    pendingProofs: [],
    recentActions: []
  })
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'overview' | 'reports' | 'proofs'>('overview')

  useEffect(() => {
    fetchManagerData()
  }, [])

  const fetchManagerData = async () => {
    try {
      const [statsResponse, activityResponse] = await Promise.all([
        fetch('/api/manager/dashboard-stats'),
        fetch('/api/manager/recent-activity')
      ])
      
      if (statsResponse.ok) {
        const statsData = await statsResponse.json()
        setStats(statsData.stats || stats)
      }
      
      if (activityResponse.ok) {
        const activityData = await activityResponse.json()
        setRecentActivity(activityData.activity || recentActivity)
      }
    } catch (error) {
      console.error('Failed to fetch manager data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleQuickApproval = async (reportId: string, action: 'approve' | 'reject') => {
    try {
      const response = await fetch('/api/manager/quick-action', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ reportId, action })
      })
      
      if (response.ok) {
        fetchManagerData() // Refresh data
      }
    } catch (error) {
      console.error('Quick action failed:', error)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="loading-glass">
          <RefreshCw className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400">Loading manager dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6 mobile-friendly">
      {/* Header with glassmorphism */}
      <div className="glass rounded-xl p-6 text-white relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-indigo-700 opacity-90"></div>
        <div className="relative">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h1 className="text-3xl font-bold mb-2">Manager Dashboard</h1>
              <p className="text-blue-100">
                Manage reports, approve payments, and oversee operations
              </p>
            </div>
            <div className="mt-4 lg:mt-0 flex gap-3">
              <Button variant="secondary" size="sm" glass>
                <Download className="w-4 h-4 mr-2" />
                Export Report
              </Button>
              <Button variant="secondary" size="sm" glass>
                <Calendar className="w-4 h-4 mr-2" />
                Schedule
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Key Metrics with glassmorphism */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card glass hover className="animate-fade-up">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Pending Reports
                </p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {stats.pendingReports}
                </p>
                <p className="text-xs text-red-500 mt-1">
                  Requires Action
                </p>
              </div>
              <div className="glass-red p-3 rounded-lg">
                <AlertTriangle className="w-6 h-6 text-red-600 dark:text-red-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card glass hover className="animate-fade-up-delay-1">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Pending Proofs
                </p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {stats.pendingPaymentProofs}
                </p>
                <p className="text-xs text-orange-500 mt-1">
                  Payment Verification
                </p>
              </div>
              <div className="bg-orange-500/10 p-3 rounded-lg backdrop-blur-md">
                <Clock className="w-6 h-6 text-orange-600 dark:text-orange-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card glass hover className="animate-fade-up-delay-2">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Today&apos;s Submissions
                </p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {stats.todaySubmissions}
                </p>
                <p className="text-xs text-blue-500 mt-1">
                  {formatCurrency(stats.thisWeekAmount)} this week
                </p>
              </div>
              <div className="glass-blue p-3 rounded-lg">
                <TrendingUp className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card glass hover className="animate-fade-up-delay-3">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Approval Rate
                </p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {stats.approvalRate}%
                </p>
                <p className="text-xs text-green-500 mt-1">
                  Avg: {stats.averageApprovalTime}h
                </p>
              </div>
              <div className="glass-green p-3 rounded-lg">
                <CheckSquare className="w-6 h-6 text-green-600 dark:text-green-400" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Activity Tabs */}
      <div className="border-b border-gray-200 dark:border-gray-700">
        <nav className="flex space-x-8">
          {[
            { id: 'overview', label: 'Overview', icon: Eye },
            { id: 'reports', label: 'Pending Reports', icon: FileText, count: stats.pendingReports },
            { id: 'proofs', label: 'Payment Proofs', icon: CreditCard, count: stats.pendingPaymentProofs }
          ].map(tab => {
            const Icon = tab.icon
            const isActive = activeTab === tab.id
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as 'overview' | 'reports' | 'proofs')}
                className={`
                  py-4 px-1 border-b-2 font-medium text-sm flex items-center space-x-2
                  ${isActive 
                    ? 'border-blue-500 text-blue-600 dark:text-blue-400' 
                    : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
                  }
                `}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
                {tab.count && tab.count > 0 && (
                  <Badge variant="danger" className="ml-2">
                    {tab.count}
                  </Badge>
                )}
              </button>
            )
          })}
        </nav>
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <CheckSquare className="w-5 h-5 mr-2" />
                Quick Actions
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Link href="/manager/reports" className="block">
                <Button glass animated className="w-full justify-start" size="lg" variant="secondary">
                  <FileText className="w-5 h-5 mr-3" />
                  Review Reports
                  {stats.pendingReports > 0 && (
                    <Badge variant="danger" className="ml-auto">
                      {stats.pendingReports}
                    </Badge>
                  )}
                </Button>
              </Link>
              <Link href="/manager/payment-proofs" className="block">
                <Button glass animated className="w-full justify-start" size="lg" variant="secondary">
                  <CreditCard className="w-5 h-5 mr-3" />
                  Payment Proofs
                  {stats.pendingPaymentProofs > 0 && (
                    <Badge variant="danger" className="ml-auto">
                      {stats.pendingPaymentProofs}
                    </Badge>
                  )}
                </Button>
              </Link>
              <Link href="/manager/users" className="block">
                <Button glass animated className="w-full justify-start" size="lg" variant="secondary">
                  <Users className="w-5 h-5 mr-3" /> Manage Users
                </Button>
              </Link>
            </CardContent>
          </Card>

          {/* Recent Activity */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Clock className="w-5 h-5 mr-2" />
                Recent Activity
              </CardTitle>
            </CardHeader>
            <CardContent>
              {recentActivity.recentActions.length === 0 ? (
                <p className="text-gray-500 dark:text-gray-400 text-center py-4">
                  No recent activity
                </p>
              ) : (
                <div className="space-y-3">
                  {recentActivity.recentActions.slice(0, 5).map(action => (
                    <div key={action.id} className="flex items-center justify-between p-3 rounded-lg bg-gray-50 dark:bg-gray-800/50">
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900 dark:text-white">
                          {action.description}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {formatDate(action.timestamp)}
                        </p>
                      </div>
                      <Badge 
                        variant={action.type === 'approval' ? 'default' : action.type === 'rejection' ? 'danger' : 'secondary'}
                        className="text-xs"
                      >
                        {action.type}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {activeTab === 'reports' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span className="flex items-center">
                <FileText className="w-5 h-5 mr-2" />
                Pending Reports ({recentActivity.pendingReports.length})
              </span>
              <Link href="/manager/reports">
                <Button size="sm">
                  View All
                </Button>
              </Link>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {recentActivity.pendingReports.length === 0 ? (
              <p className="text-gray-500 dark:text-gray-400 text-center py-8">
                No pending reports
              </p>
            ) : (
              <div className="space-y-4">
                {recentActivity.pendingReports.slice(0, 5).map(report => (
                  <div key={report.id} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <h3 className="font-medium text-gray-900 dark:text-white">
                          {report.filename}
                        </h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          By {report.user?.full_name} • {formatCurrency(report.total_amount)}
                        </p>
                        <p className="text-xs text-gray-400 dark:text-gray-500">
                          {formatDate(report.created_at)}
                        </p>
                      </div>
                      <div className="flex space-x-2">
                        <Button 
                          size="sm" 
                          variant="ghost"
                          onClick={() => handleQuickApproval(report.id, 'approve')}
                        >
                          Approve
                        </Button>
                        <Button 
                          size="sm" 
                          variant="danger"
                          onClick={() => handleQuickApproval(report.id, 'reject')}
                          glass
                        >
                          Reject
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {activeTab === 'proofs' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span className="flex items-center">
                <CreditCard className="w-5 h-5 mr-2" />
                Pending Payment Proofs ({recentActivity.pendingProofs.length})
              </span>
              <Link href="/manager/payment-proofs">
                <Button size="sm">
                  View All
                </Button>
              </Link>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {recentActivity.pendingProofs.length === 0 ? (
              <p className="text-gray-500 dark:text-gray-400 text-center py-8">
                No pending payment proofs
              </p>
            ) : (
              <div className="space-y-4">
                {recentActivity.pendingProofs.slice(0, 5).map(proof => (
                  <div key={proof.id} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <h3 className="font-medium text-gray-900 dark:text-white">
                          Payment Proof - {formatCurrency(proof.amount)}
                        </h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          {proof.file_type.toUpperCase()} • {formatDate(proof.uploaded_at)}
                        </p>
                        {proof.notes && (
                          <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                            Note: {proof.notes}
                          </p>
                        )}
                      </div>
                      <div className="flex space-x-2">
                        <Button size="sm" variant="secondary" glass>
                          <Eye className="w-4 h-4 mr-1" />
                          View
                        </Button>
                        <Button size="sm">
                          Approve
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
