import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.SUPABASE_URL
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

export async function GET() {
  try {
    if (!supabaseUrl || !supabaseServiceRoleKey) {
      return NextResponse.json({ error: 'Missing Supabase server configuration.' }, { status: 500 })
    }

    const supabase = createClient(supabaseUrl, supabaseServiceRoleKey)
    const { data, error } = await supabase
      .from('formatting_rules')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Formatting rules fetch error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, rules: data || [] })
  } catch (err: any) {
    console.error('Formatting rules GET error:', err)
    return NextResponse.json({ error: err.message || 'Failed to fetch formatting rules' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    if (!supabaseUrl || !supabaseServiceRoleKey) {
      return NextResponse.json({ error: 'Missing Supabase server configuration.' }, { status: 500 })
    }

    const { name, description, pattern } = await request.json()

    if (!name || !name.trim()) {
      return NextResponse.json({ error: 'Rule name is required.' }, { status: 400 })
    }

    if (!pattern || !pattern.trim()) {
      return NextResponse.json({ error: 'Pattern is required.' }, { status: 400 })
    }

    const supabase = createClient(supabaseUrl, supabaseServiceRoleKey)
    const { data, error } = await supabase
      .from('formatting_rules')
      .insert([{ 
        name: name.trim(), 
        description: description?.trim() || '',
        pattern: pattern.trim() 
      }])
      .select()
      .single()

    if (error) {
      console.error('Formatting rule creation error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, rule: data })
  } catch (err: any) {
    console.error('Formatting rule POST error:', err)
    return NextResponse.json({ error: err.message || 'Failed to add formatting rule' }, { status: 500 })
  }
}
