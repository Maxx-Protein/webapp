import { createClient } from '@supabase/supabase-js'
import { createServerClient, type CookieOptions } from '@supabase/ssr'
import type { NextApiRequest, NextApiResponse } from 'next'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://your-project-ref.supabase.co'
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'your-supabase-anon-key'
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'your-supabase-service-role-key'

// Client-side Supabase client with auth persistence
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  }
})

// Server-side Supabase client with service role (for admin operations)
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

// Server-side client for API routes with proper session handling
export function createServerSupabaseClient(
  req: NextApiRequest,
  res: NextApiResponse
) {
  return createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      get(name: string) {
        return req.cookies[name]
      },
      set(name: string, value: string, options: CookieOptions) {
        res.setHeader('Set-Cookie', `${name}=${value}; ${Object.entries(options).map(([key, val]) => `${key}=${val}`).join('; ')}`)
      },
      remove(name: string, options: CookieOptions) {
        res.setHeader('Set-Cookie', `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; ${Object.entries(options).map(([key, val]) => `${key}=${val}`).join('; ')}`)
      },
    },
  })
}

// Database types
export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          email: string
          full_name: string
          role: 'admin' | 'manager' | 'user'
          phone: string | null
          is_active: boolean
          created_by: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          email: string
          full_name: string
          role?: 'admin' | 'manager' | 'user'
          phone?: string | null
          is_active?: boolean
          created_by?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          full_name?: string
          role?: 'admin' | 'manager' | 'user'
          phone?: string | null
          is_active?: boolean
          created_by?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      reports: {
        Row: {
          id: string
          user_id: string
          filename: string
          report_date: string
          upload_date: string
          total_amount: number
          status: 'pending' | 'processing' | 'completed' | 'paid' | 'failed'
          file_path: string | null
          processing_details: Record<string, unknown> | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          filename: string
          report_date: string
          upload_date?: string
          total_amount?: number
          status?: 'pending' | 'processing' | 'completed' | 'paid' | 'failed'
          file_path?: string | null
          processing_details?: Record<string, unknown> | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          filename?: string
          report_date?: string
          upload_date?: string
          total_amount?: number
          status?: 'pending' | 'processing' | 'completed' | 'paid' | 'failed'
          file_path?: string | null
          processing_details?: Record<string, unknown> | null
          created_at?: string
          updated_at?: string
        }
      }
      payments: {
        Row: {
          id: string
          user_id: string
          report_id: string
          amount: number
          payment_method: string | null
          payment_status: 'pending' | 'processing' | 'completed' | 'failed' | 'refunded'
          transaction_id: string | null
          payment_date: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          report_id: string
          amount: number
          payment_method?: string | null
          payment_status?: 'pending' | 'processing' | 'completed' | 'failed' | 'refunded'
          transaction_id?: string | null
          payment_date?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          report_id?: string
          amount?: number
          payment_method?: string | null
          payment_status?: 'pending' | 'processing' | 'completed' | 'failed' | 'refunded'
          transaction_id?: string | null
          payment_date?: string | null
          created_at?: string
          updated_at?: string
        }
      }
    }
  }
}

export type User = Database['public']['Tables']['users']['Row']
export type Report = Database['public']['Tables']['reports']['Row']
export type Payment = Database['public']['Tables']['payments']['Row']