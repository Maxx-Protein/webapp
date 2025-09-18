import { NextApiRequest, NextApiResponse } from 'next'
import { AuthService } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabase'

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

    const { reportId } = req.body

    if (!reportId) {
      return res.status(400).json({
        success: false,
        message: 'Report ID is required'
      })
    }

    // Verify the report belongs to the user and can be cleared
    const { data: report, error: reportError } = await supabaseAdmin
      .from('reports')
      .select('id, user_id, status, payment_status, total_amount')
      .eq('id', reportId)
      .eq('user_id', user.id)
      .single()

    if (reportError || !report) {
      return res.status(404).json({ success: false, message: 'Report not found' })
    }

    // Only allow clearing if payment is pending or rejected
    if (!['pending', 'rejected', 'pending_approval'].includes(report.payment_status)) {
      return res.status(400).json({
        success: false,
        message: 'Only pending or rejected payments can be cleared'
      })
    }

    // Reset payment status and clear payment-related fields
    const { error: updateError } = await supabaseAdmin
      .from('reports')
      .update({
        payment_status: 'pending',
        payment_method: null,
        payment_proof_url: null,
        payment_proof_status: null,
        manager_comments: null,
        rejection_reason: null,
        updated_at: new Date().toISOString()
      })
      .eq('id', reportId)

    if (updateError) {
      console.error('Report update error:', updateError)
      return res.status(500).json({
        success: false,
        message: 'Failed to clear pending payment'
      })
    }

    // Delete any associated payment proofs
    await supabaseAdmin
      .from('payment_proofs')
      .delete()
      .eq('report_id', reportId)

    // Add to report history
    await supabaseAdmin
      .from('report_history')
      .insert({
        report_id: reportId,
        action: 'payment_cleared',
        previous_status: report.payment_status,
        new_status: 'pending',
        comments: 'Payment status cleared by user',
        performed_by: user.id
      })

    // Create notification for user
    await supabaseAdmin
      .from('notifications')
      .insert({
        user_id: user.id,
        type: 'payment_cleared',
        title: 'Payment Cleared',
        message: 'Your payment status has been reset. You can now process payment again.',
        data: {
          reportId: reportId,
          action: 'payment_cleared'
        }
      })

    console.log('Pending payment cleared:', {
      reportId,
      userId: user.id,
      previousStatus: report.payment_status
    })

    return res.status(200).json({
      success: true,
      message: 'Pending payment cleared successfully',
      data: {
        reportId,
        newPaymentStatus: 'pending'
      }
    })

  } catch (error: unknown) {
    console.error('Clear pending payment error:', error)
    const errorMessage = error instanceof Error ? error.message : 'Failed to clear pending payment'
    return res.status(500).json({ 
      success: false, 
      message: errorMessage,
      error: process.env.NODE_ENV === 'development' ? String(error) : undefined
    })
  }
}