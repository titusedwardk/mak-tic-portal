import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { 
  FolderGit, 
  Clock, 
  Bell, 
  ArrowRight, 
  Plus, 
  ChevronRight, 
  Calendar, 
  BadgeAlert,
  GraduationCap,
  CalendarDays,
  CheckCircle2,
  FileText
} from 'lucide-react'

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

export default async function DashboardPage() {
  const supabase = await createClient()

  // 1. Get user session
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  // 2. Fetch projects
  const { data: projects } = await supabase
    .from('projects')
    .select('*')
    .eq('owner_id', user.id)
    .order('updated_at', { ascending: false })

  // 3. Fetch incomplete milestones
  const { data: milestones } = await supabase
    .from('project_milestones')
    .select('*, projects!inner(owner_id, title)')
    .eq('projects.owner_id', user.id)
    .neq('status', 'completed')
    .order('due_date', { ascending: true })
    .limit(3)

  // 4. Fetch recent notifications
  const { data: notifications } = await supabase
    .from('notifications')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(3)

  // Get active project (most recently updated)
  const activeProject = projects?.[0]
  const currentStageIndex = activeProject ? STAGES.indexOf(activeProject.stage) : -1

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Top Banner / Welcome */}
      <div className="relative overflow-hidden bg-slate-900 border border-slate-800 rounded-2xl p-6 md:p-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-6 shadow-xl">
        <div className="absolute top-0 right-0 w-80 h-80 rounded-full bg-blue-900/10 blur-[80px] pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-60 h-60 rounded-full bg-amber-500/5 blur-[80px] pointer-events-none" />
        
        <div className="relative z-10 max-w-xl">
          <h2 className="text-xl md:text-2xl font-bold text-white mb-2">
            Accelerate your Innovation Journey at Mak-TIC
          </h2>
          <p className="text-sm text-slate-400 leading-relaxed">
            Submit your research, pitch decks, and prototypes. Get matched with expert mentors, undergo structured stage-gate reviews, and unlock funding.
          </p>
        </div>

        <Link
          href="/portal/projects/new"
          className="relative z-10 shrink-0 inline-flex items-center gap-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 px-5 py-3 rounded-xl font-bold text-sm shadow-lg shadow-amber-500/10 active:scale-[0.98] transition-all cursor-pointer"
        >
          <Plus className="h-4.5 w-4.5" />
          Submit New Project
        </Link>
      </div>

      {/* Active Project Stepper Banner */}
      {activeProject && (
        <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6 shadow-lg">
          <div className="flex justify-between items-center mb-6">
            <div>
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Active Project Progress</span>
              <h3 className="text-md font-bold text-white mt-0.5">{activeProject.title}</h3>
            </div>
            <Link
              href={`/portal/projects/${activeProject.id}`}
              className="text-xs text-blue-400 font-semibold hover:underline flex items-center gap-0.5"
            >
              View detail <ChevronRight className="h-3 w-3" />
            </Link>
          </div>

          {/* horizontal stepper progress */}
          <div className="w-full hidden lg:flex items-center justify-between relative mt-2 px-4">
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
                        ? 'bg-blue-600 border-blue-500 text-white shadow-md shadow-blue-500/10'
                        : current
                        ? 'bg-slate-950 border-amber-500 text-amber-400 ring-2 ring-amber-500/20 shadow-md shadow-amber-500/20'
                        : 'bg-slate-950 border-slate-800 text-slate-500'
                    }`}
                  >
                    {idx + 1}
                  </div>
                  <span
                    className={`text-[10px] font-semibold mt-2.5 truncate w-full ${
                      current ? 'text-amber-400 font-bold' : completed ? 'text-slate-300' : 'text-slate-650'
                    }`}
                  >
                    {STAGE_LABELS[stg]}
                  </span>
                </div>
              )
            })}
          </div>

          {/* Simple progress bar for mobile */}
          <div className="lg:hidden space-y-2 mt-2">
            <div className="flex justify-between items-center text-xs font-semibold text-slate-400">
              <span>Stage: {STAGE_LABELS[activeProject.stage]}</span>
              <span>{Math.round(((currentStageIndex + 1) / STAGES.length) * 100)}% Complete</span>
            </div>
            <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-blue-600 to-amber-500 rounded-full transition-all duration-300"
                style={{ width: `${((currentStageIndex + 1) / STAGES.length) * 100}%` }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Main Grid: Projects & Details */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        
        {/* Left Column: My Projects (Span 2) */}
        <div className="xl:col-span-2 space-y-6">
          <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 shadow-lg flex flex-col min-h-[300px]">
            <div className="flex justify-between items-center mb-6">
              <div className="flex items-center gap-2">
                <FolderGit className="h-5 w-5 text-blue-400" />
                <h3 className="text-md font-bold text-white">My Projects</h3>
              </div>
              <Link
                href="/portal/projects"
                className="text-xs text-blue-400 font-semibold hover:underline flex items-center gap-0.5"
              >
                All Projects <ArrowRight className="h-3 w-3" />
              </Link>
            </div>

            {/* List */}
            {!projects || projects.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center text-center p-8 border border-dashed border-slate-800 rounded-xl">
                <FolderGit className="h-10 w-10 text-slate-700 mb-2" />
                <span className="text-sm font-semibold text-slate-400">No projects submitted</span>
                <span className="text-xs text-slate-500 mt-1 max-w-xs leading-relaxed">
                  You haven't submitted any projects yet. Click below to start your application!
                </span>
                <Link
                  href="/portal/projects/new"
                  className="mt-4 bg-slate-800 hover:bg-slate-700 text-white rounded-lg px-4 py-2 text-xs font-semibold"
                >
                  Create Project
                </Link>
              </div>
            ) : (
              <div className="space-y-4 flex-1">
                {projects.slice(0, 3).map((proj) => (
                  <div
                    key={proj.id}
                    className="flex justify-between items-center p-4 bg-slate-950/40 border border-slate-800/80 rounded-xl hover:border-slate-750 hover:bg-slate-950/60 transition-all"
                  >
                    <div className="min-w-0 flex-1 pr-4">
                      <h4 className="text-sm font-bold text-white truncate">{proj.title}</h4>
                      <div className="flex items-center gap-3 mt-1 text-xs text-slate-400">
                        <span className="capitalize">{proj.track.replace('_', ' ')}</span>
                        <span>•</span>
                        <span>{new Date(proj.created_at).toLocaleDateString()}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 shrink-0">
                      <span className="bg-blue-950/65 text-blue-300 border border-blue-800/40 text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-md">
                        {STAGE_LABELS[proj.stage]}
                      </span>
                      {proj.ai_score !== null && (
                        <div className="text-right">
                          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block leading-none">AI Score</span>
                          <span className="text-sm font-extrabold text-amber-400 block mt-0.5">{Math.round(proj.ai_score)}</span>
                        </div>
                      )}
                      <Link
                        href={`/portal/projects/${proj.id}`}
                        className="p-1 text-slate-500 hover:text-white hover:bg-slate-800 rounded transition-colors"
                      >
                        <ChevronRight className="h-5 w-5" />
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Milestones & Quick Info */}
        <div className="space-y-6">
          {/* Milestones Card */}
          <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 shadow-lg">
            <div className="flex items-center gap-2 mb-6">
              <Clock className="h-5 w-5 text-amber-400" />
              <h3 className="text-md font-bold text-white">Upcoming Milestones</h3>
            </div>

            {!milestones || milestones.length === 0 ? (
              <div className="text-center py-8 border border-dashed border-slate-800 rounded-xl">
                <CheckCircle2 className="h-8 w-8 text-slate-700 mx-auto mb-2" />
                <span className="text-xs font-semibold text-slate-400 block">No pending milestones</span>
                <span className="text-[10px] text-slate-500">All of your tasks are up-to-date!</span>
              </div>
            ) : (
              <div className="space-y-4">
                {milestones.map((ms) => (
                  <div key={ms.id} className="p-3 bg-slate-950/40 border border-slate-800/60 rounded-xl">
                    <div className="flex justify-between items-start gap-2">
                      <h4 className="text-xs font-bold text-slate-200 line-clamp-1">{ms.title}</h4>
                      <span className={`text-[9px] font-bold uppercase px-1.5 py-0.5 rounded border shrink-0 ${
                        ms.status === 'overdue' 
                          ? 'bg-red-950/40 border-red-900/50 text-red-400' 
                          : 'bg-amber-950/40 border-amber-900/50 text-amber-450'
                      }`}>
                        {ms.status}
                      </span>
                    </div>
                    <p className="text-[10px] text-slate-500 mt-1 truncate">Project: {ms.projects.title}</p>
                    <div className="flex items-center gap-1 text-[10px] text-slate-400 mt-2">
                      <CalendarDays className="h-3 w-3 text-slate-500" />
                      <span>Due: {new Date(ms.due_date).toLocaleDateString()}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Quick Actions Feed */}
          <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 shadow-lg">
            <h3 className="text-md font-bold text-white mb-4">Quick Resources</h3>
            <div className="grid grid-cols-1 gap-2.5">
              <Link 
                href="/showcase" 
                className="flex items-center gap-3 p-3 bg-slate-950/40 border border-slate-800 hover:border-slate-700 hover:bg-slate-950/60 rounded-xl text-xs font-semibold text-slate-350 hover:text-white transition-all"
              >
                <FolderGit className="h-4.5 w-4.5 text-blue-400" />
                Browse Showcase Projects
              </Link>
              <a 
                href="https://aistudio.google.com/" 
                target="_blank" 
                rel="noreferrer" 
                className="flex items-center gap-3 p-3 bg-slate-950/40 border border-slate-800 hover:border-slate-700 hover:bg-slate-950/60 rounded-xl text-xs font-semibold text-slate-350 hover:text-white transition-all"
              >
                <FileText className="h-4.5 w-4.5 text-amber-400" />
                Google AI Studio Grounding
              </a>
            </div>
          </div>
        </div>

      </div>
    </div>
  )
}
