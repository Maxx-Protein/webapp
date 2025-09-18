import { NextApiRequest, NextApiResponse } from 'next'
import { supabaseAdmin } from '@/lib/supabase'
import bcrypt from 'bcryptjs'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' })
  }

  try {
    console.log('🚀 Initializing default users...')
    
    // Default password hash for "admin123", "manager123", "user123"
    const defaultPassword = 'admin123' // Same password for all for simplicity
    const passwordHash = await bcrypt.hash(defaultPassword, 12)
    
    const defaultUsers = [
      {
        email: 'admin@company.com',
        password_hash: passwordHash,
        full_name: 'System Administrator',
        role: 'admin' as const,
        is_active: true
      },
      {
        email: 'manager@company.com',
        password_hash: passwordHash,
        full_name: 'Demo Manager',
        role: 'manager' as const,
        is_active: true
      },
      {
        email: 'user@company.com',
        password_hash: passwordHash,
        full_name: 'Demo User',
        role: 'user' as const,
        is_active: true
      }
    ]
    
    const results = []
    
    for (const userData of defaultUsers) {
      console.log(`Creating user: ${userData.email}`)
      
      // Check if user already exists
      const { data: existingUser } = await supabaseAdmin
        .from('profiles')
        .select('id, email')
        .eq('email', userData.email)
        .single()
      
      if (existingUser) {
        console.log(`✅ User ${userData.email} already exists`)
        results.push({
          email: userData.email,
          status: 'already_exists',
          id: existingUser.id
        })
        continue
      }
      
      // Create new user
      const { data: newUser, error } = await supabaseAdmin
        .from('profiles')
        .insert({
          ...userData,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single()
      
      if (error) {
        console.error(`❌ Failed to create ${userData.email}:`, error)
        results.push({
          email: userData.email,
          status: 'error',
          error: error.message
        })
      } else {
        console.log(`✅ Successfully created ${userData.email}`)
        results.push({
          email: userData.email,
          status: 'created',
          id: newUser.id
        })
      }
    }
    
    // Test login with admin account
    console.log('🧪 Testing admin login...')
    try {
      const { data: adminUser } = await supabaseAdmin
        .from('profiles')
        .select('*')
        .eq('email', 'admin@company.com')
        .eq('is_active', true)
        .single()
      
      if (adminUser) {
        const isValidPassword = await bcrypt.compare(defaultPassword, adminUser.password_hash)
        console.log(`Password test result: ${isValidPassword ? '✅ Valid' : '❌ Invalid'}`)
        results.push({
          email: 'admin@company.com',
          status: 'login_test',
          password_valid: isValidPassword
        })
      }
    } catch (testError) {
      console.error('Login test failed:', testError)
    }
    
    console.log('✨ User initialization complete!')
    
    return res.status(200).json({
      success: true,
      message: 'User initialization completed',
      results,
      credentials: {
        admin: { email: 'admin@company.com', password: defaultPassword },
        manager: { email: 'manager@company.com', password: defaultPassword },
        user: { email: 'user@company.com', password: defaultPassword }
      }
    })
    
  } catch (error) {
    console.error('❌ User initialization failed:', error)
    return res.status(500).json({
      success: false,
      error: 'Failed to initialize users',
      details: error instanceof Error ? error.message : 'Unknown error'
    })
  }
}