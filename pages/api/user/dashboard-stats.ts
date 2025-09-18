import { NextApiRequest, NextApiResponse } from 'next'
import { createServerSupabaseClient } from '@/lib/supabase'

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' })
  }

  try {
    // Verify user session
    const supabase = createServerSupabaseClient(req, res)
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      })
    }

    // Get user profile to check role
    const { data: userProfile, error: profileError } = await supabase
      .from('users')
      .select('role, is_active')
      .eq('id', user.id)
      .single()

    if (profileError || !userProfile || !userProfile.is_active) {
      return res.status(403).json({
        success: false,
        message: 'Access denied or account inactive'
      })
    }

    if (userProfile.role !== 'user') {
      return res.status(403).json({ 
        success: false,
        message: 'Access denied' 
      })
    }

    // Get real stats from database using RLS policies
    const { data: reportsData, error: reportsError } = await supabase
      .from('reports')
      .select('total_amount, status, created_at, report_date')
      .eq('user_id', user.id)

    const { data: paymentsData, error: paymentsError } = await supabase
      .from('payments')
      .select('amount, payment_status, created_at')
      .eq('user_id', user.id)

    if (reportsError || paymentsError) {
      console.error('Database query error:', reportsError || paymentsError)
      return res.status(500).json({
        success: false,
        message: 'Failed to fetch user statistics'
      })
    }

    const reports = reportsData || []
    const payments = paymentsData || []

    // Calculate real statistics
    const totalReports = reports.length
    const totalAmount = payments
      .filter(p => p.payment_status === 'completed')
      .reduce((sum, p) => sum + (p.amount || 0), 0)
    const pendingAmount = payments
      .filter(p => ['pending', 'processing', 'pending_approval'].includes(p.payment_status))
      .reduce((sum, p) => sum + (p.amount || 0), 0)
    
    // Get this month's reports
    const currentMonth = new Date().getMonth()
    const currentYear = new Date().getFullYear()
    const thisMonthReports = reports.filter(r => {
      const reportDate = new Date(r.created_at)
      return reportDate.getMonth() === currentMonth && reportDate.getFullYear() === currentYear
    }).length

    // Calculate trends based on real data
    const lastMonth = currentMonth === 0 ? 11 : currentMonth - 1
    const lastMonthYear = currentMonth === 0 ? currentYear - 1 : currentYear
    const lastMonthReports = reports.filter(r => {
      const reportDate = new Date(r.created_at)
      return reportDate.getMonth() === lastMonth && reportDate.getFullYear() === lastMonthYear
    }).length

    // Calculate last week's data
    const oneWeekAgo = new Date()
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7)
    const lastWeekPayments = payments
      .filter(p => p.payment_status === 'completed' && new Date(p.created_at || '') >= oneWeekAgo)
      .reduce((sum, p) => sum + (p.amount || 0), 0)
    
    const previousWeekStart = new Date()
    previousWeekStart.setDate(previousWeekStart.getDate() - 14)
    const previousWeekEnd = new Date()
    previousWeekEnd.setDate(previousWeekEnd.getDate() - 7)
    const previousWeekPayments = payments
      .filter(p => {
        const paymentDate = new Date(p.created_at || '')
        return p.payment_status === 'completed' && 
               paymentDate >= previousWeekStart && 
               paymentDate <= previousWeekEnd
      })
      .reduce((sum, p) => sum + (p.amount || 0), 0)

    // Calculate percentage changes
    const reportsMonthlyGrowth = lastMonthReports > 0 
      ? Math.round(((thisMonthReports - lastMonthReports) / lastMonthReports) * 100)
      : thisMonthReports > 0 ? 100 : 0
    
    const paymentsWeeklyGrowth = previousWeekPayments > 0
      ? Math.round(((lastWeekPayments - previousWeekPayments) / previousWeekPayments) * 100)
      : lastWeekPayments > 0 ? 100 : 0

    const pendingPaymentsCount = payments
      .filter(p => ['pending', 'processing', 'pending_approval'].includes(p.payment_status))
      .length

    const stats = {
      totalReports,
      totalAmount,
      pendingAmount,
      thisMonthReports,
      trends: {
        reportsMonthlyGrowth,
        paymentsWeeklyGrowth,
        pendingPaymentsCount,
        thisMonthMessage: thisMonthReports > 0 ? 'Great progress!' : 'Start uploading'
      }
    }

    res.status(200).json({
      success: true,
      data: {
        stats
      }
    })

  } catch (error: unknown) {
    console.error('User dashboard stats error:', error)
    const errorMessage = error instanceof Error ? error.message : 'Failed to fetch dashboard stats'
    res.status(500).json({
      success: false,
      message: errorMessage
    })
  }
}
