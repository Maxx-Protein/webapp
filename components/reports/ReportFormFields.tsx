'use client'

import React from 'react'
import { Card, CardContent } from '@/components/ui/Card'
import { Calendar } from 'lucide-react'
import type { ReportFormData } from '@/types'

interface ReportFormFieldsProps {
  formData: ReportFormData
  onChange: (data: Partial<ReportFormData>) => void
  errors: Record<string, string>
  disabled?: boolean
}

export function ReportFormFields({ 
  formData, 
  onChange, 
  errors, 
  disabled = false 
}: ReportFormFieldsProps) {
  const handleChange = (field: keyof ReportFormData, value: string) => {
    onChange({ [field]: value })
  }

  return (
    <Card>
      <CardContent className="p-6">
        <div className="space-y-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Report Date
          </h3>
          
          {/* Report Date Field - Only field needed */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              <Calendar className="w-4 h-4 inline mr-2" />
              Report Date *
            </label>
            <input
              type="date"
              value={formData.reportDate}
              onChange={(e) => handleChange('reportDate', e.target.value)}
              disabled={disabled}
              max={new Date().toISOString().split('T')[0]}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white disabled:opacity-50"
            />
            {errors.reportDate && (
              <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                {errors.reportDate}
              </p>
            )}
          </div>

          {/* Help Text */}
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <Calendar className="h-5 w-5 text-blue-400" />
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-blue-800 dark:text-blue-200">
                  Streamlined Upload Process
                </h3>
                <div className="mt-2 text-sm text-blue-700 dark:text-blue-300">
                  <ul className="list-disc list-inside space-y-1">
                    <li>Upload your CSV or HTML report file</li>
                    <li>System will automatically parse the total amount</li>
                    <li>Select the date when the report data was generated</li>
                    <li>Proceed directly to payment (approval runs separately)</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}