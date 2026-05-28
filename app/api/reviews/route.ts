import { NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase/server'

export async function POST(request: Request) {
  try {
    const supabase = await createClient()

    // 1. Authenticate user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // 2. Verify user has reviewer/admin role
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (!profile || !['admin', 'reviewer'].includes(profile.role)) {
      return NextResponse.json({ error: 'Forbidden: Requires reviewer role' }, { status: 403 })
    }

    const body = await request.json()
    const {
      projectId,
      gate,
      score_impact,
      score_feasibility,
      score_team,
      score_innovation,
      score_market,
      comments,
      recommendation,
    } = body

    if (!projectId || !gate || !recommendation) {
      return NextResponse.json({ error: 'Missing required review fields' }, { status: 400 })
    }

    const supabaseAdmin = createAdminClient()

    // 3. Compute weighted average total score out of 10
    const weightedTotal = 
      ((score_impact || 0) + 
      (score_feasibility || 0) + 
      (score_team || 0) + 
      (score_innovation || 0) + 
      (score_market || 0)) / 5

    // 4. Insert review record
    const { data: review, error: insertError } = await supabaseAdmin
      .from('stage_gate_reviews')
      .insert({
        project_id: projectId,
        reviewer_id: user.id,
        gate,
        score_impact,
        score_feasibility,
        score_team,
        score_innovation,
        score_market,
        weighted_total: weightedTotal,
        comments,
        recommendation,
        is_ai_review: false,
      })
      .select()
      .single()

    if (insertError) {
      return NextResponse.json({ error: insertError.message }, { status: 500 })
    }

    // 5. Send notification to the project owner
    const { data: project } = await supabaseAdmin
      .from('projects')
      .select('title, owner_id')
      .eq('id', projectId)
      .single()

    if (project) {
      await supabaseAdmin.from('notifications').insert({
        user_id: project.owner_id,
        type: 'review_assigned',
        title: 'New Review Submitted',
        body: `A stage-gate review has been submitted for your project "${project.title}" with recommendation: "${recommendation.replace('_', ' ')}".`,
        link: `/portal/projects/${projectId}`,
      })
    }

    return NextResponse.json({ success: true, review })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 550 })
  }
}
