'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import { useAuth } from '@/hooks/useAuth'
import { Layout } from '@/components/layout/Layout'
import { PaymentMethods } from '@/components/payments/PaymentMethods'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { ArrowLeft, CheckCircle, AlertCircle, FileText } from 'lucide-react'
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

export default function PaymentPage() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const { reportId } = router.query
  
  const [report, setReport] = useState<ReportDetails | null>(null)
  const [loadingReport, setLoadingReport] = useState(true)
  const [error, setError] = useState('')
  const [paymentOptionsReady, setPaymentOptionsReady] = useState(false)

  const [isProcessingPayment, setIsProcessingPayment] = useState(false)
  const [paymentSuccess, setPaymentSuccess] = useState(false)

  useEffect(() => {
    if (!loading && !user) {
      router.push('/auth/login')
    } else if (!loading && user?.role !== 'user') {
      router.push('/dashboard')
    }
  }, [user, loading, router])

  useEffect(() => {
    console.log('Payment page mounted. Router query:', router.query)
    console.log('ReportId from query:', reportId)
    console.log('User:', user)
    console.log('Loading:', loading)
    
    if (user && !loading) {
      if (reportId) {
        console.log('Calling fetchReportDetails with reportId:', reportId)
        fetchReportDetails()
      } else {
        console.log('No reportId provided, fetching most recent report')
        // If no reportId provided, try to get the most recent report
        fetchMostRecentReport()
      }
    }
  }, [reportId, user, loading])

  const fetchMostRecentReport = async () => {
    try {
      setLoadingReport(true)
      
      console.log('Fetching most recent report for user...')
      const response = await fetch('/api/user/recent-reports', {
        headers: {
          'Content-Type': 'application/json'
        }
      })

      console.log('Recent reports response status:', response.status)
      if (response.ok) {
        const data = await response.json()
        console.log('Recent reports data:', data)
        
        if (data.success && data.reports && data.reports.length > 0) {
          const mostRecentReport = data.reports[0]
          console.log('Using most recent report:', mostRecentReport)
          
          // Set the report immediately
          setReport(mostRecentReport)
          setPaymentOptionsReady(true)
          setError('')
          
          // Update the URL with the report ID (but don't depend on it)
          router.replace(`/user/payment?reportId=${mostRecentReport.id}`, undefined, { shallow: true })
        } else {
          console.log('No reports found in recent reports API')
          setError('No reports found. Please upload a report first.')
        }
      } else {
        console.error('Failed to fetch recent reports:', response.status)
        if (response.status === 401) {
          setError('Session expired. Please log in again.')
        } else {
          setError('Failed to load recent reports. Please try again or upload a new report.')
        }
      }
    } catch (error) {
      console.error('Failed to fetch recent reports:', error)
      setError('Failed to load recent reports')
    } finally {
      setLoadingReport(false)
    }
  }

  const fetchReportDetails = async () => {
    try {
      setLoadingReport(true)
      setPaymentOptionsReady(false)
      setError('')
      
      console.log('Fetching report details for ID:', reportId)
      
      // Validate reportId before making API call
      if (!reportId || typeof reportId !== 'string') {
        console.warn('Invalid reportId, falling back to most recent report')
        await fetchMostRecentReport()
        return
      }
      
      const response = await fetch(`/api/reports/${reportId}`, {
        headers: {
          'Content-Type': 'application/json'
        }
      })

      console.log('Report fetch response:', response.status, response.ok)

      if (response.ok) {
        const data = await response.json()
        const reportData = data.report
        console.log('Report data received:', reportData)
        
        if (reportData) {
          setReport(reportData)
          // Allow payment for all reports regardless of approval status
          setPaymentOptionsReady(true)
          setError('') // Clear any previous errors
        } else {
          console.warn('No report data in successful response')
          setError('Report data not found in response')
        }
      } else {
        const errorData = await response.json().catch(() => ({}))
        console.error('Failed to fetch report:', response.status, errorData)
        
        if (response.status === 404) {
          console.log('Report not found, trying to get most recent report instead')
          await fetchMostRecentReport()
          return
        } else if (response.status === 403) {
          setError('You do not have permission to access this report.')
        } else {
          setError(errorData.message || `Failed to load report details (${response.status})`)
        }
      }
    } catch (error) {
      console.error('Failed to fetch report:', error)
      setError('Network error occurred. Please check your connection and try again.')
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
        
        // Show enhanced success message
        const successToast = document.createElement('div')
        successToast.className = 'fixed top-4 right-4 bg-green-500/90 backdrop-blur-md text-white px-6 py-4 rounded-xl shadow-xl z-50 animate-slide-down'
        successToast.innerHTML = `
          <div class="flex items-center space-x-3">
            <div class="flex-shrink-0">
              <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
              </svg>
            </div>
            <div>
              <p class="font-semibold">Payment Submitted Successfully!</p>
              <p class="text-sm opacity-90">Your payment has been sent to manager for review</p>
            </div>
          </div>
        `
        document.body.appendChild(successToast)
        
        // Auto-remove toast after 5 seconds with slide up animation
        setTimeout(() => {
          successToast.className = successToast.className.replace('animate-slide-down', 'animate-slide-up')
          setTimeout(() => {
            if (document.body.contains(successToast)) {
              document.body.removeChild(successToast)
            }
          }, 500)
        }, 5000)
        
        // Trigger dashboard refresh
        window.dispatchEvent(new CustomEvent('refreshDashboard'))
        
        setTimeout(() => {
          router.push('/user')
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
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <div className="text-gray-600 dark:text-gray-400">
              {loading ? 'Loading user data...' : 'Loading report details...'}
            </div>
            {reportId && (
              <div className="text-sm text-gray-500 dark:text-gray-500 mt-2">
                Report ID: {reportId}
              </div>
            )}
          </div>
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
                Payment Submitted!
              </h1>
              <p className="text-green-700 dark:text-green-300 mb-4">
                Your payment has been sent to manager for review.
              </p>
              <div className="text-sm text-green-600 dark:text-green-400">
                Redirecting in 3 seconds...
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
              <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                No Report Found
              </h2>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                No reports found for payment. Please upload a report first.
              </p>
              <div className="space-y-2">
                <Button onClick={() => router.push('/user/upload')} className="w-full">
                  <FileText className="w-4 h-4 mr-2" />
                  Upload Report
                </Button>
                <Button onClick={handleGoBack} variant="secondary" className="w-full">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Go Back
                </Button>
              </div>
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
          {paymentOptionsReady ? (
            <div>
              {/* Status information card */}
                      {report.status !== 'approved' && (
                <Card className="border-green-200 bg-green-50 dark:bg-green-900/20 dark:border-green-800 mb-4">
                  <CardContent className="p-4">
                    <div className="flex items-center">
                      <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400 mr-3" />
                      <div className="flex-1">
                        <h4 className="text-sm font-medium text-green-800 dark:text-green-200">Report Ready for Payment</h4>
                        <p className="text-sm text-green-700 dark:text-green-300">
                          Your report has been uploaded successfully. Please complete the payment below.
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
              
              {/* Payment methods */}
              <PaymentMethods
                amount={report.total_amount}
                reportId={report.id}
                onMethodSelect={handleMethodSelect}
                onPaymentComplete={handlePaymentComplete}
                disabled={isProcessingPayment}
              />
            </div>
          ) : (
            <Card className="border-amber-200 bg-amber-50 dark:bg-amber-900/20 dark:border-amber-800">
              <CardContent className="p-6 text-center">
                <AlertCircle className="w-12 h-12 text-amber-600 dark:text-amber-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-amber-800 dark:text-amber-200 mb-2">
                  Loading Payment Options
                </h3>
                <p className="text-amber-700 dark:text-amber-300">
                  Please wait while we load your payment options...
                </p>
              </CardContent>
            </Card>
          )}
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

        <Card className="bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800">
          <CardContent className="p-4">
            <div className="flex items-start">
              <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400 mt-0.5 mr-3" />
              <div className="text-sm text-green-800 dark:text-green-200">
                <p className="font-medium mb-1">Payment Instructions:</p>
                <ul className="list-disc list-inside space-y-1">
                  <li>Complete payment using any of the methods above</li>
                  <li>Upload payment proof (screenshot/PDF) for verification</li>
                  <li>Your payment will be verified by our team</li>
                  <li>You will receive confirmation once payment is approved</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  )
}