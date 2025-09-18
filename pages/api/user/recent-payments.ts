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
      return res.status(200).json({
        success: true,
        payments: []
      })
    }

    // Get user profile to check role
    const { data: userProfile, error: profileError } = await supabase
      .from('users')
      .select('role, is_active')
      .eq('id', user.id)
      .single()

    if (profileError || !userProfile || !userProfile.is_active) {
      return res.status(200).json({
        success: true,
        payments: []
      })
    }

    if (userProfile.role !== 'user') {
      return res.status(200).json({ 
        success: true,
        payments: []
      })
    }

    // Get recent payments from database (last 5) using RLS policies
    const { data: paymentsData, error: paymentsError } = await supabase
      .from('payments')
      .select(`
        id,
        amount,
        payment_method,
        payment_status,
        transaction_id,
        created_at,
        reports!inner (
          id,
          filename
        )
      `)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(5)

    // Always return success with empty array if no data or error
    const payments = paymentsData || []

    if (paymentsError) {
      console.error('Database query error:', paymentsError)
      // Don't return error, just log it and return empty array
    }

    res.status(200).json({
      success: true,
      payments
    })

  } catch (error: unknown) {
    console.error('Recent payments fetch error:', error)
    // Always return success with empty array for dashboard
    res.status(200).json({
      success: true,
      payments: []
    })
  }
}