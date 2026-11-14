import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.SUPABASE_URL
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

export async function GET(request: Request) {
  try {
    if (!supabaseUrl || !supabaseServiceRoleKey) {
      return NextResponse.json({ error: 'Missing Supabase server configuration.' }, { status: 500 })
    }

    const { searchParams } = new URL(request.url)
    const department = searchParams.get('department')

    const supabase = createClient(supabaseUrl, supabaseServiceRoleKey)
    let query = supabase
      .from('ai_style_guidelines')
      .select('*')
      .order('id', { ascending: false })

    if (department && department !== 'all') {
      query = query.or(`department.eq.${department},department.eq.all`)
    }

    const { data, error } = await query

    if (error) {
      // Table might not exist yet if migration hasn't been run
      if (error.code === '42P01') {
        return NextResponse.json({ success: true, guidelines: [], note: 'Table not created yet' })
      }
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, guidelines: data || [] })
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to fetch guidelines' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    if (!supabaseUrl || !supabaseServiceRoleKey) {
      return NextResponse.json({ error: 'Missing Supabase server configuration.' }, { status: 500 })
    }

    const body = await request.json()
    const { category, department, title, rule_content, examples, created_by } = body

    if (!title || !title.trim()) {
      return NextResponse.json({ error: 'Title is required.' }, { status: 400 })
    }
    if (!rule_content || !rule_content.trim()) {
      return NextResponse.json({ error: 'Rule content / explanation is required.' }, { status: 400 })
    }

    const supabase = createClient(supabaseUrl, supabaseServiceRoleKey)
    const { data, error } = await supabase
      .from('ai_style_guidelines')
      .insert([
        {
          category: category || 'General',
          department: department || 'all',
          title: title.trim(),
          rule_content: rule_content.trim(),
          examples: examples ? examples.trim() : null,
          created_by: created_by || 'Admin',
          updated_at: new Date().toISOString(),
        },
      ])
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, guideline: data })
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to add guideline' }, { status: 500 })
  }
}

export async function DELETE(request: Request) {
  try {
    if (!supabaseUrl || !supabaseServiceRoleKey) {
      return NextResponse.json({ error: 'Missing Supabase server configuration.' }, { status: 500 })
    }

    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'ID is required.' }, { status: 400 })
    }

    const supabase = createClient(supabaseUrl, supabaseServiceRoleKey)
    const { error } = await supabase
      .from('ai_style_guidelines')
      .delete()
      .eq('id', id)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to delete guideline' }, { status: 500 })
  }
}
