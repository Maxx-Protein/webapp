import React from 'react'
import { cn } from '@/lib/utils'

interface BadgeProps {
  children: React.ReactNode
  className?: string
  variant?: 'default' | 'secondary' | 'success' | 'warning' | 'danger' | 'info'
  glass?: boolean
  size?: 'sm' | 'md' | 'lg'
}

export function Badge({ 
  children, 
  className, 
  variant = 'default',
  glass = false,
  size = 'md'
}: BadgeProps) {
  const baseClasses = 'inline-flex items-center rounded-full font-medium transition-all duration-200'
  
  const sizeClasses = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-2.5 py-0.5 text-xs',
    lg: 'px-3 py-1 text-sm'
  }
  
  const variantClasses = {
    default: glass 
      ? 'badge-glass text-gray-600 dark:text-gray-300'
      : 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200',
    
    secondary: glass
      ? 'badge-glass text-gray-600 dark:text-gray-300'
      : 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200',
    
    success: glass
      ? 'badge-glass success'
      : 'bg-green-100 text-green-800 border border-green-200 dark:bg-green-900/20 dark:text-green-300 dark:border-green-800',
    
    warning: glass
      ? 'badge-glass warning'
      : 'bg-yellow-100 text-yellow-800 border border-yellow-200 dark:bg-yellow-900/20 dark:text-yellow-300 dark:border-yellow-800',
    
    danger: glass
      ? 'badge-glass error'
      : 'bg-red-100 text-red-800 border border-red-200 dark:bg-red-900/20 dark:text-red-300 dark:border-red-800',
    
    info: glass
      ? 'badge-glass info'
      : 'bg-blue-100 text-blue-800 border border-blue-200 dark:bg-blue-900/20 dark:text-blue-300 dark:border-blue-800'
  }
  
  return (
    <span className={cn(
      baseClasses,
      sizeClasses[size],
      variantClasses[variant],
      className
    )}>
      {children}
    </span>
  )
}