import { redirect } from 'next/navigation'
import { createClient, getUserProfile } from '@/lib/supabase/server'
import Link from 'next/link'
import { BarChart3, ChevronRight, AlertTriangle, Sparkles, Scale } from 'lucide-react'

export default async function AdminScoringPage() {
  const supabase = await createClient()

  // 1. Authenticate & authorize user
  const profile = await getUserProfile()
  if (!profile || !['admin', 'reviewer'].includes(profile.role)) {
    redirect('/portal/dashboard')
  }

  // 2. Fetch projects and their reviews
  const { data: projectsData, error } = await supabase
    .from('projects')
    .select('*, profiles(full_name), stage_gate_reviews(*)')
    .order('created_at', { ascending: false })

  const projects = projectsData || []

  // Helper to compute average human score out of 100
  const getHumanAvg = (reviews: any[]) => {
    const humanReviews = reviews.filter((r) => !r.is_ai_review)
    if (humanReviews.length === 0) return null

    let total = 0
    humanReviews.forEach((r) => {
      const sum = 
        (r.score_impact || 0) + 
        (r.score_feasibility || 0) + 
        (r.score_team || 0) + 
        (r.score_innovation || 0) + 
        (r.score_market || 0)
      total += sum * 2 // map 0-50 sum to 0-100 scale
    })

    return Math.round((total / humanReviews.length) * 10) / 10
  }

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="flex justify-between items-center border-b border-slate-800/80 pb-4">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-blue-450" />
            AI vs Human Scoring Calibration
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Analyze delta gaps between automated pre-evaluations and reviewer scores
          </p>
        </div>
      </div>

      {/* Info Warning card */}
      <div className="flex items-start gap-3.5 bg-slate-900 border border-slate-850 p-4 rounded-xl max-w-3xl text-xs text-slate-350 leading-relaxed">
        <Scale className="h-5 w-5 shrink-0 text-amber-500 mt-0.5" />
        <div>
          <strong className="text-slate-200 block mb-1">Understanding Calibration:</strong>
          Our Gemini Scorer evaluates projects on a 0-100 scale. Human reviews score 5 dimensions (Impact, Feasibility, Team, Innovation, Market) from 1 to 10. The sum is multiplied by 2 to align both metrics. Gaps (Delta) greater than 15 points suggest that the AI model needs prompts refinement or that reviewer rubrics need alignment.
        </div>
      </div>

      {/* Table */}
      <div className="bg-slate-900/40 border border-slate-800 rounded-2xl overflow-hidden shadow-lg">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-950/80 border-b border-slate-800 text-slate-400 font-bold uppercase tracking-wider">
                <th className="p-4">Project Title</th>
                <th className="p-4 text-center">AI Score</th>
                <th className="p-4 text-center">Human Avg</th>
                <th className="p-4 text-center">Score Delta</th>
                <th className="p-4">SDG Tags</th>
                <th className="p-4">Track</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/50 text-slate-300">
              {projects.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-slate-500 font-semibold italic">
                    No scored projects available
                  </td>
                </tr>
              ) : (
                projects.map((proj) => {
                  const humanAvg = getHumanAvg(proj.stage_gate_reviews || [])
                  const delta = proj.ai_score !== null && humanAvg !== null 
                    ? Math.round(proj.ai_score - humanAvg) 
                    : null
                  
                  // Score color class
                  const aiScoreClass = proj.ai_score === null 
                    ? 'text-slate-500' 
                    : proj.ai_score >= 70 
                    ? 'text-emerald-400 font-bold' 
                    : proj.ai_score >= 40 
                    ? 'text-amber-400 font-bold' 
                    : 'text-red-400 font-bold'

                  const deltaClass = delta === null 
                    ? 'text-slate-500' 
                    : Math.abs(delta) > 15 
                    ? 'text-red-400 font-extrabold bg-red-950/20 border border-red-900/40 px-2 py-0.5 rounded' 
                    : 'text-emerald-400 font-semibold'

                  return (
                    <tr key={proj.id} className="hover:bg-slate-950/30 transition-colors">
                      <td className="p-4 font-bold text-white max-w-xs truncate">
                        {proj.title}
                      </td>
                      <td className={`p-4 text-center ${aiScoreClass}`}>
                        {proj.ai_score !== null ? Math.round(proj.ai_score) : '—'}
                      </td>
                      <td className="p-4 text-center font-semibold">
                        {humanAvg !== null ? humanAvg : '—'}
                      </td>
                      <td className="p-4 text-center">
                        {delta !== null ? (
                          <span className={deltaClass}>{delta > 0 ? `+${delta}` : delta}</span>
                        ) : (
                          <span className="text-slate-650">—</span>
                        )}
                      </td>
                      <td className="p-4">
                        <div className="flex gap-1 flex-wrap">
                          {proj.sdg_tags && proj.sdg_tags.length > 0 ? (
                            proj.sdg_tags.slice(0, 3).map((sdg: number) => (
                              <span
                                key={sdg}
                                className="h-4.5 w-4.5 rounded bg-blue-900/30 text-[9px] font-extrabold text-blue-300 flex items-center justify-center border border-blue-900/40"
                              >
                                {sdg}
                              </span>
                            ))
                          ) : (
                            <span className="text-slate-600">None</span>
                          )}
                          {proj.sdg_tags && proj.sdg_tags.length > 3 && (
                            <span className="text-[10px] text-slate-500 self-center font-bold">+{proj.sdg_tags.length - 3}</span>
                          )}
                        </div>
                      </td>
                      <td className="p-4 capitalize">
                        {proj.track.replace('_', ' ')}
                      </td>
                      <td className="p-4 text-right">
                        <Link
                          href={`/portal/projects/${proj.id}`}
                          className="inline-flex items-center gap-1 text-blue-450 hover:underline hover:text-blue-400 font-bold"
                        >
                          Calibrate <ChevronRight className="h-3 w-3" />
                        </Link>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
