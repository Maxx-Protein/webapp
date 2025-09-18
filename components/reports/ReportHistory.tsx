'use client'

import React, { useState, useEffect } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Alert } from '@/components/ui/Alert'
import { 
  FileText, 
  Clock, 
  Search, 
  Filter,
  Calendar,
  Download,
  MessageCircle,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  DollarSign,
  CheckCircle,
  XCircle,
  Eye
} from 'lucide-react'
import { formatCurrency, formatDate } from '@/lib/utils'

interface ReportHistoryItem {
  id: string
  filename: string
  report_date: string
  total_amount: number
  status: string
  payment_status: string
  payment_method: string
  created_at: string
  updated_at: string
  manager_comments: string
  rejection_reason: string
  payment_proof_url: string
  file_path: string
  file_urls: string[]
  history_entries: HistoryEntry[]
}

interface HistoryEntry {
  id: string
  action: string
  previous_status: string
  new_status: string
  comments: string
  performed_at: string
  performed_by: string
  performer_name: string
}

interface FilterOptions {
  status: string
  paymentStatus: string
  dateRange: string
  searchTerm: string
}

export function ReportHistory() {
  const { user } = useAuth()
  const [reports, setReports] = useState<ReportHistoryItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [expandedReports, setExpandedReports] = useState<Set<string>>(new Set())
  const [filters, setFilters] = useState<FilterOptions>({
    status: 'all',
    paymentStatus: 'all',
    dateRange: 'all',
    searchTerm: ''
  })
  const [showFilters, setShowFilters] = useState(false)

  useEffect(() => {
    if (user) {
      fetchReportHistory()
    }

    // Listen for refresh events from other components (e.g., after upload)
    const handleRefreshEvent = () => {
      if (user) {
        fetchReportHistory()
      }
    }

    window.addEventListener('refreshDashboard', handleRefreshEvent)
    return () => window.removeEventListener('refreshDashboard', handleRefreshEvent)
  }, [user, filters])

  const fetchReportHistory = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const response = await fetch('/api/user/report-history', {
        headers: {
          'Content-Type': 'application/json'
        },
        method: 'POST',
        body: JSON.stringify({ filters })
      })

      if (response.ok) {
        const data = await response.json()
        setReports(data.reports || [])
      } else {
        // Only show error for authentication or server issues
        if (response.status === 401) {
          setError('Session expired. Please login again.')
        } else if (response.status >= 500) {
          setError('Server error. Please try again later.')
        } else {
          // For other errors, just log them and show empty state
          console.warn('Failed to fetch reports:', response.status)
          setReports([])
        }
      }
    } catch (error) {
      console.error('Failed to fetch report history:', error)
      // Only show error for network issues, not for empty data
      setError('Network error. Please check your connection and try again.')
    } finally {
      setLoading(false)
    }
  }

  const toggleExpanded = (reportId: string) => {
    const newExpanded = new Set(expandedReports)
    if (newExpanded.has(reportId)) {
      newExpanded.delete(reportId)
    } else {
      newExpanded.add(reportId)
    }
    setExpandedReports(newExpanded)
  }

  const getActionIcon = (action: string) => {
    const icons = {
      report_created: FileText,
      report_submitted: FileText,
      payment_proof_uploaded: Download,
      payment_proof_approved: CheckCircle,
      payment_proof_rejected: XCircle,
      payment_cleared: RefreshCw,
      manager_approved: CheckCircle,
      manager_rejected: XCircle
    }
    
    const Icon = icons[action as keyof typeof icons] || Clock
    return <Icon className="w-4 h-4" />
  }

  const handleDownloadReport = async (report: ReportHistoryItem) => {
    try {
      if (report.file_urls && report.file_urls.length > 0) {
        // Download the first available file
        const fileUrl = report.file_urls[0]
        const fileName = report.filename || 'report'
        
        // Create a download link
        const link = document.createElement('a')
        link.href = fileUrl
        link.download = fileName
        link.target = '_blank'
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
      } else if (report.file_path) {
        // Fallback to file_path if file_urls is not available
        const link = document.createElement('a')
        link.href = report.file_path
        link.download = report.filename || 'report'
        link.target = '_blank'
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
      } else {
        setError('No downloadable file found for this report')
        setTimeout(() => setError(null), 3000)
      }
    } catch (error) {
      console.error('Download failed:', error)
      setError('Failed to download report. Please try again.')
      setTimeout(() => setError(null), 3000)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="loading-glass">
          <RefreshCw className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400">Loading reports...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="space-y-4">
        <Alert
          variant="error"
          title="Error Loading Reports"
          message={error}
          glass
          dismissible
          onClose={() => setError(null)}
        />
        <div className="text-center">
          <Button 
            variant="primary" 
            onClick={fetchReportHistory}
            withArrow
            animated
          >
            Try Again
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6 mobile-friendly">
      {/* Header with glassmorphism */}
      <div className="glass rounded-xl p-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">
              Report History
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              View complete history and timeline of all your reports
            </p>
          </div>
          
          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setShowFilters(!showFilters)}
              glass
              animated
            >
              <Filter className="w-4 h-4 mr-2" />
              Filters
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={fetchReportHistory}
              glass
              animated
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh
            </Button>
          </div>
        </div>
      </div>

      {/* Filters with glassmorphism */}
      {showFilters && (
        <Card glass animated className="animate-fade-up">
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Status
                </label>
                <select
                  value={filters.status}
                  onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                  className="w-full p-2 border border-white/20 rounded-md bg-white/10 backdrop-blur-md dark:bg-black/10 text-gray-900 dark:text-white"
                >
                  <option value="all">All Statuses</option>
                  <option value="pending_approval">Pending Approval</option>
                  <option value="approved">Approved</option>
                  <option value="rejected">Rejected</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Payment Status
                </label>
                <select
                  value={filters.paymentStatus}
                  onChange={(e) => setFilters({ ...filters, paymentStatus: e.target.value })}
                  className="w-full p-2 border border-white/20 rounded-md bg-white/10 backdrop-blur-md dark:bg-black/10 text-gray-900 dark:text-white"
                >
                  <option value="all">All Payment Status</option>
                  <option value="pending">Pending</option>
                  <option value="pending_approval">Pending Approval</option>
                  <option value="completed">Completed</option>
                  <option value="rejected">Rejected</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Date Range
                </label>
                <select
                  value={filters.dateRange}
                  onChange={(e) => setFilters({ ...filters, dateRange: e.target.value })}
                  className="w-full p-2 border border-white/20 rounded-md bg-white/10 backdrop-blur-md dark:bg-black/10 text-gray-900 dark:text-white"
                >
                  <option value="all">All Time</option>
                  <option value="7days">Last 7 Days</option>
                  <option value="30days">Last 30 Days</option>
                  <option value="90days">Last 90 Days</option>
                  <option value="1year">Last Year</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Search
                </label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search reports..."
                    value={filters.searchTerm}
                    onChange={(e) => setFilters({ ...filters, searchTerm: e.target.value })}
                    className="w-full pl-10 pr-4 py-2 border border-white/20 rounded-md bg-white/10 backdrop-blur-md dark:bg-black/10 text-gray-900 dark:text-white placeholder-gray-500"
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Reports History with staggered animations */}
      <div className="space-y-4">
        {reports.map((report, index) => (
          <Card 
            key={report.id} 
            glass 
            hover 
            className={`animate-fade-up animate-fade-up-delay-${Math.min(index + 1, 4)} overflow-hidden`}
          >
            <CardHeader 
              className="cursor-pointer hover:bg-white/5 transition-colors duration-200"
              onClick={() => toggleExpanded(report.id)}
            >
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-4 mb-2">
                    <CardTitle className="text-lg">{report.filename}</CardTitle>
                    <Badge glass variant={report.status === 'approved' ? 'success' : report.status === 'rejected' ? 'danger' : 'warning'}>
                      {report.status.replace('_', ' ').toUpperCase()}
                    </Badge>
                    <Badge glass variant={report.payment_status === 'completed' ? 'success' : report.payment_status === 'rejected' ? 'danger' : 'warning'}>
                      {report.payment_status.replace('_', ' ').toUpperCase()}
                    </Badge>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600 dark:text-gray-400">
                    <div className="flex items-center gap-1">
                      <Calendar className="w-4 h-4" />
                      {formatDate(report.report_date)}
                    </div>
                    <div className="flex items-center gap-1 font-semibold text-green-600">
                      <DollarSign className="w-4 h-4" />
                      {formatCurrency(report.total_amount)}
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      Created {formatDate(report.created_at)}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {report.manager_comments && (
                    <MessageCircle className="w-5 h-5 text-blue-600" />
                  )}
                  {(report.file_urls?.length > 0 || report.file_path) && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation()
                        handleDownloadReport(report)
                      }}
                      glass
                      title="Download Report"
                    >
                      <Download className="w-4 h-4" />
                    </Button>
                  )}
                  {report.payment_proof_url && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation()
                        window.open(report.payment_proof_url, '_blank')
                      }}
                      glass
                      title="View Payment Proof"
                    >
                      <Eye className="w-4 h-4" />
                    </Button>
                  )}
                  {expandedReports.has(report.id) ? (
                    <ChevronUp className="w-5 h-5 text-gray-400" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-gray-400" />
                  )}
                </div>
              </div>
            </CardHeader>

            {expandedReports.has(report.id) && (
              <CardContent className="pt-0 animate-fade-up">
                <div className="border-t border-white/10 pt-4">
                  {/* Manager Comments */}
                  {(report.manager_comments || report.rejection_reason) && (
                    <div className="mb-4 p-3 glass rounded-md">
                      <h4 className="font-medium text-gray-900 dark:text-white mb-2">Manager Comments</h4>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {report.manager_comments || report.rejection_reason}
                      </p>
                    </div>
                  )}

                  {/* Timeline */}
                  <div>
                    <h4 className="font-medium text-gray-900 dark:text-white mb-3">Timeline</h4>
                    <div className="space-y-3">
                      {report.history_entries.map((entry) => (
                        <div key={entry.id} className="flex items-start gap-3">
                          <div className="flex-shrink-0 w-8 h-8 glass-blue rounded-full flex items-center justify-center">
                            {getActionIcon(entry.action)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-sm font-medium text-gray-900 dark:text-white">
                                {entry.action.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                              </span>
                              <span className="text-xs text-gray-500 dark:text-gray-400">
                                {formatDate(entry.performed_at)}
                              </span>
                            </div>
                            {entry.comments && (
                              <p className="text-sm text-gray-600 dark:text-gray-400">
                                {entry.comments}
                              </p>
                            )}
                            {entry.performer_name && (
                              <p className="text-xs text-gray-500 dark:text-gray-400">
                                by {entry.performer_name}
                              </p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </CardContent>
            )}
          </Card>
        ))}

        {reports.length === 0 && (
          <Card glass className="animate-fade-up">
            <CardContent className="text-center py-12">
              <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No reports found</h3>
              <p className="text-gray-500 dark:text-gray-400">
                {filters.searchTerm || filters.status !== 'all' || filters.paymentStatus !== 'all'
                  ? 'Try adjusting your filters to see more results.'
                  : 'Get started by uploading your first report.'}
              </p>
              <Button 
                variant="primary" 
                className="mt-4"
                withArrow
                animated
                onClick={() => window.location.href = '/user/upload'}
              >
                Upload Report
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}