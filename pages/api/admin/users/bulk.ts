import { NextApiRequest, NextApiResponse } from 'next'
import { AuthService } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabase'

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' })
  }

  const { action, userIds } = req.body

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

    if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No users selected'
      })
    }

    let result;

    switch (action) {
      case 'activate':
        result = await supabaseAdmin
          .from('users')
          .update({ 
            is_active: true,
            updated_at: new Date().toISOString()
          })
          .in('id', userIds)
        break

      case 'deactivate':
        result = await supabaseAdmin
          .from('users')
          .update({ 
            is_active: false,
            updated_at: new Date().toISOString()
          })
          .in('id', userIds)
        break

      case 'delete':
        result = await supabaseAdmin
          .from('users')
          .delete()
          .in('id', userIds)
        break

      default:
        return res.status(400).json({
          success: false,
          message: 'Invalid action'
        })
    }

    if (result.error) {
      return res.status(400).json({
        success: false,
        message: result.error.message
      })
    }

    return res.status(200).json({
      success: true,
      message: `Bulk ${action} completed successfully`
    })

  } catch (error: any) {
    console.error('Bulk operation error:', error)
    return res.status(500).json({
      success: false,
      message: error.message || 'Bulk operation failed'
    })
  }
}
