import { NextApiRequest, NextApiResponse } from 'next'
import { SupabaseAuthService } from '@/lib/supabase-auth'
import { createServerSupabaseClient } from '@/lib/supabase'

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' })
  }

  try {
    const { newPassword } = req.body

    if (!newPassword) {
      return res.status(400).json({ 
        success: false, 
        message: 'New password is required' 
      })
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ 
        success: false, 
        message: 'Password must be at least 6 characters long' 
      })
    }

    // Get the user from the request context
    const supabase = createServerSupabaseClient(req, res)
    const { data: { user }, error: userError } = await supabase.auth.getUser()

    if (userError || !user) {
      return res.status(401).json({
        success: false,
        message: 'Not authenticated'
      })
    }

    console.log(`🔐 Password update requested for: ${user.email}`)

    // Update password using server client with user context
    const { error } = await supabase.auth.updateUser({
      password: newPassword
    })

    if (error) {
      throw error
    }

    console.log(`✅ Password updated successfully for: ${user.email}`)

    res.status(200).json({
      success: true,
      message: 'Password updated successfully'
    })
  } catch (error: unknown) {
    console.error('Password update error:', error)
    res.status(400).json({
      success: false,
      message: error instanceof Error ? error.message : 'Password update failed'
    })
  }
}