import { NextApiRequest, NextApiResponse } from 'next'
import { AuthService } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabase'

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' })
  }

  try {
    // Verify admin token
    const authHeader = req.headers.authorization
    if (!authHeader?.startsWith('Bearer ')) {
      return res.status(401).json({ 
        message: 'No token provided' 
      })
    }

    const token = authHeader.substring(7)
    const user = await AuthService.verifyToken(token)

    if (user.role !== 'admin') {
      return res.status(403).json({ 
        message: 'Access denied' 
      })
    }

    // Get all users with optional filters
    const { role, status } = req.query
    
    let query = supabaseAdmin
      .from('users')
      .select('*')
    
    // Apply filters if provided
    if (role) {
      query = query.eq('role', role)
    }
    
    if (status === 'active') {
      query = query.eq('is_active', true)
    } else if (status === 'inactive') {
      query = query.eq('is_active', false)
    }
    
    const { data: users, error } = await query.order('created_at', { ascending: false })
    
    if (error) {
      console.error('Error fetching users:', error)
      return res.status(500).json({ message: 'Failed to fetch users' })
    }
    
    // Transform users data to match frontend expectations
    const transformedUsers = users.map(user => ({
      id: user.id,
      email: user.email,
      full_name: user.full_name,
      role: user.role,
      phone: user.phone,
      is_active: user.is_active,
      created_at: user.created_at,
      created_by: user.created_by,
      last_login: user.last_login
    }))
    
    return res.status(200).json({ users: transformedUsers })
  } catch (error: unknown) {
    console.error('API Error:', error)
    const errorMessage = error instanceof Error ? error.message : 'Internal server error'
    return res.status(500).json({ message: errorMessage })
  }
}