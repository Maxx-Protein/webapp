'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/router'
import { useAuth } from '@/hooks/useAuth'
import { FileUploadZone } from './FileUploadZone'
import { UploadProgress } from './UploadProgress'
import { AmountCalculation } from './AmountCalculation'
import { ReportFormFields } from './ReportFormFields'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { CheckCircle, AlertCircle, FileText } from 'lucide-react'
import type { ReportFormData } from '@/types'

interface UploadedFile {
  file: File
  id: string
  progress: number
  status: 'uploading' | 'processing' | 'completed' | 'error'
  url?: string
  error?: string
  extractedFiles?: ExtractedFile[]
  calculatedAmount?: number
}

interface ExtractedFile {
  name: string
  type: 'html' | 'csv' | 'other'
  content?: string
  amounts?: number[]
}

export function ReportUpload() {
  const router = useRouter()
  const { user } = useAuth()
  const [files, setFiles] = useState<UploadedFile[]>([])
  const [formData, setFormData] = useState<ReportFormData>({
    title: '', // Keep for backward compatibility but not required
    description: '', // Keep for backward compatibility but not required
    category: '', // Keep for backward compatibility but not required
    reportDate: new Date().toISOString().split('T')[0],
    files: []
  })
  const [formErrors, setFormErrors] = useState<Record<string, string>>({})
  const [totalAmount, setTotalAmount] = useState(0)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle')
  const [errorMessage, setErrorMessage] = useState('')
  const [showCalculation, setShowCalculation] = useState(false)
  const [showForm, setShowForm] = useState(true)
  const [showDateModal, setShowDateModal] = useState(false)

  // Auto-show calculation when files are processed and calculate total
  useEffect(() => {
    const completedFiles = files.filter(f => f.status === 'completed')
    const newTotalAmount = completedFiles.reduce((sum, file) => sum + (file.calculatedAmount || 0), 0)
    setTotalAmount(newTotalAmount)
    
    if (completedFiles.length > 0 && newTotalAmount > 0) {
      setShowCalculation(true)
      setShowForm(false) // Hide form when calculation is shown
    } else {
      setShowCalculation(false)
    }
  }, [files])

  // Form handling
  const handleFormChange = (data: Partial<ReportFormData>) => {
    setFormData(prev => ({ ...prev, ...data }))
    // Clear related errors when user starts typing
    if (data.reportDate && formErrors.reportDate) {
      setFormErrors(prev => ({ ...prev, reportDate: '' }))
    }
  }

  const handleFilesAdded = (newFiles: File[]) => {
    const uploadFiles: UploadedFile[] = newFiles.map(file => ({
      file,
      id: Math.random().toString(36).substr(2, 9),
      progress: 0,
      status: 'uploading' as const
    }))

    setFiles(prev => [...prev, ...uploadFiles])

    // Start upload and processing for each file
    uploadFiles.forEach(uploadFile => {
      uploadAndProcessFile(uploadFile.id)
    })
  }

 const uploadAndProcessFile = async (fileId: string) => {
  try {
    // Find the file from current state
    setFiles(prevFiles => {
      const currentFile = prevFiles.find(f => f.id === fileId)
      if (!currentFile) {
        console.error('File not found for ID:', fileId)
        return prevFiles
      }

      console.log('Starting upload for:', currentFile.file.name)

      // Step 1: Upload file
      const uploadFile = async () => {
        try {
          setFiles(prev => prev.map(f => 
            f.id === fileId ? { ...f, progress: 25, status: 'uploading' as const } : f
          ))

          const formData = new FormData()
          formData.append('file', currentFile.file)

          console.log('Sending upload request...')

          const uploadResponse = await fetch('/api/reports/upload', {
            method: 'POST',
            body: formData
          })

          console.log('Upload response status:', uploadResponse.status)

          if (!uploadResponse.ok) {
            const errorText = await uploadResponse.text()
            console.error('Upload failed:', errorText)
            throw new Error(`Upload failed: ${errorText}`)
          }

          const uploadResult = await uploadResponse.json()
          console.log('Upload successful:', uploadResult)

          // Step 2: Process and extract
          setFiles(prev => prev.map(f => 
            f.id === fileId ? { ...f, progress: 50, status: 'processing' as const, url: uploadResult.url } : f
          ))

          console.log('Starting processing...')

          const processResponse = await fetch('/api/reports/process', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({ 
              fileUrl: uploadResult.url, 
              fileName: currentFile.file.name 
            })
          })

          console.log('Process response status:', processResponse.status)

          if (!processResponse.ok) {
            const errorText = await processResponse.text()
            console.error('Processing failed:', errorText)
            throw new Error(`Processing failed: ${errorText}`)
          }

          const processResult = await processResponse.json()
          console.log('Processing successful:', processResult)

          // Step 3: Complete
          setFiles(prev => prev.map(f => 
            f.id === fileId 
              ? { 
                  ...f, 
                  progress: 100, 
                  status: 'completed' as const,
                  extractedFiles: processResult.extractedFiles,
                  calculatedAmount: processResult.totalAmount
                } 
              : f
          ))

        } catch (error: unknown) {
          const errorMessage = error instanceof Error ? error.message : 'Upload failed'
          console.error('Upload/Process error:', error)
          setFiles(prev => prev.map(f => 
            f.id === fileId 
              ? { ...f, status: 'error' as const, error: errorMessage }
              : f
          ))
        }
      }

      // Start the upload process
      uploadFile()

      return prevFiles
    })

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'An error occurred'
    console.error('uploadAndProcessFile error:', error)
    setFiles(prev => prev.map(f => 
      f.id === fileId 
        ? { ...f, status: 'error' as const, error: errorMessage }
        : f
    ))
  }
}


  const handleRemoveFile = useCallback((fileId: string) => {
    setFiles(prev => prev.filter(f => f.id !== fileId))
  }, [])

  const handleRetryFile = useCallback((fileId: string) => {
    setFiles(prev => prev.map(f => 
      f.id === fileId 
        ? { ...f, status: 'uploading', progress: 0, error: undefined }
        : f
    ))
    uploadAndProcessFile(fileId)
  }, [])

  const handleSendForApproval = async () => {
    // Clear any previous errors
    setErrorMessage('')
    
    // Check if date is missing and prompt user
    if (!formData.reportDate) {
      setShowDateModal(true)
      return
    }
    
    await proceedWithSubmission()
  }

  const proceedWithSubmission = async () => {
    // Validate that files are uploaded and processed
    const completedFiles = files.filter(f => f.status === 'completed')
    if (files.length === 0) {
      setSubmitStatus('error')
      setErrorMessage('Please upload a file before proceeding to payment.')
      return
    }
    
    if (completedFiles.length === 0) {
      setSubmitStatus('error')
      setErrorMessage('Please wait for files to finish processing before proceeding to payment.')
      return
    }
    
    // Check if any files failed to process
    const failedFiles = files.filter(f => f.status === 'error')
    if (failedFiles.length > 0) {
      setSubmitStatus('error')
      setErrorMessage(`Some files failed to process. Please remove failed files and try again.`)
      return
    }
    
    setIsSubmitting(true)
    
    try {
      const response = await fetch('/api/reports/submit-for-approval', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          files: completedFiles.map(f => ({
            name: f.file.name,
            url: f.url,
            extractedFiles: f.extractedFiles,
            calculatedAmount: f.calculatedAmount
          })),
          totalAmount,
          reportDate: formData.reportDate // Include report date
        })
      })

      if (!response.ok) {
        // Safely handle API error response
        let errorMessage = 'Failed to upload report'
        try {
          const data = await response.json()
          if (data.message) {
            errorMessage = data.message
          }
        } catch {
          // If JSON parsing fails, use default error message
          errorMessage = `Server error (${response.status}): ${response.statusText}`
        }
        
        setSubmitStatus('error')
        setErrorMessage(errorMessage)
        setIsSubmitting(false)
        return
      }

      // Success case - get the response data
      const result = await response.json()
      
      console.log('Report submission successful:', result)
      setSubmitStatus('success')
      
      // Trigger dashboard refresh based on user role
      if (user?.role === 'admin') {
        window.dispatchEvent(new CustomEvent('refreshAdminDashboard'))
      } else if (user?.role === 'manager') {
        window.dispatchEvent(new CustomEvent('refreshManagerDashboard'))
      } else {
        window.dispatchEvent(new CustomEvent('refreshDashboard'))
      }
      
      // Immediately redirect to payment page with report ID
      const reportId = result.reportId
      console.log('Redirecting to payment page with report ID:', reportId)
      
      // Small delay to show success message before redirect
      setTimeout(() => {
        // Redirect based on user role with report ID as query parameter
        if (user?.role === 'admin') {
          router.push(`/admin/payment?reportId=${reportId}`)
        } else if (user?.role === 'manager') {
          router.push(`/manager/payment?reportId=${reportId}`)
        } else {
          router.push(`/user/payment?reportId=${reportId}`)
        }
      }, 2000) // 2 second delay to show success message
      
    } catch (error: unknown) {
      // Handle network errors or other unexpected errors
      const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred while submitting the report'
      console.error('Submit error:', error)
      setSubmitStatus('error')
      setErrorMessage(errorMessage)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center mx-auto mb-4">
          <FileText className="w-8 h-8 text-white" />
        </div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Upload Report Files</h1>
        <p className="text-gray-600 dark:text-gray-400">
          Upload your HTML reports and CSV data files. We&apos;ll calculate the total payable amount and proceed to payment.
        </p>
      </div>

      {/* Success/Error Messages */}
      {submitStatus === 'success' && (
        <Card className="border-green-200 bg-green-50 dark:bg-green-900/20 dark:border-green-800">
          <CardContent className="p-4">
            <div className="flex items-center">
              <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400 mr-3" />
              <p className="text-green-800 dark:text-green-200">
                Report uploaded successfully! Proceeding to payment screen...
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {submitStatus === 'error' && (
        <Card className="border-red-200 bg-red-50 dark:bg-red-900/20 dark:border-red-800">
          <CardContent className="p-4">
            <div className="flex items-center">
              <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 mr-3" />
              <div className="flex-1">
                <p className="text-red-800 dark:text-red-200">{errorMessage}</p>
                <button
                  onClick={() => setSubmitStatus('idle')}
                  className="text-sm text-red-600 dark:text-red-400 underline mt-1"
                >
                  Dismiss
                </button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Report Form Fields */}
      {showForm && (
        <ReportFormFields
          formData={formData}
          onChange={handleFormChange}
          errors={formErrors}
          disabled={isSubmitting}
        />
      )}

      {/* File Upload */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <FileText className="w-5 h-5 mr-2" />
            Upload Report Files (HTML/CSV)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <FileUploadZone 
            onFilesAdded={handleFilesAdded}
            acceptedTypes={['.html', '.csv', '.htm']}
            maxFileSize={50 * 1024 * 1024} // 50MB
            maxFiles={5}
          />
          
          {files.length > 0 && (
            <div className="mt-6">
              <h3 className="font-medium text-gray-900 dark:text-white mb-4">
                Processing Files ({files.length})
              </h3>
              <UploadProgress 
                files={files}
                onRemove={handleRemoveFile}
                onRetry={handleRetryFile}
              />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Amount Calculation - Show when files are processed and have calculated amounts */}
      {showCalculation && (
        <AmountCalculation 
          files={files.filter(f => f.status === 'completed').map(f => ({
            file: f.file,
            id: f.id,
            extractedFiles: f.extractedFiles,
            calculatedAmount: f.calculatedAmount
          }))}
          totalAmount={totalAmount}
        />
      )}
      
      {/* Send for Approval Button - Show when any files are uploaded */}
      {files.length > 0 && (
        <div className="flex justify-center">
          <Button
            onClick={handleSendForApproval}
            disabled={isSubmitting || submitStatus === 'success' || files.filter(f => f.status === 'uploading' || f.status === 'processing').length > 0}
            size="lg"
            className="px-8 py-3 bg-green-600 hover:bg-green-700 disabled:opacity-50"
          >
            {isSubmitting ? 'Submitting...' : 
             files.filter(f => f.status === 'uploading' || f.status === 'processing').length > 0 ? 'Processing Files...' :
             'Continue to Payment'}
          </Button>
        </div>
      )}
      
      {/* Date Selection Modal */}
      {showDateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="w-full max-w-md mx-4">
            <CardHeader>
              <CardTitle>Select Report Date</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                Please select the date when this report data was generated before proceeding to payment:
              </p>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Report Date *
                </label>
                <input
                  type="date"
                  value={formData.reportDate}
                  onChange={(e) => setFormData(prev => ({ ...prev, reportDate: e.target.value }))}
                  max={new Date().toISOString().split('T')[0]}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                />
              </div>
              <div className="flex gap-3 justify-end">
                <Button
                  variant="secondary"
                  onClick={() => {
                    setShowDateModal(false)
                  }}
                >
                  Cancel
                </Button>
                <Button
                  onClick={async () => {
                    if (formData.reportDate) {
                      setShowDateModal(false)
                      await proceedWithSubmission()
                    }
                  }}
                  disabled={!formData.reportDate}
                >
                  Continue to Payment
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}