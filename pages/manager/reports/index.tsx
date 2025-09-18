import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import { useAuth } from '@/hooks/useAuth'
import { Layout } from '@/components/layout/Layout'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { 
  Clock, 
  CheckCircle, 
  XCircle, 
  Eye, 
  FileText,
  User,
  Calendar,
  DollarSign
} from 'lucide-react'
import { formatCurrency, formatDate, getStatusColor } from '@/lib/utils'

interface PendingReport {
  id: string
  filename: string
  report_date: string
  total_amount: number
  status: string
  created_at: string
  processing_details: {
    title?: string
    description?: string
  } | null
  users: {
    id: string
    full_name: string
    email: string
  }
}

export default function ManagerReportsPage() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const [reports, setReports] = useState<PendingReport[]>([])
  const [loadingReports, setLoadingReports] = useState(true)
  const [selectedReport, setSelectedReport] = useState<PendingReport | null>(null)
  const [showModal, setShowModal] = useState(false)
  const [actionLoading, setActionLoading] = useState(false)
  const [comments, setComments] = useState('')

  useEffect(() => {
    if (!loading && (!user || (user.role !== 'manager' && user.role !== 'admin'))) {
      router.push('/')
    }
  }, [user, loading, router])

  useEffect(() => {
    if (user?.role === 'manager' || user?.role === 'admin') {
      fetchPendingReports()
    }
  }, [user])

  const fetchPendingReports = async () => {
    try {
      const response = await fetch('/api/manager/pending-reports')
      
      if (response.ok) {
        const data = await response.json()
        setReports(data.reports || [])
      }
    } catch (error) {
      console.error('Failed to fetch pending reports:', error)
    } finally {
      setLoadingReports(false)
    }
  }

  const handleReportAction = async (action: 'approve' | 'reject') => {
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
        alert(`Report ${action}d successfully!`)
        setShowModal(false)
        setSelectedReport(null)
        setComments('')
        fetchPendingReports() // Refresh the list
      } else {
        const data = await response.json()
        alert(data.message || `Failed to ${action} report`)
      }
    } catch (error) {
      console.error(`Failed to ${action} report:`, error)
      alert(`Failed to ${action} report`)
    } finally {
      setActionLoading(false)
    }
  }

  const openReportModal = (report: PendingReport) => {
    setSelectedReport(report)
    setShowModal(true)
    setComments('')
  }

  if (loading || !user) {
    return <div className="min-h-screen flex items-center justify-center">Loading…</div>
  }

  return (
    <Layout title="Pending Reports">
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Pending Reports</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Review and approve user-submitted reports
          </p>
        </div>

        {/* Reports List */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Clock className="w-5 h-5 mr-2" />
              Reports Awaiting Approval ({reports.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loadingReports ? (
              <div className="text-center py-8">Loading reports...</div>
            ) : reports.length === 0 ? (
              <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                No pending reports found
              </div>
            ) : (
              <div className="space-y-4">
                {reports.map((report) => (
                  <div key={report.id} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                    <div className="flex items-center justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-3 mb-2">
                          <FileText className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                          <h3 className="font-medium text-gray-900 dark:text-white truncate">
                            {report.processing_details?.title || report.filename}
                          </h3>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(report.status)}`}>
                            {report.status.replace('_', ' ')}
                          </span>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm text-gray-600 dark:text-gray-400">
                          <div className="flex items-center">
                            <User className="w-4 h-4 mr-1" />
                            {report.users.full_name}
                          </div>
                          <div className="flex items-center">
                            <Calendar className="w-4 h-4 mr-1" />
                            {formatDate(report.report_date)}
                          </div>
                          <div className="flex items-center">
                            <DollarSign className="w-4 h-4 mr-1" />
                            {formatCurrency(report.total_amount)}
                          </div>
                          <div className="flex items-center">
                            <Clock className="w-4 h-4 mr-1" />
                            Submitted {formatDate(report.created_at)}
                          </div>
                        </div>

                        {report.processing_details?.description && (
                          <p className="text-sm text-gray-600 dark:text-gray-400 mt-2 line-clamp-2">
                            {report.processing_details.description}
                          </p>
                        )}
                      </div>

                      <div className="flex items-center space-x-2 ml-4">
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => openReportModal(report)}
                        >
                          <Eye className="w-4 h-4 mr-1" />
                          Review
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Review Modal */}
        {showModal && selectedReport && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
            <div className="bg-white dark:bg-gray-900 rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                    Review Report
                  </h2>
                  <button
                    onClick={() => setShowModal(false)}
                    className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                  >
                    <XCircle className="w-6 h-6" />
                  </button>
                </div>

                <div className="space-y-4">
                  {/* Report Details */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-gray-600 dark:text-gray-400">Title</label>
                      <p className="text-gray-900 dark:text-white">
                        {selectedReport.processing_details?.title || selectedReport.filename}
                      </p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-600 dark:text-gray-400">Submitted By</label>
                      <p className="text-gray-900 dark:text-white">{selectedReport.users.full_name}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-600 dark:text-gray-400">Report Date</label>
                      <p className="text-gray-900 dark:text-white">{formatDate(selectedReport.report_date)}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Amount</label>
                      <p className="text-gray-900 dark:text-white font-bold text-blue-600">
                        {formatCurrency(selectedReport.total_amount)}
                      </p>
                    </div>
                  </div>

                  {selectedReport.processing_details?.description && (
                    <div>
                      <label className="text-sm font-medium text-gray-600 dark:text-gray-400">Description</label>
                      <p className="text-gray-900 dark:text-white mt-1">
                        {selectedReport.processing_details.description}
                      </p>
                    </div>
                  )}

                  {/* Comments */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Comments (Optional)
                    </label>
                    <textarea
                      value={comments}
                      onChange={(e) => setComments(e.target.value)}
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                      placeholder="Add any comments or feedback..."
                    />
                  </div>

                  {/* Action Buttons */}
                  <div className="flex justify-end space-x-3 pt-4">
                    <Button
                      variant="secondary"
                      onClick={() => setShowModal(false)}
                      disabled={actionLoading}
                    >
                      Cancel
                    </Button>
                    <Button
                      variant="danger"
                      onClick={() => handleReportAction('reject')}
                      disabled={actionLoading}
                    >
                      <XCircle className="w-4 h-4 mr-1" />
                      {actionLoading ? 'Processing...' : 'Reject'}
                    </Button>
                    <Button
                      onClick={() => handleReportAction('approve')}
                      disabled={actionLoading}
                    >
                      <CheckCircle className="w-4 h-4 mr-1" />
                      {actionLoading ? 'Processing...' : 'Approve'}
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  )
}