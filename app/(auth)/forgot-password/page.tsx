'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import { Mail, ShieldAlert, CheckCircle, ArrowLeft, Loader2, Key } from 'lucide-react'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')
  const [successMsg, setSuccessMsg] = useState('')

  const supabase = createClient()

  async function handleReset(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setErrorMsg('')
    setSuccessMsg('')

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/callback?next=/portal/profile`,
    })

    setLoading(false)
    if (error) {
      setErrorMsg(error.message)
    } else {
      setSuccessMsg('Password reset link sent! Please check your email.')
    }
  }

  return (
    <div className="flex flex-col min-h-screen bg-slate-900 text-slate-100 items-center justify-center p-4 relative overflow-hidden font-sans">
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-blue-900/30 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[45%] h-[45%] rounded-full bg-amber-500/10 blur-[150px] pointer-events-none" />

      <div className="w-full max-w-md bg-slate-800/60 backdrop-blur-xl border border-slate-700/50 rounded-2xl shadow-2xl p-8 relative z-10">
        
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-tr from-blue-700 to-amber-500 text-white font-extrabold text-xl shadow-lg mb-4">
            <Key className="h-6 w-6" />
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-white">
            Reset Password
          </h2>
          <p className="text-sm text-slate-400 mt-1">
            Enter your email to receive a recovery link
          </p>
        </div>

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

        <form onSubmit={handleReset} className="space-y-4">
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

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-blue-700 to-indigo-800 hover:from-blue-600 hover:to-indigo-700 text-white rounded-lg py-2.5 font-semibold text-sm shadow-lg hover:shadow-indigo-900/30 focus:outline-none flex items-center justify-center gap-2 mt-6 cursor-pointer"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Sending Reset Link...
              </>
            ) : (
              <>
                Send recovery link
              </>
            )}
          </button>
        </form>

        {/* Footer */}
        <div className="text-center text-sm text-slate-400 mt-8 pt-6 border-t border-slate-700/40">
          <Link href="/login" className="text-amber-400 font-semibold hover:underline flex items-center justify-center gap-1">
            <ArrowLeft className="h-4 w-4" /> Back to Sign In
          </Link>
        </div>
      </div>
    </div>
  )
}
