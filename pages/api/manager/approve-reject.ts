import { NextApiRequest, NextApiResponse } from 'next'
import { createServerSupabaseClient } from '@/lib/supabase'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' })
  }

  try {
    // Use Supabase cookie-based auth instead of JWT tokens
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
      .select('role, is_active, full_name')
      .eq('id', user.id)
      .single()

    if (profileError || !userProfile || !userProfile.is_active) {
      return res.status(401).json({ 
        success: false,
        message: 'User not found or inactive' 
      })
    }

    if (userProfile.role !== 'manager' && userProfile.role !== 'admin') {
      return res.status(403).json({ 
        success: false,
        message: 'Access denied' 
      })
    }

    const { 
      type, // 'report' or 'payment'
      id, 
      action, // 'approve' or 'reject'
      comments,
      reason 
    } = req.body

    if (!type || !id || !action) {
      return res.status(400).json({
        success: false,
        message: 'Type, ID, and action are required'
      })
    }

    if (!['approve', 'reject'].includes(action)) {
      return res.status(400).json({
        success: false,
        message: 'Action must be approve or reject'
      })
    }

    const now = new Date().toISOString()

    if (type === 'report') {
      // Handle report approval/rejection
      const updateData = {
        status: action === 'approve' ? 'approved' : 'rejected',
        approved_by: action === 'approve' ? user.id : null,
        approved_at: action === 'approve' ? now : null,
        manager_comments: comments || null,
        rejection_reason: action === 'reject' ? reason : null,
        updated_at: now
      }

      const { data: report, error: reportError } = await supabase
        .from('reports')
        .update(updateData)
        .eq('id', id)
        .select('id, user_id, filename, total_amount')
        .single()

      if (reportError) {
        console.error('Report update error:', reportError)
        return res.status(500).json({
          success: false,
          message: 'Failed to update report'
        })
      }

      // Create notification for the user
      const notificationData = {
        user_id: report.user_id,
        type: action === 'approve' ? 'report_approved' : 'report_rejected',
        title: `Report ${action === 'approve' ? 'Approved' : 'Rejected'}`,
        message: action === 'approve' 
          ? `Your report "${report.filename}" has been approved by the manager.`
          : `Your report "${report.filename}" has been rejected. ${reason ? `Reason: ${reason}` : ''}`,
        data: {
          report_id: id,
          manager_id: user.id,
          manager_name: userProfile.full_name,
          comments: comments,
          reason: reason
        },
        created_at: now
      }

      await supabase.from('notifications').insert(notificationData)

      res.json({
        success: true,
        message: `Report ${action}d successfully`,
        report
      })

    } else if (type === 'payment') {
      // Handle payment approval/rejection
      const updateData = {
        status: action === 'approve' ? 'completed' : 'failed',
        approved_by: action === 'approve' ? user.id : null,
        approved_at: action === 'approve' ? now : null,
        manager_comments: comments || null,
        rejection_reason: action === 'reject' ? reason : null,
        updated_at: now
      }

      const { data: payment, error: paymentError } = await supabase
        .from('payments')
        .update(updateData)
        .eq('id', id)
        .select(`
          id, 
          user_id, 
          amount, 
          method,
          reports!inner(
            id,
            filename
          )
        `)
        .single()

      if (paymentError) {
        console.error('Payment update error:', paymentError)
        return res.status(500).json({
          success: false,
          message: 'Failed to update payment'
        })
      }

      // Update related report payment status
      const reportData = payment.reports
      await supabase
        .from('reports')
        .update({
          payment_status: action === 'approve' ? 'completed' : 'failed',
          updated_at: now
        })
        .eq('id', reportData?.id)

      // Create notification for the user
      const notificationData = {
        user_id: payment.user_id,
        type: action === 'approve' ? 'payment_approved' : 'payment_rejected',
        title: `Payment ${action === 'approve' ? 'Approved' : 'Rejected'}`,
        message: action === 'approve' 
          ? `Your payment of ₹${payment.amount} has been approved and processed.`
          : `Your payment of ₹${payment.amount} has been rejected. ${reason ? `Reason: ${reason}` : ''}`,
        data: {
          payment_id: id,
          report_id: reportData?.id,
          amount: payment.amount,
          method: payment.method,
          manager_id: user.id,
          manager_name: userProfile.full_name,
          comments: comments,
          reason: reason
        },
        created_at: now
      }

      await supabase.from('notifications').insert(notificationData)

      res.json({
        success: true,
        message: `Payment ${action}d successfully`,
        payment
      })

    } else {
      return res.status(400).json({
        success: false,
        message: 'Invalid type. Must be report or payment'
      })
    }

  } catch (error) {
    console.error('Manager action error:', error)
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error instanceof Error ? error.message : 'Unknown error'
    })
  }
}