'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { LogIn, Mail, Lock, ShieldAlert, CheckCircle, ArrowRight, Loader2 } from 'lucide-react'

export default function LoginPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const redirectTo = searchParams.get('redirectTo') || '/portal/dashboard'
  const errorParam = searchParams.get('error')

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState(errorParam || '')
  const [successMsg, setSuccessMsg] = useState('')
  const [method, setMethod] = useState<'password' | 'magic_link'>('password')

  const supabase = createClient()

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setErrorMsg('')
    setSuccessMsg('')

    if (method === 'password') {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) {
        setErrorMsg(error.message)
        setLoading(false)
      } else {
        router.refresh()
        router.push(redirectTo)
      }
    } else {
      // Magic Link Login
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(redirectTo)}`,
        },
      })

      setLoading(false)
      if (error) {
        setErrorMsg(error.message)
      } else {
        setSuccessMsg('Magic link sent! Check your email to log in.')
      }
    }
  }

  return (
    <div className="flex flex-col min-h-screen bg-slate-900 text-slate-100 items-center justify-center p-4 relative overflow-hidden font-sans">
      {/* Background blobs for premium glassmorphism effect */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-blue-900/30 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[45%] h-[45%] rounded-full bg-amber-500/10 blur-[150px] pointer-events-none" />

      <div className="w-full max-w-md bg-slate-800/60 backdrop-blur-xl border border-slate-700/50 rounded-2xl shadow-2xl p-8 relative z-10">
        {/* Brand Header */}
        <div className="text-center mb-8">
          <div className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-tr from-blue-700 to-amber-500 text-white font-extrabold text-xl shadow-lg mb-4">
            M
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-white">
            Mak-TIC Innovation Portal
          </h2>
          <p className="text-sm text-slate-400 mt-1">
            Makerere University Technology & Innovation Center
          </p>
        </div>

        {/* Errors & Confirmations */}
        {errorMsg && (
          <div className="flex items-center gap-3 bg-red-950/40 border border-red-500/30 text-red-300 rounded-lg p-3 text-sm mb-6 animate-pulse">
            <ShieldAlert className="h-5 w-5 shrink-0 text-red-400" />
            <p>{errorMsg}</p>
          </div>
        )}

        {successMsg && (
          <div className="flex items-center gap-3 bg-emerald-950/40 border border-emerald-500/30 text-emerald-300 rounded-lg p-3 text-sm mb-6">
            <CheckCircle className="h-5 w-5 shrink-0 text-emerald-400" />
            <p>{successMsg}</p>
          </div>
        )}

        {/* Login Method Toggle */}
        <div className="grid grid-cols-2 gap-2 bg-slate-900/50 border border-slate-700/40 p-1 rounded-lg text-sm mb-6">
          <button
            type="button"
            className={`py-1.5 rounded-md transition-all font-medium ${
              method === 'password'
                ? 'bg-slate-700 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
            onClick={() => setMethod('password')}
          >
            Password
          </button>
          <button
            type="button"
            className={`py-1.5 rounded-md transition-all font-medium ${
              method === 'magic_link'
                ? 'bg-slate-700 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
            onClick={() => setMethod('magic_link')}
          >
            Magic Link
          </button>
        </div>

        {/* Input Form */}
        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
              Email Address
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-500">
                <Mail className="h-4 w-4" />
              </span>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@domain.com"
                className="w-full bg-slate-950/50 border border-slate-700 focus:border-blue-500 rounded-lg pl-10 pr-4 py-2.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-blue-500 transition-all"
              />
            </div>
          </div>

          {method === 'password' && (
            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400">
                  Password
                </label>
                <Link
                  href="/forgot-password"
                  className="text-xs text-blue-400 hover:underline hover:text-blue-300"
                >
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-500">
                  <Lock className="h-4 w-4" />
                </span>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-slate-950/50 border border-slate-700 focus:border-blue-500 rounded-lg pl-10 pr-4 py-2.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-blue-500 transition-all"
                />
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-blue-700 to-indigo-800 hover:from-blue-600 hover:to-indigo-700 text-white rounded-lg py-2.5 font-semibold text-sm shadow-lg hover:shadow-indigo-900/30 focus:outline-none active:scale-[0.98] transition-all flex items-center justify-center gap-2 mt-6 cursor-pointer"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Signing In...
              </>
            ) : (
              <>
                <LogIn className="h-4 w-4" />
                Sign In
              </>
            )}
          </button>
        </form>

        {/* Footer */}
        <div className="text-center text-sm text-slate-400 mt-8 pt-6 border-t border-slate-700/40">
          New to the portal?{' '}
          <Link href="/register" className="text-amber-400 font-semibold hover:underline flex items-center justify-center gap-1 mt-1 hover:text-amber-300">
            Create an Innovator Account <ArrowRight className="h-3 w-3" />
          </Link>
        </div>
      </div>

      {/* Social proof counters */}
      <div className="mt-8 flex gap-8 text-slate-500 text-xs relative z-10">
        <div>
          <span className="text-slate-300 font-bold block text-sm text-center">450+</span>
          innovators registered
        </div>
        <div className="w-[1px] bg-slate-800 self-stretch" />
        <div>
          <span className="text-slate-300 font-bold block text-sm text-center">1,200+</span>
          projects submitted
        </div>
        <div className="w-[1px] bg-slate-800 self-stretch" />
        <div>
          <span className="text-slate-300 font-bold block text-sm text-center">UGX 500M+</span>
          funding disbursed
        </div>
      </div>
    </div>
  )
}
