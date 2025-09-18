import { useEffect } from 'react'
import { useRouter } from 'next/router'
import { useAuth } from '@/hooks/useAuth'
import { ReportHistory } from '@/components/reports/ReportHistory'
import { Layout } from '@/components/layout/Layout'

export default function UserReportsPage() {
  const { user, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading && !user) {
      router.push('/auth/login')
    } else if (!loading && user?.role !== 'user') {
      router.push('/dashboard')
    }
  }, [user, loading, router])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!user || user.role !== 'user') {
    return null
  }

  return (
    <Layout title="Report History">
      <ReportHistory />
    </Layout>
  )
}