import { NextApiRequest, NextApiResponse } from 'next'
import { AuthService } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabase'

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' })
  }

  try {
    // Verify admin token
    const authHeader = req.headers.authorization
    if (!authHeader?.startsWith('Bearer ')) {
      return res.status(401).json({ 
        success: false,
        message: 'No token provided' 
      })
    }

    const token = authHeader.substring(7)
    const user = await AuthService.verifyToken(token)

    if (user.role !== 'admin') {
      return res.status(403).json({ 
        success: false,
        message: 'Access denied' 
      })
    }

    // Get real stats from database
    const [usersResult, reportsResult, paymentsResult] = await Promise.all([
      supabaseAdmin.from('profiles').select('id', { count: 'exact', head: true }),
      supabaseAdmin.from('reports').select('total_amount, created_at, user_id'),
      supabaseAdmin.from('payments').select('amount, payment_status')
    ])

    if (usersResult.error || reportsResult.error || paymentsResult.error) {
      console.error('Database query error:', usersResult.error || reportsResult.error || paymentsResult.error)
      return res.status(500).json({
        success: false,
        message: 'Failed to fetch admin statistics'
      })
    }

    const reports = reportsResult.data || []
    const payments = paymentsResult.data || []
    
    const totalUsers = usersResult.count || 0
    const totalReports = reports.length
    const totalRevenue = payments
      .filter(p => p.payment_status === 'completed')
      .reduce((sum, p) => sum + (p.amount || 0), 0)
    const pendingPayments = payments
      .filter(p => ['pending', 'processing'].includes(p.payment_status))
      .reduce((sum, p) => sum + (p.amount || 0), 0)
    
    // Calculate monthly growth (simplified)
    const currentMonth = new Date().getMonth()
    const currentYear = new Date().getFullYear()
    const thisMonthReports = reports.filter(r => {
      const reportDate = new Date(r.created_at)
      return reportDate.getMonth() === currentMonth && reportDate.getFullYear() === currentYear
    }).length
    
    const lastMonth = currentMonth === 0 ? 11 : currentMonth - 1
    const lastMonthYear = currentMonth === 0 ? currentYear - 1 : currentYear
    const lastMonthReports = reports.filter(r => {
      const reportDate = new Date(r.created_at)
      return reportDate.getMonth() === lastMonth && reportDate.getFullYear() === lastMonthYear
    }).length
    
    const monthlyGrowth = lastMonthReports > 0 
      ? ((thisMonthReports - lastMonthReports) / lastMonthReports) * 100 
      : 0
    
    // Get active users (users who created reports in last 30 days)
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
    const activeUsers = new Set(
      reports
        .filter(r => new Date(r.created_at) > thirtyDaysAgo)
        .map(r => r.user_id)
    ).size

    const stats = {
      totalUsers,
      totalReports,
      totalRevenue,
      pendingPayments,
      monthlyGrowth: Math.round(monthlyGrowth * 100) / 100,
      activeUsers
    }

    // Get recent activity from the database  
    const { data: recentReports } = await supabaseAdmin
      .from('reports')
      .select('id, filename, status, created_at')
      .order('created_at', { ascending: false })
      .limit(5)
    
    const recentActivity = (recentReports || []).map(report => ({
      action: `Report ${report.status === 'approved' ? 'approved' : 'submitted'}`,
      user: 'User', // Simplified for now
      timestamp: report.created_at
    }))

    res.status(200).json({
      success: true,
      stats,
      recentActivity
    })

  } catch (error: unknown) {
    console.error('Admin dashboard stats error:', error)
    const errorMessage = error instanceof Error ? error.message : 'Failed to fetch dashboard stats'
    res.status(500).json({
      success: false,
      message: errorMessage
    })
  }
}