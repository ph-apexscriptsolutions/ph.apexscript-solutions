import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.SUPABASE_URL
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

export async function GET() {
  try {
    if (!supabaseUrl || !supabaseServiceRoleKey) {
      return NextResponse.json({ error: "Missing Supabase configuration." }, { status: 500 })
    }

    const supabase = createClient(supabaseUrl, supabaseServiceRoleKey)
    const { data, error } = await supabase
      .from("dashboard_ui_styles")
      .select("production_style,worker_style,bank_style,stats_style,worker_title")
      .eq("id", 1)
      .maybeSingle()

    if (error) {
      // Table might not exist yet — return nulls so client uses defaults
      console.warn("dashboard_ui_styles fetch error (table may not exist yet):", error.message)
      return NextResponse.json({ styles: null })
    }

    return NextResponse.json({ styles: data || null })
  } catch (err: any) {
    console.error("dashboard-styles GET error:", err)
    return NextResponse.json({ error: err.message || "Failed to fetch styles" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    if (!supabaseUrl || !supabaseServiceRoleKey) {
      return NextResponse.json({ error: "Missing Supabase configuration." }, { status: 500 })
    }

    const body = await request.json()
    const { productionStyle, workerStyle, bankStyle, statsStyle, workerTitle } = body

    const supabase = createClient(supabaseUrl, supabaseServiceRoleKey)
    const { data, error } = await supabase
      .from("dashboard_ui_styles")
      .upsert(
        {
          id: 1,
          ...(productionStyle !== undefined && { production_style: productionStyle }),
          ...(workerStyle !== undefined && { worker_style: workerStyle }),
          ...(bankStyle !== undefined && { bank_style: bankStyle }),
          ...(statsStyle !== undefined && { stats_style: statsStyle }),
          ...(workerTitle !== undefined && { worker_title: workerTitle }),
          updated_at: new Date().toISOString(),
        },
        { onConflict: "id" }
      )
      .select()

    if (error) {
      console.error("dashboard_ui_styles upsert error:", error)
      return NextResponse.json({ error: error.message || "Failed to save styles" }, { status: 500 })
    }

    return NextResponse.json({ styles: data?.[0] || null })
  } catch (err: any) {
    console.error("dashboard-styles POST error:", err)
    return NextResponse.json({ error: err.message || "Failed to save styles" }, { status: 500 })
  }
}
