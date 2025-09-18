import { NextApiRequest, NextApiResponse } from 'next'
import { AuthService } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabase'

interface FilterOptions {
  status: string
  paymentStatus: string
  dateRange: string
  searchTerm: string
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' })
  }

  try {
    const authHeader = req.headers.authorization
    if (!authHeader?.startsWith('Bearer ')) {
      return res.status(401).json({ success: false, message: 'No token provided' })
    }

    const token = authHeader.substring(7)
    const user = await AuthService.verifyToken(token)

    if (user.role !== 'user') {
      return res.status(403).json({ success: false, message: 'Access denied' })
    }

    const { filters }: { filters: FilterOptions } = req.body

    // Build the query conditions
    let query = supabaseAdmin
      .from('reports')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    // Apply filters
    if (filters.status && filters.status !== 'all') {
      query = query.eq('status', filters.status)
    }

    if (filters.paymentStatus && filters.paymentStatus !== 'all') {
      query = query.eq('payment_status', filters.paymentStatus)
    }

    // Date range filter
    if (filters.dateRange && filters.dateRange !== 'all') {
      const now = new Date()
      const daysAgo = {
        '7days': 7,
        '30days': 30,
        '90days': 90
      }[filters.dateRange]

      if (daysAgo) {
        const cutoffDate = new Date(now.getTime() - daysAgo * 24 * 60 * 60 * 1000)
        query = query.gte('created_at', cutoffDate.toISOString())
      }
    }

    const { data: reports, error: reportsError } = await query

    if (reportsError) {
      console.error('Reports fetch error:', reportsError)
      return res.status(500).json({
        success: false,
        message: 'Failed to fetch reports'
      })
    }

    // Apply search filter on the client side for filename
    let filteredReports = reports || []
    if (filters.searchTerm) {
      filteredReports = filteredReports.filter(report =>
        report.filename.toLowerCase().includes(filters.searchTerm.toLowerCase())
      )
    }

    // Calculate statistics
    const stats = {
      totalReports: filteredReports.length,
      pendingApproval: filteredReports.filter(r => r.status === 'pending_approval').length,
      approved: filteredReports.filter(r => r.status === 'approved').length,
      rejected: filteredReports.filter(r => r.status === 'rejected').length,
      totalAmount: filteredReports.reduce((sum, r) => sum + (r.total_amount || 0), 0),
      paidAmount: filteredReports
        .filter(r => r.payment_status === 'completed')
        .reduce((sum, r) => sum + (r.total_amount || 0), 0),
      pendingPayment: filteredReports
        .filter(r => ['pending', 'pending_approval', 'rejected'].includes(r.payment_status))
        .reduce((sum, r) => sum + (r.total_amount || 0), 0)
    }

    return res.status(200).json({
      success: true,
      reports: filteredReports,
      stats
    })

  } catch (error: unknown) {
    console.error('Dashboard data fetch error:', error)
    const errorMessage = error instanceof Error ? error.message : 'Failed to fetch dashboard data'
    return res.status(500).json({ 
      success: false, 
      message: errorMessage,
      error: process.env.NODE_ENV === 'development' ? String(error) : undefined
    })
  }
}