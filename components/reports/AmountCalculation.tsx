'use client'

import React from 'react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card'
import { Calculator, FileText, File, DollarSign } from 'lucide-react'

interface ExtractedFile {
  name: string
  type: 'html' | 'csv' | 'other'
  content?: string
  amounts?: number[]
}

interface UploadedFile {
  file: File
  id: string
  extractedFiles?: ExtractedFile[]
  calculatedAmount?: number
}

interface AmountCalculationProps {
  files: UploadedFile[]
  totalAmount: number
}

export function AmountCalculation({ files, totalAmount }: AmountCalculationProps) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR'
    }).format(amount)
  }

  const getFileIcon = (type: string) => {
    switch (type) {
      case 'html':
        return <FileText className="w-4 h-4 text-orange-600" />
      case 'csv':
        return <FileText className="w-4 h-4 text-green-600" />
      default:
        return <File className="w-4 h-4 text-gray-600" />
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Calculator className="w-5 h-5 mr-2" />
            Amount Calculation Results
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {files.map((file) => (
              <div key={file.id} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-medium text-gray-900 dark:text-white">
                    {file.file.name}
                  </h3>
                  <span className="text-lg font-bold text-blue-600">
                    {formatCurrency(file.calculatedAmount || 0)}
                  </span>
                </div>
                
                {file.extractedFiles && (
                  <div className="space-y-3">
                    <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Extracted Files ({file.extractedFiles.length}):
                    </h4>
                    {file.extractedFiles.map((extracted, idx) => (
                      <div key={idx} className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-800 rounded">
                        <div className="flex items-center space-x-2">
                          {getFileIcon(extracted.type)}
                          <span className="text-sm text-gray-700 dark:text-gray-300">
                            {extracted.name}
                          </span>
                          <span className="text-xs bg-gray-200 dark:bg-gray-700 px-2 py-1 rounded capitalize">
                            {extracted.type}
                          </span>
                        </div>
                        {extracted.amounts && extracted.amounts.length > 0 && (
                          <div className="text-sm text-gray-600 dark:text-gray-400">
                            {extracted.amounts.length} amount{extracted.amounts.length > 1 ? 's' : ''} found
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
            
            {/* Total Amount */}
            <div className="border-t pt-4">
              <div className="flex items-center justify-between p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <div className="flex items-center">
                  <DollarSign className="w-6 h-6 text-blue-600 mr-2" />
                  <span className="text-lg font-semibold text-gray-900 dark:text-white">
                    Total Payable Amount:
                  </span>
                </div>
                <span className="text-2xl font-bold text-blue-600">
                  {formatCurrency(totalAmount)}
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
