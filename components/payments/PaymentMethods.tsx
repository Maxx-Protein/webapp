'use client'

import React, { useState } from 'react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { 
  CreditCard, 
  Smartphone, 
  Building2, 
  FileImage,
  Check,
  AlertCircle,
  ExternalLink,
  Upload
} from 'lucide-react'
import { formatCurrency } from '@/lib/utils-enhanced'
import type { PaymentMethod } from '@/types'

interface PaymentMethodsProps {
  amount: number
  reportId: string
  onMethodSelect: (method: PaymentMethod) => void
  onPaymentComplete: (data: { method: PaymentMethod; transactionId?: string; proofUrl?: string }) => void
  disabled?: boolean
}

export function PaymentMethods({ 
  amount, 
  reportId,
  onMethodSelect, 
  onPaymentComplete, 
  disabled = false 
}: PaymentMethodsProps) {
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [proofFile, setProofFile] = useState<File | null>(null)
  const [uploadingProof, setUploadingProof] = useState(false)
  const [transactionId, setTransactionId] = useState('')
  const [notes, setNotes] = useState('')
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split('T')[0])
  const [error, setError] = useState('')

  const paymentMethods = [
    {
      id: 'credit_card' as PaymentMethod,
      name: 'Credit Card',
      description: 'Pay using your credit or debit card',
      icon: CreditCard,
      color: 'bg-blue-500 text-white',
      isOnline: true
    },
    {
      id: 'upi' as PaymentMethod,
      name: 'UPI Payment',
      description: 'Pay using UPI apps like PhonePe, Google Pay, Paytm',
      icon: Smartphone,
      color: 'bg-green-500 text-white',
      isOnline: true
    },
    {
      id: 'net_banking' as PaymentMethod,
      name: 'Net Banking',
      description: 'Pay using your bank account',
      icon: Building2,
      color: 'bg-purple-500 text-white',
      isOnline: true
    },
    {
      id: 'offline' as PaymentMethod,
      name: 'Offline Payment',
      description: 'Pay via bank transfer, cash, or other offline methods',
      icon: FileImage,
      color: 'bg-orange-500 text-white',
      isOnline: false
    }
  ]

  const handleMethodSelect = (method: PaymentMethod) => {
    setSelectedMethod(method)
    onMethodSelect(method)
  }

  const handleOnlinePayment = async (method: PaymentMethod) => {
    setIsProcessing(true)
    
    try {
      // For online payments, we still need proof upload
      // Generate a unique transaction reference
      const transactionRef = `REF_${method.toUpperCase()}_${Date.now()}`
      
      // Set transaction ID and switch to offline mode to show proof upload
      setTransactionId(transactionRef)
      setSelectedMethod('offline')
      setIsProcessing(false)
    } catch (error) {
      console.error('Payment failed:', error)
      setIsProcessing(false)
    }
  }

  const handleProofUpload = async () => {
    if (!proofFile || !reportId) return
    
    setUploadingProof(true)
    
    try {
      // First upload the proof file
      const formData = new FormData()
      formData.append('file', proofFile)
      formData.append('reportId', reportId)
      
      const uploadResponse = await fetch('/api/payments/upload-proof', {
        method: 'POST',
        body: formData
      })
      
      if (!uploadResponse.ok) {
        const errorData = await uploadResponse.json().catch(() => ({}))
        throw new Error(errorData.message || `Upload failed (${uploadResponse.status})`)
      }
      
      const uploadResult = await uploadResponse.json()
      
      if (!uploadResult.success) {
        throw new Error(uploadResult.message || 'Upload failed')
      }

      // Create payment record in database
      const paymentData = {
        reportId,
        method: selectedMethod === 'offline' ? 'offline' : selectedMethod,
        amount,
        transactionId: transactionId || undefined,
        proofUrl: uploadResult.data.fileUrl,
        notes: notes || undefined,
        paymentDate: paymentDate
      }

      const paymentResponse = await fetch('/api/payments/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(paymentData)
      })

      if (!paymentResponse.ok) {
        const errorData = await paymentResponse.json().catch(() => ({}))
        throw new Error(errorData.message || `Payment creation failed (${paymentResponse.status})`)
      }

      const paymentResult = await paymentResponse.json()
      
      if (!paymentResult.success) {
        throw new Error(paymentResult.message || 'Payment creation failed')
      }
      
      onPaymentComplete({
        method: selectedMethod || 'offline',
        transactionId,
        proofUrl: uploadResult.data.fileUrl
      })
      
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
    } catch (error) {
      console.error('Payment process failed:', error)
      setError(error instanceof Error ? error.message : 'Payment failed')
    } finally {
      setUploadingProof(false)
    }
  }

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      // Validate file type and size
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'application/pdf']
      const maxSize = 5 * 1024 * 1024 // 5MB
      
      if (!allowedTypes.includes(file.type)) {
        alert('Please select a valid file (JPG, PNG, or PDF)')
        return
      }
      
      if (file.size > maxSize) {
        alert('File size must be less than 5MB')
        return
      }
      
      setProofFile(file)
    }
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          Choose Payment Method
        </h2>
        <p className="text-xl font-semibold text-blue-600 dark:text-blue-400">
          Amount to Pay: {formatCurrency(amount)}
        </p>
      </div>

      {/* Payment Method Selection */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {paymentMethods.map((method) => {
          const Icon = method.icon
          const isSelected = selectedMethod === method.id
          
          return (
            <Card 
              key={method.id}
              className={`cursor-pointer transition-all duration-200 hover:shadow-lg ${
                isSelected 
                  ? 'ring-2 ring-blue-500 border-blue-500' 
                  : 'hover:border-gray-400'
              }`}
              onClick={() => !disabled && handleMethodSelect(method.id)}
            >
              <CardContent className="p-6">
                <div className="flex items-start space-x-4">
                  <div className={`p-3 rounded-lg ${method.color}`}>
                    <Icon className="w-6 h-6" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900 dark:text-white mb-1">
                      {method.name}
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {method.description}
                    </p>
                    {isSelected && (
                      <div className="mt-2 flex items-center text-blue-600 dark:text-blue-400">
                        <Check className="w-4 h-4 mr-2" />
                        <span className="text-sm font-medium">Selected</span>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Online Payment Process */}
      {selectedMethod && ['credit_card', 'upi', 'net_banking'].includes(selectedMethod) && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <ExternalLink className="w-5 h-5 mr-2" />
              Complete Payment
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center space-y-4">
              <p className="text-gray-600 dark:text-gray-400">
                You will be redirected to a secure payment gateway to complete your payment.
              </p>
              <Button
                onClick={() => handleOnlinePayment(selectedMethod)}
                disabled={isProcessing || disabled}
                size="lg"
                className="w-full bg-blue-600 hover:bg-blue-700"
              >
                {isProcessing ? 'Processing...' : `Pay ${formatCurrency(amount)}`}
              </Button>
              
              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                <div className="flex items-start">
                  <AlertCircle className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5 mr-3" />
                  <div className="text-sm text-blue-800 dark:text-blue-200">
                    <p className="font-medium mb-1">Payment Requirements (All Methods):</p>
                    <ul className="list-disc list-inside space-y-1">
                      <li>Payment proof upload is required for ALL payment methods</li>
                      <li>Upload receipt/screenshot after completing payment</li>
                      <li>Manager verification required before confirmation</li>
                      <li>Keep your transaction ID for reference</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Payment/Proof Upload Process - All methods require proof */}
      {selectedMethod === 'offline' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Upload className="w-5 h-5 mr-2" />
              Upload Payment Proof
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <Card className="border-green-200 bg-green-50 dark:bg-green-900/20 dark:border-green-800">
                <CardContent className="p-4">
                  <div className="flex items-start">
                    <div className="flex-shrink-0">
                      <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                        <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                    </div>
                    <div className="ml-3 flex-1">
                      <h4 className="text-sm font-medium text-green-800 dark:text-green-200 mb-1">
                        Payment Processing Instructions
                      </h4>
                      <div className="text-sm text-green-700 dark:text-green-300">
                        <p className="mb-2">After uploading your payment proof:</p>
                        <ul className="list-disc list-inside space-y-1 text-xs">
                          <li>Your payment will be marked as &ldquo;Pending Review&rdquo;</li>
                          <li>A manager will verify your payment proof within 24 hours</li>
                          <li>You&rsquo;ll receive a notification once approved</li>
                          <li>Your dashboard will reflect the updated status</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Payment Date Input */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Payment Date *
                </label>
                <input
                  type="date"
                  value={paymentDate}
                  onChange={(e) => setPaymentDate(e.target.value)}
                  max={new Date().toISOString().split('T')[0]}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                  required
                />
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  When was this payment made?
                </p>
              </div>

              {/* Transaction ID Input */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Transaction ID (Optional)
                </label>
                <input
                  type="text"
                  value={transactionId}
                  onChange={(e) => setTransactionId(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                  placeholder="Enter transaction/reference ID"
                />
              </div>

              {/* Notes Input */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Payment Notes (Optional)
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                  placeholder="Add any notes about your payment method or details"
                />
              </div>

              {/* File Upload */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Payment Proof *
                </label>
                <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-6 text-center">
                  <input
                    type="file"
                    accept=".jpg,.jpeg,.png,.pdf"
                    onChange={handleFileSelect}
                    className="hidden"
                    id="proof-upload"
                  />
                  <label htmlFor="proof-upload" className="cursor-pointer">
                    <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Click to upload payment proof
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      Supports JPG, PNG, PDF (max 5MB)
                    </p>
                  </label>
                  
                  {proofFile && (
                    <div className="mt-4 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                      <p className="text-sm text-green-800 dark:text-green-200">
                        📎 {proofFile.name} ({Math.round(proofFile.size / 1024)} KB)
                      </p>
                    </div>
                  )}
                </div>
              </div>

              <Button
                onClick={handleProofUpload}
                disabled={!proofFile || uploadingProof || disabled}
                size="lg"
                className="w-full bg-blue-600 hover:bg-blue-700"
              >
                {uploadingProof ? 'Uploading...' : 'Submit Payment Proof & Complete'}
              </Button>
              
              {error && (
                <div className="mt-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                  <p className="text-sm text-red-800 dark:text-red-200 flex items-center">
                    <AlertCircle className="w-4 h-4 mr-2" />
                    {error}
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}