import { NextApiRequest, NextApiResponse } from 'next'
import { createServerSupabaseClient } from '@/lib/supabase'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ success: false, message: 'Method not allowed' })
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
      .select('role, is_active')
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

    // Get recent activity data
    const [
      pendingReportsResult,
      pendingProofsResult,
      recentActionsResult
    ] = await Promise.all([
      // Pending reports with user details
      supabase
        .from('reports')
        .select(`
          id,
          filename,
          total_amount,
          created_at,
          status,
          users:user_id (
            id,
            full_name,
            email
          )
        `)
        .eq('status', 'pending')
        .order('created_at', { ascending: false })
        .limit(10),

      // Pending payment proofs
      supabase
        .from('payment_proofs')
        .select(`
          id,
          amount,
          file_type,
          uploaded_at,
          notes,
          status
        `)
        .eq('status', 'pending_approval')
        .order('uploaded_at', { ascending: false })
        .limit(10),

      // Recent manager actions from activity logs
      supabase
        .from('activity_logs')
        .select('id, action, created_at, details')
        .or('action.ilike.%approved%,action.ilike.%rejected%,action.ilike.%comment%')
        .order('created_at', { ascending: false })
        .limit(10)
    ])

    // Transform pending reports
    const pendingReports = (pendingReportsResult.data || []).map(report => ({
      id: report.id,
      filename: report.filename,
      total_amount: report.total_amount,
      created_at: report.created_at,
      status: report.status,
      user: Array.isArray(report.users) ? report.users[0] : report.users ? {
        id: report.users['id'],
        full_name: report.users['full_name'],
        email: report.users['email']
      } : null
    }))

    // Transform pending proofs
    const pendingProofs = pendingProofsResult.data || []

    // Transform recent actions
    const recentActions = (recentActionsResult.data || []).map(log => {
      let actionType: 'approval' | 'rejection' | 'comment' = 'comment'
      let description = log.action

      if (log.action.toLowerCase().includes('approved')) {
        actionType = 'approval'
        description = 'Report approved'
      } else if (log.action.toLowerCase().includes('rejected')) {
        actionType = 'rejection'
        description = 'Report rejected'
      } else if (log.action.toLowerCase().includes('comment')) {
        actionType = 'comment'
        description = 'Comment added'
      }

      return {
        id: log.id,
        type: actionType,
        description,
        timestamp: log.created_at,
        reportId: log.details?.reportId || ''
      }
    })

    const activity = {
      pendingReports,
      pendingProofs,
      recentActions
    }

    return res.status(200).json({
      success: true,
      activity
    })

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Internal server error'
    console.error('Manager recent activity error:', error)
    return res.status(500).json({
      success: false,
      message: errorMessage
    })
  }
}