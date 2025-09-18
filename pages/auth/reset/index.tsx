'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import { useForm } from 'react-hook-form'
import { Eye, EyeOff, Lock, Check } from 'lucide-react'
import { useToast } from '@/components/ui/Toast'
import { Button } from '@/components/ui/Button'
import { Card, CardContent, CardTitle } from '@/components/ui/Card'
import { supabase } from '@/lib/supabase'
import { motion } from 'framer-motion'

interface ResetPasswordForm {
  password: string
  confirmPassword: string
}

export default function ResetPasswordPage() {
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [isValidSession, setIsValidSession] = useState(false)
  const [accessToken, setAccessToken] = useState<string | null>(null)
  const { showToast } = useToast()
  const router = useRouter()

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
  } = useForm<ResetPasswordForm>()

  const password = watch('password')

  useEffect(() => {
    // Check if this is a valid password reset session
    const hash = window.location.hash.substring(1)
    const params = new URLSearchParams(hash)
    const access_token = params.get('access_token')
    const type = params.get('type')
    
    if (type === 'recovery' && access_token) {
      setIsValidSession(true)
      setAccessToken(access_token)
    } else {
      // Redirect to login if not a valid reset session
      router.push('/auth/login')
    }
  }, [router])

  const onSubmit = async (data: ResetPasswordForm) => {
    try {
      setLoading(true)
      
      // For password reset flows coming from email links, we need to set the session first
      if (accessToken) {
        // Set the session using the access token from the URL
        const { error: sessionError } = await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: '', // Refresh token is not needed for password reset
        })
        
        if (sessionError) {
          throw new Error(sessionError.message)
        }
      }
      
      // Now update the password
      await supabase.auth.updateUser({
        password: data.password
      })
      
      showToast({
        type: 'success',
        message: 'Password updated successfully! Redirecting to login...'
      })

      // Redirect to login after successful password reset
      setTimeout(() => {
        router.push('/auth/login')
      }, 2000)
    } catch (error) {
      showToast({
        type: 'error',
        message: error instanceof Error ? error.message : 'Failed to update password'
      })
    } finally {
      setLoading(false)
    }
  }

  const passwordRequirements = [
    { text: 'At least 6 characters', met: password?.length >= 6 },
    { text: 'Contains a number', met: /\d/.test(password || '') },
    { text: 'Contains a letter', met: /[a-zA-Z]/.test(password || '') },
  ]

  if (!isValidSession) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-cyan-100 dark:from-slate-900 dark:to-slate-800">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-cyan-100 dark:from-slate-900 dark:to-slate-800 py-12 px-4 sm:px-6 lg:px-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="max-w-md w-full space-y-8"
      >
        <div className="text-center">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.1, duration: 0.3 }}
            className="mx-auto w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center mb-4"
          >
            <Lock className="h-8 w-8 text-white" />
          </motion.div>
          <CardTitle className="text-2xl font-bold text-gray-900 dark:text-white">
            Set New Password
          </CardTitle>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">
            Please choose a strong password for your account
          </p>
        </div>

        <Card className="backdrop-blur-md bg-white/30 dark:bg-slate-800/30 rounded-2xl shadow-xl border border-white/20">
          <CardContent className="p-6">
            <form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>
              <div>
                <div className="relative">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    New Password
                  </label>
                  <Lock className="absolute left-3 top-10 w-5 h-5 text-gray-400 dark:text-gray-500" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="new-password"
                    placeholder="Enter your new password"
                    className="w-full pl-10 pr-12 py-3 rounded-md bg-white/50 dark:bg-slate-700/50 border border-white/20 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent backdrop-blur-sm"
                    {...register('password', {
                      required: 'Password is required',
                      minLength: {
                        value: 6,
                        message: 'Password must be at least 6 characters'
                      },
                      validate: {
                        hasNumber: (value) => /\d/.test(value) || 'Password must contain at least one number',
                        hasLetter: (value) => /[a-zA-Z]/.test(value) || 'Password must contain at least one letter'
                      }
                    })}
                  />
                  <button
                    type="button"
                    className="absolute right-3 top-10 text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeOff className="h-5 w-5" />
                    ) : (
                      <Eye className="h-5 w-5" />
                    )}
                  </button>
                </div>
                {errors.password && (
                  <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.password.message}</p>
                )}
              </div>

              {/* Password Requirements */}
              {password && (
                <motion.div 
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className="space-y-2"
                >
                  <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Password requirements:</p>
                  {passwordRequirements.map((req, index) => (
                    <div key={index} className="flex items-center space-x-2">
                      <div className={`flex-shrink-0 w-4 h-4 rounded-full flex items-center justify-center ${
                        req.met ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-400'
                      }`}>
                        {req.met && <Check className="w-3 h-3" />}
                      </div>
                      <span className={`text-sm ${
                        req.met ? 'text-green-600 dark:text-green-400' : 'text-gray-500 dark:text-gray-400'
                      }`}>
                        {req.text}
                      </span>
                    </div>
                  ))}
                </motion.div>
              )}

              <div>
                <div className="relative">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Confirm New Password
                  </label>
                  <Lock className="absolute left-3 top-10 w-5 h-5 text-gray-400 dark:text-gray-500" />
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    autoComplete="new-password"
                    placeholder="Confirm your new password"
                    className="w-full pl-10 pr-12 py-3 rounded-md bg-white/50 dark:bg-slate-700/50 border border-white/20 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent backdrop-blur-sm"
                    {...register('confirmPassword', {
                      required: 'Please confirm your password',
                      validate: (value) => 
                        value === password || 'Passwords do not match'
                    })}
                  />
                  <button
                    type="button"
                    className="absolute right-3 top-10 text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="h-5 w-5" />
                    ) : (
                      <Eye className="h-5 w-5" />
                    )}
                  </button>
                </div>
                {errors.confirmPassword && (
                  <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.confirmPassword.message}</p>
                )}
              </div>

              <Button
                type="submit"
                className="w-full py-3 rounded-lg font-bold relative overflow-hidden group"
                disabled={loading}
                style={{
                  background: 'linear-gradient(90deg, #2563eb, #3b82f6)',
                  transition: 'all 0.3s ease'
                }}
              >
                <span className="flex items-center justify-center">
                  {loading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Updating Password...
                    </>
                  ) : (
                    'Update Password'
                  )}
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