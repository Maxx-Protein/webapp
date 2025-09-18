import { NextApiRequest, NextApiResponse } from 'next'
import { AuthService } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabase'
import bcrypt from 'bcryptjs'

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' })
  }

  const { id } = req.query

  try {
    // Verify admin token
    const authHeader = req.headers.authorization
    if (!authHeader?.startsWith('Bearer ')) {
      return res.status(401).json({ 
        success: false,
        message: 'No token provided' 
      })
    }

    const token = authHeader.substring(7)
    const adminUser = await AuthService.verifyToken(token)

    if (adminUser.role !== 'admin') {
      return res.status(403).json({ 
        success: false,
        message: 'Access denied' 
      })
    }

    // Generate temporary password
    const tempPassword = Math.random().toString(36).slice(-8) + Math.random().toString(36).slice(-8)
    const hashedPassword = await bcrypt.hash(tempPassword, 12)

    // Update user password
    const { error } = await supabaseAdmin
      .from('profiles')
      .update({
        password_hash: hashedPassword,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)

    if (error) {
      return res.status(400).json({
        success: false,
        message: 'Failed to reset password'
      })
    }

    return res.status(200).json({
      success: true,
      message: 'Password reset successfully',
      tempPassword // In production, send via email instead
    })

  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : 'Failed to reset password'
    })
  }
}