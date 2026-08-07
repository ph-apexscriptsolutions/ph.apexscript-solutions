import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.SUPABASE_URL
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

export async function POST(request: Request) {
  try {
    if (!supabaseUrl || !supabaseServiceRoleKey) {
      return NextResponse.json({ error: 'Missing Supabase server configuration.' }, { status: 500 })
    }

    const body = await request.json()
    const { worker_id, worker_name, transcript_content, issue_description, department } = body

    if (!worker_id || !worker_name || !issue_description || !department) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const supabase = createClient(supabaseUrl, supabaseServiceRoleKey)

    const { data, error } = await supabase
      .from('validator_issue_reports')
      .insert({
        worker_id,
        worker_name,
        transcript_content: transcript_content || '',
        issue_description,
        department,
        status: 'pending'
      })
      .select()

    if (error) {
      console.error('Error inserting validator issue report:', error)
      return NextResponse.json({ error: 'Failed to submit report' }, { status: 500 })
    }

    return NextResponse.json({ success: true, data }, { status: 201 })
  } catch (error) {
    console.error('Error in validator issue reports API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function GET(request: Request) {
  try {
    if (!supabaseUrl || !supabaseServiceRoleKey) {
      return NextResponse.json({ error: 'Missing Supabase server configuration.' }, { status: 500 })
    }

    const { searchParams } = new URL(request.url)
    const workerId = searchParams.get('worker_id')

    const supabase = createClient(supabaseUrl, supabaseServiceRoleKey)

    let query = supabase
      .from('validator_issue_reports')
      .select('*')
      .order('created_at', { ascending: false })

    if (workerId) {
      query = query.eq('worker_id', workerId)
    }

    const { data, error } = await query

    if (error) {
      console.error('Error fetching validator issue reports:', error)
      return NextResponse.json({ error: 'Failed to fetch reports' }, { status: 500 })
    }

    return NextResponse.json({ reports: data }, { status: 200 })
  } catch (error) {
    console.error('Error in validator issue reports API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PATCH(request: Request) {
  try {
    if (!supabaseUrl || !supabaseServiceRoleKey) {
      return NextResponse.json({ error: 'Missing Supabase server configuration.' }, { status: 500 })
    }

    const body = await request.json()
    const { id, status, solution, resolved_by } = body

    if (!id || !status) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const supabase = createClient(supabaseUrl, supabaseServiceRoleKey)

    const updateData: any = { status, updated_at: new Date().toISOString() }
    
    if (solution !== undefined) {
      updateData.solution = solution
    }
    
    if (resolved_by !== undefined) {
      updateData.resolved_by = resolved_by
    }
    
    if (status === 'resolved' && !updateData.resolved_at) {
      updateData.resolved_at = new Date().toISOString()
    }

    const { data, error } = await supabase
      .from('validator_issue_reports')
      .update(updateData)
      .eq('id', id)
      .select()

    if (error) {
      console.error('Error updating validator issue report:', error)
      return NextResponse.json({ error: 'Failed to update report' }, { status: 500 })
    }

    return NextResponse.json({ success: true, data }, { status: 200 })
  } catch (error) {
    console.error('Error in validator issue reports API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
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
      return NextResponse.json({ error: 'Missing required field: id' }, { status: 400 })
    }

    const supabase = createClient(supabaseUrl, supabaseServiceRoleKey)

    const { error } = await supabase
      .from('validator_issue_reports')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Error deleting validator issue report:', error)
      return NextResponse.json({ error: 'Failed to delete report' }, { status: 500 })
    }

    return NextResponse.json({ success: true }, { status: 200 })
  } catch (error) {
    console.error('Error in validator issue reports API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
