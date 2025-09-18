import { NextApiRequest, NextApiResponse } from 'next'
import { AuthService } from '@/lib/auth'

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'PUT') {
    return res.status(405).json({ message: 'Method not allowed' })
  }

  const { id } = req.query
  const { is_active } = req.body

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

    await AuthService.updateUserStatus(id as string, is_active)

    return res.status(200).json({
      success: true,
      message: `User ${is_active ? 'activated' : 'deactivated'} successfully`
    })

  } catch (error: any) {
    return res.status(400).json({
      success: false,
      message: error.message || 'Failed to update user status'
    })
  }
}
