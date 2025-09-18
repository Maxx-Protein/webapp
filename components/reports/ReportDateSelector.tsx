'use client'

import React, { useState } from 'react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Calendar, Send } from 'lucide-react'

interface ReportData {
  title: string
  category: string
  priority: string
  files?: File[]
}

interface ReportDateSelectorProps {
  totalAmount: number
  reportData: ReportData
  onSendForApproval: (reportDate: string) => void
  isSubmitting: boolean
}

export function ReportDateSelector({ 
  totalAmount, 
  reportData, 
  onSendForApproval, 
  isSubmitting 
}: ReportDateSelectorProps) {
  const [selectedDate, setSelectedDate] = useState('')
  const [error, setError] = useState('')

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR'
    }).format(amount)
  }

  const handleSubmit = () => {
    if (!selectedDate) {
      setError('Please select a report date')
      return
    }
    
    setError('')
    onSendForApproval(selectedDate)
  }

  // Get today's date in YYYY-MM-DD format for max date
  const today = new Date().toISOString().split('T')[0]
  
  // Get date from 1 year ago for min date
  const oneYearAgo = new Date()
  oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1)
  const minDate = oneYearAgo.toISOString().split('T')[0]

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Calendar className="w-5 h-5 mr-2" />
            Select Report Date
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {/* Report Summary */}
            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
              <h3 className="font-medium text-gray-900 dark:text-white mb-3">Report Summary</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-600 dark:text-gray-400">Title:</span>
                  <span className="ml-2 font-medium text-gray-900 dark:text-white">
                    {reportData.title}
                  </span>
                </div>
                <div>
                  <span className="text-gray-600 dark:text-gray-400">Category:</span>
                  <span className="ml-2 font-medium text-gray-900 dark:text-white capitalize">
                    {reportData.category}
                  </span>
                </div>
                <div>
                  <span className="text-gray-600 dark:text-gray-400">Priority:</span>
                  <span className={`ml-2 px-2 py-1 rounded-full text-xs font-medium ${
                    reportData.priority === 'high' ? 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400' :
                    reportData.priority === 'medium' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400' :
                    'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
                  }`}>
                    {reportData.priority}
                  </span>
                </div>
                <div>
                  <span className="text-gray-600 dark:text-gray-400">Total Amount:</span>
                  <span className="ml-2 font-bold text-blue-600 dark:text-blue-400">
                    {formatCurrency(totalAmount)}
                  </span>
                </div>
              </div>
            </div>

            {/* Date Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Report Date <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Calendar className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => {
                    setSelectedDate(e.target.value)
                    setError('')
                  }}
                  min={minDate}
                  max={today}
                  className={`w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-800 dark:text-gray-100 dark:border-gray-600 ${
                    error ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
              </div>
              {error && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">{error}</p>
              )}
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                Select the date this report covers (up to today)
              </p>
            </div>

            {/* Information Box */}
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
              <div className="flex items-start">
                <div className="flex-shrink-0">
                  <div className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center">
                    <span className="text-white text-xs font-bold">i</span>
                  </div>
                </div>
                <div className="ml-3">
                  <h4 className="text-sm font-medium text-blue-900 dark:text-blue-100">
                    Next Steps
                  </h4>
                  <p className="text-sm text-blue-800 dark:text-blue-200 mt-1">
                    After selecting the report date, you&apos;ll proceed directly to payment. Manager approval will process in parallel.
                  </p>
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <div className="flex justify-end">
              <Button
                onClick={handleSubmit}
                disabled={isSubmitting || !selectedDate}
                className="min-w-48"
              >
                {isSubmitting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Sending for Approval...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4 mr-2" />
                    Send for Manager Approval
                  </>
                )}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}