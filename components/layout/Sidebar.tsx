'use client'

import React from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Home,
  Upload,
  FileText,
  CreditCard,
  Users,
  BarChart3,
  Settings,
  LogOut,
  User
} from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/Button'

const navigation = {
  admin: [
    { name: 'Dashboard', href: '/admin', icon: Home },
    { name: 'Users', href: '/admin/users', icon: Users },
    { name: 'Reports', href: '/admin/reports', icon: FileText },
    { name: 'Analytics', href: '/admin/analytics', icon: BarChart3 },
    { name: 'Settings', href: '/admin/settings', icon: Settings },
  ],
  manager: [
    { name: 'Dashboard', href: '/manager', icon: Home },
    { name: 'Users', href: '/manager/users', icon: Users },
    { name: 'Reports', href: '/manager/reports', icon: FileText },
    { name: 'Pending Reports', href: '/manager/reports', icon: FileText },
  ],
  user: [
    { name: 'Dashboard', href: '/user', icon: Home },
    { name: 'Upload Report', href: '/user/upload', icon: Upload },
    { name: 'My Reports', href: '/user/reports', icon: FileText },
    { name: 'Payments', href: '/user/payments', icon: CreditCard },
  ],
}

interface SidebarProps {
  open?: boolean       // mobile toggle
  onClose?: () => void // close on mobile
  className?: string
}

export function Sidebar({ open = false, onClose, className = '' }: SidebarProps) {
  const { user, signOut } = useAuth()
  const pathname = usePathname()
  const router = useRouter()
  if (!user) return null

  const userNavigation = navigation[user.role] || []

  const handleLogout = () => {
    signOut()
    router.push('/')
  }

  const handleProfile = () => {
    router.push(`/${user.role}/profile`)
  }

  const sidebarVariants = {
    hidden: {
      x: '-100%',
      transition: {
        duration: 0.3,
        ease: [0.16, 1, 0.3, 1]
      }
    },
    visible: {
      x: 0,
      transition: {
        duration: 0.3,
        ease: [0.16, 1, 0.3, 1]
      }
    }
  }

  const backdropVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1 }
  }

  const navItemVariants = {
    hidden: { opacity: 0, x: -20 },
    visible: (index: number) => ({
      opacity: 1,
      x: 0,
      transition: {
        delay: index * 0.1,
        duration: 0.3,
        ease: [0.16, 1, 0.3, 1]
      }
    })
  }

  return (
    // Enhanced responsive sidebar with Framer Motion animations
    <>
      {/* Animated Backdrop */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial="hidden"
            animate="visible"
            exit="hidden"
            variants={backdropVariants}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-40 bg-black/40 lg:hidden"
            onClick={onClose}
            aria-label="Sidebar backdrop"
          />
        )}
      </AnimatePresence>

      {/* Enhanced Sidebar with Motion */}
      <motion.aside
        initial={false}
        animate={open || (typeof window !== 'undefined' && window.innerWidth >= 1024) ? 'visible' : 'hidden'}
        variants={sidebarVariants}
        className={cn(
          `fixed z-50 inset-y-0 left-0 w-64 bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl
          shadow-2xl border-r border-gray-200/50 dark:border-gray-800/50
          flex flex-col lg:translate-x-0 lg:static lg:block lg:bg-white lg:dark:bg-gray-900
          lg:backdrop-blur-none lg:shadow-lg`,
          className
        )}
        aria-label="Sidebar"
        tabIndex={-1}
      >
        {/* Enhanced Logo and Brand Section */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          className="flex items-center justify-between p-4 border-b border-gray-200/50 dark:border-gray-800/50 bg-gradient-to-r from-gray-50/80 to-gray-100/80 dark:from-gray-800/50 dark:to-gray-900/50 backdrop-blur-sm"
        >
          <motion.div 
            className="flex items-center"
            whileHover={{ scale: 1.02 }}
            transition={{ duration: 0.2 }}
          >
            <motion.div 
              className="bg-gradient-to-br from-blue-500 to-indigo-600 p-2 rounded-lg shadow-lg"
              whileHover={{ 
                scale: 1.1,
                boxShadow: "0 8px 25px rgba(59, 130, 246, 0.3)"
              }}
              transition={{ duration: 0.2 }}
            >
              <img 
                src="/epacific-logo.png" 
                alt="Epacific Technologies Logo" 
                className="w-6 h-6 text-white object-contain"
              />
            </motion.div>
            <div className="ml-3">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white truncate">Epacific Technologies</h2>
              <p className="text-xs text-gray-600 dark:text-gray-400">Professional Solutions</p>
            </div>
          </motion.div>
          {/* Enhanced Dismiss button for mobile */}
          <motion.button
            type="button"
            onClick={onClose}
            className="text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white focus:ring-2 focus:ring-blue-500 rounded-lg p-2 lg:hidden transition-colors duration-200"
            aria-label="Close sidebar"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
          >
            <svg width="22" height="22" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path d="M6 6l12 12M6 18L18 6" strokeWidth={2} strokeLinecap="round" />
            </svg>
          </motion.button>
        </motion.div>

        {/* Enhanced Navigation with Animations */}
        <nav className="flex-1 overflow-y-auto px-2 pt-6 space-y-2 pb-4">
          <motion.div
            initial="hidden"
            animate="visible"
            className="space-y-2"
          >
            {userNavigation.map((item, index) => {
              const isActive = pathname === item.href
              return (
                <motion.div
                  key={item.name}
                  custom={index}
                  variants={navItemVariants}
                  whileHover={{ 
                    x: 4,
                    transition: { duration: 0.2 }
                  }}
                  whileTap={{ scale: 0.98 }}
                >
                  <Link
                    href={item.href}
                    onClick={onClose} // Close sidebar on mobile when navigation item is clicked
                    className={cn(
                      'flex items-center px-4 py-3 rounded-xl text-sm font-medium transition-all w-full touch-manipulation group relative overflow-hidden',
                      isActive
                        ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-500/25 border border-blue-500/20'
                        : 'text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gradient-to-r hover:from-gray-100 hover:to-gray-50 dark:hover:from-gray-800/70 dark:hover:to-gray-700/50 active:bg-gray-200 dark:active:bg-gray-700'
                    )}
                  >
                    {/* Active indicator */}
                    {isActive && (
                      <motion.div
                        layoutId="activeTab"
                        className="absolute inset-0 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl"
                        initial={false}
                        transition={{
                          type: "spring",
                          stiffness: 500,
                          damping: 30
                        }}
                      />
                    )}
                    
                    {/* Icon with enhanced hover effect */}
                    <motion.div
                      className={cn(
                        'relative z-10 transition-transform duration-200',
                        isActive ? 'text-white' : 'group-hover:scale-110'
                      )}
                    >
                      <item.icon className="w-5 h-5 flex-shrink-0" />
                    </motion.div>
                    
                    {/* Text */}
                    <span className={cn(
                      'ml-3 truncate relative z-10 transition-all duration-200',
                      isActive ? 'text-white font-semibold' : 'group-hover:translate-x-1'
                    )}>
                      {item.name}
                    </span>
                    
                    {/* Hover gradient effect */}
                    {!isActive && (
                      <motion.div
                        className="absolute inset-0 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                        initial={false}
                      />
                    )}
                  </Link>
                </motion.div>
              )
            })}
          </motion.div>
        </nav>

        {/* Enhanced User Controls Section */}
        <motion.div 
          className="mt-auto border-t border-gray-200/50 dark:border-gray-800/50 bg-gradient-to-r from-gray-50/80 to-gray-100/80 dark:from-gray-800/50 dark:to-gray-900/50 backdrop-blur-sm px-4 py-4"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.3 }}
        >
          {/* Enhanced User Profile Card */}
          <motion.div 
            className="flex items-center p-3 rounded-xl bg-white/70 dark:bg-gray-800/70 border border-gray-200/50 dark:border-gray-700/50 shadow-sm backdrop-blur-sm mb-4"
            whileHover={{ 
              scale: 1.02,
              boxShadow: "0 4px 12px rgba(0, 0, 0, 0.1)"
            }}
            transition={{ duration: 0.2 }}
          >
            <motion.div 
              className="w-10 h-10 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center shadow-lg"
              whileHover={{ scale: 1.1 }}
              transition={{ duration: 0.2 }}
            >
              <span className="text-base font-bold text-white">
                {user.fullName.charAt(0).toUpperCase()}
              </span>
            </motion.div>
            <div className="ml-3 min-w-0 flex-1">
              <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{user.fullName}</p>
              <motion.p 
                className="text-xs text-gray-500 dark:text-gray-400 capitalize px-2 py-1 rounded-full bg-gray-100 dark:bg-gray-700 inline-block"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
              >
                {user.role}
              </motion.p>
            </div>
          </motion.div>
          
          {/* Enhanced Action Buttons */}
          <motion.div 
            className="flex flex-col gap-2"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
          >
            <motion.div
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <Button
                variant="ghost"
                size="sm"
                onClick={handleProfile}
                className="w-full justify-start text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-white/50 dark:hover:bg-gray-800/50 rounded-xl transition-all duration-200 backdrop-blur-sm"
              >
                <User className="w-4 h-4" />
                <span className="ml-2">Profile</span>
              </Button>
            </motion.div>
            
            <motion.div
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <Button
                variant="ghost"
                size="sm"
                onClick={handleLogout}
                className="w-full justify-start text-gray-600 dark:text-gray-300 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50/50 dark:hover:bg-red-900/20 rounded-xl transition-all duration-200 backdrop-blur-sm"
              >
                <LogOut className="w-4 h-4" />
                <span className="ml-2">Logout</span>
              </Button>
            </motion.div>
          </motion.div>
        </motion.div>
      </motion.aside>
    </>
  )
}
