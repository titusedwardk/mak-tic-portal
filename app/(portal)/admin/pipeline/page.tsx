import { redirect } from 'next/navigation'
import { createClient, getUserProfile } from '@/lib/supabase/server'
import Link from 'next/link'
import { 
  Kanban, 
  ChevronRight, 
  ArrowRight, 
  ArrowLeft, 
  SlidersHorizontal, 
  User, 
  TrendingUp, 
  Star,
  Activity
} from 'lucide-react'

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
  searchParams: Promise<{
    track?: string
  }>
}

export default async function AdminPipelinePage({ searchParams }: PageProps) {
  const params = await searchParams
  const trackFilter = params.track || 'all'

  const supabase = await createClient()

  // 1. Authenticate & authorize user
  const profile = await getUserProfile()
  if (!profile || !['admin', 'reviewer'].includes(profile.role)) {
    redirect('/portal/dashboard')
  }

  // 2. Fetch projects
  let query = supabase
    .from('projects')
    .select('*, profiles(full_name)')
    .order('updated_at', { ascending: false })

  if (trackFilter !== 'all') {
    query = query.eq('track', trackFilter)
  }

  const { data: projects } = await query
  const projectList = projects || []

  // 3. Server action to advance project stage
  async function updateProjectStage(projectId: string, newStage: string) {
    'use server'
    const { createAdminClient } = await import('@/lib/supabase/server')
    const admin = createAdminClient()
    await admin.from('projects').update({ stage: newStage }).eq('id', projectId)
    redirect(`/portal/admin/pipeline?track=${trackFilter}`)
  }

  // Group projects by stage
  const columns: Record<string, typeof projectList> = {}
  STAGES.forEach((stage) => {
    columns[stage] = projectList.filter((p) => p.stage === stage)
  })

  // Conversion Funnel metrics
  const totalCount = projectList.length
  const graduatedCount = projectList.filter((p) => p.stage === 'graduated').length
  const activeCount = projectList.filter((p) => p.stage !== 'graduated' && p.stage !== 'archived').length

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="flex justify-between items-center border-b border-slate-800/80 pb-4">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Kanban className="h-5 w-5 text-blue-450" />
            Stage-Gate Pipeline Board
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Drag/move projects through gate phases and review evaluations
          </p>
        </div>
      </div>

      {/* Analytics widgets row */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-slate-900 border border-slate-800/80 rounded-xl p-4 flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Total Proposals</span>
            <span className="text-xl font-black text-white block mt-1">{totalCount}</span>
          </div>
          <Activity className="h-8 w-8 text-blue-500/20" />
        </div>
        <div className="bg-slate-900 border border-slate-800/80 rounded-xl p-4 flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Active Funnel</span>
            <span className="text-xl font-black text-amber-500 block mt-1">{activeCount}</span>
          </div>
          <TrendingUp className="h-8 w-8 text-amber-500/20" />
        </div>
        <div className="bg-slate-900 border border-slate-800/80 rounded-xl p-4 flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Graduated</span>
            <span className="text-xl font-black text-emerald-500 block mt-1">{graduatedCount}</span>
          </div>
          <Star className="h-8 w-8 text-emerald-500/20" />
        </div>
        <div className="bg-slate-900 border border-slate-800/80 rounded-xl p-4 flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Funnel Efficiency</span>
            <span className="text-xl font-black text-purple-400 block mt-1">
              {totalCount > 0 ? Math.round((graduatedCount / totalCount) * 100) : 0}%
            </span>
          </div>
          <TrendingUp className="h-8 w-8 text-purple-550/20" />
        </div>
      </div>

      {/* Track filters */}
      <div className="flex items-center gap-3 bg-slate-905 border border-slate-800/80 p-3 rounded-xl">
        <span className="text-xs font-bold text-slate-400 flex items-center gap-1.5">
          <SlidersHorizontal className="h-3.5 w-3.5 text-slate-550" /> Filter Track:
        </span>
        <div className="flex bg-slate-950 border border-slate-800 p-0.5 rounded-lg text-[10px] font-semibold text-slate-400">
          {['all', 'early_idea', 'prototype', 'market_ready', 'ip_only', 'challenge_response'].map((t) => (
            <Link
              key={t}
              href={`/portal/admin/pipeline?track=${t}`}
              className={`px-3 py-1 rounded-md capitalize ${
                trackFilter === t ? 'bg-slate-800 text-white shadow-sm' : 'hover:text-slate-200'
              }`}
            >
              {t.replace('_', ' ')}
            </Link>
          ))}
        </div>
      </div>

      {/* Kanban columns view */}
      <div className="flex gap-4 overflow-x-auto pb-6 select-none scrollbar-thin">
        {STAGES.map((stage) => {
          const colProjects = columns[stage] || []
          const stageIndex = STAGES.indexOf(stage)
          return (
            <div
              key={stage}
              className="w-72 bg-slate-900/35 border border-slate-800/80 rounded-2xl p-4 flex flex-col shrink-0 min-h-[450px]"
            >
              {/* Header column */}
              <div className="flex justify-between items-center mb-4 border-b border-slate-800 pb-2">
                <h3 className="text-xs font-bold text-slate-200 truncate pr-2 uppercase tracking-wide">
                  {STAGE_LABELS[stage]}
                </h3>
                <span className="bg-slate-800 text-slate-400 text-[10px] font-bold px-2 py-0.5 rounded-full">
                  {colProjects.length}
                </span>
              </div>

              {/* Cards stack */}
              <div className="space-y-3 flex-1 overflow-y-auto">
                {colProjects.length === 0 ? (
                  <div className="text-center py-10 text-[10px] text-slate-600 font-semibold italic">Empty</div>
                ) : (
                  colProjects.map((proj) => (
                    <div
                      key={proj.id}
                      className="bg-slate-900 border border-slate-800 rounded-xl p-3.5 hover:border-slate-700 transition-all space-y-3 shadow-md"
                    >
                      <div className="flex justify-between items-start">
                        <span className="text-[9px] font-bold text-slate-500 capitalize leading-none">
                          {proj.track.replace('_', ' ')}
                        </span>
                        {proj.ai_score !== null && (
                          <span className="text-[10px] font-extrabold text-amber-400 leading-none">
                            AI: {Math.round(proj.ai_score)}
                          </span>
                        )}
                      </div>
                      
                      <h4 className="text-xs font-bold text-slate-100 line-clamp-2 leading-snug">
                        {proj.title}
                      </h4>
                      
                      <div className="flex items-center gap-1.5 text-[9px] text-slate-450 border-t border-slate-850 pt-2">
                        <User className="h-3 w-3 text-slate-500" />
                        <span className="truncate">Lead: {proj.profiles?.full_name}</span>
                      </div>

                      {/* Manual Stage Shifting Buttons */}
                      <div className="flex justify-between items-center pt-1 mt-1 border-t border-slate-850/50">
                        {stageIndex > 0 ? (
                          <form action={updateProjectStage.bind(null, proj.id, STAGES[stageIndex - 1])}>
                            <button
                              type="submit"
                              title="Move Back"
                              className="p-1 rounded bg-slate-950 text-slate-500 hover:text-white border border-slate-850 cursor-pointer"
                            >
                              <ArrowLeft className="h-3 w-3" />
                            </button>
                          </form>
                        ) : (
                          <div className="w-5" />
                        )}

                        <Link
                          href={`/portal/projects/${proj.id}`}
                          className="text-[9px] text-blue-450 font-bold hover:underline flex items-center"
                        >
                          Details <ChevronRight className="h-3 w-3" />
                        </Link>

                        {stageIndex < STAGES.length - 1 ? (
                          <form action={updateProjectStage.bind(null, proj.id, STAGES[stageIndex + 1])}>
                            <button
                              type="submit"
                              title="Move Forward"
                              className="p-1 rounded bg-slate-950 text-slate-500 hover:text-white border border-slate-850 cursor-pointer"
                            >
                              <ArrowRight className="h-3 w-3" />
                            </button>
                          </form>
                        ) : (
                          <div className="w-5" />
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
