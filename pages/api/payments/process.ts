import { NextApiRequest, NextApiResponse } from 'next'
import { AuthService } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabase'

interface PaymentRequest {
  reportId: string
  amount: number
  paymentMethod: 'credit_card' | 'upi' | 'net_banking' | 'offline'
  transactionId?: string
  proofUrl?: string
  notes?: string
  paymentDate?: string
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  console.log('Payment process API called:', {
    method: req.method,
    body: req.body,
    headers: req.headers.authorization ? 'Bearer token present' : 'No auth header'
  })
  
  if (req.method !== 'POST') {
    console.log('Method not allowed:', req.method)
    return res.status(405).json({ message: 'Method not allowed' })
  }

  try {
    const authHeader = req.headers.authorization
    if (!authHeader?.startsWith('Bearer ')) {
      console.log('No auth header provided')
      return res.status(401).json({ success: false, message: 'No token provided' })
    }

    const token = authHeader.substring(7)
    const user = await AuthService.verifyToken(token)
    console.log('User verified:', { userId: user.id, role: user.role })

    if (!['user', 'manager', 'admin'].includes(user.role)) {
      return res.status(403).json({ success: false, message: 'Access denied' })
    }

    const { 
      reportId, 
      amount, 
      paymentMethod, 
      transactionId, 
      proofUrl,
      paymentDate
    }: PaymentRequest = req.body

    console.log('Payment request data:', { reportId, amount, paymentMethod })

    // Validate required fields
    if (!reportId || !amount || !paymentMethod) {
      return res.status(400).json({
        success: false,
        message: 'Report ID, amount, and payment method are required'
      })
    }

    // Verify the report exists and belongs to the user
    console.log('Verifying report exists for:', { reportId, userId: user.id })
    const { data: report, error: reportError } = await supabaseAdmin
      .from('reports')
      .select('id, user_id, total_amount, status')
      .eq('id', reportId)
      .eq('user_id', user.id)
      .single()

    console.log('Report verification result:', { report, reportError })

    if (reportError || !report) {
      console.log('Report not found or error:', reportError)
      return res.status(404).json({
        success: false,
        message: 'Report not found'
      })
    }

    // Payment is always allowed - no approval gate
    console.log('Processing payment for report:', {
      reportId: report.id,
      status: report.status,
      amount
    })

    if (amount > report.total_amount) {
      return res.status(400).json({
        success: false,
        message: 'Payment amount cannot exceed report total'
      })
    }

    // Determine payment status based on method
    let paymentStatus = 'pending'
    if (['credit_card', 'upi', 'net_banking'].includes(paymentMethod)) {
      // For online payments, simulate gateway processing
      paymentStatus = 'processing'
    }

    console.log('Creating payment record with status:', paymentStatus)

    // For offline payments, just update the report with payment method and proof
    if (paymentMethod === 'offline') {
      console.log('Processing offline payment, updating report')
      const { error: updateError } = await supabaseAdmin
        .from('reports')
        .update({
          payment_method: 'offline',
          payment_status: 'pending',
          payment_proof_url: proofUrl,
          payment_proof_status: 'pending',
          payment_date: paymentDate || new Date().toISOString().split('T')[0],
          updated_at: new Date().toISOString()
        })
        .eq('id', reportId)

      if (updateError) {
        console.error('Report update error:', updateError)
        return res.status(500).json({
          success: false,
          message: 'Failed to update report with payment info'
        })
      }

      console.log('Offline payment processed successfully')
      return res.status(200).json({
        success: true,
        message: 'Payment processed successfully',
        payment: {
          id: reportId,
          amount: amount,
          status: 'pending',
          method: paymentMethod,
          proofUrl: proofUrl
        }
      })
    }

    // For online payments, update report status
    console.log('Processing online payment')
    const { error: updateError } = await supabaseAdmin
      .from('reports')
      .update({
        payment_method: paymentMethod,
        payment_status: paymentStatus,
        payment_date: paymentDate || new Date().toISOString().split('T')[0],
        updated_at: new Date().toISOString()
      })
      .eq('id', reportId)

    if (updateError) {
      console.error('Report update error:', updateError)
      return res.status(500).json({
        success: false,
        message: 'Failed to update report with payment info'
      })
    }

    console.log('Online payment processed successfully')
    return res.status(200).json({
      success: true,
      message: 'Payment processed successfully',
      payment: {
        id: reportId,
        amount: amount,
        status: paymentStatus,
        method: paymentMethod,
        transactionId: transactionId
      }
    })

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Internal server error'
    console.error('Payment processing error:', error)
    return res.status(500).json({
      success: false,
      message: errorMessage
    })
  }
}