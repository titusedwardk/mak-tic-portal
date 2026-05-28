'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import AiChatAssistant from '@/components/ai-chat-assistant'
import { 
  ArrowLeft, 
  ArrowRight, 
  CheckCircle2, 
  FolderPlus, 
  Info, 
  Plus, 
  Upload, 
  X, 
  Loader2, 
  AlertCircle,
  FileCode,
  Users2,
  FileSpreadsheet
} from 'lucide-react'

// Tracks definitions
const TRACKS = [
  { id: 'early_idea', label: 'Early Idea', desc: 'Concept stage research or problem explorations' },
  { id: 'prototype', label: 'Prototype Ready', desc: 'Working proof of concept or minimum viable product' },
  { id: 'market_ready', label: 'Market Ready', desc: 'Completed prototype ready for deployment/scaling' },
  { id: 'ip_only', label: 'IP Only / Patent', desc: 'Inventions seeking intellectual property filing guidance' },
  { id: 'challenge_response', label: 'Challenge Response', desc: 'Solutions responding to active innovation calls' },
]

// Support Types
const SUPPORT_TYPES = [
  { id: 'funding', label: 'Funding / Grants' },
  { id: 'mentorship', label: 'Incubation & Mentorship' },
  { id: 'lab_access', label: 'Lab & Equipment Access' },
  { id: 'ip_protection', label: 'IP Protection / Legal' },
  { id: 'networking', label: 'Funder & Corporate Networks' },
  { id: 'technical_training', label: 'Technical Skills Training' },
]

export default function NewProjectPage() {
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [submitting, setSubmitting] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')

  // Step 1: Basics
  const [title, setTitle] = useState('')
  const [track, setTrack] = useState('early_idea')
  const [sectorsInput, setSectorsInput] = useState('')
  const [sectors, setSectors] = useState<string[]>(['agritech'])

  // Step 2: Problem & Solution
  const [problemStatement, setProblemStatement] = useState('')
  const [proposedSolution, setProposedSolution] = useState('')

  // Step 3: Team & Support
  const [teamEmail, setTeamEmail] = useState('')
  const [teamMembers, setTeamMembers] = useState<{ email: string; role: string }[]>([])
  const [supportNeeded, setSupportNeeded] = useState<string[]>([])
  const [supportExplanation, setSupportExplanation] = useState<Record<string, string>>({})

  // Step 4: Files Upload
  const [pitchDeck, setPitchDeck] = useState<File | null>(null)
  const [businessPlan, setBusinessPlan] = useState<File | null>(null)
  const [otherDoc, setOtherDoc] = useState<File | null>(null)

  const handleAddSector = (e: React.FormEvent) => {
    e.preventDefault()
    if (sectorsInput.trim() && !sectors.includes(sectorsInput.trim().toLowerCase())) {
      setSectors([...sectors, sectorsInput.trim().toLowerCase()])
      setSectorsInput('')
    }
  }

  const handleAddTeamMember = (e: React.FormEvent) => {
    e.preventDefault()
    if (teamEmail.trim() && !teamMembers.some((m) => m.email === teamEmail.trim())) {
      setTeamMembers([...teamMembers, { email: teamEmail.trim(), role: 'member' }])
      setTeamEmail('')
    }
  }

  const handleToggleSupport = (id: string) => {
    if (supportNeeded.includes(id)) {
      setSupportNeeded(supportNeeded.filter((s) => s !== id))
    } else {
      setSupportNeeded([...supportNeeded, id])
    }
  }

  const handleSupportExplanationChange = (id: string, text: string) => {
    setSupportExplanation({
      ...supportExplanation,
      [id]: text,
    })
  }

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    setErrorMsg('')

    try {
      // 1. Submit project details
      const response = await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          track,
          sectors,
          description: proposedSolution, // map solution to description
          problem_statement: problemStatement,
          proposed_solution: proposedSolution,
          support_needed: supportNeeded,
          team_members: teamMembers,
        }),
      })

      const data = await response.json()
      if (data.error) {
        setErrorMsg(data.error)
        setSubmitting(false)
        return
      }

      const projectId = data.project.id

      // 2. Upload files if any
      const filesToUpload = [
        { file: pitchDeck, type: 'pitch_deck' },
        { file: businessPlan, type: 'business_plan' },
        { file: otherDoc, type: 'other' },
      ].filter((f) => f.file !== null)

      for (const item of filesToUpload) {
        const formData = new FormData()
        formData.append('file', item.file!)
        formData.append('file_type', item.type)

        const uploadRes = await fetch(`/api/projects/${projectId}/files`, {
          method: 'POST',
          body: formData,
        })
        const uploadData = await uploadRes.json()
        if (uploadData.error) {
          console.error(`Failed to upload ${item.type}:`, uploadData.error)
        }
      }

      // 3. Trigger AI scorer asynchronously (non-blocking)
      fetch(`/api/ai/score-project`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectId }),
      }).catch(console.error)

      // 4. Redirect
      router.push('/portal/projects')
      router.refresh()
    } catch (err: any) {
      setErrorMsg(err.message || 'Something went wrong during submission.')
      setSubmitting(false)
    }
  }

  return (
    <div className="grid grid-cols-1 xl:grid-cols-3 gap-8 items-start animate-fadeIn">
      {/* Left Columns: Submission Wizard (Span 2) */}
      <div className="xl:col-span-2 space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3 border-b border-slate-800/80 pb-4">
          <Link href="/portal/projects" className="p-1.5 rounded-lg border border-slate-800 hover:bg-slate-800 transition-colors">
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div>
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <FolderPlus className="h-5 w-5 text-blue-400" />
              Submit Innovation Proposal
            </h2>
            <p className="text-xs text-slate-400 mt-1">Complete the steps below to pitch your project to Mak-TIC reviewers</p>
          </div>
        </div>

        {/* Wizard Steps Stepper */}
        <div className="bg-slate-900/40 border border-slate-800/85 rounded-xl p-4 flex justify-between items-center text-xs font-semibold text-slate-400">
          {[
            { step: 1, label: 'Basics' },
            { step: 2, label: 'Problem & Solution' },
            { step: 3, label: 'Team & Support' },
            { step: 4, label: 'Upload Pitch Deck' },
            { step: 5, label: 'Review & Submit' },
          ].map((s) => (
            <div key={s.step} className="flex items-center gap-2">
              <div
                className={`h-6 w-6 rounded-full flex items-center justify-center text-[10px] font-bold border ${
                  step === s.step
                    ? 'bg-amber-500 border-amber-500 text-slate-950 font-bold'
                    : step > s.step
                    ? 'bg-blue-600 border-blue-500 text-white'
                    : 'bg-slate-950 border-slate-850 text-slate-650'
                }`}
              >
                {s.step}
              </div>
              <span className={`hidden sm:inline ${step === s.step ? 'text-amber-400 font-bold' : ''}`}>
                {s.label}
              </span>
            </div>
          ))}
        </div>

        {errorMsg && (
          <div className="flex items-center gap-3 bg-red-950/40 border border-red-500/30 text-red-300 rounded-lg p-3 text-sm">
            <AlertCircle className="h-5 w-5 shrink-0 text-red-400" />
            <p>{errorMsg}</p>
          </div>
        )}

        {/* Form Container */}
        <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6 md:p-8 shadow-xl">
          
          {/* Step 1: Basics */}
          {step === 1 && (
            <div className="space-y-6">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                  Project Title
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. IoT Soil Moisture Monitoring System"
                  className="w-full bg-slate-950/50 border border-slate-700 focus:border-blue-500 rounded-lg px-4 py-2.5 text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-blue-500 transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-3">
                  Select Project Track
                </label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                  {TRACKS.map((t) => (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => setTrack(t.id)}
                      className={`flex flex-col items-start p-4 border rounded-xl text-left transition-all cursor-pointer ${
                        track === t.id
                          ? 'border-amber-500 bg-amber-500/10 text-amber-300'
                          : 'border-slate-800 bg-slate-950/40 text-slate-400 hover:border-slate-700 hover:text-slate-300'
                      }`}
                    >
                      <span className="text-xs font-bold block mb-1 text-slate-100">{t.label}</span>
                      <span className="text-[10px] text-slate-400 leading-normal">{t.desc}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                  Target Sectors
                </label>
                <div className="flex gap-2 mb-2">
                  <input
                    type="text"
                    value={sectorsInput}
                    onChange={(e) => setSectorsInput(e.target.value)}
                    placeholder="e.g. agritech, healthtech, hardware"
                    className="flex-1 bg-slate-950/50 border border-slate-700 focus:border-blue-500 rounded-lg px-4 py-2 text-sm text-slate-100 focus:outline-none focus:ring-1 focus:ring-blue-500 transition-all"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault()
                        if (sectorsInput.trim()) {
                          setSectors([...sectors, sectorsInput.trim().toLowerCase()])
                          setSectorsInput('')
                        }
                      }
                    }}
                  />
                  <button
                    type="button"
                    onClick={handleAddSector}
                    className="bg-slate-800 hover:bg-slate-700 text-white rounded-lg px-3.5 flex items-center justify-center cursor-pointer text-xs font-bold"
                  >
                    Add
                  </button>
                </div>
                <div className="flex flex-wrap gap-2 p-2 bg-slate-950/30 border border-slate-800 rounded-lg min-h-[38px]">
                  {sectors.length === 0 ? (
                    <span className="text-xs text-slate-500 self-center pl-1">No sectors added</span>
                  ) : (
                    sectors.map((s) => (
                      <span
                        key={s}
                        className="inline-flex items-center gap-1 bg-slate-800 text-white text-[10px] uppercase tracking-wider px-2 py-0.5 rounded font-bold"
                      >
                        {s}
                        <button
                          type="button"
                          onClick={() => setSectors(sectors.filter((sec) => sec !== s))}
                          className="text-slate-500 hover:text-white focus:outline-none"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </span>
                    ))
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Problem & Solution */}
          {step === 2 && (
            <div className="space-y-6">
              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400">
                    Problem Statement
                  </label>
                  <span className="text-[10px] text-slate-500">Character count: {problemStatement.length}</span>
                </div>
                <textarea
                  required
                  value={problemStatement}
                  onChange={(e) => setProblemStatement(e.target.value)}
                  placeholder="Clearly define the problem you are solving. Explain who experiences this problem, its size or urgency, and the limitations of current solutions."
                  rows={6}
                  className="w-full bg-slate-950/50 border border-slate-700 focus:border-blue-500 rounded-lg p-4 text-xs text-slate-100 focus:outline-none focus:ring-1 focus:ring-blue-500 transition-all resize-none leading-relaxed"
                />
              </div>

              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400">
                    Proposed Solution
                  </label>
                  <span className="text-[10px] text-slate-500">Character count: {proposedSolution.length}</span>
                </div>
                <textarea
                  required
                  value={proposedSolution}
                  onChange={(e) => setProposedSolution(e.target.value)}
                  placeholder="Detail your solution. How does it work? Why is it unique, different, or better than current methods? State any prototype work done so far."
                  rows={6}
                  className="w-full bg-slate-950/50 border border-slate-700 focus:border-blue-500 rounded-lg p-4 text-xs text-slate-100 focus:outline-none focus:ring-1 focus:ring-blue-500 transition-all resize-none leading-relaxed"
                />
              </div>
            </div>
          )}

          {/* Step 3: Team & Support */}
          {step === 3 && (
            <div className="space-y-6">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                  Invite Team Members (Emails)
                </label>
                <div className="flex gap-2 mb-2">
                  <input
                    type="email"
                    value={teamEmail}
                    onChange={(e) => setTeamEmail(e.target.value)}
                    placeholder="teammember@domain.com"
                    className="flex-1 bg-slate-950/50 border border-slate-700 focus:border-blue-500 rounded-lg px-4 py-2 text-sm text-slate-100 focus:outline-none focus:ring-1 focus:ring-blue-500 transition-all"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault()
                        if (teamEmail.trim()) {
                          setTeamMembers([...teamMembers, { email: teamEmail.trim(), role: 'member' }])
                          setTeamEmail('')
                        }
                      }
                    }}
                  />
                  <button
                    type="button"
                    onClick={handleAddTeamMember}
                    className="bg-slate-850 hover:bg-slate-700 text-white rounded-lg px-3.5 flex items-center justify-center cursor-pointer text-xs font-bold"
                  >
                    Invite
                  </button>
                </div>
                <div className="space-y-2 max-h-40 overflow-y-auto p-2 bg-slate-950/30 border border-slate-800 rounded-lg">
                  {teamMembers.length === 0 ? (
                    <span className="text-xs text-slate-500 self-center block text-center py-2">No team members invited. You are the lead contact.</span>
                  ) : (
                    teamMembers.map((m) => (
                      <div key={m.email} className="flex justify-between items-center bg-slate-950/60 p-2 border border-slate-850 rounded-lg text-xs">
                        <span className="text-slate-350">{m.email}</span>
                        <div className="flex items-center gap-2">
                          <select
                            value={m.role}
                            onChange={(e) =>
                              setTeamMembers(
                                teamMembers.map((mem) =>
                                  mem.email === m.email ? { ...mem, role: e.target.value } : mem
                                )
                              )
                            }
                            className="bg-slate-900 border border-slate-750 text-slate-300 rounded text-[10px] py-1 px-1.5 focus:outline-none"
                          >
                            <option value="co_founder">Co-founder</option>
                            <option value="member">Member</option>
                            <option value="advisor">Advisor</option>
                          </select>
                          <button
                            type="button"
                            onClick={() => setTeamMembers(teamMembers.filter((mem) => mem.email !== m.email))}
                            className="text-slate-500 hover:text-red-400 p-0.5 rounded transition-colors"
                          >
                            <X className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-3">
                  Requested Support Types
                </label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {SUPPORT_TYPES.map((s) => {
                    const active = supportNeeded.includes(s.id)
                    return (
                      <button
                        key={s.id}
                        type="button"
                        onClick={() => handleToggleSupport(s.id)}
                        className={`py-2 px-3 border rounded-xl text-center font-bold text-xs transition-all cursor-pointer ${
                          active
                            ? 'border-amber-500 bg-amber-500/10 text-amber-300'
                            : 'border-slate-800 bg-slate-950/40 text-slate-400 hover:border-slate-700 hover:text-slate-300'
                        }`}
                      >
                        {s.label}
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Conditional textareas for support */}
              {supportNeeded.length > 0 && (
                <div className="space-y-4 pt-4 border-t border-slate-800/60 animate-fadeIn">
                  <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider">Explain Support Needs</h4>
                  {supportNeeded.map((s) => {
                    const label = SUPPORT_TYPES.find((st) => st.id === s)?.label
                    return (
                      <div key={s}>
                        <label className="block text-[11px] font-bold text-slate-400 mb-1">
                          {label} details:
                        </label>
                        <textarea
                          required
                          value={supportExplanation[s] || ''}
                          onChange={(e) => handleSupportExplanationChange(s, e.target.value)}
                          placeholder={`Briefly explain what support is needed for ${label?.toLowerCase()}...`}
                          rows={2}
                          className="w-full bg-slate-950/50 border border-slate-750 focus:border-blue-500 rounded-lg p-3 text-xs text-slate-100 focus:outline-none focus:ring-1 focus:ring-blue-500 transition-all resize-none"
                        />
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          )}

          {/* Step 4: Files Upload */}
          {step === 4 && (
            <div className="space-y-6">
              <div className="border-2 border-dashed border-slate-800 hover:border-slate-700 rounded-2xl p-6 text-center transition-all bg-slate-950/10">
                <Upload className="h-8 w-8 text-slate-500 mx-auto mb-2" />
                <h4 className="text-xs font-bold text-slate-200">Pitch Deck (Required)</h4>
                <p className="text-[10px] text-slate-500 mt-0.5">PDF or PPT files up to 50MB</p>
                <label className="inline-flex items-center gap-1.5 mt-3.5 bg-blue-600 hover:bg-blue-500 text-white rounded-md px-3.5 py-1.5 text-xs font-bold cursor-pointer shadow-sm shadow-blue-500/10">
                  Choose Pitch Deck
                  <input
                    type="file"
                    accept=".pdf,.ppt,.pptx"
                    onChange={(e) => setPitchDeck(e.target.files?.[0] || null)}
                    className="hidden"
                  />
                </label>
                {pitchDeck && (
                  <div className="mt-4 p-2.5 bg-slate-950/60 border border-slate-850 rounded-lg flex items-center justify-between text-xs text-slate-350 max-w-sm mx-auto">
                    <span className="truncate pr-4 font-semibold">{pitchDeck.name}</span>
                    <button
                      type="button"
                      onClick={() => setPitchDeck(null)}
                      className="text-slate-500 hover:text-white"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="border border-slate-800 p-4 rounded-xl text-center">
                  <FileSpreadsheet className="h-6 w-6 text-slate-500 mx-auto mb-1.5" />
                  <h5 className="text-[11px] font-bold text-slate-200">Business Plan (Optional)</h5>
                  <label className="inline-flex items-center mt-2.5 bg-slate-800 hover:bg-slate-700 text-white rounded-md px-3 py-1 text-xs font-bold cursor-pointer">
                    Upload
                    <input
                      type="file"
                      accept=".pdf,.doc,.docx"
                      onChange={(e) => setBusinessPlan(e.target.files?.[0] || null)}
                      className="hidden"
                    />
                  </label>
                  {businessPlan && (
                    <div className="mt-2 text-[10px] text-slate-400 flex items-center justify-center gap-1">
                      <span className="truncate max-w-[120px]">{businessPlan.name}</span>
                      <button type="button" onClick={() => setBusinessPlan(null)}>
                        <X className="h-3 w-3 hover:text-white" />
                      </button>
                    </div>
                  )}
                </div>

                <div className="border border-slate-800 p-4 rounded-xl text-center">
                  <FileCode className="h-6 w-6 text-slate-500 mx-auto mb-1.5" />
                  <h5 className="text-[11px] font-bold text-slate-200">Other Document (Optional)</h5>
                  <label className="inline-flex items-center mt-2.5 bg-slate-800 hover:bg-slate-700 text-white rounded-md px-3 py-1 text-xs font-bold cursor-pointer">
                    Upload
                    <input
                      type="file"
                      accept="*"
                      onChange={(e) => setOtherDoc(e.target.files?.[0] || null)}
                      className="hidden"
                    />
                  </label>
                  {otherDoc && (
                    <div className="mt-2 text-[10px] text-slate-400 flex items-center justify-center gap-1">
                      <span className="truncate max-w-[120px]">{otherDoc.name}</span>
                      <button type="button" onClick={() => setOtherDoc(null)}>
                        <X className="h-3 w-3 hover:text-white" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Step 5: Review & Submit */}
          {step === 5 && (
            <div className="space-y-6">
              <h3 className="text-md font-bold text-white border-b border-slate-800 pb-2">Application Draft Summary</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                <div>
                  <span className="text-[10px] text-slate-500 uppercase font-semibold">Title</span>
                  <p className="text-white font-bold mt-0.5">{title}</p>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 uppercase font-semibold">Track</span>
                  <p className="text-amber-400 font-bold capitalize mt-0.5">{track.replace('_', ' ')}</p>
                </div>
              </div>

              <div>
                <span className="text-[10px] text-slate-500 uppercase font-semibold">Sectors</span>
                <div className="flex flex-wrap gap-1 mt-1">
                  {sectors.map((s) => (
                    <span key={s} className="bg-slate-800 text-[10px] text-white px-2 py-0.5 rounded font-bold uppercase">{s}</span>
                  ))}
                </div>
              </div>

              <div className="bg-slate-950/40 border border-slate-800/80 rounded-xl p-4 space-y-3 text-xs leading-relaxed">
                <div>
                  <span className="text-[10px] text-slate-500 uppercase font-bold">Problem Statement</span>
                  <p className="text-slate-350 mt-1 whitespace-pre-wrap">{problemStatement}</p>
                </div>
                <div className="pt-3 border-t border-slate-850">
                  <span className="text-[10px] text-slate-500 uppercase font-bold">Proposed Solution</span>
                  <p className="text-slate-350 mt-1 whitespace-pre-wrap">{proposedSolution}</p>
                </div>
              </div>

              <div className="bg-slate-950/40 border border-slate-800/80 rounded-xl p-4 space-y-2 text-xs">
                <div className="flex justify-between items-center text-[10px] text-slate-500 uppercase font-bold">
                  <span>Attached Files</span>
                </div>
                <ul className="space-y-1.5 text-slate-350">
                  <li className="flex items-center justify-between">
                    <span>Pitch Deck: {pitchDeck?.name || <strong className="text-red-400">Missing (Required)</strong>}</span>
                  </li>
                  {businessPlan && <li>Business Plan: {businessPlan.name}</li>}
                  {otherDoc && <li>Other Doc: {otherDoc.name}</li>}
                </ul>
              </div>

              <div className="pt-4 flex items-start gap-3 bg-blue-950/20 border border-blue-900/30 text-blue-300 rounded-xl p-3.5">
                <Info className="h-5 w-5 shrink-0 text-blue-400 mt-0.5" />
                <p className="text-[11px] leading-relaxed">
                  Upon clicking submit, your application will be scanned by our background AI reviewer. Gemini will generate a draft score, executive summary, and SDG mapping tags for our review board. Final decision remains with the Makerere team.
                </p>
              </div>
            </div>
          )}

          {/* Stepper controls */}
          <div className="flex justify-between mt-8 pt-4 border-t border-slate-800/60">
            {step > 1 && step < 6 && (
              <button
                type="button"
                onClick={() => setStep(step - 1)}
                className="border border-slate-750 hover:bg-slate-800 text-slate-300 rounded-lg px-5 py-2.5 font-bold text-xs flex items-center gap-1.5 cursor-pointer transition-all"
              >
                Back
              </button>
            )}

            {step < 5 ? (
              <button
                type="button"
                onClick={() => {
                  if (step === 1 && (!title || sectors.length === 0)) {
                    setErrorMsg('Please enter a title and add at least one sector.')
                    return
                  }
                  if (step === 2 && (!problemStatement || !proposedSolution)) {
                    setErrorMsg('Please specify both the problem statement and the solution.')
                    return
                  }
                  if (step === 4 && !pitchDeck) {
                    setErrorMsg('Please upload a Pitch Deck file (Required).')
                    return
                  }
                  setErrorMsg('')
                  setStep(step + 1)
                }}
                className="bg-blue-600 hover:bg-blue-500 text-white rounded-lg px-5 py-2.5 font-bold text-xs flex items-center gap-1.5 shadow-md shadow-blue-500/10 cursor-pointer ml-auto transition-all hover:translate-x-0.5"
              >
                Continue
                <ArrowRight className="h-4 w-4" />
              </button>
            ) : (
              <button
                type="button"
                onClick={handleFormSubmit}
                disabled={submitting || !pitchDeck}
                className="bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 rounded-lg px-6 py-2.5 font-extrabold text-xs shadow-lg shadow-amber-500/15 flex items-center gap-2 cursor-pointer ml-auto transition-all disabled:opacity-50"
              >
                {submitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Submitting Innovation...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="h-4 w-4" />
                    Submit Application
                  </>
                )}
              </button>
            )}
          </div>

        </div>
      </div>

      {/* Right Column: AI Coach Assistant (Collapsible sidebar/widget) */}
      <div className="space-y-6">
        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5 shadow-lg">
          <h3 className="text-xs font-bold text-white uppercase tracking-wider mb-2 flex items-center gap-1.5">
            <Users2 className="h-4 w-4 text-blue-400" />
            Submission Guidelines
          </h3>
          <ul className="space-y-2 text-[11px] text-slate-450 leading-relaxed">
            <li><strong>Basics</strong>: Select the correct track to receive matching evaluation rubric.</li>
            <li><strong>Problem</strong>: Write a clear problem definition with local context.</li>
            <li><strong>Solution</strong>: Keep it technical but focus on customer adoption.</li>
            <li><strong>Uploads</strong>: Include details on technology, roadmap, and funding in pitch deck.</li>
          </ul>
        </div>

        <AiChatAssistant 
          projectDraft={{
            title,
            track,
            description: proposedSolution,
            problemStatement,
            proposedSolution,
          }}
        />
      </div>
    </div>
  )
}
