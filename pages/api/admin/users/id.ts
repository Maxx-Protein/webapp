import { NextApiRequest, NextApiResponse } from 'next'
import { AuthService } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabase'

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
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

    if (req.method === 'GET') {
      // Get specific user
      const { data: user, error } = await supabaseAdmin
        .from('profiles')
        .select('*')
        .eq('id', id)
        .single()

      if (error || !user) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        })
      }

      return res.status(200).json({
        success: true,
        user
      })

    } else if (req.method === 'PUT') {
      // Update user
      const { fullName, email, phone, role, isActive } = req.body

      const { data: updatedUser, error } = await supabaseAdmin
        .from('profiles')
        .update({
          full_name: fullName,
          email: email,
          phone: phone || null,
          role: role,
          is_active: isActive,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single()

      if (error) {
        return res.status(400).json({
          success: false,
          message: error.message || 'Failed to update user'
        })
      }

      return res.status(200).json({
        success: true,
        message: 'User updated successfully',
        user: updatedUser
      })

    } else if (req.method === 'DELETE') {
      // Delete user
      const { error } = await supabaseAdmin
        .from('profiles')
        .delete()
        .eq('id', id)

      if (error) {
        return res.status(400).json({
          success: false,
          message: error.message || 'Failed to delete user'
        })
      }

      return res.status(200).json({
        success: true,
        message: 'User deleted successfully'
      })

    } else {
      return res.status(405).json({ message: 'Method not allowed' })
    }

  } catch (error) {
    console.error('User API error:', error)
    return res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : 'Internal server error'
    })
  }
}