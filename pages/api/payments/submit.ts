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

    const { 
      reportId,
      paymentMethod,
      amount,
      proofFile,
      transactionId
    } = req.body

    // Validate required fields
    if (!reportId || !paymentMethod || !amount) {
      return res.status(400).json({
        success: false,
        message: 'Report ID, payment method, and amount are required'
      })
    }

    // Validate payment method
    if (!['online', 'offline'].includes(paymentMethod)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid payment method. Must be online or offline'
      })
    }

    // For offline payments, proof is required
    if (paymentMethod === 'offline' && !proofFile) {
      return res.status(400).json({
        success: false,
        message: 'Payment proof is required for offline payments'
      })
    }

    // Create payment record
    const { data: payment, error: paymentError } = await supabaseAdmin
      .from('payments')
      .insert({
        user_id: user.id,
        report_id: reportId,
        amount: amount,
        payment_method: paymentMethod,
        payment_status: paymentMethod === 'online' ? 'completed' : 'pending_approval',
        transaction_id: transactionId || null,
        payment_proof_url: proofFile || null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single()

    if (paymentError) {
      console.error('Payment creation error:', paymentError)
      return res.status(500).json({
        success: false,
        message: 'Failed to create payment record'
      })
    }

    // Update report payment status
    const { error: reportUpdateError } = await supabaseAdmin
      .from('reports')
      .update({
        payment_status: paymentMethod === 'online' ? 'completed' : 'pending_approval',
        payment_method: paymentMethod,
        updated_at: new Date().toISOString()
      })
      .eq('id', reportId)

    if (reportUpdateError) {
      console.error('Report update error:', reportUpdateError)
      // Don't fail the request, just log the error
    }

    // Log activity
    await supabaseAdmin
      .from('activity_logs')
      .insert({
        user_id: user.id,
        action: `Payment ${paymentMethod === 'online' ? 'completed' : 'submitted'}`,
        details: {
          reportId,
          paymentId: payment.id,
          paymentMethod,
          amount
        }
      })

    return res.status(200).json({
      success: true,
      message: 'Payment submitted successfully',
      paymentId: payment.id,
      status: payment.payment_status
    })

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Internal server error'
    console.error('Payment submission error:', error)
    return res.status(500).json({
      success: false,
      message: errorMessage
    })
  }
}