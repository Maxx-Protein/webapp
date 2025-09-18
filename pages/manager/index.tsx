import { useEffect } from 'react'
import { useRouter } from 'next/router'
import { useAuth } from '@/hooks/useAuth'
import { Layout } from '@/components/layout/Layout'
import { ManagerDashboard } from '@/components/dashboard/ManagerDashboard'

export default function ManagerPage() {
  const { user, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading && (!user || (user.role !== 'manager' && user.role !== 'admin'))) {
      router.push('/')
    }
  }, [user, loading, router])

  if (loading || !user) {
    return <div className="min-h-screen flex items-center justify-center">Loading…</div>
  }
  return (
    <Layout title="Manager Dashboard">
      <ManagerDashboard />
    </Layout>
  )
}
