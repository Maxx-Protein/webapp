import { useEffect } from 'react'
import { useRouter } from 'next/router'
import { useAuth } from '@/hooks/useAuth'
import { Layout } from '@/components/layout/Layout'
import { PaymentHistory } from '@/components/payments/PaymentHistory'

export default function UserPaymentsPage() {
  const { user, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading && !user) {
      router.push('/auth/login')
    } else if (!loading && user?.role !== 'user') {
      router.push('/dashboard')
    }
  }, [user, loading, router])

  const handleViewProof = (proof: { file_url: string }) => {
    window.open(proof.file_url, '_blank')
  }

  const handleDownloadProof = async (proof: { id: string; file_url: string; file_type: string }) => {
    try {
      const response = await fetch(proof.file_url)
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `payment-proof-${proof.id}.${proof.file_type}`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)
    } catch (error) {
      console.error('Failed to download proof:', error)
    }
  }

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
    <Layout title="Payment History">
      <PaymentHistory 
        onViewProof={handleViewProof}
        onDownloadProof={handleDownloadProof}
      />
    </Layout>
  )
}