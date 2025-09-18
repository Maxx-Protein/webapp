'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import { supabase } from '@/lib/supabase'
import { useToast } from '@/components/ui/Toast'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/Card'

export default function AuthConfirmPage() {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showErrorScreen, setShowErrorScreen] = useState(false)
  const [showPasswordForm, setShowPasswordForm] = useState(false)
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [passwordError, setPasswordError] = useState('')
  const [settingPassword, setSettingPassword] = useState(false)
  const router = useRouter()
  const { showToast } = useToast()

  useEffect(() => {
    const handleEmailConfirmation = async () => {
      try {
        // Get the hash fragment from the URL
        const hash = window.location.hash.substring(1) // Remove the # symbol
        
        // Check for expired/invalid links
        if (hash.includes('error=access_denied') || hash.includes('otp_expired')) {
          setShowErrorScreen(true)
          setLoading(false)
          return
        }

        if (!hash) {
          setShowErrorScreen(true)
          setLoading(false)
          return
        }

        // Convert hash to URLSearchParams
        const params = new URLSearchParams(hash)
        const accessToken = params.get('access_token')
        const refreshToken = params.get('refresh_token')
        const type = params.get('type')

        // Check if this is an email confirmation (invite or magic link)
        if (type === 'invite' || type === 'magiclink' || type === 'signup') {
          if (accessToken && refreshToken) {
            // Exchange the code for a session
            const { error: sessionError } = await supabase.auth.setSession({
              access_token: accessToken,
              refresh_token: refreshToken,
            })

            if (sessionError) {
              throw new Error(sessionError.message)
            }

            // For invite links, show password setting form
            if (type === 'invite') {
              setShowPasswordForm(true)
              setLoading(false)
              return
            }

            showToast({
              type: 'success',
              message: 'Account confirmed successfully! Redirecting to dashboard...'
            })

            // Redirect to dashboard after successful confirmation
            setTimeout(() => {
              router.push('/dashboard')
            }, 2000)
          } else {
            setShowErrorScreen(true)
          }
        } else if (type === 'recovery') {
          // This is a password reset link, redirect to reset password page
          router.push(`/auth/reset/confirm?${hash}`)
        } else {
          setShowErrorScreen(true)
        }
      } catch (err) {
        console.error('Email confirmation error:', err)
        setError(err instanceof Error ? err.message : 'Failed to confirm email')
        setShowErrorScreen(true)
        showToast({
          type: 'error',
          message: err instanceof Error ? err.message : 'Failed to confirm email'
        })
      } finally {
        if (!showPasswordForm && !showErrorScreen) {
          setLoading(false)
        }
      }
    }

    // Only run this on the client side
    if (typeof window !== 'undefined') {
      handleEmailConfirmation()
    }
  }, [router, showToast])

  const handleSetPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Validate passwords
    if (!password || password.length < 6) {
      setPasswordError('Password must be at least 6 characters')
      return
    }
    
    if (password !== confirmPassword) {
      setPasswordError('Passwords do not match')
      return
    }
    
    setSettingPassword(true)
    
    try {
      // Update user's password
      const { error: updateError } = await supabase.auth.updateUser({
        password: password
      })
      
      if (updateError) {
        throw new Error(updateError.message)
      }
      
      showToast({
        type: 'success',
        message: 'Password set successfully! Redirecting to login...'
      })
      
      // Redirect to login page after setting password
      setTimeout(() => {
        router.push('/auth/login')
      }, 2000)
    } catch (err) {
      console.error('Password setting error:', err)
      setPasswordError(err instanceof Error ? err.message : 'Failed to set password')
      showToast({
        type: 'error',
        message: err instanceof Error ? err.message : 'Failed to set password'
      })
    } finally {
      setSettingPassword(false)
    }
  }

  if (showPasswordForm) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 to-primary-100 py-12 px-4 sm:px-6 lg:px-8">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Set Your Password</CardTitle>
            <p className="text-sm text-gray-600 mt-2">
              Please set a password for your new account
            </p>
          </CardHeader>
          <form onSubmit={handleSetPassword}>
            <CardContent className="space-y-4">
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                  Password
                </label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value)
                    if (passwordError) setPasswordError('')
                  }}
                  placeholder="Enter your password"
                  required
                />
              </div>
              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">
                  Confirm Password
                </label>
                <Input
                  id="confirmPassword"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => {
                    setConfirmPassword(e.target.value)
                    if (passwordError) setPasswordError('')
                  }}
                  placeholder="Confirm your password"
                  required
                />
              </div>
              {passwordError && (
                <div className="text-sm text-red-600">{passwordError}</div>
              )}
            </CardContent>
            <CardFooter className="flex flex-col space-y-2">
              <Button 
                type="submit" 
                className="w-full"
                disabled={settingPassword}
              >
                {settingPassword ? 'Setting Password...' : 'Set Password'}
              </Button>
              <Button
                type="button"
                variant="secondary"
                className="w-full"
                onClick={() => router.push('/auth/login')}
              >
                Back to Login
              </Button>
            </CardFooter>
          </form>
        </Card>
      </div>
    )
  }

  if (showErrorScreen) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 to-primary-100 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          <div className="text-center">
            <div className="mx-auto h-20 w-20 bg-red-100 rounded-full flex items-center justify-center">
              <svg className="h-12 w-12 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            
            <h2 className="mt-6 text-3xl font-bold text-gray-900">
              Link Expired or Invalid
            </h2>
            
            <p className="mt-2 text-sm text-gray-600">
              Your invite link has expired or is invalid. Please request a new invite from your admin/manager.
            </p>
          </div>

          <div className="flex flex-col items-center">
            <Button
              onClick={() => router.push('/auth/login')}
              className="mt-4"
            >
              Back to Login
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 to-primary-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <div className="mx-auto h-16 w-16 bg-primary-600 rounded-xl flex items-center justify-center">
            {/* Removed duplicate loader - using the main loader below */}
          </div>
          <h2 className="mt-6 text-3xl font-bold text-gray-900">
            {loading ? 'Confirming your account...' : 'Account Confirmation'}
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            {loading 
              ? 'Please wait while we confirm your account.' 
              : error 
                ? error 
                : 'Your account has been confirmed successfully!'}
          </p>
        </div>

        <div className="flex flex-col items-center">
          {loading ? (
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          ) : error ? (
            <div className="text-center">
              <div className="mx-auto h-12 w-12 bg-red-100 rounded-full flex items-center justify-center">
                <svg className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </div>
              <p className="mt-4 text-sm text-gray-500">
                There was an error confirming your account. Please try again or contact support.
              </p>
              <Button
                onClick={() => router.push('/auth/login')}
                className="mt-4"
              >
                Back to Login
              </Button>
            </div>
          ) : (
            <div className="text-center">
              <div className="mx-auto h-12 w-12 bg-green-100 rounded-full flex items-center justify-center">
                <svg className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <p className="mt-4 text-sm text-gray-500">
                Your account has been confirmed successfully! You will be redirected to your dashboard shortly.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}