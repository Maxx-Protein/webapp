import { useEffect } from 'react'
import { useRouter } from 'next/router'
import { useAuth } from '@/hooks/useAuth'
import { Layout } from '@/components/layout/Layout'
import { ReportHistory } from '@/components/reports/ReportHistory'

export default function AdminReportsPage() {
  const { user, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading && !user) {
      router.push('/auth/login')
    } else if (!loading && user?.role !== 'admin') {
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

  if (!user || user.role !== 'admin') {
    return null
  }

  return (
    <Layout title="All Reports">
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">All Reports</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            View and manage all reports in the system
          </p>
        </div>
        <ReportHistory />
      </div>
    </Layout>
  )
}