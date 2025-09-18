'use client'

import React from 'react'
import { CheckCircle, XCircle, RotateCcw, X, File, FileText, Image } from 'lucide-react'
import { Button } from '@/components/ui/Button'

interface UploadedFile {
  file: File
  id: string
  progress: number
  status: 'uploading' | 'processing' | 'completed' | 'error'
  url?: string
  error?: string
}

interface UploadProgressProps {
  files: UploadedFile[]
  onRemove: (fileId: string) => void
  onRetry: (fileId: string) => void
}

export function UploadProgress({ files, onRemove, onRetry }: UploadProgressProps) {
  const getFileIcon = (fileName: string) => {
    const extension = fileName.split('.').pop()?.toLowerCase()
    
    if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(extension || '')) {
      return <Image className="w-4 h-4" />
    } else if (['pdf'].includes(extension || '')) {
      return <FileText className="w-4 h-4 text-red-600" />
    } else if (['doc', 'docx'].includes(extension || '')) {
      return <FileText className="w-4 h-4 text-blue-600" />
    } else if (['xls', 'xlsx'].includes(extension || '')) {
      return <FileText className="w-4 h-4 text-green-600" />
    }
    return <File className="w-4 h-4" />
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  return (
    <div className="space-y-3">
      {files.map((uploadFile) => (
        <div 
          key={uploadFile.id}
          className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3 min-w-0 flex-1">
              <div className="flex-shrink-0">
                {getFileIcon(uploadFile.file.name)}
              </div>
              
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                  {uploadFile.file.name}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {formatFileSize(uploadFile.file.size)}
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              {uploadFile.status === 'completed' && (
                <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
              )}
              
              {uploadFile.status === 'processing' && (
                <div className="flex items-center space-x-2">
                  <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                  <span className="text-xs text-blue-600">Processing...</span>
                </div>
              )}
              
              {uploadFile.status === 'error' && (
                <div className="flex items-center space-x-2">
                  <XCircle className="w-5 h-5 text-red-600 dark:text-red-400" />
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => onRetry(uploadFile.id)}
                    className="h-6 px-2"
                  >
                    <RotateCcw className="w-3 h-3" />
                  </Button>
                </div>
              )}

              <Button
                size="sm"
                variant="ghost"
                onClick={() => onRemove(uploadFile.id)}
                className="h-6 w-6 p-0 text-gray-400 hover:text-gray-600"
              >
                <X className="w-3 h-3" />
              </Button>
            </div>
          </div>

          {uploadFile.status === 'uploading' && (
            <div className="mt-2">
              <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mb-1">
                <span>Uploading...</span>
                <span>{uploadFile.progress}%</span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5">
                <div 
                  className="bg-blue-600 h-1.5 rounded-full transition-all duration-200"
                  style={{ width: `${uploadFile.progress}%` }}
                />
              </div>
            </div>
          )}

          {uploadFile.status === 'error' && uploadFile.error && (
            <p className="text-xs text-red-600 dark:text-red-400 mt-1">
              {uploadFile.error}
            </p>
          )}
        </div>
      ))}
    </div>
  )
}
