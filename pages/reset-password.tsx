'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import { useForm } from 'react-hook-form'
import { Eye, EyeOff, Lock, Check } from 'lucide-react'
import { useToast } from '@/components/ui/Toast'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Card, CardContent } from '@/components/ui/Card'
import { supabase } from '@/lib/supabase'

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
    const { access_token, type } = router.query
    
    if (type === 'recovery' && access_token) {
      setIsValidSession(true)
      setAccessToken(access_token as string)
    } else {
      // Redirect to login if not a valid reset session
      router.push('/')
    }
  }, [router])

  const onSubmit = async (data: ResetPasswordForm) => {
    try {
      setLoading(true)
      
      // For password reset flows coming from email links, we need to set the session first
      if (accessToken) {
        // Set the session using the access token from the URL
        const { error: sessionError } = await supabase.auth.setSession({
          access_token: accessToken as string,
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
        router.push('/')
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
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 to-primary-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <div className="mx-auto h-16 w-16 bg-primary-600 rounded-xl flex items-center justify-center">
            <Lock className="h-8 w-8 text-white" />
          </div>
          <h2 className="mt-6 text-3xl font-bold text-gray-900">
            Set New Password
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Please choose a strong password for your account
          </p>
        </div>

        <Card className="bg-white shadow-xl">
          <CardContent className="p-6">
            <form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>
              <div>
                <div className="relative">
                  <Input
                    label="New Password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="new-password"
                    placeholder="Enter your new password"
                    error={errors.password?.message}
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
                    className="absolute right-3 top-9 text-gray-400 hover:text-gray-600"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeOff className="h-6 w-6" />
                    ) : (
                      <Eye className="h-6 w-6" />
                    )}
                  </button>
                </div>
              </div>

              {/* Password Requirements */}
              {password && (
                <div className="space-y-2">
                  <p className="text-sm font-medium text-gray-700">Password requirements:</p>
                  {passwordRequirements.map((req, index) => (
                    <div key={index} className="flex items-center space-x-2">
                      <div className={`flex-shrink-0 w-4 h-4 rounded-full flex items-center justify-center ${
                        req.met ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-400'
                      }`}>
                        {req.met && <Check className="w-3 h-3" />}
                      </div>
                      <span className={`text-sm ${
                        req.met ? 'text-green-600' : 'text-gray-500'
                      }`}>
                        {req.text}
                      </span>
                    </div>
                  ))}
                </div>
              )}

              <div>
                <div className="relative">
                  <Input
                    label="Confirm New Password"
                    type={showConfirmPassword ? 'text' : 'password'}
                    autoComplete="new-password"
                    placeholder="Confirm your new password"
                    error={errors.confirmPassword?.message}
                    {...register('confirmPassword', {
                      required: 'Please confirm your password',
                      validate: (value) => 
                        value === password || 'Passwords do not match'
                    })}
                  />
                  <button
                    type="button"
                    className="absolute right-3 top-9 text-gray-400 hover:text-gray-600"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="h-6 w-6" />
                    ) : (
                      <Eye className="h-6 w-6" />
                    )}
                  </button>
                </div>
              </div>

              <Button
                type="submit"
                className="w-full"
                size="md"
                disabled={loading}
              >
                {loading ? 'Updating Password...' : 'Update Password'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}