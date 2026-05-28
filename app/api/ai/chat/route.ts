import { NextResponse } from 'next/server'
import { runQualityChat } from '@/lib/ai/gemini-agents'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: Request) {
  try {
    const supabase = await createClient()

    // 1. Authenticate user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { messages, projectDraft } = body

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json({ error: 'Missing messages history' }, { status: 400 })
    }

    // 2. Call the coach agent
    const responseText = await runQualityChat(messages, projectDraft || {})

    return NextResponse.json({ text: responseText })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 550 })
  }
}
