import { createClient, SupabaseClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

function getSupabaseUrl(): string {
  if (!supabaseUrl) {
    throw new Error('Missing Supabase URL. Set SUPABASE_URL or NEXT_PUBLIC_SUPABASE_URL in your environment.')
  }
  return supabaseUrl
}

function getSupabaseKey(requireServiceRole = true): string {
  if (requireServiceRole) {
    if (supabaseServiceRoleKey) return supabaseServiceRoleKey
    if (supabaseAnonKey) return supabaseAnonKey
    throw new Error('Missing Supabase key. Set SUPABASE_SERVICE_ROLE_KEY or NEXT_PUBLIC_SUPABASE_ANON_KEY in your environment.')
  }

  if (!supabaseAnonKey) {
    throw new Error('Missing Supabase anon key. Set NEXT_PUBLIC_SUPABASE_ANON_KEY in your environment.')
  }

  return supabaseAnonKey
}

export function getSupabaseServerClient(requireServiceRole = true): SupabaseClient {
  return createClient(getSupabaseUrl(), getSupabaseKey(requireServiceRole), {
    auth: { persistSession: false },
  })
}
