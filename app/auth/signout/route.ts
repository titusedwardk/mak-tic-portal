import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: Request) {
  const supabase = await createClient()

  // Check if session exists
  const { data: { session } } = await supabase.auth.getSession()

  if (session) {
    await supabase.auth.signOut()
  }

  const { origin } = new URL(request.url)
  return NextResponse.redirect(`${origin}/login`, {
    status: 302,
  })
}
