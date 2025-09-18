import { NextApiRequest, NextApiResponse } from 'next'
import { createServerSupabaseClient } from '@/lib/supabase'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
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

    const { reportId, action } = req.body

    if (!reportId || !action || !['approve', 'reject'].includes(action)) {
      return res.status(400).json({
        success: false,
        message: 'Report ID and valid action (approve/reject) are required'
      })
    }

    // Get the report
    const { data: report, error: reportError } = await supabase
      .from('reports')
      .select('id, user_id, filename, status')
      .eq('id', reportId)
      .single()

    if (reportError || !report) {
      return res.status(404).json({
        success: false,
        message: 'Report not found'
      })
    }

    if (report.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: 'Report is not pending approval'
      })
    }

    // Update report status
    const newStatus = action === 'approve' ? 'approved' : 'rejected'
    const updateData: Record<string, unknown> = {
      status: newStatus,
      updated_at: new Date().toISOString()
    }

    if (action === 'approve') {
      updateData.approved_by = user.id
      updateData.approved_at = new Date().toISOString()
    } else {
      updateData.rejection_reason = 'Quick rejection from dashboard'
    }

    const { error: updateError } = await supabase
      .from('reports')
      .update(updateData)
      .eq('id', reportId)

    if (updateError) {
      console.error('Report update error:', updateError)
      return res.status(500).json({
        success: false,
        message: 'Failed to update report status'
      })
    }

    // Add to report history
    await supabase
      .from('report_history')
      .insert({
        report_id: reportId,
        action: `report_${action}d`,
        previous_status: 'pending',
        new_status: newStatus,
        comments: `Quick ${action} from manager dashboard`,
        performed_by: user.id
      })

    // Log activity
    await supabase
      .from('activity_logs')
      .insert({
        user_id: user.id,
        action: `Report ${action}d: ${report.filename}`,
        entity_type: 'report',
        entity_id: reportId,
        details: {
          reportId,
          action,
          filename: report.filename,
          quickAction: true
        }
      })

    // Create notification for user
    const notificationTitle = action === 'approve' ? 'Report Approved' : 'Report Rejected'
    const notificationMessage = action === 'approve'
      ? `Your report "${report.filename}" has been approved by ${userProfile.full_name}`
      : `Your report "${report.filename}" has been rejected. Please review and resubmit if needed.`

    await supabase
      .from('notifications')
      .insert({
        user_id: report.user_id,
        type: action === 'approve' ? 'report_approved' : 'report_rejected',
        title: notificationTitle,
        message: notificationMessage,
        data: {
          reportId,
          action,
          managerId: user.id,
          managerName: userProfile.full_name
        }
      })

    return res.status(200).json({
      success: true,
      message: `Report ${action}d successfully`,
      data: {
        reportId,
        newStatus,
        action
      }
    })

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Internal server error'
    console.error('Quick action error:', error)
    return res.status(500).json({
      success: false,
      message: errorMessage
    })
  }
}