import { NextApiRequest, NextApiResponse } from 'next'
import { AuthService } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabase'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Method not allowed' })
  }

  try {
    console.log('Payment creation API called with data:', req.body)

    // Verify authentication
    const authHeader = req.headers.authorization
    if (!authHeader?.startsWith('Bearer ')) {
      console.log('No token provided')
      return res.status(401).json({ success: false, message: 'No token provided' })
    }

    const token = authHeader.substring(7)
    const user = await AuthService.verifyToken(token)
    const { reportId, method, amount, transactionId, proofUrl, notes, paymentDate } = req.body

    console.log('Creating payment for user:', user.id, 'report:', reportId)

    // Validate required fields
    if (!reportId || !method || !amount) {
      return res.status(400).json({ 
        success: false, 
        message: 'Missing required fields: reportId, method, amount' 
      })
    }

    // Validate payment method
    const validMethods = ['credit_card', 'upi', 'net_banking', 'offline']
    if (!validMethods.includes(method)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid payment method' 
      })
    }

    // Verify the report exists and belongs to the user
    const { data: report, error: reportError } = await supabaseAdmin
      .from('reports')
      .select('id, user_id, total_amount')
      .eq('id', reportId)
      .eq('user_id', user.id)
      .single()

    if (reportError || !report) {
      console.log('Report not found:', reportError)
      return res.status(404).json({ 
        success: false, 
        message: 'Report not found' 
      })
    }

    console.log('Report found:', report)

    // Create payment record
    const paymentData = {
      user_id: user.id,
      report_id: reportId,
      amount: parseFloat(amount),
      method: method,
      status: 'pending' as const,
      transaction_id: transactionId || null,
      proof_url: proofUrl || null,
      notes: notes || null,
      payment_date: paymentDate || null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }

    console.log('Creating payment with data:', paymentData)

    const { data: payment, error: paymentError } = await supabaseAdmin
      .from('payments')
      .insert(paymentData)
      .select()
      .single()

    if (paymentError) {
      console.error('Payment creation error:', paymentError)
      return res.status(500).json({ 
        success: false, 
        message: 'Failed to create payment record',
        error: paymentError.message
      })
    }

    console.log('Payment created successfully:', payment)

    // Create notification for the user
    const notificationData = {
      user_id: user.id,
      type: 'proof_required' as const,
      title: 'Payment Submitted for Review',
      message: `Your payment of ₹${amount} has been submitted and is pending manager review.`,
      data: {
        payment_id: payment.id,
        report_id: reportId,
        amount: amount,
        method: method
      },
      created_at: new Date().toISOString()
    }

    const { error: notificationError } = await supabaseAdmin
      .from('notifications')
      .insert(notificationData)

    if (notificationError) {
      console.error('Notification creation error:', notificationError)
    }

    // Update report with payment information
    const { error: updateError } = await supabaseAdmin
      .from('reports')
      .update({
        payment_method: method,
        payment_status: 'pending',
        payment_proof_url: proofUrl || null,
        payment_date: paymentDate || null,
        updated_at: new Date().toISOString()
      })
      .eq('id', reportId)

    if (updateError) {
      console.error('Report update error:', updateError)
    }

    res.status(200).json({
      success: true,
      message: 'Payment created successfully',
      data: {
        payment,
        notification: 'Your payment has been sent to manager for review'
      }
    })

  } catch (error) {
    console.error('Payment creation error:', error)
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error instanceof Error ? error.message : 'Unknown error'
    })
  }
}