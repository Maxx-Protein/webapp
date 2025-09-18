'use client'

import React, { useState } from 'react'
import { Button } from '@/components/ui/Button'
import { Card, CardContent } from '@/components/ui/Card'
import { Download, FileText, Loader2, CheckCircle } from 'lucide-react'
import { formatCurrency, formatDate } from '@/lib/utils-enhanced'
import type { Payment } from '@/types'

interface InvoiceManagerProps {
  payment: Payment
  onInvoiceGenerated?: (invoiceUrl: string) => void
}

export function InvoiceManager({ payment, onInvoiceGenerated }: InvoiceManagerProps) {
  const [isGenerating, setIsGenerating] = useState(false)
  const [hasInvoice, setHasInvoice] = useState(false)
  const [error, setError] = useState('')

  const generateInvoice = async () => {
    if (payment.payment_status !== 'completed') {
      setError('Invoice can only be generated for completed payments')
      return
    }

    setIsGenerating(true)
    setError('')

    try {
      const response = await fetch('/api/invoices/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ paymentId: payment.id })
      })

      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.style.display = 'none'
        a.href = url
        a.download = `Invoice-${payment.id}.pdf`
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)

        setHasInvoice(true)
        onInvoiceGenerated?.(url)
      } else {
        const data = await response.json()
        setError(data.message || 'Failed to generate invoice')
      }
    } catch {
      setError('Network error occurred while generating invoice')
    } finally {
      setIsGenerating(false)
    }
  }

  const downloadExistingInvoice = async () => {
    try {
      const response = await fetch(`/api/invoices/download?paymentId=${payment.id}`)

      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.style.display = 'none'
        a.href = url
        a.download = `Invoice-${payment.id}.pdf`
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)
      } else {
        setError('Failed to download invoice')
      }
    } catch {
      setError('Network error occurred while downloading invoice')
    }
  }

  return (
    <Card className="border-l-4 border-l-blue-500">
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="bg-blue-100 dark:bg-blue-900/20 p-2 rounded-lg">
              <FileText className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h3 className="font-medium text-gray-900 dark:text-white">
                Invoice
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Payment: {formatCurrency(payment.amount)} • {formatDate(payment.created_at)}
              </p>
              {payment.transaction_id && (
                <p className="text-xs text-gray-500 dark:text-gray-500">
                  Transaction: {payment.transaction_id}
                </p>
              )}
            </div>
          </div>

          <div className="flex items-center space-x-2">
            {payment.payment_status === 'completed' ? (
              <>
                <CheckCircle className="w-5 h-5 text-green-600" />
                {hasInvoice ? (
                  <Button
                    size="sm"
                    onClick={downloadExistingInvoice}
                    disabled={isGenerating}
                  >
                    <Download className="w-4 h-4 mr-1" />
                    Download
                  </Button>
                ) : (
                  <Button
                    size="sm"
                    onClick={generateInvoice}
                    disabled={isGenerating}
                  >
                    {isGenerating ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                        Generating...
                      </>
                    ) : (
                      <>
                        <FileText className="w-4 h-4 mr-1" />
                        Generate Invoice
                      </>
                    )}
                  </Button>
                )}
              </>
            ) : (
              <div className="text-sm text-gray-500 dark:text-gray-400">
                Payment not completed
              </div>
            )}
          </div>
        </div>

        {error && (
          <div className="mt-3 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
            <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
          </div>
        )}

        {payment.payment_status === 'completed' && !hasInvoice && (
          <div className="mt-3 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
            <p className="text-sm text-blue-600 dark:text-blue-400">
              <strong>Invoice Available:</strong> Your payment has been completed successfully. 
              You can now generate and download your invoice.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}