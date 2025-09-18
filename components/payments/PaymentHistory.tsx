'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardTitle, CardContent } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Alert } from '@/components/ui/Alert'
import { 
  Clock, 
  CheckCircle, 
  XCircle, 
  Download, 
  Eye,
  CreditCard,
  Smartphone,
  Building2,
  FileImage,
  Search,
  Calendar,
  RefreshCw
} from 'lucide-react'
import { formatCurrency, formatDate } from '@/lib/utils-enhanced'
import type { Payment, PaymentProof } from '@/types'

interface PaymentHistoryProps {
  onViewProof: (proof: PaymentProof) => void
  onDownloadProof: (proof: PaymentProof) => void
}

export function PaymentHistory({ onViewProof, onDownloadProof }: PaymentHistoryProps) {
  const [payments, setPayments] = useState<Payment[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [methodFilter, setMethodFilter] = useState('all')

  useEffect(() => {
    fetchPaymentHistory()
  }, [])

  const fetchPaymentHistory = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const response = await fetch('/api/payments/history', {
        headers: {
          'Content-Type': 'application/json'
        }
      })
      
      if (response.ok) {
        const data = await response.json()
        setPayments(data.payments || [])
      } else {
        // Only show error for authentication or server issues
        if (response.status === 401) {
          setError('Session expired. Please login again.')
        } else if (response.status >= 500) {
          setError('Server error. Please try again later.')
        } else {
          // For other errors, just log them and show empty state
          console.warn('Failed to fetch payments:', response.status)
          setPayments([])
        }
      }
    } catch (error) {
      console.error('Failed to fetch payment history:', error)
      // Only show error for network issues, not for empty data
      setError('Network error. Please check your connection and try again.')
    } finally {
      setLoading(false)
    }
  }

  const getPaymentMethodIcon = (method: string) => {
    const icons = {
      credit_card: CreditCard,
      upi: Smartphone,
      net_banking: Building2,
      offline: FileImage
    }
    const Icon = icons[method as keyof typeof icons] || FileImage
    return <Icon className="w-4 h-4" />
  }

  const getPaymentMethodName = (method: string) => {
    const names = {
      credit_card: 'Credit Card',
      upi: 'UPI',
      net_banking: 'Net Banking',
      offline: 'Offline'
    }
    return names[method as keyof typeof names] || method
  }

  const filteredPayments = payments.filter(payment => {
    const matchesSearch = !searchTerm || 
      payment.report?.filename.toLowerCase().includes(searchTerm.toLowerCase()) ||
      payment.transaction_id?.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesStatus = statusFilter === 'all' || payment.payment_status === statusFilter
    const matchesMethod = methodFilter === 'all' || payment.payment_method === methodFilter
    
    return matchesSearch && matchesStatus && matchesMethod
  })

  const getStatusIcon = (status: string) => {
    const icons = {
      pending: Clock,
      processing: Clock,
      completed: CheckCircle,
      failed: XCircle,
      refunded: XCircle,
      partial: Clock
    }
    const Icon = icons[status as keyof typeof icons] || Clock
    return <Icon className="w-4 h-4" />
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="loading-glass">
          <RefreshCw className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400">Loading payment history...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="space-y-4">
        <Alert
          variant="error"
          title="Error Loading Payments"
          message={error}
          glass
          dismissible
          onClose={() => setError(null)}
        />
        <div className="text-center">
          <Button 
            variant="primary" 
            onClick={fetchPaymentHistory}
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
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <CardTitle className="text-2xl font-bold text-gray-900 dark:text-white">Payment History</CardTitle>
            <p className="text-gray-600 dark:text-gray-400">
              Track all your payments and proof submissions
            </p>
          </div>
          
          <div className="flex flex-wrap gap-3">
            {/* Search */}
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search payments..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 border border-white/20 rounded-lg bg-white/10 backdrop-blur-md dark:bg-black/10 text-gray-900 dark:text-white placeholder-gray-500"
              />
            </div>
            
            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 border border-white/20 rounded-lg bg-white/10 backdrop-blur-md dark:bg-black/10 text-gray-900 dark:text-white"
            >
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="completed">Completed</option>
              <option value="failed">Failed</option>
              <option value="partial">Partial</option>
            </select>
            
            {/* Method Filter */}
            <select
              value={methodFilter}
              onChange={(e) => setMethodFilter(e.target.value)}
              className="px-3 py-2 border border-white/20 rounded-lg bg-white/10 backdrop-blur-md dark:bg-black/10 text-gray-900 dark:text-white"
            >
              <option value="all">All Methods</option>
              <option value="credit_card">Credit Card</option>
              <option value="upi">UPI</option>
              <option value="net_banking">Net Banking</option>
              <option value="offline">Offline</option>
            </select>
            
            <Button
              variant="primary"
              size="sm"
              onClick={fetchPaymentHistory}
              glass
              animated
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh
            </Button>
          </div>
        </div>
      </div>

      {/* Payment Cards with staggered animations */}
      <div className="space-y-4">
        {filteredPayments.length === 0 ? (
          <Card glass className="animate-fade-up">
            <CardContent className="p-8 text-center">
              <FileImage className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <CardTitle className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                No Payments Found
              </CardTitle>
              <p className="text-gray-600 dark:text-gray-400">
                {searchTerm || statusFilter !== 'all' || methodFilter !== 'all' 
                  ? 'Try adjusting your filters to see more results.'
                  : 'You haven\'t made any payments yet.'}
              </p>
            </CardContent>
          </Card>
        ) : (
          filteredPayments.map((payment, index) => {
            const statusIcon = getStatusIcon(payment.payment_status)
            
            return (
              <Card 
                key={payment.id} 
                glass 
                hover 
                className={`animate-fade-up animate-fade-up-delay-${Math.min(index + 1, 4)}`}
              >
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 space-y-3">
                      {/* Header */}
                      <div className="flex items-start justify-between">
                        <div>
                          <CardTitle className="font-semibold text-gray-900 dark:text-white">
                            {payment.report?.filename || 'Unknown Report'}
                          </CardTitle>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            Payment ID: {payment.id.slice(0, 8)}...
                          </p>
                        </div>
                        
                        <div className="text-right">
                          <p className="text-lg font-bold text-gray-900 dark:text-white">
                            {formatCurrency(payment.amount)}
                          </p>
                          {payment.remaining_amount > 0 && (
                            <p className="text-sm text-orange-600 dark:text-orange-400">
                              Remaining: {formatCurrency(payment.remaining_amount)}
                            </p>
                          )}
                        </div>
                      </div>
                      
                      {/* Status and Method */}
                      <div className="flex items-center gap-4">
                        <Badge glass variant={payment.payment_status === 'completed' ? 'success' : payment.payment_status === 'failed' ? 'danger' : 'warning'}>
                          {statusIcon}
                          <span className="ml-1">{payment.payment_status.toUpperCase()}</span>
                        </Badge>
                        
                        <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                          {getPaymentMethodIcon(payment.payment_method)}
                          <span className="ml-1">{getPaymentMethodName(payment.payment_method)}</span>
                        </div>
                        
                        <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                          <Calendar className="w-4 h-4 mr-1" />
                          {formatDate(payment.created_at)}
                        </div>
                      </div>
                      
                      {/* Transaction ID */}
                      {payment.transaction_id && (
                        <div className="text-sm text-gray-600 dark:text-gray-400">
                          Transaction ID: <span className="font-mono">{payment.transaction_id}</span>
                        </div>
                      )}
                      
                      {/* Payment Proofs */}
                      {payment.payment_proofs && payment.payment_proofs.length > 0 && (
                        <div className="space-y-2">
                          <CardTitle className="text-sm font-medium text-gray-700 dark:text-gray-300">
                            Payment Proofs:
                          </CardTitle>
                          <div className="flex flex-wrap gap-2">
                            {payment.payment_proofs.map((proof) => (
                              <div 
                                key={proof.id}
                                className="flex items-center gap-2 glass rounded-lg px-3 py-2"
                              >
                                <Badge glass variant={proof.status === 'approved' ? 'success' : proof.status === 'rejected' ? 'danger' : 'warning'}>
                                  {proof.status.replace('_', ' ').toUpperCase()}
                                </Badge>
                                
                                <div className="flex gap-1">
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => onViewProof(proof)}
                                    glass
                                  >
                                    <Eye className="w-3 h-3" />
                                  </Button>
                                  
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => onDownloadProof(proof)}
                                    glass
                                  >
                                    <Download className="w-3 h-3" />
                                  </Button>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })
        )}
      </div>
    </div>
  )
}