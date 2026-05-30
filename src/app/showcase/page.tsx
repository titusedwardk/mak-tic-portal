import Link from "next/link";
import { Button } from "@/components/ui/button";
import { createClient } from "@/utils/supabase/server";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, Globe, Layers, Zap } from "lucide-react";

export const dynamic = 'force-dynamic';

export default async function ShowcasePage() {
  const supabase = await createClient();

  // Fetch graduated/commercialized projects
  const { data: projects } = await supabase
    .from("projects")
    .select("id, title, description, stage, sector, created_at, profiles(full_name)")
    .in("stage", ["commercialization", "graduated"])
    .order("created_at", { ascending: false });

  return (
    <div className="flex flex-col min-h-screen bg-black text-white selection:bg-emerald-500/30">
      {/* Background styling */}
      <div className="fixed inset-0 z-0 pointer-events-none opacity-40">
        <div className="absolute top-[10%] left-[20%] w-[30%] h-[30%] rounded-full bg-emerald-600/30 blur-[150px] mix-blend-screen" />
        <div className="absolute bottom-[10%] right-[10%] w-[40%] h-[40%] rounded-full bg-blue-600/20 blur-[150px] mix-blend-screen" />
      </div>

      <header className="px-6 lg:px-12 h-20 flex items-center border-b border-white/10 bg-black/40 backdrop-blur-md sticky top-0 z-50">
        <Link href="/" className="flex items-center space-x-3 group">
          <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-emerald-400 to-blue-600 flex items-center justify-center shadow-lg shadow-emerald-500/20 group-hover:scale-105 transition-transform">
            <span className="text-white font-black text-xl tracking-tighter">M</span>
          </div>
          <span className="font-bold text-2xl tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white to-white/70">
            Mak-TIC
          </span>
        </Link>
        <nav className="ml-auto flex gap-4 sm:gap-6 items-center">
          <Link className="text-sm font-medium text-white/70 hover:text-white transition-colors" href="/">
            Home
          </Link>
          <Link href="/login">
            <Button size="sm" className="rounded-full bg-white/10 text-white hover:bg-white/20 border border-white/20">
              Sign In
            </Button>
          </Link>
        </nav>
      </header>

      <main className="flex-1 py-16 md:py-24 relative z-10">
        <div className="container px-4 md:px-6 mx-auto max-w-7xl">
          
          <div className="flex flex-col items-center space-y-6 text-center mb-20">
            <div className="inline-flex items-center rounded-full border border-blue-500/30 bg-blue-500/10 px-4 py-1.5 text-sm font-medium text-blue-300">
              <Globe className="mr-2 h-4 w-4" />
              <span>Public Portfolio</span>
            </div>
            <h1 className="text-5xl font-extrabold tracking-tight sm:text-6xl md:text-7xl bg-clip-text text-transparent bg-gradient-to-b from-white via-white/90 to-white/50">
              Innovation <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-500">Showcase</span>
            </h1>
            <p className="mx-auto max-w-2xl text-white/60 md:text-xl leading-relaxed">
              Explore the cutting-edge commercialized research and graduated startups emerging from Makerere University.
            </p>
          </div>

          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {projects?.map((project: any) => (
              <div 
                key={project.id} 
                className="group flex flex-col rounded-3xl border border-white/10 bg-white/5 p-6 hover:bg-white/10 transition-all duration-300 hover:-translate-y-2 hover:shadow-[0_20px_40px_rgba(0,0,0,0.5)] overflow-hidden relative"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-emerald-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                
                <div className="relative z-10 flex flex-col h-full">
                  <div className="flex justify-between items-start mb-6">
                    <Badge className="bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/30 border-0 uppercase tracking-wider text-xs">
                      {project.stage.replace('_', ' ')}
                    </Badge>
                    <div className="h-10 w-10 rounded-full bg-white/5 flex items-center justify-center border border-white/10">
                      <Zap className="h-5 w-5 text-yellow-400" />
                    </div>
                  </div>
                  
                  <h3 className="text-2xl font-bold text-white mb-2 line-clamp-2 group-hover:text-blue-400 transition-colors">
                    {project.title}
                  </h3>
                  
                  <p className="text-sm text-white/50 mb-6 font-medium flex items-center">
                    <Layers className="h-4 w-4 mr-2" />
                    By {project.profiles?.full_name}
                  </p>
                  
                  <div className="flex-1">
                    <p className="text-white/70 leading-relaxed line-clamp-3">
                      {project.description}
                    </p>
                  </div>
                  
                  <div className="mt-8 pt-6 border-t border-white/10 flex items-center justify-between">
                    <span className="text-xs text-white/40 uppercase tracking-wider font-semibold">
                      {project.sector?.[0] || 'Technology'}
                    </span>
                    <Button variant="ghost" className="text-blue-400 hover:text-blue-300 hover:bg-blue-400/10 p-0 h-auto">
                      View Details <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
            
            {(!projects || projects.length === 0) && (
              <div className="col-span-full py-24 text-center text-white/40 border border-dashed border-white/10 rounded-3xl bg-white/5 flex flex-col items-center justify-center">
                <Globe className="h-12 w-12 mb-4 opacity-50" />
                <h3 className="text-xl font-medium mb-2">No projects available</h3>
                <p>Public projects are currently being curated. Check back soon.</p>
              </div>
            )}
          </div>
        </div>
      </main>
      
      <footer className="py-8 w-full border-t border-white/10 bg-black text-center z-10 mt-auto">
        <p className="text-sm text-white/40">
          © {new Date().getFullYear()} Makerere University Technology & Innovation Center (Mak-TIC). All rights reserved.
        </p>
      </footer>
    </div>
  );
}
