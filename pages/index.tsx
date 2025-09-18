'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/router'
import { useAuth } from '@/hooks/useAuth'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Mail, Lock } from 'lucide-react'
import { motion } from 'framer-motion'
import { useToast } from '@/components/ui/Toast'

export default function LoginPage() {
  const { user, loading, signIn } = useAuth()
  const router = useRouter()
  const { showToast } = useToast()
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  })
  const [isLoading, setIsLoading] = useState(false)
  const blobRefs = useRef<(HTMLDivElement | null)[]>([])

  // Redirect if already logged in
  useEffect(() => {
    if (user && !loading) {
      const dashboardRoutes = {
        admin: '/admin',
        manager: '/manager', 
        user: '/user'
      }
      
      const redirectPath = dashboardRoutes[user.role as keyof typeof dashboardRoutes]
      if (redirectPath) {
        router.push(redirectPath)
      }
    }
  }, [user, loading, router])

  // Mouse move effect for background blobs with smooth transitions
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (blobRefs.current) {
        const x = e.clientX / window.innerWidth
        const y = e.clientY / window.innerHeight
        
        blobRefs.current.forEach((blob, index) => {
          if (blob) {
            // Different movement patterns for each blob
            const offsetX = (x * 20 - 10) * (index + 1) * 0.5
            const offsetY = (y * 20 - 10) * (index + 1) * 0.3
            blob.style.transform = `translate(${offsetX}px, ${offsetY}px)`
          }
        })
      }
    }

    window.addEventListener('mousemove', handleMouseMove)
    return () => window.removeEventListener('mousemove', handleMouseMove)
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      await signIn({
        email: formData.email.trim().toLowerCase(),
        password: formData.password
      })
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Login failed'
      showToast({
        type: 'error',
        message: errorMessage,
        duration: 3000
      })
    } finally {
      setIsLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-cyan-100 dark:from-slate-900 dark:to-slate-800">
        <div className="animate-pulse text-gray-600 dark:text-gray-400">Loading...</div>
      </div>
    )
  }

  if (user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-cyan-100 dark:from-slate-900 dark:to-slate-800">
        <div className="text-gray-600 dark:text-gray-400">Redirecting to dashboard...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-cyan-100 dark:from-slate-900 dark:to-slate-800 overflow-hidden relative">
      {/* Animated background blobs */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div 
          ref={(el) => { if (el) blobRefs.current[0] = el; }}
          className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-500 rounded-full blur-3xl opacity-40 transition-transform duration-700 animate-blob"
        ></div>
        <div 
          ref={(el) => { if (el) blobRefs.current[1] = el; }}
          className="absolute top-1/3 right-1/4 w-96 h-96 bg-purple-500 rounded-full blur-3xl opacity-40 transition-transform duration-700 animate-blob"
          style={{ animationDelay: '2s' }}
        ></div>
        <div 
          ref={(el) => { if (el) blobRefs.current[2] = el; }}
          className="absolute bottom-1/4 left-1/2 w-96 h-96 bg-cyan-500 rounded-full blur-3xl opacity-40 transition-transform duration-700 animate-blob"
          style={{ animationDelay: '4s' }}
        ></div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-sm z-10"
      >
        <Card className="backdrop-blur-md bg-white/30 dark:bg-slate-800/30 rounded-2xl shadow-xl border border-white/20">
          <CardHeader className="text-center pb-6">
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.1, duration: 0.3 }}
              className="mx-auto mb-4"
            >
              <img 
                src="/epacific-logo.png" 
                alt="Epacific Technologies Logo" 
                className="w-16 h-16 mx-auto object-contain"
              />
            </motion.div>
            <CardTitle className="text-2xl font-bold text-gray-900 dark:text-white">
              Welcome to Epacific Technologies
            </CardTitle>
            <p className="text-gray-600 dark:text-gray-300 mt-2">
              Sign in to your account
            </p>
          </CardHeader>
          
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 w-5 h-5 text-gray-400 dark:text-gray-500" />
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                    className="w-full pl-10 pr-4 py-3 rounded-md bg-white/50 dark:bg-slate-700/50 border border-white/20 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent backdrop-blur-sm"
                    placeholder="Enter your email"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 w-5 h-5 text-gray-400 dark:text-gray-500" />
                  <input
                    type="password"
                    value={formData.password}
                    onChange={(e) => setFormData({...formData, password: e.target.value})}
                    className="w-full pl-10 pr-4 py-3 rounded-md bg-white/50 dark:bg-slate-700/50 border border-white/20 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent backdrop-blur-sm"
                    placeholder="Enter your password"
                    required
                  />
                </div>
              </div>

              <Button
                type="submit"
                className="w-full py-3 rounded-lg font-bold relative overflow-hidden group"
                disabled={isLoading}
                style={{
                  background: 'linear-gradient(90deg, #2563eb, #3b82f6)',
                  transition: 'all 0.3s ease'
                }}
              >
                <span className="flex items-center justify-center">
                  {isLoading ? 'Signing In...' : 'Sign In'}
                </span>
                <span className="absolute right-0 top-0 h-full w-0 bg-white/20 group-hover:w-full transition-all duration-300"></span>
              </Button>
            </form>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  )
}