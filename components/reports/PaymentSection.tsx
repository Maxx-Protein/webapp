'use client'

import React, { useState } from 'react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { CreditCard, Lock } from 'lucide-react'

interface PaymentSectionProps {
  amount: number
  reportData: {
    title?: string
    [key: string]: unknown
  }
  onPaymentComplete: (paymentId: string) => void
  isProcessing?: boolean
}

export function PaymentSection({ amount, reportData, onPaymentComplete, isProcessing }: PaymentSectionProps) {
  const [paymentMethod, setPaymentMethod] = useState<'card' | 'upi' | 'netbanking'>('card')
  const [isProcessingPayment, setIsProcessingPayment] = useState(false)

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR'
    }).format(amount)
  }

  const handlePayment = async () => {
    setIsProcessingPayment(true)
    
    try {
      // TODO: Integrate with real payment gateway
      // For now, this will need to be implemented based on your payment provider
      // Examples: Razorpay, Stripe, PayPal, etc.
      
      // Placeholder for payment integration
      console.log('Payment processing...', { amount, paymentMethod, reportData })
      
      // Generate payment ID (this should come from your payment gateway)
      const paymentId = 'pay_' + Math.random().toString(36).substr(2, 9).toUpperCase()
      
      onPaymentComplete(paymentId)
      
    } catch (error) {
      console.error('Payment failed:', error)
      alert('Payment failed. Please try again.')
    } finally {
      setIsProcessingPayment(false)
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <CreditCard className="w-5 h-5 mr-2" />
            Payment Details
          </CardTitle>
        </CardHeader>
        <CardContent>
          {/* Amount Summary */}
          <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 mb-6">
            <div className="flex justify-between items-center mb-2">
              <span className="text-gray-600 dark:text-gray-400">Report Title:</span>
              <span className="font-medium text-gray-900 dark:text-white">{reportData.title}</span>
            </div>
            <div className="flex justify-between items-center mb-2">
              <span className="text-gray-600 dark:text-gray-400">Processing Fee:</span>
              <span className="font-medium text-gray-900 dark:text-white">{formatCurrency(amount)}</span>
            </div>
            <div className="border-t pt-2 mt-2">
              <div className="flex justify-between items-center">
                <span className="text-lg font-semibold text-gray-900 dark:text-white">Total Amount:</span>
                <span className="text-xl font-bold text-blue-600">{formatCurrency(amount)}</span>
              </div>
            </div>
          </div>

          {/* Payment Method Selection */}
          <div className="mb-6">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
              Select Payment Method
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <button
                onClick={() => setPaymentMethod('card')}
                className={`p-4 border rounded-lg text-left ${
                  paymentMethod === 'card'
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                    : 'border-gray-300 dark:border-gray-600 hover:border-gray-400'
                }`}
              >
                <CreditCard className="w-6 h-6 text-blue-600 mb-2" />
                <div className="font-medium text-gray-900 dark:text-white">Credit/Debit Card</div>
                <div className="text-sm text-gray-500 dark:text-gray-400">Visa, MasterCard, RuPay</div>
              </button>
              
              <button
                onClick={() => setPaymentMethod('upi')}
                className={`p-4 border rounded-lg text-left ${
                  paymentMethod === 'upi'
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                    : 'border-gray-300 dark:border-gray-600 hover:border-gray-400'
                }`}
              >
                <div className="w-6 h-6 bg-orange-500 rounded mb-2 flex items-center justify-center">
                  <span className="text-white text-xs font-bold">UPI</span>
                </div>
                <div className="font-medium text-gray-900 dark:text-white">UPI Payment</div>
                <div className="text-sm text-gray-500 dark:text-gray-400">Google Pay, PhonePe, Paytm</div>
              </button>
              
              <button
                onClick={() => setPaymentMethod('netbanking')}
                className={`p-4 border rounded-lg text-left ${
                  paymentMethod === 'netbanking'
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                    : 'border-gray-300 dark:border-gray-600 hover:border-gray-400'
                }`}
              >
                <div className="w-6 h-6 bg-green-500 rounded mb-2 flex items-center justify-center">
                  <span className="text-white text-xs font-bold">NB</span>
                </div>
                <div className="font-medium text-gray-900 dark:text-white">Net Banking</div>
                <div className="text-sm text-gray-500 dark:text-gray-400">All major banks</div>
              </button>
            </div>
          </div>

          {/* Security Notice */}
          <div className="flex items-center p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg mb-6">
            <Lock className="w-5 h-5 text-green-600 dark:text-green-400 mr-3" />
            <div>
              <p className="text-sm font-medium text-green-800 dark:text-green-200">
                Secure Payment
              </p>
              <p className="text-xs text-green-600 dark:text-green-300">
                Your payment information is encrypted and secure
              </p>
            </div>
          </div>

          {/* Payment Button */}
          <Button
            onClick={handlePayment}
            disabled={isProcessingPayment || isProcessing}
            className="w-full py-3 text-lg"
          >
            {isProcessingPayment ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Processing Payment...
              </>
            ) : (
              <>
                <Lock className="w-4 h-4 mr-2" />
                Pay {formatCurrency(amount)}
              </>
            )}
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
