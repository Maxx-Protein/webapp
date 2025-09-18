'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import { useAuth } from '@/hooks/useAuth'
import { Layout } from '@/components/layout/Layout'
import { PaymentMethods } from '@/components/payments/PaymentMethods'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { ArrowLeft, CheckCircle, AlertCircle } from 'lucide-react'
import { formatCurrency } from '@/lib/utils-enhanced'
import type { PaymentMethod } from '@/types'

interface ReportDetails {
  id: string
  filename: string
  total_amount: number
  report_date: string
  status: string
  payment_status: string
}

export default function AdminPaymentPage() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const { reportId } = router.query
  
  const [report, setReport] = useState<ReportDetails | null>(null)
  const [loadingReport, setLoadingReport] = useState(true)
  const [error, setError] = useState('')
  const [isProcessingPayment, setIsProcessingPayment] = useState(false)
  const [paymentSuccess, setPaymentSuccess] = useState(false)

  useEffect(() => {
    if (!loading && !user) {
      router.push('/auth/login')
    } else if (!loading && user?.role !== 'admin') {
      router.push('/dashboard')
    }
  }, [user, loading, router])

  useEffect(() => {
    if (reportId && user) {
      fetchReportDetails()
    }
  }, [reportId, user])

  const fetchReportDetails = async () => {
    try {
      setLoadingReport(true)
      
      const response = await fetch(`/api/reports/${reportId}`, {
        headers: {
          'Content-Type': 'application/json'
        }
      })

      if (response.ok) {
        const data = await response.json()
        setReport(data.report)
      } else {
        setError('Failed to load report details')
      }
    } catch (error) {
      console.error('Failed to fetch report:', error)
      setError('Network error occurred')
    } finally {
      setLoadingReport(false)
    }
  }

  const handleMethodSelect = () => {
    // Method selection is handled by the PaymentMethods component
  }

  const handlePaymentComplete = async (paymentData: { 
    method: PaymentMethod
    transactionId?: string
    proofUrl?: string 
  }) => {
    if (!report) return

    setIsProcessingPayment(true)
    
    try {
      const response = await fetch('/api/payments/process', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          reportId: report.id,
          amount: report.total_amount,
          paymentMethod: paymentData.method,
          transactionId: paymentData.transactionId,
          proofUrl: paymentData.proofUrl
        })
      })

      if (response.ok) {
        setPaymentSuccess(true)
        
        // Trigger dashboard refresh
        window.dispatchEvent(new CustomEvent('refreshAdminDashboard'))
        
        setTimeout(() => {
          router.push('/admin')
        }, 3000)
      } else {
        const data = await response.json()
        setError(data.message || 'Payment processing failed')
      }
    } catch (error) {
      console.error('Payment processing error:', error)
      setError('Payment processing failed. Please try again.')
    } finally {
      setIsProcessingPayment(false)
    }
  }

  const handleGoBack = () => {
    router.back()
  }

  if (loading || loadingReport) {
    return (
      <Layout title="Payment">
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-gray-600">Loading...</div>
        </div>
      </Layout>
    )
  }

  if (error && !report) {
    return (
      <Layout title="Payment">
        <div className="max-w-2xl mx-auto p-6">
          <Card className="border-red-200 bg-red-50 dark:bg-red-900/20 dark:border-red-800">
            <CardContent className="p-6 text-center">
              <AlertCircle className="w-12 h-12 text-red-600 dark:text-red-400 mx-auto mb-4" />
              <h2 className="text-lg font-semibold text-red-800 dark:text-red-200 mb-2">
                Error Loading Report
              </h2>
              <p className="text-red-700 dark:text-red-300 mb-4">{error}</p>
              <Button onClick={handleGoBack} variant="secondary">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Go Back
              </Button>
            </CardContent>
          </Card>
        </div>
      </Layout>
    )
  }

  if (paymentSuccess) {
    return (
      <Layout title="Payment Successful">
        <div className="max-w-2xl mx-auto p-6">
          <Card className="border-green-200 bg-green-50 dark:bg-green-900/20 dark:border-green-800">
            <CardContent className="p-6 text-center">
              <CheckCircle className="w-16 h-16 text-green-600 dark:text-green-400 mx-auto mb-4" />
              <h1 className="text-2xl font-bold text-green-800 dark:text-green-200 mb-2">
                Payment Successful!
              </h1>
              <p className="text-green-700 dark:text-green-300 mb-4">
                Your payment has been processed successfully.
              </p>
              <div className="text-sm text-green-600 dark:text-green-400">
                Redirecting to dashboard in 3 seconds...
              </div>
            </CardContent>
          </Card>
        </div>
      </Layout>
    )
  }

  if (!report) {
    return (
      <Layout title="Payment">
        <div className="max-w-2xl mx-auto p-6">
          <Card>
            <CardContent className="p-6 text-center">
              <p className="text-gray-600 dark:text-gray-400">Report not found</p>
              <Button onClick={handleGoBack} variant="secondary" className="mt-4">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Go Back
              </Button>
            </CardContent>
          </Card>
        </div>
      </Layout>
    )
  }

  return (
    <Layout title="Complete Payment">
      <div className="max-w-4xl mx-auto p-6 space-y-6">
        <div className="flex items-center justify-between">
          <Button onClick={handleGoBack} variant="secondary">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Complete Payment</h1>
          <div></div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Report Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-600 dark:text-gray-400">Report File</label>
                <p className="text-gray-900 dark:text-white">{report.filename}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600 dark:text-gray-400">Report Date</label>
                <p className="text-gray-900 dark:text-white">{report.report_date}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600 dark:text-gray-400">Status</label>
                <p className="text-gray-900 dark:text-white capitalize">{report.status.replace('_', ' ')}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Amount</label>
                <p className="text-2xl font-bold text-blue-600">{formatCurrency(report.total_amount)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <div>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
            Payment Method
          </h2>
          <PaymentMethods
            amount={report.total_amount}
            onMethodSelect={handleMethodSelect}
            onPaymentComplete={handlePaymentComplete}
            disabled={isProcessingPayment}
          />
        </div>

        {error && (
          <Card className="border-red-200 bg-red-50 dark:bg-red-900/20 dark:border-red-800">
            <CardContent className="p-4">
              <div className="flex items-center">
                <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 mr-3" />
                <p className="text-red-800 dark:text-red-200">{error}</p>
              </div>
            </CardContent>
          </Card>
        )}

        <Card className="bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
          <CardContent className="p-4">
            <div className="flex items-start">
              <AlertCircle className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5 mr-3" />
              <div className="text-sm text-blue-800 dark:text-blue-200">
                <p className="font-medium mb-1">Administrator Payment Information:</p>
                <ul className="list-disc list-inside space-y-1">
                  <li>As an administrator, you have full payment processing privileges</li>
                  <li>Your payment will be processed immediately with highest priority</li>
                  <li>All system records will be updated automatically</li>
                  <li>Users and managers will receive payment completion notifications</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  )
}