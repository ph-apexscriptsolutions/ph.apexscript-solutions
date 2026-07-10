import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.SUPABASE_URL
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
const BUCKET = 'style-guides'

export async function GET() {
  try {
    if (!supabaseUrl || !supabaseServiceRoleKey) {
      return NextResponse.json({ error: 'Missing Supabase server configuration.' }, { status: 500 })
    }

    const supabase = createClient(supabaseUrl, supabaseServiceRoleKey)
    const { data, error } = await supabase
      .from('style_guides')
      .select('id, department, file_url, file_name, note, updated_at')
      .order('department')

    if (error) {
      console.error('Style guides fetch error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, guides: data || [] })
  } catch (err: any) {
    console.error('Style guides GET error:', err)
    return NextResponse.json({ error: err.message || 'Failed to fetch style guides' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    if (!supabaseUrl || !supabaseServiceRoleKey) {
      return NextResponse.json({ error: 'Missing Supabase server configuration.' }, { status: 500 })
    }

    const { department } = await request.json()

    if (!department || !department.trim()) {
      return NextResponse.json({ error: 'Department name is required.' }, { status: 400 })
    }

    const supabase = createClient(supabaseUrl, supabaseServiceRoleKey)
    const { data, error } = await supabase
      .from('style_guides')
      .insert([{ department: department.trim() }])
      .select()
      .single()

    if (error) {
      console.error('Style guide creation error:', error)
      if (error.code === '23505') { // unique violation
        return NextResponse.json({ error: 'A department with this name already exists.' }, { status: 400 })
      }
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, guide: data })
  } catch (err: any) {
    console.error('Style guide POST error:', err)
    return NextResponse.json({ error: err.message || 'Failed to add department' }, { status: 500 })
  }
}

export async function PATCH(request: Request) {
  try {
    if (!supabaseUrl || !supabaseServiceRoleKey) {
      return NextResponse.json({ error: 'Missing Supabase server configuration.' }, { status: 500 })
    }

    const { id, department, note, renameTo } = await request.json()

    const supabase = createClient(supabaseUrl, supabaseServiceRoleKey)

    const updateData: any = {}
    if (typeof note === 'string') {
      updateData.note = note.trim()
    }
    if (renameTo && renameTo.trim()) {
      updateData.department = renameTo.trim()
    } else if (id && department && department.trim()) {
      // If id is provided and department name is provided, treat it as rename
      updateData.department = department.trim()
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ error: 'No fields to update.' }, { status: 400 })
    }

    updateData.updated_at = new Date().toISOString()

    let query = supabase.from('style_guides').update(updateData)

    if (id) {
      query = query.eq('id', id)
    } else if (department) {
      query = query.eq('department', department)
    } else {
      return NextResponse.json({ error: 'Missing department identifier (id or department).' }, { status: 400 })
    }

    const { error } = await query

    if (error) {
      console.error('Style guide update error:', error)
      if (error.code === '23505') {
        return NextResponse.json({ error: 'A department with this name already exists.' }, { status: 400 })
      }
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (err: any) {
    console.error('Style guide PATCH error:', err)
    return NextResponse.json({ error: err.message || 'Failed to update style guide' }, { status: 500 })
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
      return NextResponse.json({ error: 'Missing department id.' }, { status: 400 })
    }

    const supabase = createClient(supabaseUrl, supabaseServiceRoleKey)

    // First fetch the record to see if there is an associated file in storage
    const { data: guide, error: fetchError } = await supabase
      .from('style_guides')
      .select('file_url')
      .eq('id', id)
      .single()

    if (fetchError) {
      console.error('Fetch style guide for delete error:', fetchError)
      return NextResponse.json({ error: fetchError.message }, { status: 500 })
    }

    // If there is an associated file, try to delete it from storage
    if (guide && guide.file_url) {
      try {
        const urlParts = guide.file_url.split(`/storage/v1/object/public/${BUCKET}/`)
        if (urlParts.length === 2) {
          const storagePath = decodeURIComponent(urlParts[1])
          const { error: storageDeleteError } = await supabase.storage
            .from(BUCKET)
            .remove([storagePath])
          if (storageDeleteError) {
            console.warn('Storage file deletion failed during department deletion:', storageDeleteError)
          }
        }
      } catch (storageErr) {
        console.error('Error deleting file from storage:', storageErr)
      }
    }

    // Delete row from DB
    const { error: deleteError } = await supabase
      .from('style_guides')
      .delete()
      .eq('id', id)

    if (deleteError) {
      console.error('Delete department error:', deleteError)
      return NextResponse.json({ error: deleteError.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (err: any) {
    console.error('Style guide DELETE error:', err)
    return NextResponse.json({ error: err.message || 'Failed to delete department' }, { status: 500 })
  }
}
