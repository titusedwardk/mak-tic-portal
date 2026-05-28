import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Plus, FolderGit, LayoutGrid, Calendar, ChevronRight, SlidersHorizontal, Sparkles } from 'lucide-react'

// Stage helper mapping
const STAGE_LABELS: Record<string, string> = {
  submitted: 'Submitted',
  screening: 'Screening',
  problem_validation: 'Problem Validation',
  solution_viability: 'Solution Viability',
  impact_assessment: 'Impact Assessment',
  prototype_review: 'Prototype Review',
  commercialization: 'Commercialization',
  graduated: 'Graduated',
  archived: 'Archived',
}

interface PageProps {
  searchParams: Promise<{
    track?: string
    stage?: string
  }>
}

export default async function ProjectsPage({ searchParams }: PageProps) {
  const params = await searchParams
  const trackFilter = params.track || 'all'
  const stageFilter = params.stage || 'all'

  const supabase = await createClient()

  // 1. Get user session
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  // 2. Build query
  let query = supabase
    .from('projects')
    .select('*')
    .eq('owner_id', user.id)
    .order('created_at', { ascending: false })

  if (trackFilter !== 'all') {
    query = query.eq('track', trackFilter)
  }
  if (stageFilter !== 'all') {
    query = query.eq('stage', stageFilter)
  }

  const { data: projects } = await query

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header section */}
      <div className="flex justify-between items-center border-b border-slate-800/80 pb-4">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <FolderGit className="h-5 w-5 text-blue-400" />
            My Innovation Projects
          </h2>
          <p className="text-xs text-slate-400 mt-1">Manage and track your active stage-gate submissions</p>
        </div>
        <Link
          href="/portal/projects/new"
          className="bg-blue-600 hover:bg-blue-500 text-white rounded-lg px-4 py-2 font-semibold text-xs flex items-center gap-1.5 shadow-md active:scale-95 transition-all cursor-pointer"
        >
          <Plus className="h-4 w-4" /> Create Project
        </Link>
      </div>

      {/* Filters row */}
      <div className="flex flex-wrap gap-4 items-center justify-between bg-slate-900/40 border border-slate-800/80 p-4 rounded-xl">
        <div className="flex items-center gap-2 text-xs font-semibold text-slate-400">
          <SlidersHorizontal className="h-4 w-4" />
          Filters:
        </div>
        <div className="flex flex-wrap gap-3">
          {/* Track Filter */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500">Track:</span>
            <div className="flex bg-slate-950 border border-slate-800 p-0.5 rounded-lg text-[11px] font-semibold text-slate-400">
              {['all', 'early_idea', 'prototype', 'market_ready', 'ip_only'].map((track) => (
                <Link
                  key={track}
                  href={`/portal/projects?track=${track}&stage=${stageFilter}`}
                  className={`px-2 py-1 rounded-md capitalize ${
                    trackFilter === track ? 'bg-slate-800 text-white shadow-sm' : 'hover:text-slate-200'
                  }`}
                >
                  {track.replace('_', ' ')}
                </Link>
              ))}
            </div>
          </div>

          {/* Stage Filter */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500">Stage:</span>
            <div className="flex bg-slate-950 border border-slate-800 p-0.5 rounded-lg text-[11px] font-semibold text-slate-400">
              {['all', 'submitted', 'screening', 'problem_validation', 'graduated'].map((stage) => (
                <Link
                  key={stage}
                  href={`/portal/projects?track=${trackFilter}&stage=${stage}`}
                  className={`px-2.5 py-1 rounded-md capitalize ${
                    stageFilter === stage ? 'bg-slate-800 text-white shadow-sm' : 'hover:text-slate-200'
                  }`}
                >
                  {stage.replace('_', ' ')}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* List content */}
      {!projects || projects.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center bg-slate-900/30 border border-slate-850 rounded-2xl">
          <FolderGit className="h-12 w-12 text-slate-700 mb-2" />
          <h4 className="text-md font-bold text-slate-450">No submissions found</h4>
          <p className="text-xs text-slate-500 mt-1 max-w-sm leading-relaxed">
            There are no projects that match the selected filters. Click button above or change your filters.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects.map((proj) => (
            <div
              key={proj.id}
              className="bg-slate-900/40 border border-slate-800 hover:border-slate-750 hover:bg-slate-900/70 rounded-2xl p-5 shadow-md flex flex-col justify-between group transition-all"
            >
              <div>
                <div className="flex items-center justify-between mb-4">
                  <span className="bg-slate-950 border border-slate-800 text-slate-400 text-[10px] font-bold tracking-wider uppercase px-2 py-0.5 rounded-md">
                    {proj.track.replace('_', ' ')}
                  </span>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${
                    proj.stage === 'graduated' 
                      ? 'bg-emerald-950/40 border-emerald-900/50 text-emerald-400' 
                      : proj.stage === 'submitted'
                      ? 'bg-slate-950 border-slate-800 text-slate-400'
                      : 'bg-blue-950/40 border-blue-900/50 text-blue-450'
                  }`}>
                    {STAGE_LABELS[proj.stage]}
                  </span>
                </div>

                <h3 className="text-sm font-bold text-white group-hover:text-amber-400 transition-colors line-clamp-1">
                  {proj.title}
                </h3>
                
                {/* description preview */}
                <p className="text-xs text-slate-450 line-clamp-2 mt-2 leading-relaxed h-8">
                  {proj.description.replace(/<[^>]*>/g, '')}
                </p>

                {/* SDG badges */}
                {proj.sdg_tags && proj.sdg_tags.length > 0 && (
                  <div className="flex items-center gap-1.5 mt-4">
                    <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">SDGs:</span>
                    <div className="flex flex-wrap gap-1">
                      {proj.sdg_tags.slice(0, 4).map((sdg: number) => (
                        <span
                          key={sdg}
                          className="h-5 w-5 rounded bg-blue-900/30 text-[10px] font-extrabold text-blue-300 flex items-center justify-center border border-blue-900/40"
                          title={`SDG ${sdg}`}
                        >
                          {sdg}
                        </span>
                      ))}
                      {proj.sdg_tags.length > 4 && (
                        <span className="text-[10px] text-slate-500 self-center font-bold">+{proj.sdg_tags.length - 4}</span>
                      )}
                    </div>
                  </div>
                )}
              </div>

              <div className="pt-5 border-t border-slate-800/60 mt-5 flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-[10px] text-slate-500">
                  <Calendar className="h-3.5 w-3.5" />
                  <span>{new Date(proj.created_at).toLocaleDateString()}</span>
                </div>
                
                {proj.ai_score !== null ? (
                  <div className="flex items-center gap-2">
                    <div className="text-right">
                      <span className="text-[9px] font-bold text-slate-500 block">AI Score</span>
                      <span className="text-xs font-black text-amber-450 block leading-none">{Math.round(proj.ai_score)}</span>
                    </div>
                    <Link
                      href={`/portal/projects/${proj.id}`}
                      className="p-1 rounded-lg bg-slate-800 text-slate-300 hover:text-white transition-all"
                    >
                      <ChevronRight className="h-4.5 w-4.5" />
                    </Link>
                  </div>
                ) : (
                  <Link
                    href={`/portal/projects/${proj.id}`}
                    className="flex items-center gap-1.5 text-xs text-blue-400 font-bold hover:underline"
                  >
                    View Details
                    <ChevronRight className="h-3.5 w-3.5" />
                  </Link>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
