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

    const { paymentProofId, action, comments } = req.body

    if (!paymentProofId || !action || !['approve', 'reject'].includes(action)) {
      return res.status(400).json({
        success: false,
        message: 'Payment proof ID and valid action (approve/reject) are required'
      })
    }

    // Get payment proof details
    const { data: paymentProof, error: proofError } = await supabase
      .from('payment_proofs')
      .select(`
        *,
        reports!inner(id, user_id, total_amount, status, payment_status)
      `)
      .eq('id', paymentProofId)
      .single()

    if (proofError || !paymentProof) {
      return res.status(404).json({ success: false, message: 'Payment proof not found' })
    }

    const newStatus = action === 'approve' ? 'approved' : 'rejected'
    const paymentStatus = action === 'approve' ? 'completed' : 'rejected'

    // Update payment proof status
    const { error: updateProofError } = await supabase
      .from('payment_proofs')
      .update({
        status: newStatus,
        manager_comments: comments || null,
        approved_at: action === 'approve' ? new Date().toISOString() : null,
        approved_by: user.id
      })
      .eq('id', paymentProofId)

    if (updateProofError) {
      console.error('Payment proof update error:', updateProofError)
      return res.status(500).json({
        success: false,
        message: 'Failed to update payment proof'
      })
    }

    // Update report payment status
    const { error: updateReportError } = await supabase
      .from('reports')
      .update({
        payment_status: paymentStatus,
        payment_proof_status: newStatus,
        manager_comments: comments || null,
        updated_at: new Date().toISOString()
      })
      .eq('id', paymentProof.reports.id)

    if (updateReportError) {
      console.error('Report update error:', updateReportError)
      return res.status(500).json({
        success: false,
        message: 'Failed to update report'
      })
    }

    // Add to report history
    await supabase
      .from('report_history')
      .insert({
        report_id: paymentProof.reports.id,
        action: `payment_proof_${action}d`,
        previous_status: paymentProof.status,
        new_status: newStatus,
        comments: comments || `Payment proof ${action}d by manager`,
        performed_by: user.id
      })

    // Create notification for user
    await supabase
      .from('notifications')
      .insert({
        user_id: paymentProof.reports.user_id,
        type: `payment_proof_${action}d`,
        title: `Payment Proof ${action === 'approve' ? 'Approved' : 'Rejected'}`,
        message: action === 'approve' 
          ? 'Your payment proof has been approved and payment is now completed.'
          : `Your payment proof has been rejected. ${comments ? 'Reason: ' + comments : 'Please resubmit with correct documentation.'}`,
        data: {
          reportId: paymentProof.reports.id,
          paymentProofId: paymentProofId,
          action: action,
          comments: comments
        }
      })

    console.log(`Payment proof ${action}d:`, {
      paymentProofId,
      reportId: paymentProof.reports.id,
      managerId: user.id,
      action,
      comments
    })

    return res.status(200).json({
      success: true,
      message: `Payment proof ${action}d successfully`,
      data: {
        paymentProofId,
        reportId: paymentProof.reports.id,
        status: newStatus,
        paymentStatus,
        comments
      }
    })

  } catch (error) {
    console.error('Payment proof approval error:', error)
    const errorMessage = error instanceof Error ? error.message : 'Payment proof approval failed'
    return res.status(500).json({ 
      success: false, 
      message: errorMessage,
      error: process.env.NODE_ENV === 'development' ? String(error) : undefined
    })
  }
}