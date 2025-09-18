import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import { useAuth } from '@/hooks/useAuth'
import { Layout } from '@/components/layout/Layout'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { 
  Clock, 
  Eye, 
  CreditCard,
  User,
  Calendar,
  DollarSign,
  Download
} from 'lucide-react'
import { formatCurrency, formatDate } from '@/lib/utils'

interface PaymentProof {
  id: string
  amount: number
  file_url: string
  file_type: string
  uploaded_at: string
  notes?: string
  status: string
  user: {
    full_name: string
    email: string
  }
  report: {
    id: string
    filename: string
  }
}

export default function ManagerPaymentProofsPage() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const [proofs, setProofs] = useState<PaymentProof[]>([])
  const [loadingProofs, setLoadingProofs] = useState(true)

  useEffect(() => {
    if (!loading && (!user || !['manager', 'admin'].includes(user.role))) {
      router.push('/')
    }
  }, [user, loading, router])

  useEffect(() => {
    if (user?.role === 'manager' || user?.role === 'admin') {
      fetchPendingProofs()
    }
  }, [user])

  const fetchPendingProofs = async () => {
    try {
      const response = await fetch('/api/manager/pending-payment-proofs')
      
      if (response.ok) {
        const data = await response.json()
        setProofs(data.proofs || [])
      }
    } catch (error) {
      console.error('Failed to fetch pending payment proofs:', error)
    } finally {
      setLoadingProofs(false)
    }
  }

  if (loading || !user) {
    return <div className="min-h-screen flex items-center justify-center">Loading…</div>
  }

  return (
    <Layout title="Payment Proofs">
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Payment Proofs</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Review and approve user-submitted payment proofs
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Clock className="w-5 h-5 mr-2" />
              Payment Proofs Awaiting Approval ({proofs.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loadingProofs ? (
              <div className="text-center py-8">Loading payment proofs...</div>
            ) : proofs.length === 0 ? (
              <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                No pending payment proofs found
              </div>
            ) : (
              <div className="space-y-4">
                {proofs.map((proof) => (
                  <div key={proof.id} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                    <div className="flex items-center justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-3 mb-2">
                          <CreditCard className="w-5 h-5 text-green-600 dark:text-green-400" />
                          <h3 className="font-medium text-gray-900 dark:text-white">
                            Payment Proof - {formatCurrency(proof.amount)}
                          </h3>
                          <Badge variant="warning">
                            {proof.status.replace('_', ' ').toUpperCase()}
                          </Badge>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm text-gray-600 dark:text-gray-400">
                          <div className="flex items-center">
                            <User className="w-4 h-4 mr-1" />
                            {proof.user.full_name}
                          </div>
                          <div className="flex items-center">
                            <Calendar className="w-4 h-4 mr-1" />
                            {formatDate(proof.uploaded_at)}
                          </div>
                          <div className="flex items-center">
                            <DollarSign className="w-4 h-4 mr-1" />
                            {formatCurrency(proof.amount)}
                          </div>
                          <div className="flex items-center">
                            <Download className="w-4 h-4 mr-1" />
                            {proof.file_type.toUpperCase()} File
                          </div>
                        </div>

                        {proof.notes && (
                          <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                            Note: {proof.notes}
                          </p>
                        )}
                      </div>

                      <div className="flex items-center space-x-2 ml-4">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => window.open(proof.file_url, '_blank')}
                        >
                          <Eye className="w-4 h-4 mr-1" />
                          View
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </Layout>
  )
}