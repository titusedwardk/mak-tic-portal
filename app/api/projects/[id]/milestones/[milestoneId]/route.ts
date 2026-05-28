import { NextResponse } from 'next/server'
import { createAdminClient, createClient } from '@/lib/supabase/server'

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string; milestoneId: string }> }
) {
  try {
    const { id: projectId, milestoneId } = await params
    const supabase = await createClient()

    // 1. Authenticate user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // 2. Verify user is project member or owner
    const { data: membership } = await supabase
      .from('project_members')
      .select('*')
      .eq('project_id', projectId)
      .eq('user_id', user.id)
      .maybeSingle()

    const { data: project } = await supabase
      .from('projects')
      .select('owner_id, title')
      .eq('id', projectId)
      .single()

    const isOwner = project?.owner_id === user.id

    if (!membership && !isOwner) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json()
    const { status, evidence_url, completed_at } = body

    const supabaseAdmin = createAdminClient()

    // 3. Update milestone record
    const { data: milestone, error: updateError } = await supabaseAdmin
      .from('project_milestones')
      .update({
        status: status || 'completed',
        evidence_url: evidence_url || null,
        completed_at: completed_at || new Date().toISOString(),
      })
      .eq('id', milestoneId)
      .eq('project_id', projectId)
      .select()
      .single()

    if (updateError || !milestone) {
      return NextResponse.json({ error: updateError?.message || 'Failed to update milestone' }, { status: 500 })
    }

    // 4. Send notification to administrators to verify completion
    // Fetch admins
    const { data: admins } = await supabaseAdmin
      .from('profiles')
      .select('id')
      .eq('role', 'admin')

    if (admins) {
      for (const admin of admins) {
        await supabaseAdmin.from('notifications').insert({
          user_id: admin.id,
          type: 'system',
          title: 'Milestone Completion Submitted',
          body: `The project "${project.title}" has submitted completion evidence for the milestone: "${milestone.title}".`,
          link: `/portal/projects/${projectId}`,
        })
      }
    }

    return NextResponse.json({ success: true, milestone })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 550 })
  }
}
