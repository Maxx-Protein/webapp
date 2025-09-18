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

    // Get limit from query parameters (default to 5)
    const limit = parseInt(req.query.limit as string) || 5

    // Validate limit to prevent excessive queries
    const validatedLimit = Math.min(Math.max(limit, 1), 20)

    const { data: notifications, error } = await supabaseAdmin
      .from('notifications')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(validatedLimit)

    if (error) {
      console.error('Latest notifications fetch error:', error)
      // Return empty array instead of error to prevent UI crashes
      return res.status(200).json({
        success: true,
        notifications: []
      })
    }

    return res.status(200).json({
      success: true,
      notifications: notifications || []
    })

  } catch (error: unknown) {
    console.error('Latest notifications fetch error:', error)
    const errorMessage = error instanceof Error ? error.message : 'Failed to fetch latest notifications'
    return res.status(500).json({ 
      success: false, 
      message: errorMessage
    })
  }
}