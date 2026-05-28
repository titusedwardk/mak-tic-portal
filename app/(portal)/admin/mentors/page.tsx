import { redirect } from 'next/navigation'
import { createClient, getUserProfile } from '@/lib/supabase/server'
import { runMentorMatcher } from '@/lib/ai/gemini-agents'
import { Users, User, Check, AlertCircle, Award, Compass, Star } from 'lucide-react'
import Link from 'next/Link'

export default async function AdminMentorsPage() {
  const supabase = await createClient()

  // 1. Authenticate & authorize user
  const profile = await getUserProfile()
  if (!profile || !['admin', 'reviewer'].includes(profile.role)) {
    redirect('/portal/dashboard')
  }

  // 2. Fetch all mentors and profiles
  const { data: mentorsData } = await supabase
    .from('profiles')
    .select('*, mentor_profiles(*)')
    .eq('role', 'mentor')

  const mentors = mentorsData || []

  // 3. Fetch unmatched active projects (stage NOT in graduated/archived, and no active assignments)
  const { data: activeAssignments } = await supabase
    .from('mentor_assignments')
    .select('project_id')
    .eq('status', 'active')

  const activeAssignedIds = activeAssignments?.map((a) => a.project_id) || []

  let projectsQuery = supabase
    .from('projects')
    .select('id, title, track, sector')
    .not('stage', 'in', '("graduated","archived")')

  if (activeAssignedIds.length > 0) {
    projectsQuery = projectsQuery.not('id', 'in', `(${activeAssignedIds.map(id => `"${id}"`).join(',')})`)
  }

  const { data: unmatchedProjects } = await projectsQuery
  const projectsToMatch = unmatchedProjects || []

  // 4. Generate AI proposed matches
  let proposedMatches: any[] = []
  if (projectsToMatch.length > 0 && mentors.length > 0) {
    try {
      // Structure parameters for Gemini agent
      const pData = projectsToMatch.map((p) => ({
        id: p.id,
        title: p.title,
        track: p.track,
        sectors: p.sector || [],
      }))
      
      const mData = mentors.map((m) => ({
        id: m.id,
        name: m.full_name,
        expertise_sectors: m.mentor_profiles?.expertise_sectors || [],
        bio_extended: m.mentor_profiles?.bio_extended || '',
      }))

      // Run AI matcher agent on the first unmatched project to avoid token overflow, or match general list
      // For demonstration, let's query matches for the first unmatched project
      const matchResult = await runMentorMatcher(pData[0], mData)
      proposedMatches = matchResult.matches.map((match) => {
        const resolvedProject = projectsToMatch.find((p) => p.id === match.project_id)
        const resolvedMentor = mentors.find((m) => m.id === match.mentor_id)
        return {
          ...match,
          project_title: resolvedProject?.title || 'Unknown Project',
          mentor_name: resolvedMentor?.full_name || 'Unknown Mentor',
        }
      })
    } catch (err) {
      console.error('Failed to run AI Matcher:', err)
    }
  }

  // 5. Server action to approve AI match
  async function approveMatch(projectId: string, mentorId: string) {
    'use server'
    const { createAdminClient } = await import('@/lib/supabase/server')
    const admin = createAdminClient()

    // Create assignment
    const { data: assignment, error: assignError } = await admin
      .from('mentor_assignments')
      .insert({
        project_id: projectId,
        mentor_id: mentorId,
        status: 'active',
      })
      .select()
      .single()

    if (assignError) {
      console.error('Failed to approve match:', assignError)
      return
    }

    // Get project title to send notifications
    const { data: project } = await admin
      .from('projects')
      .select('title, owner_id')
      .eq('id', projectId)
      .single()

    if (project) {
      // Notify innovator
      await admin.from('notifications').insert({
        user_id: project.owner_id,
        type: 'mentor_matched',
        title: 'Mentor Matched!',
        body: `Your project "${project.title}" has been assigned a new mentor. Visit the Mentorship tab for details.`,
        link: `/portal/projects/${projectId}`,
      })

      // Notify mentor
      await admin.from('notifications').insert({
        user_id: mentorId,
        type: 'mentor_matched',
        title: 'New Mentoring Assignment',
        body: `You have been assigned to mentor the project: "${project.title}".`,
        link: `/portal/projects/${projectId}`,
      })
    }

    redirect('/portal/admin/mentors')
  }

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Header */}
      <div className="flex justify-between items-center border-b border-slate-800/80 pb-4">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Users className="h-5 w-5 text-blue-450" />
            Mentor Matcher & Directory
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Browse mentor records and approve AI compatibility recommendations
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        
        {/* Active Mentors list (Span 2) */}
        <div className="xl:col-span-2 space-y-6">
          <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-6">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-6">Active Mentors Directory</h3>
            
            {mentors.length === 0 ? (
              <div className="text-center py-12 border border-dashed border-slate-800 rounded-xl">
                <User className="h-10 w-10 text-slate-700 mx-auto mb-2" />
                <span className="text-xs font-semibold text-slate-400 block">No mentors registered</span>
                <span className="text-[10px] text-slate-500">Change user roles to mentor to populate directory.</span>
              </div>
            ) : (
              <div className="space-y-4">
                {mentors.map((m) => (
                  <div key={m.id} className="p-4 bg-slate-950/40 border border-slate-850 rounded-xl flex flex-col md:flex-row justify-between gap-4">
                    <div className="flex items-start gap-3.5">
                      <div className="h-10 w-10 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center font-bold text-slate-300">
                        {m.full_name.charAt(0)}
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-white">{m.full_name}</h4>
                        <p className="text-[10px] text-slate-500">{m.email}</p>
                        
                        <div className="flex flex-wrap gap-1 mt-2.5">
                          {m.mentor_profiles?.expertise_sectors?.map((s: string) => (
                            <span key={s} className="bg-slate-900 border border-slate-800 text-slate-400 text-[9px] uppercase tracking-wider px-2 py-0.5 rounded">
                              {s}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-6 shrink-0 md:border-l border-slate-850 md:pl-6 text-[10px] text-slate-450">
                      <div>
                        <span className="text-slate-500 uppercase tracking-widest block font-bold">Mentees Limit</span>
                        <span className="text-slate-200 font-extrabold block mt-0.5">
                          {m.mentor_profiles?.current_mentees || 0} / {m.mentor_profiles?.max_mentees || 5}
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-500 uppercase tracking-widest block font-bold">Rating</span>
                        <span className="text-amber-400 font-extrabold flex items-center gap-0.5 mt-0.5">
                          <Star className="h-3.5 w-3.5 fill-amber-500 text-amber-500" /> {m.mentor_profiles?.rating_avg || '5.0'}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* AI Proposals Match panel */}
        <div className="space-y-6">
          <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 flex flex-col min-h-[300px]">
            <div className="flex items-center gap-2 mb-4">
              <Award className="h-5 w-5 text-amber-400" />
              <h3 className="text-xs font-bold text-white uppercase tracking-wider">AI Pairing Matcher</h3>
            </div>

            {proposedMatches.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center text-center p-6 border border-dashed border-slate-800 rounded-xl">
                <Compass className="h-8 w-8 text-slate-700 mb-2" />
                <span className="text-xs font-bold text-slate-400">No matches to propose</span>
                <span className="text-[10px] text-slate-500 mt-1 max-w-[200px]">
                  All active projects are matched, or no mentors are available.
                </span>
              </div>
            ) : (
              <div className="space-y-4 flex-1">
                <div className="flex items-start gap-2 bg-blue-950/20 border border-blue-900/40 text-[10px] text-blue-300 rounded-lg p-2.5 mb-2">
                  <AlertCircle className="h-4.5 w-4.5 shrink-0 text-blue-400" />
                  We analyzed sectors, tracks, and mentor workloads. Review compatibilities below.
                </div>

                {proposedMatches.map((match) => (
                  <div key={`${match.project_id}-${match.mentor_id}`} className="p-3.5 bg-slate-950 border border-slate-850 rounded-xl space-y-2">
                    <div className="flex justify-between items-start">
                      <h4 className="text-xs font-bold text-slate-100 line-clamp-1 pr-2">{match.project_title}</h4>
                      <span className="text-[10px] font-extrabold text-amber-400">{match.compatibility_score}% Match</span>
                    </div>
                    <p className="text-[10px] text-slate-500 leading-normal">Proposed Mentor: <strong className="text-slate-350">{match.mentor_name}</strong></p>
                    <p className="text-[10px] text-slate-400 italic">"{match.reasoning}"</p>
                    
                    <form action={approveMatch.bind(null, match.project_id, match.mentor_id)} className="pt-2 border-t border-slate-900 mt-2">
                      <button
                        type="submit"
                        className="w-full bg-blue-650 hover:bg-blue-600 text-white rounded py-1.5 font-bold text-[10px] flex items-center justify-center gap-1 cursor-pointer transition-all"
                      >
                        <Check className="h-3.5 w-3.5" /> Approve Matching Pairing
                      </button>
                    </form>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  )
}
