import { NextApiRequest, NextApiResponse } from 'next'
import { AuthService } from '@/lib/auth'

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' })
  }

  try {
    const authHeader = req.headers.authorization
    if (!authHeader?.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'No token provided' })
    }

    const token = authHeader.substring(7)
    const user = await AuthService.verifyToken(token)

    if (user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied' })
    }

    const users = await AuthService.getUsers()

    res.status(200).json({
      success: true,
      users
    })
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch users'
    })
  }
}
