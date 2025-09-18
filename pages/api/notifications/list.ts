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

    // Get page and limit from query parameters
    const page = parseInt(req.query.page as string) || 1
    const limit = Math.min(parseInt(req.query.limit as string) || 20, 50) // Max 50 items per page
    const offset = (page - 1) * limit

    // Get user's notifications with pagination
    const { data: notifications, error, count } = await supabaseAdmin
      .from('notifications')
      .select('*', { count: 'exact' })
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (error) {
      console.error('Notifications fetch error:', error)
      return res.status(500).json({
        success: false,
        message: 'Failed to fetch notifications'
      })
    }

    // Calculate pagination info
    const totalPages = Math.ceil((count || 0) / limit)
    const hasNext = page < totalPages
    const hasPrev = page > 1

    res.status(200).json({
      success: true,
      notifications: notifications || [],
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages,
        hasNext,
        hasPrev
      }
    })

  } catch (error) {
    console.error('Notifications list error:', error)
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    })
  }
}