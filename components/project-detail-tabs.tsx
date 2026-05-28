'use client'

import { useState } from 'react'
import ReviewsRadarChart from './reviews-radar-chart'
import { 
  FileText, 
  Upload, 
  Plus, 
  CheckCircle, 
  AlertCircle,
  Download, 
  Calendar, 
  User, 
  ExternalLink,
  MessageSquare,
  Award,
  BookOpen,
  Loader2
} from 'lucide-react'

interface ProjectDetailTabsProps {
  project: any
  members: any[]
  files: any[]
  milestones: any[]
  reviews: any[]
  mentorAssignment: any
  mentorSessions: any[]
  currentUser: { id: string; role: string }
}

export default function ProjectDetailTabs({
  project,
  members,
  files,
  milestones,
  reviews,
  mentorAssignment,
  mentorSessions,
  currentUser,
}: ProjectDetailTabsProps) {
  const [activeTab, setActiveTab] = useState<'overview' | 'files' | 'milestones' | 'reviews' | 'mentor'>('overview')
  const [uploading, setUploading] = useState(false)
  const [fileType, setFileType] = useState('other')
  const [fileError, setFileError] = useState('')
  
  // Milestone state
  const [completingMilestoneId, setCompletingMilestoneId] = useState<string | null>(null)
  const [evidenceUrl, setEvidenceUrl] = useState('')
  const [milestoneSubmitting, setMilestoneSubmitting] = useState(false)

  // Compute average human scores across all reviews for this project
  const humanScoresAvg = {
    impact: 0,
    feasibility: 0,
    team: 0,
    innovation: 0,
    market: 0,
  }

  const humanReviews = reviews.filter((r) => !r.is_ai_review)
  if (humanReviews.length > 0) {
    humanReviews.forEach((r) => {
      humanScoresAvg.impact += r.score_impact || 0
      humanScoresAvg.feasibility += r.score_feasibility || 0
      humanScoresAvg.team += r.score_team || 0
      humanScoresAvg.innovation += r.score_innovation || 0
      humanScoresAvg.market += r.score_market || 0
    })
    
    // Average them out
    humanScoresAvg.impact /= humanReviews.length
    humanScoresAvg.feasibility /= humanReviews.length
    humanScoresAvg.team /= humanReviews.length
    humanScoresAvg.innovation /= humanReviews.length
    humanScoresAvg.market /= humanReviews.length
  }

  // Get AI reviews
  const aiReviewRecord = reviews.find((r) => r.is_ai_review)
  const aiScores = aiReviewRecord 
    ? {
        impact: aiReviewRecord.score_impact || 0,
        feasibility: aiReviewRecord.score_feasibility || 0,
        team: aiReviewRecord.score_team || 0,
        innovation: aiReviewRecord.score_innovation || 0,
        market: aiReviewRecord.score_market || 0,
      }
    : project.ai_score !== null 
    ? {
        // Fallback to project main AI score fields
        impact: Math.round(project.ai_score / 10),
        feasibility: Math.round(project.ai_score / 10),
        team: Math.round(project.ai_score / 10),
        innovation: Math.round(project.ai_score / 10),
        market: Math.round(project.ai_score / 10),
      }
    : null

  const handleFileUpload = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const form = e.currentTarget
    const fileInput = form.elements.namedItem('file') as HTMLInputElement
    const file = fileInput.files?.[0]
    if (!file) return

    setUploading(true)
    setFileError('')

    const formData = new FormData()
    formData.append('file', file)
    formData.append('file_type', fileType)

    try {
      const res = await fetch(`/api/projects/${project.id}/files`, {
        method: 'POST',
        body: formData,
      })
      const data = await res.json()
      if (data.error) {
        setFileError(data.error)
      } else {
        // Reload page to refresh file list
        window.location.reload()
      }
    } catch (err) {
      setFileError('Failed to upload file.')
    } finally {
      setUploading(false)
    }
  }

  const handleCompleteMilestone = async (milestoneId: string) => {
    setMilestoneSubmitting(true)
    try {
      const res = await fetch(`/api/projects/${project.id}/milestones/${milestoneId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: 'completed',
          evidence_url: evidenceUrl,
          completed_at: new Date().toISOString(),
        }),
      })

      const data = await res.json()
      if (data.error) {
        alert(data.error)
      } else {
        window.location.reload()
      }
    } catch (err) {
      alert('Failed to submit milestone completion.')
    } finally {
      setMilestoneSubmitting(false)
      setCompletingMilestoneId(null)
      setEvidenceUrl('')
    }
  }

  return (
    <div className="space-y-6">
      {/* Tabs Selector */}
      <div className="flex border-b border-slate-800 text-sm font-semibold text-slate-400">
        {[
          { id: 'overview', label: 'Overview' },
          { id: 'files', label: 'Files' },
          { id: 'milestones', label: 'Milestones' },
          { id: 'reviews', label: 'Stage-Gate Reviews' },
          { id: 'mentor', label: 'Mentorship' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`px-6 py-3 border-b-2 transition-all cursor-pointer ${
              activeTab === tab.id
                ? 'border-amber-500 text-amber-400'
                : 'border-transparent hover:text-slate-200'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Details (Span 2) */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-6 space-y-4">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">Project Concept</h3>
              <div className="text-xs text-slate-300 leading-relaxed whitespace-pre-wrap">
                <h4 className="font-bold text-slate-400 mb-1">Problem Statement:</h4>
                <p className="mb-4 bg-slate-950/40 border border-slate-850 p-3 rounded-lg">{project.problem_statement}</p>
                
                <h4 className="font-bold text-slate-400 mb-1">Proposed Solution:</h4>
                <p className="bg-slate-950/40 border border-slate-850 p-3 rounded-lg">{project.proposed_solution}</p>
              </div>
            </div>

            {/* AI Scorer Pre-Analysis Summary */}
            {project.ai_summary && (
              <div className="bg-gradient-to-r from-blue-950/20 to-indigo-950/10 border border-blue-900/30 rounded-2xl p-6 space-y-4">
                <div className="flex items-center gap-2 text-blue-400">
                  <Award className="h-5 w-5" />
                  <h3 className="text-sm font-bold uppercase tracking-wider">AI Evaluation & SDG Alignment</h3>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  {project.ai_summary}
                </p>
                {project.ai_sdg_reasoning && (
                  <div className="pt-2 text-xs text-slate-400">
                    <strong className="text-slate-300 font-bold block mb-1">SDG Mapping Justification:</strong>
                    <span className="italic">"{project.ai_sdg_reasoning}"</span>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Sidebar Info */}
          <div className="space-y-6">
            {/* Team Members */}
            <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-6">
              <h3 className="text-xs font-bold text-white uppercase tracking-wider mb-4 flex items-center gap-2">
                <User className="h-4.5 w-4.5 text-blue-400" />
                Team Members
              </h3>
              <div className="space-y-3.5">
                {members.map((m) => (
                  <div key={m.id} className="flex items-center gap-3 bg-slate-950/30 border border-slate-850/60 p-2.5 rounded-xl">
                    <div className="h-8 w-8 rounded-full bg-slate-800 flex items-center justify-center font-bold text-xs text-slate-300 uppercase">
                      {m.profiles?.full_name?.charAt(0) || 'U'}
                    </div>
                    <div className="min-w-0 flex-1">
                      <h4 className="text-xs font-bold text-white truncate">{m.profiles?.full_name}</h4>
                      <p className="text-[10px] text-slate-500 capitalize">{m.role.replace('_', ' ')}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Requested support details */}
            <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-6">
              <h3 className="text-xs font-bold text-white uppercase tracking-wider mb-3">Support Requested</h3>
              <div className="flex flex-wrap gap-1.5">
                {project.support_needed?.map((sup: string) => (
                  <span
                    key={sup}
                    className="bg-amber-950/40 border border-amber-900/40 text-amber-450 text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded"
                  >
                    {sup.replace('_', ' ')}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Files Tab */}
      {activeTab === 'files' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Files List (Span 2) */}
          <div className="lg:col-span-2 bg-slate-900/40 border border-slate-800 rounded-2xl p-6">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-6">Uploaded Project Files</h3>
            {files.length === 0 ? (
              <div className="text-center py-16 border border-dashed border-slate-800 rounded-xl">
                <FileText className="h-10 w-10 text-slate-700 mx-auto mb-2" />
                <span className="text-xs font-semibold text-slate-400 block">No files uploaded</span>
                <span className="text-[10px] text-slate-500">Add slides, decks, or video demos.</span>
              </div>
            ) : (
              <div className="space-y-3">
                {files.map((file) => (
                  <div
                    key={file.id}
                    className="flex justify-between items-center p-3.5 bg-slate-950/40 border border-slate-800 rounded-xl"
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-blue-950/40 text-blue-400">
                        <FileText className="h-5 w-5" />
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-slate-200">{file.file_name}</h4>
                        <div className="flex gap-3 text-[10px] text-slate-500 mt-1 capitalize">
                          <span>{file.file_type.replace('_', ' ')}</span>
                          <span>•</span>
                          <span>{Math.round(file.file_size_bytes / 1024)} KB</span>
                        </div>
                      </div>
                    </div>
                    <a
                      href={`/api/projects/${project.id}/files/${file.id}/download`}
                      target="_blank"
                      rel="noreferrer"
                      className="p-2 text-slate-400 hover:text-white bg-slate-800/80 rounded-lg transition-colors cursor-pointer"
                    >
                      <Download className="h-4 w-4" />
                    </a>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Upload Widget */}
          <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-6">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider mb-4">Upload New File</h3>
            {fileError && (
              <div className="flex items-center gap-2 bg-red-950/30 border border-red-900/50 text-red-400 rounded-lg p-3 text-[11px] mb-4">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <p>{fileError}</p>
              </div>
            )}
            <form onSubmit={handleFileUpload} className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-1">
                  File Type
                </label>
                <select
                  value={fileType}
                  onChange={(e) => setFileType(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-750 text-slate-300 rounded-lg text-xs py-2 px-3 focus:outline-none"
                >
                  <option value="pitch_deck">Pitch Deck</option>
                  <option value="business_plan">Business Plan</option>
                  <option value="prototype_doc">Prototype Documentation</option>
                  <option value="demo_video">Demo Video</option>
                  <option value="financial_model">Financial Model</option>
                  <option value="other">Other Document</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-1">
                  Select File
                </label>
                <div className="border border-dashed border-slate-700 hover:border-slate-600 rounded-lg p-4 text-center cursor-pointer transition-colors relative">
                  <Upload className="h-5 w-5 text-slate-500 mx-auto mb-1.5" />
                  <span className="text-[10px] text-slate-400 block font-semibold">Choose file...</span>
                  <input
                    type="file"
                    name="file"
                    required
                    className="absolute inset-0 opacity-0 cursor-pointer"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={uploading}
                className="w-full bg-blue-600 hover:bg-blue-500 text-white rounded-lg py-2 text-xs font-bold shadow-md cursor-pointer flex items-center justify-center gap-1.5 transition-all"
              >
                {uploading ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    Uploading...
                  </>
                ) : (
                  <>
                    <Upload className="h-3.5 w-3.5" />
                    Upload File
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Milestones Tab */}
      {activeTab === 'milestones' && (
        <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-6">
          <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-6">Milestone Progress Tracking</h3>
          
          {milestones.length === 0 ? (
            <div className="text-center py-16 border border-dashed border-slate-800 rounded-xl">
              <Calendar className="h-10 w-10 text-slate-700 mx-auto mb-2" />
              <span className="text-xs font-semibold text-slate-400 block">No milestones created yet</span>
              <span className="text-[10px] text-slate-500">Contact the admin pipeline reviewer to define gate milestones.</span>
            </div>
          ) : (
            <div className="relative border-l border-slate-800 pl-6 ml-4 space-y-6">
              {milestones.map((ms) => {
                const isCompleted = ms.status === 'completed'
                const isCompleting = completingMilestoneId === ms.id
                return (
                  <div key={ms.id} className="relative">
                    {/* Circle marker */}
                    <div className={`absolute -left-9.5 top-0.5 h-6 w-6 rounded-full flex items-center justify-center border-2 ${
                      isCompleted 
                        ? 'bg-blue-600 border-blue-500 text-white shadow-md' 
                        : ms.status === 'overdue'
                        ? 'bg-red-950 border-red-500 text-red-400'
                        : 'bg-slate-950 border-slate-700 text-slate-500'
                    }`}>
                      {isCompleted ? <CheckCircle className="h-3.5 w-3.5" /> : <div className="h-1.5 w-1.5 rounded-full bg-slate-500" />}
                    </div>

                    <div className="bg-slate-950/40 border border-slate-850 p-4 rounded-xl max-w-2xl">
                      <div className="flex justify-between items-start gap-3">
                        <div>
                          <h4 className="text-xs font-bold text-slate-200">{ms.title}</h4>
                          <p className="text-[10px] text-slate-450 mt-1 leading-relaxed">{ms.description}</p>
                        </div>
                        <span className={`text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded border shrink-0 ${
                          isCompleted
                            ? 'bg-blue-950/40 border-blue-900/50 text-blue-400'
                            : ms.status === 'overdue'
                            ? 'bg-red-950/40 border-red-900/50 text-red-400'
                            : 'bg-slate-900/40 border-slate-750 text-slate-450'
                        }`}>
                          {ms.status}
                        </span>
                      </div>

                      <div className="flex items-center justify-between mt-4 text-[10px] text-slate-500 border-t border-slate-850/50 pt-3">
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3.5 w-3.5" /> Due: {new Date(ms.due_date).toLocaleDateString()}
                        </span>
                        
                        {isCompleted ? (
                          ms.evidence_url && (
                            <a
                              href={ms.evidence_url}
                              target="_blank"
                              rel="noreferrer"
                              className="text-blue-400 font-bold hover:underline flex items-center gap-0.5"
                            >
                              View Evidence <ExternalLink className="h-2.5 w-2.5" />
                            </a>
                          )
                        ) : isCompleting ? (
                          <div className="flex gap-2 w-full mt-2 animate-fadeIn">
                            <input
                              type="url"
                              value={evidenceUrl}
                              onChange={(e) => setEvidenceUrl(e.target.value)}
                              placeholder="Evidence link (e.g. GitHub, prototype video)..."
                              className="flex-1 bg-slate-900 border border-slate-750 text-xs rounded-lg px-2.5 py-1 text-slate-100 placeholder-slate-500 focus:outline-none"
                            />
                            <button
                              onClick={() => handleCompleteMilestone(ms.id)}
                              disabled={milestoneSubmitting}
                              className="bg-blue-600 hover:bg-blue-500 text-white rounded-lg px-3 py-1 font-bold text-[10px] cursor-pointer flex items-center gap-1"
                            >
                              {milestoneSubmitting && <Loader2 className="h-3 w-3 animate-spin" />}
                              Submit
                            </button>
                            <button
                              onClick={() => setCompletingMilestoneId(null)}
                              className="border border-slate-750 text-slate-450 hover:bg-slate-800 rounded-lg px-2 py-1 text-[10px]"
                            >
                              Cancel
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => setCompletingMilestoneId(ms.id)}
                            className="bg-slate-800 hover:bg-slate-750 hover:text-white text-slate-350 text-[10px] font-bold px-3 py-1.5 rounded transition-all cursor-pointer"
                          >
                            Mark Completed
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}

      {/* Reviews Tab */}
      {activeTab === 'reviews' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Radar Chart (Span 1) */}
          <div>
            <ReviewsRadarChart 
              humanScores={humanScoresAvg} 
              aiScores={aiScores}
            />
          </div>

          {/* Reviews Comments List (Span 2) */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-6">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-6">Review Comments & Feedback</h3>
              
              {humanReviews.length === 0 ? (
                <div className="text-center py-12 border border-dashed border-slate-800 rounded-xl">
                  <MessageSquare className="h-10 w-10 text-slate-700 mx-auto mb-2" />
                  <span className="text-xs font-semibold text-slate-400 block">No reviews submitted yet</span>
                  <span className="text-[10px] text-slate-500">Wait for assigned reviewers to submit evaluations.</span>
                </div>
              ) : (
                <div className="space-y-4">
                  {humanReviews.map((rev) => (
                    <div key={rev.id} className="p-4 bg-slate-950/40 border border-slate-850 rounded-xl space-y-3">
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="text-xs font-bold text-slate-200">
                            {rev.reviewer?.full_name || 'Anonymous Reviewer'}
                          </h4>
                          <span className="text-[10px] text-slate-500 mt-0.5 uppercase tracking-wider font-bold">
                            Gate: {rev.gate.replace('_', ' ')}
                          </span>
                        </div>
                        <div className="text-right">
                          <span className="text-[9px] font-bold text-slate-500 block">Gate Avg Score</span>
                          <span className="text-xs font-extrabold text-blue-400 block">
                            {Math.round(((rev.score_impact + rev.score_feasibility + rev.score_team + rev.score_innovation + rev.score_market) / 5) * 10) / 10} / 10
                          </span>
                        </div>
                      </div>
                      
                      <p className="text-xs text-slate-350 leading-relaxed italic">
                        "{rev.comments || 'No comments provided.'}"
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Mentor Tab */}
      {activeTab === 'mentor' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-fadeIn">
          {/* Mentor Profile Details (Span 1) */}
          <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-6">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider mb-4 flex items-center gap-2">
              <User className="h-4.5 w-4.5 text-blue-450" />
              Assigned Mentor
            </h3>
            
            {!mentorAssignment ? (
              <div className="text-center py-8">
                <User className="h-8 w-8 text-slate-700 mx-auto mb-2" />
                <span className="text-xs font-semibold text-slate-400 block">No mentor assigned</span>
                <span className="text-[10px] text-slate-500">Wait for admin to match you with a mentor.</span>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="h-12 w-12 rounded-full bg-slate-800 flex items-center justify-center font-bold text-slate-300 text-sm">
                    {mentorAssignment.mentor?.full_name?.charAt(0) || 'M'}
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-white">{mentorAssignment.mentor?.full_name}</h4>
                    <p className="text-[10px] text-slate-450 mt-0.5">{mentorAssignment.mentor?.email}</p>
                  </div>
                </div>
                <div className="pt-3 border-t border-slate-800 text-xs text-slate-350">
                  <span className="font-bold text-slate-400 block mb-1">Status:</span>
                  <span className="capitalize">{mentorAssignment.status}</span>
                </div>
              </div>
            )}
          </div>

          {/* Sessions List (Span 2) */}
          <div className="lg:col-span-2 bg-slate-900/40 border border-slate-800 rounded-2xl p-6">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-6">Mentoring Sessions</h3>
            
            {mentorSessions.length === 0 ? (
              <div className="text-center py-12 border border-dashed border-slate-800 rounded-xl">
                <BookOpen className="h-10 w-10 text-slate-700 mx-auto mb-2" />
                <span className="text-xs font-semibold text-slate-400 block">No sessions scheduled</span>
                <span className="text-[10px] text-slate-500">Keep in touch with your mentor to schedule one.</span>
              </div>
            ) : (
              <div className="space-y-3">
                {mentorSessions.map((session) => (
                  <div key={session.id} className="flex justify-between items-center p-3.5 bg-slate-950/40 border border-slate-800 rounded-xl text-xs">
                    <div>
                      <h4 className="font-bold text-slate-200">Session Call</h4>
                      <p className="text-[10px] text-slate-500 mt-0.5">{new Date(session.scheduled_at).toLocaleDateString()} at {new Date(session.scheduled_at).toLocaleTimeString()}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="bg-slate-900 border border-slate-750 text-[10px] px-2 py-0.5 rounded capitalize">{session.status}</span>
                      {session.meeting_link && (
                        <a
                          href={session.meeting_link}
                          target="_blank"
                          rel="noreferrer"
                          className="bg-blue-650 hover:bg-blue-600 text-white rounded px-2.5 py-1 font-bold text-[10px]"
                        >
                          Join Call
                        </a>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

    </div>
  )
}
