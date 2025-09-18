import React from 'react'
import { cn } from '@/lib/utils'

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  hover?: boolean
  animated?: boolean
  glass?: boolean
  variant?: 'default' | 'elevated' | 'outline'
}

function Card({ 
  className, 
  hover = false, 
  animated = false, 
  glass = false,
  variant = 'default',
  ...props 
}: CardProps) {
  const baseClasses = 'rounded-xl transition-all duration-300'
  
  const variantClasses = {
    default: glass 
      ? 'card-glass'
      : 'bg-white border border-gray-200 shadow-sm dark:bg-gray-900 dark:border-gray-800',
    
    elevated: glass
      ? 'card-glass shadow-lg'
      : 'bg-white border border-gray-200 shadow-lg dark:bg-gray-900 dark:border-gray-800',
    
    outline: glass
      ? 'glass border-white/20'
      : 'border-2 border-dashed border-gray-300 dark:border-gray-700'
  }
  
  const hoverClasses = hover ? (
    glass 
      ? 'hover:scale-105 hover:shadow-xl'
      : 'hover:shadow-md hover:-translate-y-1'
  ) : ''
  
  const animatedClasses = animated ? 'animate-fade-up' : ''
  
  return (
    <div
      className={cn(
        baseClasses,
        variantClasses[variant],
        hoverClasses,
        animatedClasses,
        className
      )}
      {...props}
    />
  )
}

function CardHeader({ 
  className, 
  glass = false,
  ...props 
}: React.HTMLAttributes<HTMLDivElement> & { glass?: boolean }) {
  return (
    <div
      className={cn(
        'flex flex-col space-y-1.5 p-6',
        glass && 'border-b border-white/10',
        className
      )}
      {...props}
    />
  )
}

function CardTitle({ 
  className, 
  ...props 
}: React.HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h3
      className={cn(
        'text-lg font-semibold leading-none tracking-tight text-gray-900 dark:text-gray-100',
        className
      )}
      {...props}
    />
  )
}

function CardContent({ 
  className, 
  ...props 
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div 
      className={cn('p-6 pt-0', className)} 
      {...props} 
    />
  )
}

function CardFooter({ 
  className, 
  glass = false,
  ...props 
}: React.HTMLAttributes<HTMLDivElement> & { glass?: boolean }) {
  return (
    <div 
      className={cn(
        'flex items-center p-6 pt-0',
        glass && 'border-t border-white/10',
        className
      )} 
      {...props} 
    />
  )
}

export { Card, CardHeader, CardTitle, CardContent, CardFooter }
