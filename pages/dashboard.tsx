import { useEffect } from 'react'
import { useRouter } from 'next/router'
import { useAuth } from '@/hooks/useAuth'

export default function DashboardRedirect() {
  const { user, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading) {
      if (!user) {
        // Not logged in, redirect to login
        router.replace('/')
      } else {
        // Logged in, redirect to correct dashboard
        const dashboardRoutes = {
          admin: '/admin',
          manager: '/manager',
          user: '/user'
        }
        
        const redirectPath = dashboardRoutes[user.role as keyof typeof dashboardRoutes]
        if (redirectPath) {
          router.replace(redirectPath)
        } else {
          router.replace('/')
        }
      }
    }
  }, [user, loading, router])

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-gray-600">Redirecting to your dashboard...</div>
    </div>
  )
}
