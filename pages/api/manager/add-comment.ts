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

    const { reportId, comment, action } = req.body

    if (!reportId || !comment) {
      return res.status(400).json({
        success: false,
        message: 'Report ID and comment are required'
      })
    }

    // Verify the report exists
    const { data: report, error: reportError } = await supabase
      .from('reports')
      .select('id, user_id, status, filename')
      .eq('id', reportId)
      .single()

    if (reportError || !report) {
      return res.status(404).json({ success: false, message: 'Report not found' })
    }

    // Update report with manager comment
    const updateData: { 
      manager_comments: string; 
      updated_at: string; 
      status?: string; 
      rejection_reason?: string 
    } = {
      manager_comments: comment,
      updated_at: new Date().toISOString()
    }

    // If action is provided, update status accordingly
    if (action === 'approve') {
      updateData.status = 'approved'
    } else if (action === 'reject') {
      updateData.status = 'rejected'
      updateData.rejection_reason = comment
    }

    const { error: updateError } = await supabase
      .from('reports')
      .update(updateData)
      .eq('id', reportId)

    if (updateError) {
      console.error('Report update error:', updateError)
      return res.status(500).json({
        success: false,
        message: 'Failed to add comment'
      })
    }

    // Add to report history
    await supabase
      .from('report_history')
      .insert({
        report_id: reportId,
        action: action ? `manager_${action}d` : 'comment_added',
        new_status: updateData.status || report.status,
        comments: comment,
        performed_by: user.id
      })

    // Create notification for user
    const notificationTitle = action 
      ? `Report ${action === 'approve' ? 'Approved' : 'Rejected'}`
      : 'Manager Comment Added'
    
    const notificationMessage = action
      ? `Your report "${report.filename}" has been ${action}d. ${comment}`
      : `A manager has added a comment to your report "${report.filename}". ${comment}`

    await supabase
      .from('notifications')
      .insert({
        user_id: report.user_id,
        type: action ? `report_${action}d` : 'comment_added',
        title: notificationTitle,
        message: notificationMessage,
        data: {
          reportId: reportId,
          action: action || 'comment',
          comment: comment
        }
      })

    console.log('Manager comment added:', {
      reportId,
      managerId: user.id,
      action: action || 'comment',
      comment: comment.substring(0, 100) + '...'
    })

    return res.status(200).json({
      success: true,
      message: `Comment ${action ? 'and ' + action + ' action' : ''} added successfully`,
      data: {
        reportId,
        comment,
        action: action || 'comment',
        status: updateData.status || report.status
      }
    })

  } catch (error) {
    console.error('Add comment error:', error)
    const errorMessage = error instanceof Error ? error.message : 'Failed to add comment'
    return res.status(500).json({ 
      success: false, 
      message: errorMessage
    })
  }
}