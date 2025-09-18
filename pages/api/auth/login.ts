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
    const { email, password } = req.body

    if (!email || !password) {
      return res.status(400).json({ 
        success: false, 
        message: 'Email and password are required' 
      })
    }

    console.log(`🔐 Login attempt for: ${email}`)

    const result = await SupabaseAuthService.signIn({ email, password })

    console.log(`✅ Login successful for: ${email} (${result.user.role})`)

    res.status(200).json({
      success: true,
      message: 'Login successful',
      user: result.user,
      session: result.session
    })
  } catch (error: unknown) {
    console.error('Login error:', error)
    res.status(401).json({
      success: false,
      message: error instanceof Error ? error.message : 'Login failed'
    })
  }
}
