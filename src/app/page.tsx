"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { ArrowRight, Lightbulb, TrendingUp, ShieldCheck, Zap } from "lucide-react";

export default function HomePage() {
  return (
    <div className="flex flex-col min-h-screen bg-black text-white overflow-hidden selection:bg-emerald-500/30">
      {/* Dynamic Background Gradients */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] rounded-full bg-emerald-600/20 blur-[120px] mix-blend-screen" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] rounded-full bg-blue-600/20 blur-[120px] mix-blend-screen" />
      </div>

      <header className="px-6 lg:px-12 h-20 flex items-center border-b border-white/10 bg-black/40 backdrop-blur-md sticky top-0 z-50">
        <div className="flex items-center space-x-3">
          <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-emerald-400 to-blue-600 flex items-center justify-center shadow-lg shadow-emerald-500/20">
            <span className="text-white font-black text-xl tracking-tighter">M</span>
          </div>
          <span className="font-bold text-2xl tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white to-white/70">
            Mak-TIC
          </span>
        </div>
        <nav className="ml-auto flex gap-6 items-center">
          <Link className="text-sm font-medium text-white/70 hover:text-white transition-colors" href="/showcase">
            Showcase
          </Link>
          <Link className="text-sm font-medium text-white/70 hover:text-white transition-colors" href="/login">
            Sign In
          </Link>
          <Link href="/register">
            <Button className="rounded-full bg-white text-black hover:bg-white/90 font-semibold px-6 shadow-[0_0_20px_rgba(255,255,255,0.1)] transition-all hover:shadow-[0_0_30px_rgba(255,255,255,0.3)]">
              Get Started
            </Button>
          </Link>
        </nav>
      </header>

      <main className="flex-1 relative z-10">
        {/* Hero Section */}
        <section className="w-full pt-32 pb-20 md:pt-48 md:pb-32 lg:pt-56">
          <div className="container px-4 md:px-6 mx-auto max-w-7xl">
            <div className="flex flex-col items-center text-center space-y-10">
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="inline-flex items-center rounded-full border border-emerald-500/30 bg-emerald-500/10 px-4 py-1.5 text-sm font-medium text-emerald-300 backdrop-blur-sm"
              >
                <Zap className="mr-2 h-4 w-4" />
                <span>The Future of African Innovation</span>
              </motion.div>

              <motion.h1 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.1 }}
                className="text-5xl font-extrabold tracking-tight sm:text-6xl md:text-7xl lg:text-8xl max-w-5xl bg-clip-text text-transparent bg-gradient-to-b from-white via-white/90 to-white/50"
              >
                Turn your research into a <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-blue-500">commercial reality.</span>
              </motion.h1>

              <motion.p 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
                className="mx-auto max-w-2xl text-white/60 text-lg md:text-xl leading-relaxed"
              >
                Makerere University Technology & Innovation Center empowers students, alumni, and researchers to build, fund, and scale breakthrough ideas.
              </motion.p>

              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.3 }}
                className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto"
              >
                <Link href="/register">
                  <Button size="lg" className="w-full sm:w-auto h-14 px-8 text-base rounded-full bg-gradient-to-r from-emerald-500 to-blue-600 hover:from-emerald-400 hover:to-blue-500 text-white border-0 shadow-[0_0_40px_rgba(16,185,129,0.3)] transition-all hover:scale-105">
                    Submit a Project <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </Link>
                <Link href="/showcase">
                  <Button variant="outline" size="lg" className="w-full sm:w-auto h-14 px-8 text-base rounded-full border-white/20 bg-white/5 backdrop-blur-md text-white hover:bg-white/10 hover:border-white/30 transition-all">
                    Explore Showcase
                  </Button>
                </Link>
              </motion.div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="w-full py-24 border-t border-white/5 bg-black/50 backdrop-blur-sm relative">
          <div className="container px-4 md:px-6 mx-auto max-w-7xl">
            <div className="grid gap-8 md:grid-cols-3">
              {[
                {
                  icon: <TrendingUp className="h-8 w-8 text-emerald-400" />,
                  title: "Access Funding",
                  desc: "Apply for university grants, seed capital, and external innovation challenges directly through the portal."
                },
                {
                  icon: <Lightbulb className="h-8 w-8 text-blue-400" />,
                  title: "Expert Mentorship",
                  desc: "Connect with industry experts, alumni, and faculty. Get your business model refined by the best."
                },
                {
                  icon: <ShieldCheck className="h-8 w-8 text-purple-400" />,
                  title: "AI-Powered Evaluation",
                  desc: "Get instant automated feedback, market viability scores, and SDG tracking powered by Google Gemini AI."
                }
              ].map((feature, i) => (
                <motion.div 
                  key={i}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: i * 0.1 }}
                  className="group relative p-8 rounded-3xl border border-white/10 bg-white/5 hover:bg-white/10 transition-all duration-300 overflow-hidden"
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                  <div className="relative z-10 flex flex-col space-y-4">
                    <div className="h-16 w-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                      {feature.icon}
                    </div>
                    <h3 className="text-2xl font-bold text-white">{feature.title}</h3>
                    <p className="text-white/60 leading-relaxed">
                      {feature.desc}
                    </p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>
      </main>

      <footer className="py-8 w-full border-t border-white/10 bg-black text-center z-10">
        <p className="text-sm text-white/40">
          © {new Date().getFullYear()} Makerere University Technology & Innovation Center (Mak-TIC). All rights reserved.
        </p>
      </footer>
    </div>
  );
}
