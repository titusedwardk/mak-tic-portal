'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/Link'
import { createClient } from '@/lib/supabase/client'
import { User, Mail, Lock, GraduationCap, Briefcase, FileText, Camera, Plus, X, Loader2, ArrowLeft, ArrowRight, CheckCircle, ShieldAlert } from 'lucide-react'

type AffiliationType = 'makerere_student' | 'makerere_staff' | 'makerere_alumni' | 'external'

export default function RegisterPage() {
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')
  const [successMsg, setSuccessMsg] = useState('')

  // Form states
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  
  const [affiliation, setAffiliation] = useState<AffiliationType>('makerere_student')
  const [studentId, setStudentId] = useState('')
  const [department, setDepartment] = useState('')
  
  const [bio, setBio] = useState('')
  const [skills, setSkills] = useState<string[]>([])
  const [skillInput, setSkillInput] = useState('')
  const [avatarUrl, setAvatarUrl] = useState('')
  const [avatarLoading, setAvatarLoading] = useState(false)

  const supabase = createClient()

  const handleAddSkill = (e: React.FormEvent) => {
    e.preventDefault()
    if (skillInput.trim() && !skills.includes(skillInput.trim())) {
      setSkills([...skills, skillInput.trim()])
      setSkillInput('')
    }
  }

  const handleRemoveSkill = (skill: string) => {
    setSkills(skills.filter((s) => s !== skill))
  }

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setAvatarLoading(true)
    setErrorMsg('')

    const formData = new FormData()
    formData.append('file', file)

    try {
      const res = await fetch('/api/auth/upload-avatar', {
        method: 'POST',
        body: formData,
      })
      const data = await res.json()
      if (data.error) {
        setErrorMsg(data.error)
      } else {
        setAvatarUrl(data.url)
      }
    } catch (err: any) {
      setErrorMsg('Failed to upload profile photo.')
    } finally {
      setAvatarLoading(false)
    }
  }

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setErrorMsg('')
    setSuccessMsg('')

    // Sign up using Supabase Auth
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
        data: {
          full_name: fullName,
          affiliation,
          student_id: studentId || null,
          department: department || null,
          bio: bio || null,
          skills,
          avatar_url: avatarUrl || null,
        },
      },
    })

    setLoading(false)

    if (error) {
      setErrorMsg(error.message)
    } else {
      if (data.session) {
        // Auto signed-in
        router.refresh()
        router.push('/portal/dashboard')
      } else {
        // Verification email sent
        setSuccessMsg('Registration successful! Please check your email to verify your account.')
        setStep(4) // Move to confirmation step
      }
    }
  }

  return (
    <div className="flex flex-col min-h-screen bg-slate-900 text-slate-100 items-center justify-center p-4 relative overflow-hidden font-sans">
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-blue-900/30 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[45%] h-[45%] rounded-full bg-amber-500/10 blur-[150px] pointer-events-none" />

      <div className="w-full max-w-lg bg-slate-800/60 backdrop-blur-xl border border-slate-700/50 rounded-2xl shadow-2xl p-8 relative z-10">
        
        {/* Step Indicator Header */}
        {step <= 3 && (
          <div className="mb-8">
            <div className="flex justify-between items-center text-xs font-semibold text-slate-400 uppercase tracking-widest mb-2">
              <span>Step {step} of 3</span>
              <span>{step === 1 ? 'Credentials' : step === 2 ? 'Affiliation' : 'Profile'}</span>
            </div>
            <div className="h-1.5 w-full bg-slate-700/50 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-blue-600 to-amber-500 rounded-full transition-all duration-300"
                style={{ width: `${(step / 3) * 100}%` }}
              />
            </div>
          </div>
        )}

        {errorMsg && (
          <div className="flex items-center gap-3 bg-red-950/40 border border-red-500/30 text-red-300 rounded-lg p-3 text-sm mb-6 animate-pulse">
            <ShieldAlert className="h-5 w-5 shrink-0 text-red-400" />
            <p>{errorMsg}</p>
          </div>
        )}

        {/* Step 1: Credentials */}
        {step === 1 && (
          <div>
            <h3 className="text-xl font-bold text-white mb-6">Create Your Credentials</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
                  Full Name
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-500">
                    <User className="h-4 w-4" />
                  </span>
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="John Doe"
                    className="w-full bg-slate-950/50 border border-slate-700 focus:border-blue-500 rounded-lg pl-10 pr-4 py-2.5 text-sm text-slate-100 focus:outline-none focus:ring-1 focus:ring-blue-500 transition-all"
                  />
                </div>
              </div>

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
                    placeholder="john@domain.com"
                    className="w-full bg-slate-950/50 border border-slate-700 focus:border-blue-500 rounded-lg pl-10 pr-4 py-2.5 text-sm text-slate-100 focus:outline-none focus:ring-1 focus:ring-blue-500 transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
                  Password
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-500">
                    <Lock className="h-4 w-4" />
                  </span>
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Min 6 characters"
                    className="w-full bg-slate-950/50 border border-slate-700 focus:border-blue-500 rounded-lg pl-10 pr-4 py-2.5 text-sm text-slate-100 focus:outline-none focus:ring-1 focus:ring-blue-500 transition-all"
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end mt-8">
              <button
                type="button"
                onClick={() => {
                  if (!fullName || !email || !password) {
                    setErrorMsg('Please fill out all fields.')
                    return
                  }
                  if (password.length < 6) {
                    setErrorMsg('Password must be at least 6 characters.')
                    return
                  }
                  setErrorMsg('')
                  setStep(2)
                }}
                className="bg-blue-600 hover:bg-blue-500 text-white rounded-lg px-5 py-2.5 font-semibold text-sm shadow-md flex items-center gap-2 cursor-pointer transition-all hover:translate-x-0.5"
              >
                Next Step
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}

        {/* Step 2: Affiliation */}
        {step === 2 && (
          <div>
            <h3 className="text-xl font-bold text-white mb-6">University Affiliation</h3>
            <div className="space-y-6">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-3">
                  Select Affiliation
                </label>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { id: 'makerere_student', label: 'Makerere Student', icon: GraduationCap },
                    { id: 'makerere_staff', label: 'Makerere Staff', icon: Briefcase },
                    { id: 'makerere_alumni', label: 'Makerere Alumni', icon: GraduationCap },
                    { id: 'external', label: 'External Innovator', icon: User },
                  ].map((aff) => {
                    const Icon = aff.icon
                    return (
                      <button
                        key={aff.id}
                        type="button"
                        onClick={() => setAffiliation(aff.id as AffiliationType)}
                        className={`flex flex-col items-center justify-center p-4 border rounded-xl transition-all cursor-pointer ${
                          affiliation === aff.id
                            ? 'border-amber-500 bg-amber-500/10 text-amber-300'
                            : 'border-slate-700 bg-slate-900/30 text-slate-400 hover:border-slate-600 hover:text-slate-300'
                        }`}
                      >
                        <Icon className="h-6 w-6 mb-2" />
                        <span className="text-xs font-semibold">{aff.label}</span>
                      </button>
                    )
                  })}
                </div>
              </div>

              {(affiliation === 'makerere_student' || affiliation === 'makerere_staff') && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-fadeIn">
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
                      Student / Staff ID
                    </label>
                    <input
                      type="text"
                      required
                      value={studentId}
                      onChange={(e) => setStudentId(e.target.value)}
                      placeholder="e.g. 210012345"
                      className="w-full bg-slate-950/50 border border-slate-700 focus:border-blue-500 rounded-lg px-4 py-2.5 text-sm text-slate-100 focus:outline-none focus:ring-1 focus:ring-blue-500 transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
                      Department / College
                    </label>
                    <input
                      type="text"
                      required
                      value={department}
                      onChange={(e) => setDepartment(e.target.value)}
                      placeholder="e.g. CEDAT / COCIS"
                      className="w-full bg-slate-950/50 border border-slate-700 focus:border-blue-500 rounded-lg px-4 py-2.5 text-sm text-slate-100 focus:outline-none focus:ring-1 focus:ring-blue-500 transition-all"
                    />
                  </div>
                </div>
              )}
            </div>

            <div className="flex justify-between mt-8">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="border border-slate-700 hover:bg-slate-700/50 text-slate-300 rounded-lg px-5 py-2.5 font-semibold text-sm flex items-center gap-2 cursor-pointer transition-all"
              >
                <ArrowLeft className="h-4 w-4" />
                Back
              </button>
              <button
                type="button"
                onClick={() => {
                  if ((affiliation === 'makerere_student' || affiliation === 'makerere_staff') && (!studentId || !department)) {
                    setErrorMsg('Please enter your University ID and Department.')
                    return
                  }
                  setErrorMsg('')
                  setStep(3)
                }}
                className="bg-blue-600 hover:bg-blue-500 text-white rounded-lg px-5 py-2.5 font-semibold text-sm shadow-md flex items-center gap-2 cursor-pointer transition-all hover:translate-x-0.5"
              >
                Next Step
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Profile */}
        {step === 3 && (
          <form onSubmit={handleRegister}>
            <h3 className="text-xl font-bold text-white mb-6">Profile Details</h3>
            <div className="space-y-5">
              {/* Photo upload */}
              <div className="flex items-center gap-6 bg-slate-900/30 border border-slate-700/50 rounded-xl p-4">
                <div className="relative h-20 w-20 rounded-full border-2 border-slate-600 bg-slate-950 flex items-center justify-center overflow-hidden group">
                  {avatarUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={avatarUrl} alt="Avatar" className="h-full w-full object-cover" />
                  ) : (
                    <User className="h-10 w-10 text-slate-500" />
                  )}
                  {avatarLoading && (
                    <div className="absolute inset-0 bg-slate-950/70 flex items-center justify-center">
                      <Loader2 className="h-6 w-6 text-blue-500 animate-spin" />
                    </div>
                  )}
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-white">Profile Photo</h4>
                  <p className="text-xs text-slate-400 mt-0.5">JPG, PNG up to 10MB</p>
                  <label className="inline-flex items-center gap-1.5 mt-2 bg-slate-700 hover:bg-slate-600 text-white rounded-md px-3 py-1.5 text-xs font-semibold cursor-pointer shadow-sm active:scale-95 transition-all">
                    <Camera className="h-3.5 w-3.5" />
                    Upload Image
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleAvatarChange}
                      className="hidden"
                    />
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
                  Short Biography
                </label>
                <div className="relative">
                  <span className="absolute top-3 left-3 text-slate-500">
                    <FileText className="h-4 w-4" />
                  </span>
                  <textarea
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    placeholder="Tell us about yourself and your background in innovation..."
                    rows={3}
                    className="w-full bg-slate-950/50 border border-slate-700 focus:border-blue-500 rounded-lg pl-10 pr-4 py-2.5 text-sm text-slate-100 focus:outline-none focus:ring-1 focus:ring-blue-500 transition-all resize-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
                  Skills & Interests
                </label>
                <div className="flex gap-2 mb-2">
                  <input
                    type="text"
                    value={skillInput}
                    onChange={(e) => setSkillInput(e.target.value)}
                    placeholder="e.g. IoT, Agritech, React, CAD"
                    className="flex-1 bg-slate-950/50 border border-slate-700 focus:border-blue-500 rounded-lg px-4 py-1.5 text-sm text-slate-100 focus:outline-none focus:ring-1 focus:ring-blue-500 transition-all"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault()
                        if (skillInput.trim()) {
                          setSkills([...skills, skillInput.trim()])
                          setSkillInput('')
                        }
                      }
                    }}
                  />
                  <button
                    type="button"
                    onClick={handleAddSkill}
                    className="bg-slate-700 hover:bg-slate-600 text-white rounded-lg px-3 flex items-center justify-center cursor-pointer"
                  >
                    <Plus className="h-4 w-4" />
                  </button>
                </div>

                <div className="flex flex-wrap gap-2 min-h-[36px] p-2 bg-slate-900/30 border border-slate-700/50 rounded-lg">
                  {skills.length === 0 ? (
                    <span className="text-xs text-slate-500 self-center pl-1">No skills added yet</span>
                  ) : (
                    skills.map((skill) => (
                      <span
                        key={skill}
                        className="inline-flex items-center gap-1 bg-slate-700 text-white text-xs px-2.5 py-1 rounded-full font-medium"
                      >
                        {skill}
                        <button
                          type="button"
                          onClick={() => handleRemoveSkill(skill)}
                          className="text-slate-400 hover:text-white rounded-full focus:outline-none"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </span>
                    ))
                  )}
                </div>
              </div>
            </div>

            <div className="flex justify-between mt-8">
              <button
                type="button"
                onClick={() => setStep(2)}
                className="border border-slate-700 hover:bg-slate-700/50 text-slate-300 rounded-lg px-5 py-2.5 font-semibold text-sm flex items-center gap-2 cursor-pointer transition-all"
              >
                <ArrowLeft className="h-4 w-4" />
                Back
              </button>
              <button
                type="submit"
                disabled={loading}
                className="bg-gradient-to-r from-blue-700 to-indigo-800 hover:from-blue-600 hover:to-indigo-700 text-white rounded-lg px-6 py-2.5 font-semibold text-sm shadow-lg hover:shadow-indigo-900/30 flex items-center gap-2 cursor-pointer transition-all"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Creating Account...
                  </>
                ) : (
                  <>
                    <CheckCircle className="h-4 w-4" />
                    Complete Register
                  </>
                )}
              </button>
            </div>
          </form>
        )}

        {/* Step 4: Success/Verification */}
        {step === 4 && (
          <div className="text-center py-6 animate-fadeIn">
            <div className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-emerald-950 border-2 border-emerald-500 text-emerald-400 mb-6">
              <CheckCircle className="h-10 w-10" />
            </div>
            <h3 className="text-2xl font-bold text-white mb-2">Check Your Email</h3>
            <p className="text-slate-300 text-sm max-w-sm mx-auto leading-relaxed">
              We have sent a verification link to <strong className="text-slate-100">{email}</strong>. Please click the link to confirm your account and log in.
            </p>
            <div className="mt-8">
              <Link
                href="/login"
                className="inline-flex items-center gap-2 text-sm text-amber-400 font-semibold hover:underline"
              >
                <ArrowLeft className="h-4 w-4" />
                Go to Sign In
              </Link>
            </div>
          </div>
        )}

        {/* Footer link */}
        {step <= 3 && (
          <div className="text-center text-sm text-slate-400 mt-8 pt-6 border-t border-slate-700/40">
            Already have an account?{' '}
            <Link href="/login" className="text-amber-400 font-semibold hover:underline">
              Sign In
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}
