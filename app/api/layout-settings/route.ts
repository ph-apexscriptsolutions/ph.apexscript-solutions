import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.SUPABASE_URL
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

const isMissingTableError = (error: any) => {
  if (!error) return false
  return error.code === 'PGRST116' || error.message?.includes("Could not find table 'public.dashboard_layout_settings'")
}

export async function GET() {
  try {
    if (!supabaseUrl || !supabaseServiceRoleKey) {
      return NextResponse.json({ error: 'Missing Supabase server configuration.' }, { status: 500 })
    }

    const supabase = createClient(supabaseUrl, supabaseServiceRoleKey)
    const { data, error } = await supabase
      .from('dashboard_layout_settings')
      .select('assignment_header_template,assignment_row_template')
      .limit(1)
      .single()

    if (error) {
      if (isMissingTableError(error)) {
        console.warn('Layout settings table missing, returning defaults:', error.message)
        return NextResponse.json({ layout: null })
      }
      console.error('Layout settings fetch error:', error)
      return NextResponse.json({ error: error.message || 'Failed to fetch layout settings' }, { status: 500 })
    }

    return NextResponse.json({ layout: data || null })
  } catch (err: any) {
    console.error('Layout settings GET error:', err)
    return NextResponse.json({ error: err.message || 'Failed to fetch layout settings' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    if (!supabaseUrl || !supabaseServiceRoleKey) {
      return NextResponse.json({ error: 'Missing Supabase server configuration.' }, { status: 500 })
    }

    const body = await request.json()
    const { assignmentHeaderTemplate, assignmentRowTemplate } = body

    if (!assignmentHeaderTemplate || !assignmentRowTemplate) {
      return NextResponse.json({ error: 'Missing layout values' }, { status: 400 })
    }

    const supabase = createClient(supabaseUrl, supabaseServiceRoleKey)
    const { data, error } = await supabase
      .from('dashboard_layout_settings')
      .upsert({
        id: 1,
        assignment_header_template: assignmentHeaderTemplate,
        assignment_row_template: assignmentRowTemplate,
      }, { onConflict: 'id' })
      .select()

    if (error) {
      if (isMissingTableError(error)) {
        console.error('Layout settings save failed because table is missing:', error.message)
        return NextResponse.json({ error: 'Missing Supabase table dashboard_layout_settings. Run the new migration SQL to create it before saving layout settings.' }, { status: 500 })
      }
      console.error('Layout settings save error:', error)
      return NextResponse.json({ error: error.message || 'Failed to save layout settings' }, { status: 500 })
    }

    return NextResponse.json({ layout: data?.[0] || null })
  } catch (err: any) {
    console.error('Layout settings POST error:', err)
    return NextResponse.json({ error: err.message || 'Failed to save layout settings' }, { status: 500 })
  }
}
