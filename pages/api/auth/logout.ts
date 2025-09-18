import { NextApiRequest, NextApiResponse } from 'next'
import { createServerSupabaseClient } from '@/lib/supabase'

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' })
  }

  try {
    const supabase = createServerSupabaseClient(req, res)
    
    // Sign out the user
    const { error } = await supabase.auth.signOut()
    
    if (error) {
      throw error
    }

    console.log('✅ User signed out successfully')

    res.status(200).json({
      success: true,
      message: 'Signed out successfully'
    })
  } catch (error: unknown) {
    console.error('Sign out error:', error)
    res.status(400).json({
      success: false,
      message: error instanceof Error ? error.message : 'Sign out failed'
    })
  }
}