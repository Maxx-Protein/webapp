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

    // Mark all notifications as read for this user
    const { error } = await supabaseAdmin
      .from('notifications')
      .update({ 
        read: true,
        updated_at: new Date().toISOString()
      })
      .eq('user_id', user.id)
      .eq('read', false) // Only update unread notifications

    if (error) {
      console.error('Mark all notifications as read error:', error)
      return res.status(500).json({
        success: false,
        message: 'Failed to mark all notifications as read'
      })
    }

    res.status(200).json({
      success: true,
      message: 'All notifications marked as read'
    })

  } catch (error) {
    console.error('Mark all notifications as read error:', error)
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    })
  }
}