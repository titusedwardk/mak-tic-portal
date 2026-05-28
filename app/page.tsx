import Link from 'next/link'
import { ArrowRight, Award, Compass, Users, CheckCircle2, ShieldCheck, Flame, BookOpen } from 'lucide-react'

export default function Home() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans relative overflow-hidden flex flex-col justify-between">
      
      {/* Background radial blobs */}
      <div className="absolute top-[-20%] left-[-20%] w-[60%] h-[60%] rounded-full bg-blue-900/20 blur-[130px] pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-20%] w-[65%] h-[65%] rounded-full bg-amber-500/5 blur-[160px] pointer-events-none" />

      {/* Top Navbar */}
      <header className="max-w-6xl w-full mx-auto px-6 h-20 flex justify-between items-center relative z-10">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-blue-700 to-amber-500 text-white font-extrabold text-lg flex">
            M
          </div>
          <div>
            <h1 className="text-sm font-bold tracking-tight text-white leading-none">Mak-TIC</h1>
            <span className="text-[9px] text-slate-500 font-semibold tracking-wider uppercase">Innovation Center</span>
          </div>
        </div>
        
        <div className="flex items-center gap-4 text-xs font-semibold">
          <Link href="/showcase" className="text-slate-450 hover:text-white transition-colors">
            Browse Showcase
          </Link>
          <Link href="/login" className="border border-slate-800 hover:bg-slate-900 rounded-xl px-4 py-2 text-slate-300">
            Sign In
          </Link>
          <Link href="/register" className="bg-blue-650 hover:bg-blue-600 text-white rounded-xl px-4 py-2">
            Apply Now
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-6 py-12 md:py-20 relative z-10 flex flex-col gap-20">
        
        {/* Hero Section */}
        <section className="text-center max-w-3xl mx-auto space-y-6">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-500/10 border border-amber-500/30 text-amber-400 rounded-full text-[10px] font-bold uppercase tracking-widest">
            <Flame className="h-3.5 w-3.5 fill-amber-500 animate-pulse" /> Makerere's Innovation Engine
          </div>
          <h1 className="text-4xl md:text-5xl font-black tracking-tight leading-[1.1] text-white">
            Transform Your Research & Ideas into Scaleable Ventures
          </h1>
          <p className="text-sm md:text-base text-slate-400 leading-relaxed max-w-xl mx-auto">
            The Mak-TIC Innovation Portal is your gateway to structured stage-gate reviews, elite mentorship matching, and grant disbursement tracking at Makerere University.
          </p>

          <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/register"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-gradient-to-r from-blue-700 to-indigo-800 hover:from-blue-600 hover:to-indigo-700 text-white px-6 py-3.5 rounded-xl font-bold text-sm shadow-lg shadow-indigo-900/20 transition-all cursor-pointer hover:translate-x-0.5"
            >
              Get Started as Innovator
              <ArrowRight className="h-4.5 w-4.5" />
            </Link>
            <Link
              href="/showcase"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-slate-900 border border-slate-800 hover:bg-slate-800 hover:text-white text-slate-350 px-6 py-3.5 rounded-xl font-bold text-sm shadow-md transition-all cursor-pointer"
            >
              <Compass className="h-4.5 w-4.5" />
              Explore the Showcase
            </Link>
          </div>
        </section>

        {/* Statistic Panels */}
        <section className="grid grid-cols-1 md:grid-cols-4 gap-6 bg-slate-900/40 border border-slate-800/80 p-8 rounded-3xl shadow-xl">
          <div className="text-center space-y-1">
            <span className="text-3xl font-black text-white block">450+</span>
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">Innovators Active</span>
          </div>
          <div className="w-px bg-slate-800 self-stretch hidden md:block" />
          <div className="text-center space-y-1">
            <span className="text-3xl font-black text-white block">1,200+</span>
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">Proposals Evaluated</span>
          </div>
          <div className="w-px bg-slate-800 self-stretch hidden md:block" />
          <div className="text-center space-y-1">
            <span className="text-3xl font-black text-white block">UGX 500M+</span>
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">Funding Disbursed</span>
          </div>
          <div className="w-px bg-slate-800 self-stretch hidden md:block" />
          <div className="text-center space-y-1">
            <span className="text-3xl font-black text-amber-400 block">Gemini 2.5</span>
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">AI Evaluator Driven</span>
          </div>
        </section>

        {/* How it works */}
        <section className="space-y-12">
          <div className="text-center space-y-2">
            <h2 className="text-xl md:text-2xl font-bold text-white">How The Portal Works</h2>
            <p className="text-xs text-slate-500 uppercase tracking-widest font-semibold">Your step-by-step incubation lifecycle</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            {[
              { step: '01', title: 'Register & Profile', desc: 'Create an account, declare your academic college affiliation, and outline your core technology skills.', icon: Users },
              { step: '02', title: 'Submit Proposal', desc: 'Pitch your project, outline the problem statement, add team members, and upload files. Chat with our AI Coach before submitting.', icon: BookOpen },
              { step: '03', title: 'AI & Board Evaluation', desc: 'Our Gemini agent pre-scores your project for viability and SDG alignment, then a reviewer conducts a stage-gate check.', icon: Award },
              { step: '04', title: 'Incubate & Scale', desc: 'Get assigned an expert mentor, fulfill milestone gates, unlock funding releases, and push to the public showcase.', icon: ShieldCheck },
            ].map((s) => {
              const Icon = s.icon
              return (
                <div key={s.step} className="bg-slate-900/30 border border-slate-850 p-6 rounded-2xl relative space-y-4">
                  <span className="absolute top-4 right-6 text-2xl font-black text-slate-800">{s.step}</span>
                  <div className="p-2.5 bg-blue-900/20 border border-blue-900/30 text-blue-400 rounded-xl inline-flex">
                    <Icon className="h-5 w-5" />
                  </div>
                  <h3 className="text-sm font-bold text-slate-200">{s.title}</h3>
                  <p className="text-xs text-slate-400 leading-relaxed">{s.desc}</p>
                </div>
              )
            })}
          </div>
        </section>

      </main>

      {/* Footer */}
      <footer className="border-t border-slate-900 py-6 text-center text-[10px] text-slate-500 font-medium">
        © {new Date().getFullYear()} Makerere University Technology & Innovation Center (Mak-TIC). All rights reserved.
      </footer>
      
    </div>
  )
}
