import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Compass, Award, ExternalLink, ArrowLeft, Star } from 'lucide-react'

// Simple public view of projects
export default async function ShowcasePage() {
  const supabase = await createClient()

  // Fetch all public projects
  const { data: projects } = await supabase
    .from('projects')
    .select('*, profiles(full_name)')
    .eq('is_public', true)
    .order('created_at', { ascending: false })

  const publicProjects = projects || []

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans p-6 md:p-12 relative overflow-hidden">
      {/* Background blobs */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-blue-900/20 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[45%] h-[45%] rounded-full bg-amber-500/5 blur-[150px] pointer-events-none" />

      <div className="max-w-6xl mx-auto space-y-8 relative z-10">
        
        {/* Navigation / Header */}
        <div className="flex justify-between items-center border-b border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <Link href="/portal/dashboard" className="p-1.5 rounded-lg border border-slate-800 hover:bg-slate-850 transition-colors">
              <ArrowLeft className="h-4 w-4" />
            </Link>
            <div>
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <Compass className="h-5 w-5 text-blue-450" />
                Mak-TIC Public Innovation Showcase
              </h2>
              <p className="text-xs text-slate-400 mt-1">Explore ready-to-scale prototypes and projects from Makerere</p>
            </div>
          </div>
          <Link href="/login" className="bg-blue-650 hover:bg-blue-600 text-white rounded-lg px-4 py-2 font-bold text-xs">
            Submit Your Idea
          </Link>
        </div>

        {/* Content grid */}
        {publicProjects.length === 0 ? (
          <div className="text-center py-24 bg-slate-900/30 border border-slate-850 rounded-2xl">
            <Award className="h-12 w-12 text-slate-700 mx-auto mb-2" />
            <h3 className="text-md font-bold text-slate-400">Showcase empty</h3>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto leading-relaxed">
              No projects have been approved for public showcase yet. Creators can toggle the "is_public" field inside their project settings.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {publicProjects.map((proj) => (
              <div key={proj.id} className="bg-slate-900 border border-slate-850 p-6 rounded-2xl flex flex-col justify-between hover:border-slate-750 transition-all">
                <div>
                  <div className="flex justify-between items-center mb-3">
                    <span className="bg-slate-950 border border-slate-800 text-slate-400 text-[10px] font-bold tracking-wider uppercase px-2.5 py-0.5 rounded">
                      {proj.track.replace('_', ' ')}
                    </span>
                    <span className="bg-emerald-950/40 text-emerald-400 border border-emerald-900/30 text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md">
                      Showcase Active
                    </span>
                  </div>

                  <h3 className="text-sm font-bold text-white mb-2 leading-snug">{proj.title}</h3>
                  <p className="text-xs text-slate-400 line-clamp-3 leading-relaxed mb-4">
                    {proj.description.replace(/<[^>]*>/g, '')}
                  </p>

                  {/* SDG tags */}
                  {proj.sdg_tags && proj.sdg_tags.length > 0 && (
                    <div className="flex items-center gap-1.5 pt-3 border-t border-slate-850 mt-4">
                      <span className="text-[10px] text-slate-500 font-bold uppercase">SDGs:</span>
                      <div className="flex flex-wrap gap-1">
                        {proj.sdg_tags.map((sdg: number) => (
                          <span
                            key={sdg}
                            className="h-4.5 w-4.5 rounded bg-blue-900/30 text-[9px] font-extrabold text-blue-300 flex items-center justify-center border border-blue-900/40"
                            title={`SDG ${sdg}`}
                          >
                            {sdg}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <div className="pt-4 border-t border-slate-850 mt-4 flex items-center justify-between text-[10px] text-slate-500">
                  <span>Lead Creator: <strong className="text-slate-350">{proj.profiles?.full_name}</strong></span>
                  <div className="flex items-center gap-1.5">
                    <Star className="h-3.5 w-3.5 fill-amber-500 text-amber-500" />
                    <span>Graduated</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
