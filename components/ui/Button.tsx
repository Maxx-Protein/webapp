import React, { useState } from 'react'
import { cn } from '@/lib/utils'
import { ArrowRight, Loader2 } from 'lucide-react'

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger' | 'success' | 'warning' | 'glass'
  size?: 'sm' | 'md' | 'lg'
  animated?: boolean
  withArrow?: boolean
  glass?: boolean
  loading?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ 
    className, 
    variant = 'primary', 
    size = 'md', 
    animated = false,
    withArrow = false,
    glass = false,
    loading = false,
    children,
    disabled,
    ...props 
  }, ref) => {
    const [isHovered, setIsHovered] = useState(false)

    const baseClasses = 'inline-flex items-center justify-center rounded-lg font-medium transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 relative overflow-hidden'
    
    const glassClasses = glass ? 'glass backdrop-blur-md' : ''
    
    const animatedClasses = animated ? 'btn-enhanced hover:-translate-y-1 hover:shadow-lg active:translate-y-0' : ''
    
    const variantClasses = {
      primary: glass 
        ? 'glass-blue text-blue-600 dark:text-blue-400 hover:bg-blue-500/20 focus-visible:ring-blue-500'
        : 'bg-blue-600 text-white hover:bg-blue-700 shadow-md hover:shadow-lg focus-visible:ring-blue-500 dark:bg-blue-600 dark:hover:bg-blue-500',
      
      secondary: glass
        ? 'glass border-white/20 text-gray-700 dark:text-gray-200 hover:bg-white/10 focus-visible:ring-gray-500'
        : 'bg-gray-100 text-gray-900 hover:bg-gray-200 border border-gray-200 dark:bg-gray-800 dark:text-gray-100 dark:hover:bg-gray-700 dark:border-gray-700 focus-visible:ring-gray-500',
      
      ghost: 'hover:bg-gray-100 text-gray-700 dark:text-gray-200 dark:hover:bg-gray-800 focus-visible:ring-gray-500',
      
      danger: glass
        ? 'glass-red text-red-600 dark:text-red-400 hover:bg-red-500/20 focus-visible:ring-red-500'
        : 'bg-red-600 text-white hover:bg-red-700 shadow-md hover:shadow-lg focus-visible:ring-red-500 dark:bg-red-600 dark:hover:bg-red-500',
      
      success: glass
        ? 'glass-green text-green-600 dark:text-green-400 hover:bg-green-500/20 focus-visible:ring-green-500'
        : 'bg-green-600 text-white hover:bg-green-700 shadow-md hover:shadow-lg focus-visible:ring-green-500 dark:bg-green-600 dark:hover:bg-green-500',
      
      warning: glass
        ? 'bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 hover:bg-yellow-500/20 border border-yellow-500/20 focus-visible:ring-yellow-500'
        : 'bg-yellow-500 text-white hover:bg-yellow-600 shadow-md hover:shadow-lg focus-visible:ring-yellow-500 dark:bg-yellow-600 dark:hover:bg-yellow-500',
      
      glass: 'glass text-gray-700 dark:text-gray-200 hover:bg-white/10 dark:hover:bg-white/5 focus-visible:ring-gray-500'
    }
    
    const sizeClasses = {
      sm: 'h-8 px-3 text-sm',
      md: 'h-10 px-4 text-sm',
      lg: 'h-12 px-6 text-base'
    }

    const isDisabled = disabled || loading

    return (
      <button
        className={cn(
          baseClasses,
          glassClasses,
          animatedClasses,
          variantClasses[variant],
          sizeClasses[size],
          className
        )}
        ref={ref}
        disabled={isDisabled}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        {...props}
      >
        {loading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : withArrow ? (
          <>
            <span className={cn(
              'transition-transform duration-300',
              isHovered ? 'transform -translate-x-1' : ''
            )}>
              {children}
            </span>
            <ArrowRight 
              className={cn(
                'ml-2 h-4 w-4 transition-all duration-300',
                isHovered ? 'transform translate-x-1 opacity-100' : 'transform translate-x-0 opacity-70'
              )} 
            />
          </>
        ) : (
          children
        )}
      </button>
    )
  }
)
Button.displayName = 'Button'

export { Button }