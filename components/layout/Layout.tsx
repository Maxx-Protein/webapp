'use client'

import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuth } from '@/hooks/useAuth'
import { Sidebar } from './Sidebar'
import { Header } from './Header'

interface LayoutProps {
  children: React.ReactNode
  title?: string
}

export function Layout({ children, title }: LayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [isMobile, setIsMobile] = useState(false)
  const { loading } = useAuth()

  // Enhanced responsive detection
  useEffect(() => {
    const checkScreenSize = () => {
      setIsMobile(window.innerWidth < 1024)
    }
    
    checkScreenSize()
    window.addEventListener('resize', checkScreenSize)
    return () => window.removeEventListener('resize', checkScreenSize)
  }, [])

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen)
  }

  const closeSidebar = () => {
    setSidebarOpen(false)
  }

  // Auto-close sidebar on desktop when toggled
  useEffect(() => {
    if (!isMobile && sidebarOpen) {
      setSidebarOpen(false)
    }
  }, [isMobile, sidebarOpen])

  if (loading) {
    return (
      <motion.div 
        className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
      >
        <div className="text-center">
          <motion.div 
            className="loading-spinner w-8 h-8 mx-auto mb-4"
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          />
          <motion.p 
            className="text-gray-600 dark:text-gray-400"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            Loading...
          </motion.p>
        </div>
      </motion.div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex overflow-hidden">
      {/* Enhanced Sidebar */}
      <Sidebar 
        open={sidebarOpen} 
        onClose={closeSidebar} 
      />
      
      {/* Enhanced Main Content Area */}
      <motion.div 
        className="flex-1 flex flex-col min-w-0 lg:ml-0"
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.4, delay: 0.1 }}
      >
        <Header 
          title={title}
          onToggleSidebar={toggleSidebar}
          sidebarOpen={sidebarOpen}
        />
        
        {/* Enhanced Main Content with Responsive Layout */}
        <motion.main 
          className="flex-1 overflow-auto"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.2 }}
        >
          {/* Responsive Container */}
          <div className="h-full">
            {/* Mobile-First Layout: Stack vertically below sm:640px */}
            <div className="
              p-4 sm:p-6 pt-20 md:pt-24
              max-w-7xl mx-auto
              
              /* Mobile: Stack vertically */
              flex flex-col space-y-4 sm:space-y-6
              
              /* Tablet md:768px: Expand to multi-column */
              md:grid md:grid-cols-1 md:gap-6 md:space-y-0
              
              /* Desktop lg:1024px: Full multi-column layout */
              lg:grid-cols-1 lg:gap-8
            ">
              <AnimatePresence mode="wait">
                <motion.div
                  key={title || 'default'}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.3 }}
                  className="w-full"
                >
                  {children}
                </motion.div>
              </AnimatePresence>
            </div>
          </div>
        </motion.main>
      </motion.div>
    </div>
  )
}
