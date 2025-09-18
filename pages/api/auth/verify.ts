import { NextApiRequest, NextApiResponse } from 'next'
import { createServerSupabaseClient } from '@/lib/supabase'
import { SupabaseAuthService } from '@/lib/supabase-auth'

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' })
  }

  try {
    const supabase = createServerSupabaseClient(req, res)
    
    // Get the current session
    const { data: { session }, error: sessionError } = await supabase.auth.getSession()
    
    if (sessionError || !session?.user) {
      return res.status(401).json({
        success: false,
        message: 'No valid session'
      })
    }

    // Get user profile data
    const user = await SupabaseAuthService.getCurrentUser()
    
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'User profile not found'
      })
    }

    res.status(200).json({
      success: true,
      user,
      session
    })
  } catch (error: unknown) {
    console.error('Auth verification error:', error)
    res.status(401).json({
      success: false,
      message: error instanceof Error ? error.message : 'Authentication failed'
    })
  }
}
