import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { supabaseAdmin } from './supabase'
import type { User } from './supabase'

const JWT_SECRET = process.env.NEXTAUTH_SECRET || 'your-jwt-secret-key'
const JWT_EXPIRES_IN = '7d'

export interface AuthUser {
  id: string
  email: string
  fullName: string
  role: 'admin' | 'manager' | 'user'
}

export interface LoginCredentials {
  email: string
  password: string
}

export interface CreateUserData {
  email: string
  password: string
  fullName: string
  role: 'admin' | 'manager' | 'user'
  phone?: string
  createdBy: string
}

export class AuthService {
  static async login(credentials: LoginCredentials): Promise<{
    user: AuthUser
    token: string
  }> {
    const { email, password } = credentials

    // Find user in Supabase
    const { data: user, error } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('email', email)
      .eq('is_active', true)
      .single()

    if (error || !user) {
      throw new Error('Invalid credentials')
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.password_hash)
    if (!isValidPassword) {
      throw new Error('Invalid credentials')
    }

    // Generate JWT token
    const token = jwt.sign(
      {
        userId: user.id,
        email: user.email,
        role: user.role,
      },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    )

    return {
      user: {
        id: user.id,
        email: user.email,
        fullName: user.full_name,
        role: user.role,
      },
      token,
    }
  }

  static async verifyToken(token: string): Promise<AuthUser> {
    try {
      const decoded = jwt.verify(token, JWT_SECRET) as { userId: string }
      
      // Fetch fresh user data
      const { data: user, error } = await supabaseAdmin
        .from('users')
        .select('*')
        .eq('id', decoded.userId)
        .eq('is_active', true)
        .single()

      if (error || !user) {
        throw new Error('User not found')
      }

      return {
        id: user.id,
        email: user.email,
        fullName: user.full_name,
        role: user.role,
      }
    } catch {
      throw new Error('Invalid token')
    }
  }

  static async createUser(userData: CreateUserData, creatorRole: string): Promise<string> {
    const { email, password, fullName, role, phone, createdBy } = userData

    // Role-based creation validation
    if (creatorRole === 'manager' && role === 'admin') {
      throw new Error('Managers cannot create admin accounts')
    }

    if (creatorRole === 'user') {
      throw new Error('Users cannot create accounts')
    }

    // Check if user already exists
    const { data: existingUser } = await supabaseAdmin
      .from('users')
      .select('id')
      .eq('email', email)
      .single()

    if (existingUser) {
      throw new Error('User with this email already exists')
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 12)

    // Create user
    const { data: newUser, error } = await supabaseAdmin
      .from('users')
      .insert({
        email,
        password_hash: passwordHash,
        full_name: fullName,
        role,
        phone,
        created_by: createdBy,
      })
      .select('id')
      .single()

    if (error || !newUser) {
      throw new Error('Failed to create user')
    }

    return newUser.id
  }

  static async getUsers(createdBy?: string, role?: string): Promise<User[]> {
    let query = supabaseAdmin
      .from('users')
      .select('*')
      .eq('is_active', true)

    if (createdBy) {
      query = query.eq('created_by', createdBy)
    }

    if (role) {
      query = query.eq('role', role)
    }

    const { data: users, error } = await query.order('created_at', { ascending: false })

    if (error) {
      throw new Error('Failed to fetch users')
    }

    return users || []
  }

  static async updateUserStatus(id: string, isActive: boolean): Promise<void> {
    const { error } = await supabaseAdmin
      .from('users')
      .update({ is_active: isActive, updated_at: new Date().toISOString() })
      .eq('id', id)

    if (error) {
      throw new Error('Failed to update user status')
    }
  }
}