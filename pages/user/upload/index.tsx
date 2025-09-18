import { useEffect } from 'react'
import { useRouter } from 'next/router'
import { useAuth } from '@/hooks/useAuth'
import { Layout } from '@/components/layout/Layout'
import { ReportUpload } from '@/components/reports/ReportUpload'

export default function UploadReportPage() {
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
    <Layout title="Upload Report">
      <div className="max-w-4xl mx-auto">
        <ReportUpload />
      </div>
    </Layout>
  )
}
