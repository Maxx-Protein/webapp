'use client'

import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Menu, Bell, Search, X } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { ThemeToggle } from '@/components/ui/ThemeToggle'
import { useAuth } from '@/hooks/useAuth'
import { NotificationCenter, useNotifications } from '@/components/notifications/NotificationCenter'
import { useRouter } from 'next/router'

interface HeaderProps {
  title?: string
  onToggleSidebar?: () => void
  sidebarOpen?: boolean  // Add to show current state
}

export function Header({ title, onToggleSidebar, sidebarOpen = false }: HeaderProps) {
  const { user } = useAuth()
  const router = useRouter()
  const { unreadCount } = useNotifications()
  const [showNotifications, setShowNotifications] = useState(false)

  // Only show notifications for authenticated users
  if (!user) {
    return (
      <header
        role="banner"
        className="
          bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800
          shadow-sm dark:shadow-gray-900/20 fixed w-full z-30 top-0
          transition-colors duration-300 ease-in-out p-3
        "
      >
        <div
          className="
            flex items-center justify-evenly px-4 sm:px-6 py-3 sm:py-4
            max-w-screen-xl mx-auto w-full
          "
        >
          {/* Basic header without notifications */}
          <div className="flex items-center gap-3 min-w-0">
            <Button
              variant="ghost"
              size="sm"
              onClick={onToggleSidebar}
              className="lg:hidden flex-shrink-0 focus-visible:ring-2 focus-visible:ring-primary-500"
              aria-label="Open sidebar"
            >
              <Menu className="w-5 h-5" />
            </Button>
            {title && (
              <h1
                className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white truncate"
                tabIndex={0}
                aria-label={title}
              >
                {title}
              </h1>
            )}
          </div>
          <nav className="flex items-center gap-2 sm:gap-4">
            <ThemeToggle />
          </nav>
        </div>
      </header>
    )
  }

  return (
    <header
      role="banner"
      className="
        bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800
        shadow-sm dark:shadow-gray-900/20 fixed w-full z-30 top-0
        transition-colors duration-300 ease-in-out p-3
      "
    >
      <div
        className="
          flex items-center justify-evenly px-4 sm:px-6 py-3 sm:py-4
          max-w-screen-xl mx-auto w-full
        "
      >
        {/* LEFT: Enhanced Hamburger Menu (mobile) & Title */}
        <div className="flex items-center gap-3 min-w-0">
          {/* Enhanced Hamburger Menu with Animation */}
          <motion.div
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="lg:hidden"
          >
            <Button
              variant="ghost"
              size="sm"
              onClick={onToggleSidebar}
              className="flex-shrink-0 focus-visible:ring-2 focus-visible:ring-blue-500 relative overflow-hidden"
              aria-label={sidebarOpen ? "Close sidebar" : "Open sidebar"}
            >
              {/* Animated Hamburger/X Icon */}
              <motion.div
                initial={false}
                animate={{ rotate: sidebarOpen ? 180 : 0 }}
                transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                className="relative w-5 h-5"
              >
                <AnimatePresence mode="wait">
                  {sidebarOpen ? (
                    <motion.div
                      key="close"
                      initial={{ opacity: 0, rotate: -90 }}
                      animate={{ opacity: 1, rotate: 0 }}
                      exit={{ opacity: 0, rotate: 90 }}
                      transition={{ duration: 0.2 }}
                      className="absolute inset-0"
                    >
                      <X className="w-5 h-5" />
                    </motion.div>
                  ) : (
                    <motion.div
                      key="menu"
                      initial={{ opacity: 0, rotate: 90 }}
                      animate={{ opacity: 1, rotate: 0 }}
                      exit={{ opacity: 0, rotate: -90 }}
                      transition={{ duration: 0.2 }}
                      className="absolute inset-0"
                    >
                      <Menu className="w-5 h-5" />
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
              
              {/* Ripple Effect */}
              <motion.div
                className="absolute inset-0 rounded-lg bg-blue-500/20"
                initial={{ scale: 0, opacity: 0.8 }}
                whileTap={{ scale: 2, opacity: 0 }}
                transition={{ duration: 0.3 }}
              />
            </Button>
          </motion.div>
          
          {/* Enhanced Title with Animation */}
          {title && (
            <motion.h1
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3, delay: 0.1 }}
              className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white truncate flex items-center"
              tabIndex={0}
              aria-label={title}
            >
              <img 
                src="/epacific-logo.png" 
                alt="Epacific Technologies Logo" 
                className="w-8 h-8 mr-2 object-contain"
              />
              {title}
            </motion.h1>
          )}
        </div>

        {/* RIGHT: Controls */}
        <nav
          className="flex items-center gap-2 sm:gap-4"
          aria-label="Header controls"
        >
          {/* Search - visible on md+ */}
          <form
            role="search"
            aria-label="Site search"
            className="hidden md:flex items-center"
            onSubmit={e => e.preventDefault()}
          >
            <div className="relative w-full">
              <label htmlFor="header-search" className="sr-only">
                Search
              </label>
              <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400 dark:text-gray-500" />
              <input
                id="header-search"
                type="search"
                autoComplete="off"
                placeholder="Search…"
                className="
                  pl-10 pr-4 py-2 w-44 sm:w-64 text-sm rounded-lg border
                  border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-800
                  text-gray-900 dark:text-gray-100
                  placeholder-gray-500 dark:placeholder-gray-400
                  focus:ring-2 focus:ring-primary-500 dark:focus:ring-primary-400
                  focus:border-primary-500 dark:focus:border-primary-400
                  transition-all duration-200 ease-in-out
                "
                aria-label="Search site"
              />
            </div>
          </form>

          {/* Theme toggle */}
          <ThemeToggle />

          {/* Enhanced Notifications with Animation */}
          <motion.div 
            className="relative"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                if (unreadCount > 0) {
                  setShowNotifications(!showNotifications)
                } else {
                  router.push('/notifications')
                }
              }}
              className="relative focus-visible:ring-2 focus-visible:ring-blue-500"
              aria-label="View notifications"
            >
              <motion.div
                animate={{ 
                  rotate: unreadCount > 0 ? [0, 15, -15, 0] : 0 
                }}
                transition={{ 
                  duration: 0.5, 
                  repeat: unreadCount > 0 ? Infinity : 0,
                  repeatDelay: 3
                }}
              >
                <Bell className="w-5 h-5" aria-hidden="true" />
              </motion.div>
              
              {/* Enhanced Notification Badge */}
              <AnimatePresence>
                {unreadCount > 0 && (
                  <motion.span
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0, opacity: 0 }}
                    transition={{ 
                      type: "spring", 
                      stiffness: 500, 
                      damping: 30 
                    }}
                    className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center text-xs text-white font-bold shadow-lg"
                    aria-live="polite"
                    aria-label={`You have ${unreadCount} new notifications`}
                  >
                    <motion.span
                      key={unreadCount}
                      initial={{ scale: 0.5 }}
                      animate={{ scale: 1 }}
                      transition={{ duration: 0.2 }}
                    >
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </motion.span>
                  </motion.span>
                )}
              </AnimatePresence>
            </Button>

            {/* Enhanced Notification Dropdown */}
            <AnimatePresence>
              {showNotifications && (
                <motion.div 
                  className="absolute right-0 top-full mt-2 z-50"
                  initial={{ opacity: 0, y: -10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -10, scale: 0.95 }}
                  transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
                >
                  <NotificationCenter onClose={() => setShowNotifications(false)} />
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>

         
          
        </nav>
      </div>

      {/* Divider for mobile */}
      <div className="block sm:hidden border-b border-gray-100 dark:border-gray-800 shadow-sm" />
    </header>
  )
}
