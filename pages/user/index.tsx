import { useEffect } from 'react'
import { useRouter } from 'next/router'
import { useAuth } from '@/hooks/useAuth'
import { Layout } from '@/components/layout/Layout'
import UserDashboard from '@/components/dashboard/UserDashboard' // Changed import

export default function UserPage() {
  const { user, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading && (!user || user.role !== 'user')) {
      router.push('/')
    }
  }, [user, loading, router])

  if (loading || !user) {
    return <div className="min-h-screen flex items-center justify-center">Loading…</div>
  }
  
  return (
    <Layout title="User Dashboard">
      <UserDashboard />
    </Layout>
  )
}
