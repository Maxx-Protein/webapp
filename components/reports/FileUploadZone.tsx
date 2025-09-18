'use client'

import React, { useCallback, useState } from 'react'
import { FileText, AlertCircle, Calculator } from 'lucide-react'

interface FileUploadZoneProps {
  onFilesAdded: (files: File[]) => void
  acceptedTypes?: string[]
  maxFileSize?: number
  maxFiles?: number
}

export function FileUploadZone({ 
  onFilesAdded, 
  acceptedTypes = ['.html', '.csv'], 
  maxFileSize = 50 * 1024 * 1024,
  maxFiles = 5 
}: FileUploadZoneProps) {
  const [isDragOver, setIsDragOver] = useState(false)
  const [error, setError] = useState('')

  const validateFiles = useCallback((files: FileList | File[]) => {
    const fileArray = Array.from(files)
    const errors: string[] = []

    if (fileArray.length > maxFiles) {
      errors.push(`Maximum ${maxFiles} files allowed`)
      return errors
    }

    fileArray.forEach(file => {
      // Check file size
      if (file.size > maxFileSize) {
        errors.push(`${file.name} exceeds ${Math.round(maxFileSize / (1024 * 1024))}MB limit`)
      }

      // Check file type for HTML/CSV
      const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase()
      if (!acceptedTypes.includes(fileExtension)) {
        errors.push(`${file.name} must be an HTML or CSV file`)
      }
    })

    return errors
  }, [acceptedTypes, maxFileSize, maxFiles])

  const handleFiles = useCallback((files: FileList | File[]) => {
    const fileArray = Array.from(files)
    const errors = validateFiles(fileArray)

    if (errors.length > 0) {
      setError(errors.join(', '))
      return
    }

    setError('')
    onFilesAdded(fileArray)
  }, [validateFiles, onFilesAdded])

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
    
    if (e.dataTransfer.files) {
      handleFiles(e.dataTransfer.files)
    }
  }, [handleFiles])

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      handleFiles(e.target.files)
      e.target.value = ''
    }
  }, [handleFiles])

  return (
    <div className="space-y-4">
      <div
        className={`
          relative border-2 border-dashed rounded-lg p-8 text-center transition-all
          ${isDragOver 
            ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' 
            : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500'
          }
        `}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <input
          type="file"
          multiple
          accept=".html,.csv,.htm"
          onChange={handleFileSelect}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
        />
        
        <div className="space-y-4">
          <div className="w-16 h-16 bg-gradient-to-br from-blue-100 to-blue-200 dark:from-blue-800 dark:to-blue-900 rounded-full flex items-center justify-center mx-auto">
            <FileText className="w-8 h-8 text-blue-600 dark:text-blue-400" />
          </div>
          
          <div>
            <p className="text-lg font-medium text-gray-900 dark:text-white">
              Drop HTML/CSV files here or click to browse
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
              <Calculator className="w-4 h-4 inline mr-1" />
              HTML reports and CSV data files supported
            </p>
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
              Max {Math.round(maxFileSize / (1024 * 1024))}MB per file • Up to {maxFiles} files
            </p>
          </div>
        </div>
      </div>

      {error && (
        <div className="flex items-center p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
          <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 mr-3" />
          <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
        </div>
      )}
    </div>
  )
}
