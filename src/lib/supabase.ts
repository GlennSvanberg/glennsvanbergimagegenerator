import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export interface GlennPhoto {
  id: string
  name: string
  url: string
  fullPath: string
  created_at: string
  updated_at: string
  size: number
  metadata?: {
    width?: number
    height?: number
    type?: string
  }
} 