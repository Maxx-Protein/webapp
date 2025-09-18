import { NextApiRequest, NextApiResponse } from 'next'
import { createClient } from '@supabase/supabase-js'
import { createServerSupabaseClient } from '@/lib/supabase'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''

// Create Supabase client with service role key for admin operations
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ 
      success: false,
      message: 'Method not allowed' 
    })
  }

  try {
    // Verify admin authentication using server supabase client
    const supabase = createServerSupabaseClient(req, res)
    const { data: { session }, error: sessionError } = await supabase.auth.getSession()
    
    if (sessionError || !session?.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      })
    }

    // Get admin user profile to verify role
    const { data: adminUser, error: userError } = await supabase
      .from('users')
      .select('role')
      .eq('id', session.user.id)
      .single()

    if (userError || !adminUser || adminUser.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Admin access required'
      })
    }

    const { email, role } = req.body

    // Validate required fields
    if (!email || !role) {
      return res.status(400).json({
        success: false,
        message: 'Email and role are required'
      })
    }

    // Validate role
    if (!['admin', 'manager', 'user'].includes(role)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid role specified'
      })
    }

    console.log(`👤 Creating user: ${email} with role: ${role}`)

    // Create user using Supabase admin client
    const { data: authUser, error: createUserError } = await supabaseAdmin.auth.admin.createUser({
      email,
      email_confirm: false, // User will confirm email and set their own password
      user_metadata: { 
        role 
      }
    })

    if (createUserError || !authUser?.user) {
      console.error('Auth user creation error:', createUserError)
      throw new Error(createUserError?.message || 'Failed to create auth user')
    }

    console.log(`✅ User created successfully: ${email} (ID: ${authUser.user.id})`)

    res.status(201).json({
      success: true,
      message: 'User created successfully. An invitation email has been sent.',
      userId: authUser.user.id
    })

  } catch (error: unknown) {
    console.error('User creation error:', error)
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : 'User creation failed'
    })
  }
}