import { createClient } from '@supabase/supabase-js'

// I-paste mo dito ang iyong URL at Key para i-bypass ang bug ng v0 environment variables.
// Ligtas ito dahil "public/anon" key lang ito, at protektado ang database mo ng RLS.

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? ''
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? ''

export const supabase = createClient(supabaseUrl, supabaseAnonKey)