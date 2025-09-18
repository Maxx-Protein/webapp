'use client'

import React, { useEffect, useState } from 'react'
import { cn } from '@/lib/utils'
import { CheckCircle, AlertTriangle, XCircle, Info, X } from 'lucide-react'

export interface AlertProps {
  variant?: 'success' | 'warning' | 'error' | 'info'
  title?: string
  message: string
  glass?: boolean
  dismissible?: boolean
  autoClose?: boolean
  duration?: number
  onClose?: () => void
  className?: string
}

const Alert: React.FC<AlertProps> = ({
  variant = 'info',
  title,
  message,
  glass = false,
  dismissible = false,
  autoClose = false,
  duration = 5000,
  onClose,
  className
}) => {
  const [isVisible, setIsVisible] = useState(true)
  const [isAnimatingOut, setIsAnimatingOut] = useState(false)

  useEffect(() => {
    if (autoClose && duration > 0) {
      const timer = setTimeout(() => {
        handleClose()
      }, duration)

      return () => clearTimeout(timer)
    }
  }, [autoClose, duration])

  const handleClose = () => {
    if (variant === 'error') {
      // Error alerts use shake animation
      setIsAnimatingOut(true)
      setTimeout(() => {
        setIsVisible(false)
        onClose?.()
      }, 500)
    } else {
      // Success alerts slide up
      setIsAnimatingOut(true)
      setTimeout(() => {
        setIsVisible(false)
        onClose?.()
      }, 400)
    }
  }

  const icons = {
    success: CheckCircle,
    warning: AlertTriangle,
    error: XCircle,
    info: Info
  }

  const Icon = icons[variant]

  const baseClasses = 'relative p-4 rounded-lg border transition-all duration-300'
  
  const glassClasses = glass ? 'backdrop-blur-md' : ''
  
  const variantClasses = {
    success: glass
      ? 'glass-green text-green-700 dark:text-green-300 border-green-200/30'
      : 'bg-green-50 text-green-800 border-green-200 dark:bg-green-900/20 dark:text-green-300 dark:border-green-800',
    
    warning: glass
      ? 'bg-yellow-500/10 text-yellow-700 dark:text-yellow-300 border-yellow-200/30 backdrop-blur-md'
      : 'bg-yellow-50 text-yellow-800 border-yellow-200 dark:bg-yellow-900/20 dark:text-yellow-300 dark:border-yellow-800',
    
    error: glass
      ? 'glass-red text-red-700 dark:text-red-300 border-red-200/30'
      : 'bg-red-50 text-red-800 border-red-200 dark:bg-red-900/20 dark:text-red-300 dark:border-red-800',
    
    info: glass
      ? 'glass-blue text-blue-700 dark:text-blue-300 border-blue-200/30'
      : 'bg-blue-50 text-blue-800 border-blue-200 dark:bg-blue-900/20 dark:text-blue-300 dark:border-blue-800'
  }

  const animationClasses = cn(
    'alert-slide-down',
    {
      'alert-slide-up': isAnimatingOut && variant !== 'error',
      'alert-shake': isAnimatingOut && variant === 'error'
    }
  )

  if (!isVisible) return null

  return (
    <div
      className={cn(
        baseClasses,
        glassClasses,
        variantClasses[variant],
        animationClasses,
        className
      )}
      role="alert"
    >
      <div className="flex items-start">
        <div className="flex-shrink-0">
          <Icon className="h-5 w-5" />
        </div>
        
        <div className="ml-3 flex-1">
          {title && (
            <h3 className="text-sm font-medium mb-1">
              {title}
            </h3>
          )}
          <p className="text-sm">
            {message}
          </p>
        </div>
        
        {dismissible && (
          <div className="ml-auto pl-3">
            <button
              type="button"
              onClick={handleClose}
              className={cn(
                'inline-flex rounded-md p-1.5 transition-colors duration-200',
                'hover:bg-black/5 dark:hover:bg-white/5',
                'focus:outline-none focus:ring-2 focus:ring-offset-2',
                {
                  'focus:ring-green-500 focus:ring-offset-green-50 dark:focus:ring-offset-green-900': variant === 'success',
                  'focus:ring-yellow-500 focus:ring-offset-yellow-50 dark:focus:ring-offset-yellow-900': variant === 'warning',
                  'focus:ring-red-500 focus:ring-offset-red-50 dark:focus:ring-offset-red-900': variant === 'error',
                  'focus:ring-blue-500 focus:ring-offset-blue-50 dark:focus:ring-offset-blue-900': variant === 'info'
                }
              )}
            >
              <X className="h-4 w-4" />
              <span className="sr-only">Close</span>
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

export { Alert }