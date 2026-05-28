import { NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase/server'

export async function GET(request: Request) {
  try {
    const supabase = await createClient()

    // Get current user session
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Fetch projects where user is owner or member
    const { data: projects, error } = await supabase
      .from('projects')
      .select('*')
      .eq('owner_id', user.id)
      .order('created_at', { ascending: false })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ projects })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 550 })
  }
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient()

    // 1. Authenticate user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const {
      title,
      track,
      sectors,
      description,
      problem_statement,
      proposed_solution,
      support_needed,
      team_members,
    } = body

    if (!title || !problem_statement || !proposed_solution) {
      return NextResponse.json(
        { error: 'Missing required fields: title, problem statement, solution' },
        { status: 400 }
      )
    }

    const supabaseAdmin = createAdminClient()

    // 2. Insert project record (running via admin bypass to ensure slug generation and trigger executes cleanly)
    const { data: project, error: projectError } = await supabaseAdmin
      .from('projects')
      .insert({
        title,
        track,
        sector: sectors,
        description,
        problem_statement,
        proposed_solution,
        support_needed,
        owner_id: user.id,
        stage: 'submitted',
        status: 'active',
      })
      .select()
      .single()

    if (projectError || !project) {
      return NextResponse.json({ error: projectError?.message || 'Failed to create project' }, { status: 500 })
    }

    // 3. Add owner as Lead Member in project_members
    const { error: leadMemberError } = await supabaseAdmin
      .from('project_members')
      .insert({
        project_id: project.id,
        user_id: user.id,
        role: 'lead',
      })

    if (leadMemberError) {
      console.error('Failed to create lead member entry:', leadMemberError)
    }

    // 4. Add other team members (by resolving email to profiles where possible)
    if (team_members && Array.isArray(team_members)) {
      for (const member of team_members) {
        // Resolve email to user profile ID
        const { data: resolvedProfile } = await supabaseAdmin
          .from('profiles')
          .select('id')
          .eq('email', member.email)
          .maybeSingle()

        if (resolvedProfile) {
          await supabaseAdmin.from('project_members').insert({
            project_id: project.id,
            user_id: resolvedProfile.id,
            role: member.role || 'member',
          })
        }
        // In full phase we would trigger an email invite for unregistered emails
      }
    }

    // 5. Log activity audit log
    await supabaseAdmin.from('audit_logs').insert({
      actor_id: user.id,
      action: 'project.submit',
      entity_type: 'project',
      entity_id: project.id,
      metadata: { title, track },
    })

    return NextResponse.json({ success: true, project })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 550 })
  }
}
