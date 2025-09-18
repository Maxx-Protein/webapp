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

    const { reportId, action, comments } = req.body

    if (!reportId || !action || !['approve', 'reject'].includes(action)) {
      return res.status(400).json({
        success: false,
        message: 'Report ID and valid action (approve/reject) are required'
      })
    }

    // Get the report first
    const { data: report, error: fetchError } = await supabase
      .from('reports')
      .select('*, users!inner(full_name, email)')
      .eq('id', reportId)
      .single()

    if (fetchError || !report) {
      return res.status(404).json({
        success: false,
        message: 'Report not found'
      })
    }

    // Update report status
    const newStatus = action === 'approve' ? 'approved' : 'rejected'
    const { error: updateError } = await supabase
      .from('reports')
      .update({
        status: newStatus,
        processing_details: {
          ...report.processing_details,
          managerAction: {
            action,
            comments: comments || '',
            managerId: user.id,
            managerName: userProfile.full_name,
            actionDate: new Date().toISOString()
          }
        },
        updated_at: new Date().toISOString()
      })
      .eq('id', reportId)

    if (updateError) {
      console.error('Error updating report:', updateError)
      return res.status(500).json({
        success: false,
        message: 'Failed to update report status'
      })
    }

    // Log activity
    await supabase
      .from('activity_logs')
      .insert({
        user_id: user.id,
        action: `Report ${action}d`,
        details: {
          reportId,
          userId: report.user_id,
          userName: report.users.full_name,
          comments: comments || '',
          totalAmount: report.total_amount
        }
      })

    return res.status(200).json({
      success: true,
      message: `Report ${action}d successfully`
    })

  } catch (error) {
    console.error('Report approval error:', error)
    return res.status(500).json({
      success: false,
      message: 'Failed to process report approval'
    })
  }
}