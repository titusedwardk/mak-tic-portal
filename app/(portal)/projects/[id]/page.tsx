import { redirect } from 'next/navigation'
import { createClient, getUserProfile } from '@/lib/supabase/server'
import ProjectDetailTabs from '@/components/project-detail-tabs'
import { FolderGit, Settings, RefreshCw, ChevronRight } from 'lucide-react'
import Link from 'next/Link'

// Define project stages
const STAGES = [
  'submitted',
  'screening',
  'problem_validation',
  'solution_viability',
  'impact_assessment',
  'prototype_review',
  'commercialization',
  'graduated',
]

const STAGE_LABELS: Record<string, string> = {
  submitted: 'Submitted',
  screening: 'Screening',
  problem_validation: 'Problem Validation',
  solution_viability: 'Solution Viability',
  impact_assessment: 'Impact Assessment',
  prototype_review: 'Prototype Review',
  commercialization: 'Commercialization',
  graduated: 'Graduated',
}

interface PageProps {
  params: Promise<{
    id: string
  }>
}

export default async function ProjectDetailPage({ params }: PageProps) {
  const { id: projectId } = await params
  const supabase = await createClient()

  // 1. Get user and profile
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    redirect('/login')
  }

  const profile = await getUserProfile()
  if (!profile) return null

  // 2. Fetch project details
  const { data: project, error: projectError } = await supabase
    .from('projects')
    .select('*')
    .eq('id', projectId)
    .single()

  if (projectError || !project) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <h4 className="text-md font-bold text-white">Project Not Found</h4>
        <p className="text-xs text-slate-500 mt-2">The project link is invalid or you do not have permission.</p>
        <Link href="/portal/dashboard" className="text-blue-450 hover:underline mt-4 text-xs font-bold">Back to Dashboard</Link>
      </div>
    )
  }

  // 3. Fetch members
  const { data: members } = await supabase
    .from('project_members')
    .select('*, profiles(full_name, email, role)')
    .eq('project_id', projectId)

  // 4. Fetch files
  const { data: files } = await supabase
    .from('project_files')
    .select('*')
    .eq('project_id', projectId)
    .order('created_at', { ascending: false })

  // 5. Fetch milestones
  const { data: milestones } = await supabase
    .from('project_milestones')
    .select('*')
    .eq('project_id', projectId)
    .order('due_date', { ascending: true })

  // 6. Fetch reviews
  const { data: reviews } = await supabase
    .from('stage_gate_reviews')
    .select('*, reviewer:profiles(full_name)')
    .eq('project_id', projectId)
    .order('submitted_at', { ascending: false })

  // 7. Fetch mentor assignments and sessions
  const { data: mentorAssignment } = await supabase
    .from('mentor_assignments')
    .select('*, mentor:profiles(full_name, email)')
    .eq('project_id', projectId)
    .eq('status', 'active')
    .maybeSingle()

  let mentorSessions: any[] = []
  if (mentorAssignment) {
    const { data: sessions } = await supabase
      .from('mentor_sessions')
      .select('*')
      .eq('assignment_id', mentorAssignment.id)
      .order('scheduled_at', { ascending: false })
    mentorSessions = sessions || []
  }

  const isAdmin = ['admin', 'reviewer'].includes(profile.role)
  const currentStageIndex = STAGES.indexOf(project.stage)

  // Admin advancement action function (called from clients using fetch)
  // We can include simple buttons in this page, and use Client action elements inside details.
  
  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header Info */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-800/80 pb-4">
        <div>
          <div className="flex items-center gap-2 text-xs text-slate-500 font-semibold mb-1">
            <Link href="/portal/projects" className="hover:underline">Projects</Link>
            <ChevronRight className="h-3 w-3" />
            <span>Detail</span>
          </div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <FolderGit className="h-5 w-5 text-blue-400" />
            {project.title}
          </h2>
        </div>

        {/* Admin controls */}
        {isAdmin && (
          <div className="flex gap-2">
            {/* Advance Stage button */}
            {currentStageIndex < STAGES.length - 1 && (
              <form
                action={async () => {
                  'use server'
                  // Import admin client to bypass RLS, update stage
                  const { createAdminClient } = await import('@/lib/supabase/server')
                  const admin = createAdminClient()
                  
                  const nextStage = STAGES[currentStageIndex + 1]
                  
                  // Update stage in database
                  await admin
                    .from('projects')
                    .update({ stage: nextStage })
                    .eq('id', projectId)
                  
                  // Redirect/reload
                  redirect(`/portal/projects/${projectId}`)
                }}
              >
                <button
                  type="submit"
                  className="bg-blue-650 hover:bg-blue-600 text-white rounded-lg px-4 py-2 text-xs font-bold shadow-md cursor-pointer flex items-center gap-1.5 transition-all"
                >
                  <Settings className="h-4 w-4" />
                  Advance Gate: {STAGE_LABELS[STAGES[currentStageIndex + 1]]}
                </button>
              </form>
            )}

            {/* Re-run AI Scorer */}
            <form
              action={async () => {
                'use server'
                // Trigger AI Scorer endpoint via fetch
                const headers = new Headers()
                headers.set('Content-Type', 'application/json')
                
                await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL?.replace('.co', '.co')}/api/ai/score-project`, {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ projectId }),
                }).catch(console.error)

                redirect(`/portal/projects/${projectId}`)
              }}
            >
              <button
                type="submit"
                className="border border-slate-750 hover:bg-slate-800 text-slate-300 rounded-lg px-3 py-2 text-xs font-bold cursor-pointer flex items-center gap-1 transition-all"
              >
                <RefreshCw className="h-3.5 w-3.5" />
                Re-Score AI
              </button>
            </form>
          </div>
        )}
      </div>

      {/* Stepper bar */}
      <div className="bg-slate-900/40 border border-slate-800/80 rounded-2xl p-5 shadow-md">
        <div className="w-full flex items-center justify-between relative px-4">
          <div className="absolute top-[18px] left-[5%] right-[5%] h-0.5 bg-slate-800 -z-10" />
          <div
            className="absolute top-[18px] left-[5%] h-0.5 bg-gradient-to-r from-blue-600 to-amber-500 -z-10 transition-all duration-300"
            style={{
              width: currentStageIndex <= 0 ? '0%' : `${(currentStageIndex / (STAGES.length - 1)) * 90}%`,
            }}
          />

          {STAGES.map((stg, idx) => {
            const completed = idx < currentStageIndex
            const current = idx === currentStageIndex
            return (
              <div key={stg} className="flex flex-col items-center text-center w-24 relative">
                <div
                  className={`h-9 w-9 rounded-full flex items-center justify-center font-bold text-xs border transition-all ${
                    completed
                      ? 'bg-blue-600 border-blue-500 text-white'
                      : current
                      ? 'bg-slate-950 border-amber-500 text-amber-400 ring-2 ring-amber-500/20 shadow-amber-500/10'
                      : 'bg-slate-950 border-slate-800 text-slate-500'
                  }`}
                >
                  {idx + 1}
                </div>
                <span
                  className={`text-[10px] font-semibold mt-2.5 truncate w-full ${
                    current ? 'text-amber-400 font-bold' : completed ? 'text-slate-350' : 'text-slate-650'
                  }`}
                >
                  {STAGE_LABELS[stg]}
                </span>
              </div>
            )
          })}
        </div>
      </div>

      {/* Interactive Tabs */}
      <ProjectDetailTabs
        project={project}
        members={members || []}
        files={files || []}
        milestones={milestones || []}
        reviews={reviews || []}
        mentorAssignment={mentorAssignment}
        mentorSessions={mentorSessions}
        currentUser={{ id: user.id, role: profile.role }}
      />
    </div>
  )
}
