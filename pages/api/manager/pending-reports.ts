import { NextApiRequest, NextApiResponse } from 'next'
import { createServerSupabaseClient } from '@/lib/supabase'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' })
  }

  try {
    // Use Supabase cookie-based auth instead of JWT tokens
    const supabase = createServerSupabaseClient(req, res)
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return res.status(401).json({ 
        success: false,
        message: 'Authentication required' 
      })
    }

    // Get user profile to check role
    const { data: userProfile, error: profileError } = await supabase
      .from('users')
      .select('role, is_active')
      .eq('id', user.id)
      .single()

    if (profileError || !userProfile || !userProfile.is_active) {
      return res.status(401).json({ 
        success: false,
        message: 'User not found or inactive' 
      })
    }

    if (userProfile.role !== 'manager' && userProfile.role !== 'admin') {
      return res.status(403).json({ 
        success: false,
        message: 'Access denied' 
      })
    }

    // Get pending reports with user information
    const { data: reports, error } = await supabase
      .from('reports')
      .select(`
        *,
        users!inner(
          id,
          full_name,
          email
        )
      `)
      .eq('status', 'pending_approval')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching pending reports:', error)
      return res.status(500).json({
        success: false,
        message: 'Failed to fetch pending reports'
      })
    }

    return res.status(200).json({
      success: true,
      reports: reports || []
    })

  } catch (error) {
    console.error('Pending reports API error:', error)
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch pending reports'
    })
  }
}