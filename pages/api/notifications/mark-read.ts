import { NextApiRequest, NextApiResponse } from 'next'
import { SupabaseAuthService } from '@/lib/supabase-auth'
import { supabaseAdmin } from '@/lib/supabase'
import { createServerSupabaseClient } from '@/lib/supabase'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' })
  }

  try {
    // Use Supabase authentication instead of JWT
    const supabase = createServerSupabaseClient(req, res)
    const { data: { session }, error: authError } = await supabase.auth.getSession()
    
    if (authError || !session?.user) {
      return res.status(401).json({ success: false, message: 'Authentication required' })
    }

    // Get user profile
    const user = await SupabaseAuthService.getCurrentUser()
    if (!user) {
      return res.status(401).json({ success: false, message: 'User not found' })
    }

    const { notificationId } = req.body

    if (!notificationId) {
      return res.status(400).json({
        success: false,
        message: 'Notification ID is required'
      })
    }

    // Mark the specific notification as read
    const { error } = await supabaseAdmin
      .from('notifications')
      .update({ 
        read: true,
        updated_at: new Date().toISOString()
      })
      .eq('id', notificationId)
      .eq('user_id', user.id) // Ensure user can only update their own notifications

    if (error) {
      console.error('Mark notification as read error:', error)
      return res.status(500).json({
        success: false,
        message: 'Failed to mark notification as read'
      })
    }

    res.status(200).json({
      success: true,
      message: 'Notification marked as read'
    })

  } catch (error) {
    console.error('Mark notification as read error:', error)
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    })
  }
}