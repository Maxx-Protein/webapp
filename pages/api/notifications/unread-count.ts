import { NextApiRequest, NextApiResponse } from 'next'
import { SupabaseAuthService } from '@/lib/supabase-auth'
import { supabaseAdmin } from '@/lib/supabase'
import { createServerSupabaseClient } from '@/lib/supabase'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
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

    // Get count of unread notifications for the user
    const { count, error } = await supabaseAdmin
      .from('notifications')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .eq('read', false)

    if (error) {
      console.error('Unread notifications count error:', error)
      // Return 0 count instead of error to prevent UI crashes
      return res.status(200).json({
        success: true,
        count: 0
      })
    }

    return res.status(200).json({
      success: true,
      count: count || 0
    })

  } catch (error: unknown) {
    console.error('Unread notifications count error:', error)
    const errorMessage = error instanceof Error ? error.message : 'Failed to fetch unread notifications count'
    return res.status(500).json({ 
      success: false, 
      message: errorMessage
    })
  }
}