import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { runProjectScorer } from '@/lib/ai/gemini-agents'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { projectId } = body

    if (!projectId) {
      return NextResponse.json({ error: 'Missing projectId' }, { status: 400 })
    }

    const supabaseAdmin = createAdminClient()

    // 1. Fetch project details
    const { data: project, error: fetchError } = await supabaseAdmin
      .from('projects')
      .select('*')
      .eq('id', projectId)
      .single()

    if (fetchError || !project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 })
    }

    // 2. Execute Gemini Scorer Agent
    const aiEvaluation = await runProjectScorer({
      title: project.title,
      track: project.track,
      sectors: project.sector || [],
      description: project.description,
      problem_statement: project.problem_statement,
      proposed_solution: project.proposed_solution,
    })

    // 3. Write results back to projects table
    const { error: updateError } = await supabaseAdmin
      .from('projects')
      .update({
        ai_score: aiEvaluation.score,
        ai_summary: aiEvaluation.summary,
        sdg_tags: aiEvaluation.sdg_tags,
        ai_sdg_reasoning: aiEvaluation.sdg_reasoning,
      })
      .eq('id', projectId)

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 })
    }

    // 4. Create an automated review record in stage_gate_reviews
    // Use the owner_id as reviewer_id since it must link to a profile, but mark as AI review
    await supabaseAdmin
      .from('stage_gate_reviews')
      .insert({
        project_id: projectId,
        reviewer_id: project.owner_id,
        gate: project.stage,
        score_impact: Math.round(aiEvaluation.score / 10),
        score_feasibility: Math.round(aiEvaluation.score / 10),
        score_team: Math.round(aiEvaluation.score / 10),
        score_innovation: Math.round(aiEvaluation.score / 10),
        score_market: Math.round(aiEvaluation.score / 10),
        comments: `AI Evaluation Summary: ${aiEvaluation.summary}\n\nStrengths:\n- ${aiEvaluation.strengths.join('\n- ')}\n\nConcerns:\n- ${aiEvaluation.concerns.join('\n- ')}`,
        recommendation: aiEvaluation.score >= 50 ? 'advance' : 'revise_resubmit',
        is_ai_review: true,
      })

    // 5. Send confirmation notification to owner
    await supabaseAdmin.from('notifications').insert({
      user_id: project.owner_id,
      type: 'system',
      title: 'AI Pre-Evaluation Complete',
      body: `Your project "${project.title}" has been pre-evaluated with AI SDG tags: ${aiEvaluation.sdg_tags.join(', ')}.`,
      link: `/portal/projects/${project.id}`,
    })

    return NextResponse.json({ success: true, evaluation: aiEvaluation })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 550 })
  }
}
