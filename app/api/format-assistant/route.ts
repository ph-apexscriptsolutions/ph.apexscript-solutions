import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.SUPABASE_URL
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

export async function POST(request: Request) {
  try {
    const apiKey = process.env.GEMINI_API_KEY
    if (!apiKey) {
      return NextResponse.json(
        { error: 'Gemini API key is not configured. Please add GEMINI_API_KEY in your environment variables.' },
        { status: 500 }
      )
    }

    const { message, department, chatHistory } = await request.json()

    if (!message || typeof message !== 'string' || !message.trim()) {
      return NextResponse.json({ error: 'Message cannot be empty.' }, { status: 400 })
    }

    // 1. Fetch live admin-added AI style guidelines from database
    let customGuidelinesText = ''
    if (supabaseUrl && supabaseServiceRoleKey) {
      try {
        const supabase = createClient(supabaseUrl, supabaseServiceRoleKey)
        let query = supabase.from('ai_style_guidelines').select('*')
        if (department && department !== 'all') {
          query = query.or(`department.eq.${department},department.eq.all`)
        }
        const { data: guidelines } = await query

        if (guidelines && guidelines.length > 0) {
          customGuidelinesText = guidelines
            .map(
              (g: any) =>
                `### [${g.department.toUpperCase()} - ${g.category}] ${g.title}\nRule: ${g.rule_content}${
                  g.examples ? `\nExamples:\n${g.examples}` : ''
                }`
            )
            .join('\n\n')
        }
      } catch (dbErr) {
        console.warn('Could not load ai_style_guidelines:', dbErr)
      }
    }

    // 2. Fetch active regex/find-replace formatting rules
    let formattingRulesText = ''
    if (supabaseUrl && supabaseServiceRoleKey) {
      try {
        const supabase = createClient(supabaseUrl, supabaseServiceRoleKey)
        const { data: rules } = await supabase
          .from('formatting_rules')
          .select('name, description, pattern, replacement, department')
          .limit(30)

        if (rules && rules.length > 0) {
          formattingRulesText = rules
            .map(
              (r: any) =>
                `- [${r.department || 'all'}] ${r.name}: Find "${r.pattern}" -> Replace with "${r.replacement || ''}" (${r.description || ''})`
            )
            .join('\n')
        }
      } catch (err) {
        console.warn('Could not load formatting_rules:', err)
      }
    }

    const systemPrompt = `You are the ApexScript AI Format Assistant.
Your job is to answer questions from transcribers, workers, and editors regarding transcription formats, speaker labels, numbers, punctuation, timestamps, and style guidelines.

OFFICIAL APEXSCRIPT GUIDELINES (Added and managed by Admins):
${customGuidelinesText ? customGuidelinesText : 'No custom admin guidelines uploaded yet; follow standard professional transcription practices below.'}

${formattingRulesText ? `AUTOMATED SYSTEM RULES:\n${formattingRulesText}\n` : ''}

DEFAULT STANDARD TRANSCRIPTION BASELINE:
- Speaker labels: Capitalized, followed by a colon and space: "JOHN DOE: Good morning."
- Timestamps: [HH:MM:SS] format for inaudibles and crosstalk: "[inaudible 00:04:12]".
- Interruptions: Use an em-dash (—) without spaces for self-interruptions and false starts.
- Numbers: Spell zero to nine, numerals for 10+ and currency ($500, £20).
- Departments: Adhere strictly to the requested department guidelines (Senate, Conference, Broadcast, Podcast, etc.).

INSTRUCTIONS:
1. Always give priority to the Admin Guidelines above.
2. Provide clear, direct, and ready-to-copy examples.
3. If the user pastes a transcript snippet, review it, highlight any mistakes, and provide the corrected version.
4. If an instruction is genuinely ambiguous or not covered, give the safest standard advice and mention that they can check with their shift editor for client-specific exceptions.`

    // Format chat history
    const contents: any[] = []
    if (Array.isArray(chatHistory)) {
      for (const msg of chatHistory.slice(-10)) {
        if (msg.role === 'user' || msg.role === 'assistant') {
          contents.push({
            role: msg.role === 'assistant' ? 'model' : 'user',
            parts: [{ text: String(msg.content) }],
          })
        }
      }
    }

    const userPrompt = department && department !== 'all'
      ? `[Current Department Context: ${department.toUpperCase()}]\n${message}`
      : message

    contents.push({
      role: 'user',
      parts: [{ text: userPrompt }],
    })

    const geminiEndpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`

    const response = await fetch(geminiEndpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: systemPrompt }] },
        contents,
        generationConfig: {
          temperature: 0.2,
          maxOutputTokens: 1024,
        },
      }),
    })

    if (!response.ok) {
      const errData = await response.json().catch(() => ({}))
      console.error('Gemini API Error:', errData)
      return NextResponse.json(
        { error: errData.error?.message || 'Failed to generate response from Gemini AI.' },
        { status: response.status }
      )
    }

    const data = await response.json()
    const reply = data.candidates?.[0]?.content?.parts?.[0]?.text || 'No response generated.'

    return NextResponse.json({ success: true, reply })
  } catch (error: any) {
    console.error('Format Assistant API Error:', error)
    return NextResponse.json({ error: error.message || 'Internal server error.' }, { status: 500 })
  }
}
