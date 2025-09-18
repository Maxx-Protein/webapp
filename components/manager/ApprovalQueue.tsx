'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { 
  Clock, 
  CheckCircle, 
  XCircle, 
  Eye, 
  FileText,
  User,
  Calendar,
  DollarSign,
  Filter
} from 'lucide-react'
import { formatCurrency, formatDate } from '@/lib/utils-enhanced'
import type { Report } from '@/types'

// Using Report type directly for pending reports

interface ApprovalQueueProps {
  onApprove: (reportId: string, comments?: string) => void
  onReject: (reportId: string, comments?: string) => void
  onViewDetails: (report: Report) => void
}

export function ApprovalQueue({ onApprove, onReject, onViewDetails }: ApprovalQueueProps) {
  const [reports, setReports] = useState<Report[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedReport, setSelectedReport] = useState<Report | null>(null)
  const [showModal, setShowModal] = useState(false)
  const [comments, setComments] = useState('')
  const [actionLoading, setActionLoading] = useState(false)
  const [filter, setFilter] = useState<'all' | 'today' | 'this_week'>('all')

  useEffect(() => {
    fetchPendingReports()
  }, [filter])

  const fetchPendingReports = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/manager/pending-reports?filter=${filter}`)
      
      if (response.ok) {
        const data = await response.json()
        setReports(data.reports || [])
      }
    } catch {
      console.error('Failed to fetch pending reports')
    } finally {
      setLoading(false)
    }
  }

  const handleAction = async (action: 'approve' | 'reject') => {
    if (!selectedReport) return

    setActionLoading(true)
    try {
      const response = await fetch('/api/manager/approve-report', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          reportId: selectedReport.id,
          action,
          comments
        })
      })

      if (response.ok) {
        setShowModal(false)
        setComments('')
        setSelectedReport(null)
        fetchPendingReports()
        
        if (action === 'approve') {
          onApprove(selectedReport.id, comments)
        } else {
          onReject(selectedReport.id, comments)
        }
      } else {
        const data = await response.json()
        alert(data.message || `Failed to ${action} report`)
      }
    } catch {
      alert(`Failed to ${action} report`)
    } finally {
      setActionLoading(false)
    }
  }

  const openModal = (report: Report) => {
    setSelectedReport(report)
    setShowModal(true)
    setComments('')
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span className="ml-3">Loading pending reports...</span>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header and Filters */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            Approval Queue
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            {reports.length} reports awaiting your approval
          </p>
        </div>
        
        <div className="flex items-center space-x-3">
          <Filter className="w-5 h-5 text-gray-400" />
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value as 'all' | 'today' | 'this_week')}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
          >
            <option value="all">All Reports</option>
            <option value="today">Today&apos;s Submissions</option>
            <option value="this_week">This Week</option>
          </select>
        </div>
      </div>

      {/* Reports List */}
      {reports.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              No Pending Reports
            </h3>
            <p className="text-gray-500 dark:text-gray-400">
              All reports have been reviewed. Great job!
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {reports.map((report) => (
            <Card key={report.id} className="hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-3 mb-3">
                      <FileText className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                      <h3 className="font-medium text-gray-900 dark:text-white truncate">
                        {report.filename}
                      </h3>
                      <Badge variant="warning" className="text-xs">
                        PENDING
                      </Badge>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
                      <div className="flex items-center space-x-2">
                        <User className="w-4 h-4 text-gray-400" />
                        <span className="text-gray-600 dark:text-gray-300">
                          {report.user?.full_name || 'Unknown User'}
                        </span>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <DollarSign className="w-4 h-4 text-gray-400" />
                        <span className="font-medium text-gray-900 dark:text-white">
                          {formatCurrency(report.total_amount)}
                        </span>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <Calendar className="w-4 h-4 text-gray-400" />
                        <span className="text-gray-600 dark:text-gray-300">
                          {formatDate(report.report_date)}
                        </span>
                      </div>

                      <div className="flex items-center space-x-2">
                        <Clock className="w-4 h-4 text-gray-400" />
                        <span className="text-gray-600 dark:text-gray-300">
                          {formatDate(report.created_at)}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex space-x-2 ml-4">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => onViewDetails(report)}
                    >
                      <Eye className="w-4 h-4 mr-1" />
                      View
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => openModal(report)}
                      className="bg-green-600 hover:bg-green-700 text-white"
                    >
                      <CheckCircle className="w-4 h-4 mr-1" />
                      Approve
                    </Button>
                    <Button
                      size="sm"
                      variant="danger"
                      onClick={() => openModal(report)}
                    >
                      <XCircle className="w-4 h-4 mr-1" />
                      Reject
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Action Modal */}
      {showModal && selectedReport && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              {actionLoading ? 'Processing...' : `Confirm ${comments ? 'Approval' : 'Action'}`}
            </h3>
            
            <div className="mb-4">
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                Report: <strong>{selectedReport.filename}</strong>
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                Amount: <strong>{formatCurrency(selectedReport.total_amount)}</strong>
              </p>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Comments (Optional)
              </label>
              <textarea
                value={comments}
                onChange={(e) => setComments(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                rows={3}
                placeholder="Add any comments or feedback..."
                disabled={actionLoading}
              />
            </div>

            <div className="flex space-x-3">
              <Button
                onClick={() => handleAction('approve')}
                disabled={actionLoading}
                className="flex-1 bg-green-600 hover:bg-green-700 text-white"
              >
                {actionLoading ? 'Processing...' : 'Approve'}
              </Button>
              <Button
                onClick={() => handleAction('reject')}
                variant="danger"
                disabled={actionLoading}
                className="flex-1"
              >
                {actionLoading ? 'Processing...' : 'Reject'}
              </Button>
              <Button
                onClick={() => setShowModal(false)}
                variant="ghost"
                disabled={actionLoading}
              >
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}