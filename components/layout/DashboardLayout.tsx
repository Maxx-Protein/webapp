'use client'

import React from 'react'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'
import { LucideIcon } from 'lucide-react'

interface DashboardLayoutProps {
  children: React.ReactNode
  className?: string
}

interface DashboardSectionProps {
  children: React.ReactNode
  className?: string
  title?: string
  description?: string
}

interface DashboardGridProps {
  children: React.ReactNode
  columns?: {
    default?: number
    sm?: number  // 640px
    md?: number  // 768px
    lg?: number  // 1024px
    xl?: number  // 1280px
  }
  gap?: number
  className?: string
}

interface DashboardCardProps {
  children: React.ReactNode
  className?: string
  glass?: boolean
  hover?: boolean
  animated?: boolean
  onClick?: () => void
}

/**
 * Responsive Dashboard Layout Component
 * 
 * Implements the user's requirements:
 * - Mobile-first responsive layout
 * - Stack vertically below 640px (sm)
 * - Expand to multi-column at 768px (md) and 1024px (lg)
 * - Consistent spacing and typography scaling
 * - Uses Tailwind breakpoints
 */
export function DashboardLayout({ children, className }: DashboardLayoutProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className={cn(
        // Mobile-first responsive layout
        'space-y-4 sm:space-y-6 md:space-y-8',
        // Consistent padding with responsive scaling
        'p-4 sm:p-6 md:p-8',
        // Ensure proper mobile handling
        'mobile-friendly',
        className
      )}
    >
      {children}
    </motion.div>
  )
}

/**
 * Dashboard Section for organizing content
 */
export function DashboardSection({ 
  children, 
  className, 
  title, 
  description 
}: DashboardSectionProps) {
  return (
    <section className={cn('space-y-4 sm:space-y-6', className)}>
      {(title || description) && (
        <motion.header
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="space-y-1 sm:space-y-2"
        >
          {title && (
            <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">
              {title}
            </h2>
          )}
          {description && (
            <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400">
              {description}
            </p>
          )}
        </motion.header>
      )}
      {children}
    </section>
  )
}

/**
 * Responsive Dashboard Grid
 * 
 * Implements responsive column layout:
 * - Mobile (default): 1 column
 * - sm (640px+): Configurable columns  
 * - md (768px+): Expand to multi-column
 * - lg (1024px+): Full multi-column layout
 */
export function DashboardGrid({ 
  children, 
  columns = { default: 1, sm: 1, md: 2, lg: 3 },
  gap = 6,
  className 
}: DashboardGridProps) {
  const gridClasses = cn(
    'grid',
    // Default mobile layout
    `grid-cols-${columns.default || 1}`,
    // Responsive breakpoints
    columns.sm && `sm:grid-cols-${columns.sm}`,
    columns.md && `md:grid-cols-${columns.md}`,
    columns.lg && `lg:grid-cols-${columns.lg}`,
    columns.xl && `xl:grid-cols-${columns.xl}`,
    // Responsive gap
    `gap-${gap}`,
    className
  )

  return (
    <div className={gridClasses}>
      {React.Children.map(children, (child, index) => (
        <motion.div
          key={index}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ 
            duration: 0.3, 
            delay: index * 0.1,
            ease: [0.16, 1, 0.3, 1]
          }}
        >
          {child}
        </motion.div>
      ))}
    </div>
  )
}

/**
 * Enhanced Dashboard Card with Animations
 */
export function DashboardCard({ 
  children, 
  className, 
  glass = true, 
  hover = true,
  animated = true,
  onClick
}: DashboardCardProps) {
  const cardClasses = cn(
    'rounded-xl border transition-all duration-300',
    // Glass morphism effect
    glass && 'glass backdrop-blur-md',
    // Hover effects
    hover && 'hover:shadow-lg hover:scale-[1.02]',
    // Base styling
    !glass && 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700',
    className
  )

  const CardComponent = animated ? motion.div : 'div'
  const motionProps = animated ? {
    whileHover: hover ? { 
      scale: 1.02,
      transition: { duration: 0.2 }
    } : undefined,
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.3 }
  } : {}

  return (
    <CardComponent
      className={cardClasses}
      onClick={onClick}
      {...motionProps}
    >
      {children}
    </CardComponent>
  )
}

/**
 * Metrics Cards Grid - Common pattern in dashboards
 */
interface MetricsGridProps {
  metrics: Array<{
    title: string
    value: string | number
    icon?: LucideIcon
    trend?: string
    color?: string
  }>
  className?: string
}

export function MetricsGrid({ metrics, className }: MetricsGridProps) {
  return (
    <DashboardGrid
      columns={{ default: 1, sm: 2, md: 2, lg: 4 }}
      gap={6}
      className={className}
    >
      {metrics.map((metric, index) => (
        <DashboardCard key={index} className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
                {metric.title}
              </p>
              <p className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
                {metric.value}
              </p>
              {metric.trend && (
                <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-1">
                  {metric.trend}
                </p>
              )}
            </div>
            {metric.icon && (
              <div className={cn(
                'p-3 rounded-lg bg-opacity-10',
                metric.color || 'bg-blue-500'
              )}>
                <metric.icon className={cn(
                  'w-6 h-6',
                  metric.color || 'text-blue-600'
                )} />
              </div>
            )}
          </div>
        </DashboardCard>
      ))}
    </DashboardGrid>
  )
}

/**
 * Dashboard Actions Grid - For quick action buttons
 */
interface ActionsGridProps {
  actions: Array<{
    title: string
    description?: string
    icon?: LucideIcon
    onClick: () => void
    variant?: 'primary' | 'secondary'
  }>
  className?: string
}

export function ActionsGrid({ actions, className }: ActionsGridProps) {
  return (
    <DashboardGrid
      columns={{ default: 1, sm: 1, md: 2, lg: 2 }}
      gap={6}
      className={className}
    >
      {actions.map((action, index) => (
        <DashboardCard key={index} hover className="p-6 cursor-pointer" onClick={action.onClick}>
          <div className="flex items-center space-x-4">
            {action.icon && (
              <div className={cn(
                'p-3 rounded-lg',
                action.variant === 'primary' 
                  ? 'bg-blue-500 text-white' 
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300'
              )}>
                <action.icon className="w-6 h-6" />
              </div>
            )}
            <div className="flex-1">
              <h3 className="font-semibold text-gray-900 dark:text-white">
                {action.title}
              </h3>
              {action.description && (
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  {action.description}
                </p>
              )}
            </div>
          </div>
        </DashboardCard>
      ))}
    </DashboardGrid>
  )
}