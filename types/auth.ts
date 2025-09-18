import type { Session } from '@supabase/supabase-js'

export interface User {
  id: string
  email: string
  fullName: string
  role: 'admin' | 'manager' | 'user'
  phone?: string
  isActive: boolean
  createdBy?: string
  createdAt: string
  updatedAt: string
}

export interface AuthUser {
  id: string
  email: string
  fullName: string
  role: 'admin' | 'manager' | 'user'
  phone?: string
  isActive: boolean
}

export interface SignInCredentials {
  email: string
  password: string
}

// Legacy interface for backward compatibility
export interface LoginCredentials extends SignInCredentials {}

export interface LoginResponse {
  user: AuthUser
  token: string
}

export interface CreateUserData {
  email: string
  password?: string // Optional as Supabase handles this
  fullName: string
  role: 'admin' | 'manager' | 'user'
  phone?: string
}

export interface AuthContextType {
  user: AuthUser | null
  session: Session | null
  loading: boolean
  signIn: (credentials: SignInCredentials) => Promise<void>
  signOut: () => Promise<void>
  resetPassword: (email: string) => Promise<void>
  updatePassword: (newPassword: string) => Promise<void>
  updateProfile: (updates: { fullName?: string; phone?: string }) => Promise<void>
  hasRole: (roles: string | string[]) => boolean
  // Legacy methods for backward compatibility
  login?: (credentials: LoginCredentials) => Promise<void>
  logout?: () => Promise<void>
}
