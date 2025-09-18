import { NextApiRequest, NextApiResponse } from 'next'
import { AuthService } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabase'

interface TransformedPayment {
  id: string
  user_id: string
  user_name: string
  user_email: string
  report_id: string
  report_filename: string
  report_date: string
  amount: number
  payment_method: string
  payment_status: string
  transaction_id?: string
  proof_url?: string
  notes?: string
  approved_by?: string
  approved_at?: string
  manager_comments?: string
  rejection_reason?: string
  created_at: string
  updated_at: string
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ success: false, message: 'Method not allowed' })
  }

  try {
    // Verify authentication
    const authHeader = req.headers.authorization
    if (!authHeader?.startsWith('Bearer ')) {
      return res.status(401).json({ success: false, message: 'No token provided' })
    }

    const token = authHeader.substring(7)
    const user = await AuthService.verifyToken(token)
    console.log('Fetching payment history for user:', user.id)

    // Get user role to determine data access
    const isManager = user.role === 'admin' || user.role === 'manager'
    
    // Build query based on user role
    let query = supabaseAdmin
      .from('payments')
      .select(`
        id,
        user_id,
        report_id,
        amount,
        method,
        status,
        transaction_id,
        proof_url,
        notes,
        approved_by,
        approved_at,
        manager_comments,
        rejection_reason,
        created_at,
        updated_at,
        reports!inner(
          id,
          filename,
          report_date,
          total_amount
        ),
        users!inner(
          id,
          full_name,
          email
        )
      `)
      .order('created_at', { ascending: false })

    // Apply user-specific filtering
    if (!isManager) {
      query = query.eq('user_id', user.id)
    }

    const { data: payments, error: paymentsError } = await query

    if (paymentsError) {
      console.error('Payment fetch error:', paymentsError)
      return res.status(500).json({ 
        success: false, 
        message: 'Failed to fetch payments',
        error: paymentsError.message
      })
    }

    console.log(`Found ${payments?.length || 0} payments`)

    // Transform data for frontend - using flexible typing for Supabase response
    const transformedPayments: TransformedPayment[] = (payments || []).map((payment) => {
      const users = payment.users as any
      const reports = payment.reports as any
      return {
        id: payment.id,
        user_id: payment.user_id,
        user_name: users?.full_name || 'Unknown User',
        user_email: users?.email || 'No Email',
        report_id: payment.report_id,
        report_filename: reports?.filename || 'Unknown Report',
        report_date: reports?.report_date || '',
        amount: payment.amount,
        payment_method: payment.method,
        payment_status: payment.status,
        transaction_id: payment.transaction_id,
        proof_url: payment.proof_url,
        notes: payment.notes,
        approved_by: payment.approved_by,
        approved_at: payment.approved_at,
        manager_comments: payment.manager_comments,
        rejection_reason: payment.rejection_reason,
        created_at: payment.created_at,
        updated_at: payment.updated_at
      }
    })

    // Calculate summary statistics
    const stats = {
      total_payments: transformedPayments.length,
      total_amount: transformedPayments.reduce((sum: number, payment: TransformedPayment) => sum + payment.amount, 0),
      pending_count: transformedPayments.filter((p: TransformedPayment) => p.payment_status === 'pending').length,
      completed_count: transformedPayments.filter((p: TransformedPayment) => p.payment_status === 'completed').length,
      failed_count: transformedPayments.filter((p: TransformedPayment) => p.payment_status === 'failed').length
    }

    res.status(200).json({
      success: true,
      data: {
        payments: transformedPayments,
        stats,
        user_role: user.role
      }
    })

  } catch (error) {
    console.error('Payment history error:', error)
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error instanceof Error ? error.message : 'Unknown error'
    })
  }
}