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
        reports: []
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
        reports: []
      })
    }

    if (userProfile.role !== 'user') {
      return res.status(200).json({ 
        success: true,
        reports: []
      })
    }

    // Get recent reports from database (last 5) using RLS policies
    console.log('Fetching recent reports for user:', user.id)
    const { data: reportsData, error: reportsError } = await supabase
      .from('reports')
      .select('id, filename, total_amount, status, created_at, report_date')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(5)

    console.log('Recent reports query result:', { reportsData, reportsError, userCount: reportsData?.length || 0 })

    // Always return success with empty array if no data or error
    const reports = reportsData || []

    if (reportsError) {
      console.error('Database query error:', reportsError)
      // Don't return error, just log it and return empty array
    }

    res.status(200).json({
      success: true,
      reports
    })

  } catch (error: unknown) {
    console.error('Recent reports fetch error:', error)
    // Always return success with empty array for dashboard
    res.status(200).json({
      success: true,
      reports: []
    })
  }
}