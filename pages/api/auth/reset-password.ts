import { NextApiRequest, NextApiResponse } from 'next'
import { SupabaseAuthService } from '@/lib/supabase-auth'

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' })
  }

  try {
    const { email } = req.body

    if (!email) {
      return res.status(400).json({ 
        success: false, 
        message: 'Email is required' 
      })
    }

    console.log(`🔑 Password reset requested for: ${email}`)

    await SupabaseAuthService.resetPassword(email)

    console.log(`✅ Password reset email sent to: ${email}`)

    res.status(200).json({
      success: true,
      message: 'Password reset email sent successfully'
    })
  } catch (error: unknown) {
    console.error('Password reset error:', error)
    res.status(400).json({
      success: false,
      message: error instanceof Error ? error.message : 'Password reset failed'
    })
  }
}