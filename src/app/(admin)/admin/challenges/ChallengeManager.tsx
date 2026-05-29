"use client";

import { useActionState, startTransition, useState } from "react";
import { createChallenge, updateChallenge, gradeSubmission } from "./actions";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { getSdgInfo } from "@/components/ui/sdg-helper";
import { 
  Trophy, 
  Plus, 
  Edit, 
  Check, 
  Trash, 
  Target, 
  Calendar, 
  FileText, 
  Users, 
  Sparkles, 
  ChevronRight, 
  Bookmark, 
  User, 
  Building,
  GraduationCap
} from "lucide-react";
import Link from "next/link";

interface Challenge {
  id: string;
  title: string;
  description: string;
  sponsor_name: string;
  prize_amount: number;
  sector_tags: string[];
  sdg_tags: number[];
  submission_deadline: string;
  judging_deadline: string;
  status: "draft" | "open" | "judging" | "closed" | "archived";
  max_submissions: number | null;
}

interface Submission {
  id: string;
  challenge_id: string;
  project_id: string | null;
  submitter_id: string;
  title: string;
  description: string;
  community_votes: number;
  judge_score_avg: number | null;
  status: "submitted" | "shortlisted" | "winner" | "runner_up" | "not_selected";
  created_at: string;
  profiles: {
    full_name: string;
    email: string;
  } | null;
  challenges: {
    title: string;
  } | null;
  projects: {
    title: string;
    slug: string;
  } | null;
}

interface ChallengeManagerProps {
  challenges: Challenge[];
  submissions: Submission[];
}

export function ChallengeManager({ challenges, submissions }: ChallengeManagerProps) {
  const [activeTab, setActiveTab] = useState<"list" | "create" | "submissions">("list");
  const [editingChallenge, setEditingChallenge] = useState<Challenge | null>(null);
  const [gradingSubmission, setGradingSubmission] = useState<Submission | null>(null);
  
  // Create / Edit Action State
  const [createState, createAction, isCreating] = useActionState(createChallenge, { success: false, message: "" });
  
  // Custom Edit Action wrapper
  const handleEditSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!editingChallenge) return;
    const formData = new FormData(event.currentTarget);
    const result = await updateChallenge(editingChallenge.id, {}, formData);
    if (result.success) {
      alert(result.message);
      setEditingChallenge(null);
      setActiveTab("list");
      window.location.reload();
    } else {
      alert(result.message || "Failed to update challenge.");
    }
  };

  // Grade Action State
  const [gradeState, gradeAction, isGrading] = useActionState(gradeSubmission, { success: false, message: "" });

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-UG", {
      style: "currency",
      currency: "UGX",
      maximumFractionDigits: 0,
    }).format(amount);
  };

  // Filter submissions by specific challenge if user clicked "View Submissions"
  const [selectedChallengeFilter, setSelectedChallengeFilter] = useState<string>("all");

  const filteredSubmissions = selectedChallengeFilter === "all" 
    ? submissions 
    : submissions.filter(sub => sub.challenge_id === selectedChallengeFilter);

  return (
    <div className="space-y-6">
      
      {/* Tab Selectors */}
      <div className="flex border-b border-slate-200 dark:border-slate-800 pb-2 gap-4">
        <button
          onClick={() => { setActiveTab("list"); setEditingChallenge(null); }}
          className={`pb-2 text-sm font-semibold border-b-2 transition-all ${
            activeTab === "list" && !editingChallenge
              ? "border-primary text-foreground"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          All Challenges ({challenges.length})
        </button>

        {editingChallenge && (
          <span className="pb-2 text-sm font-semibold border-b-2 border-amber-500 text-amber-600 dark:text-amber-400">
            Editing: {editingChallenge.title.substring(0, 20)}...
          </span>
        )}

        <button
          onClick={() => { setActiveTab("create"); setEditingChallenge(null); }}
          className={`pb-2 text-sm font-semibold border-b-2 transition-all ${
            activeTab === "create"
              ? "border-primary text-foreground"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          <span className="flex items-center gap-1">
            <Plus className="h-4 w-4" /> Create Challenge
          </span>
        </button>

        <button
          onClick={() => { setActiveTab("submissions"); setEditingChallenge(null); }}
          className={`pb-2 text-sm font-semibold border-b-2 transition-all ${
            activeTab === "submissions"
              ? "border-primary text-foreground"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          Review Submissions ({submissions.length})
        </button>
      </div>

      {/* Tab content */}
      {activeTab === "list" && !editingChallenge && (
        <Card className="border-slate-200 dark:border-slate-800 shadow-sm">
          <CardHeader>
            <CardTitle>Open Innovation Challenges</CardTitle>
            <CardDescription>View, edit, or adjust deadlines of active challenges.</CardDescription>
          </CardHeader>
          <CardContent>
            {challenges.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground text-sm border border-dashed rounded-lg">
                No challenges available. Click "Create Challenge" to launch one.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="bg-muted text-muted-foreground text-xs uppercase">
                    <tr>
                      <th className="p-3 font-semibold">Challenge</th>
                      <th className="p-3 font-semibold">Sponsor</th>
                      <th className="p-3 font-semibold">Prize</th>
                      <th className="p-3 font-semibold">Status</th>
                      <th className="p-3 font-semibold">Deadline</th>
                      <th className="p-3 font-semibold">Entries</th>
                      <th className="p-3 font-semibold text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {challenges.map((c) => {
                      const subsCount = submissions.filter(s => s.challenge_id === c.id).length;
                      return (
                        <tr key={c.id} className="hover:bg-muted/30 transition-colors">
                          <td className="p-3 font-semibold text-slate-900 dark:text-slate-100 max-w-[220px] truncate" title={c.title}>
                            {c.title}
                          </td>
                          <td className="p-3 text-muted-foreground">{c.sponsor_name}</td>
                          <td className="p-3 text-primary font-bold">{formatCurrency(c.prize_amount)}</td>
                          <td className="p-3">
                            <Badge variant={c.status === 'open' ? 'default' : 'secondary'} className="capitalize scale-90">
                              {c.status}
                            </Badge>
                          </td>
                          <td className="p-3 text-xs text-muted-foreground">
                            {new Date(c.submission_deadline).toLocaleDateString()}
                          </td>
                          <td className="p-3 font-semibold">
                            {subsCount}
                          </td>
                          <td className="p-3 text-right space-x-2">
                            <Button 
                              variant="outline" 
                              size="sm" 
                              className="h-8"
                              onClick={() => setEditingChallenge(c)}
                            >
                              <Edit className="h-3.5 w-3.5 mr-1" /> Edit
                            </Button>
                            <Button 
                              variant="secondary" 
                              size="sm" 
                              className="h-8"
                              onClick={() => {
                                setSelectedChallengeFilter(c.id);
                                setActiveTab("submissions");
                              }}
                            >
                              Submissions
                            </Button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Editing Challenge Block */}
      {editingChallenge && (
        <Card className="border-amber-500/20 shadow-md">
          <CardHeader>
            <CardTitle className="text-amber-700 dark:text-amber-400">Edit Challenge</CardTitle>
            <CardDescription>Update details, deadline, and judging rules.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleEditSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* Left Side fields */}
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="title" className="font-semibold text-sm">Challenge Title</Label>
                    <Input id="title" name="title" defaultValue={editingChallenge.title} required />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="sponsorName" className="font-semibold text-sm">Sponsor Name</Label>
                    <Input id="sponsorName" name="sponsorName" defaultValue={editingChallenge.sponsor_name} required />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="prizeAmount" className="font-semibold text-sm">Prize (UGX)</Label>
                      <Input id="prizeAmount" name="prizeAmount" type="number" defaultValue={editingChallenge.prize_amount} required />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="maxSubmissions" className="font-semibold text-sm">Max Entries</Label>
                      <Input id="maxSubmissions" name="maxSubmissions" type="number" defaultValue={editingChallenge.max_submissions || ""} placeholder="e.g. 50" />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="sectorTagsString" className="font-semibold text-sm">Sectors (Comma separated)</Label>
                    <Input id="sectorTagsString" name="sectorTagsString" defaultValue={editingChallenge.sector_tags.join(", ")} placeholder="AgriTech, IoT, AI" required />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="submissionDeadline" className="font-semibold text-sm">Submission Deadline</Label>
                      <Input 
                        id="submissionDeadline" 
                        name="submissionDeadline" 
                        type="datetime-local" 
                        defaultValue={new Date(editingChallenge.submission_deadline).toISOString().substring(0, 16)} 
                        required 
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="judgingDeadline" className="font-semibold text-sm">Judging Deadline</Label>
                      <Input 
                        id="judgingDeadline" 
                        name="judgingDeadline" 
                        type="datetime-local" 
                        defaultValue={new Date(editingChallenge.judging_deadline).toISOString().substring(0, 16)} 
                        required 
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="status" className="font-semibold text-sm">Status</Label>
                    <select
                      id="status"
                      name="status"
                      defaultValue={editingChallenge.status}
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    >
                      <option value="draft">Draft</option>
                      <option value="open">Open</option>
                      <option value="judging">Judging</option>
                      <option value="closed">Closed</option>
                      <option value="archived">Archived</option>
                    </select>
                  </div>
                </div>

                {/* Right Side: SDGs and Description */}
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="description" className="font-semibold text-sm">Challenge Scope Description</Label>
                    <Textarea id="description" name="description" rows={6} defaultValue={editingChallenge.description} required />
                  </div>

                  <div className="space-y-2">
                    <Label className="font-semibold text-sm block mb-1">Target UN SDGs</Label>
                    <div className="grid grid-cols-2 gap-2 max-h-[220px] overflow-y-auto border p-3 rounded-md bg-muted/20">
                      {Array.from({ length: 17 }, (_, i) => i + 1).map((num) => {
                        const isChecked = editingChallenge.sdg_tags.includes(num);
                        return (
                          <label key={num} className="flex items-center gap-2 text-xs font-semibold cursor-pointer p-1 hover:bg-muted rounded">
                            <input
                              type="checkbox"
                              name={`sdg-${num}`}
                              defaultChecked={isChecked}
                              className="rounded border-gray-300 text-primary focus:ring-primary h-3.5 w-3.5"
                            />
                            <span>SDG {num}</span>
                          </label>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex gap-4 border-t pt-4 justify-end">
                <Button type="button" variant="outline" onClick={() => setEditingChallenge(null)}>
                  Cancel
                </Button>
                <Button type="submit" className="bg-amber-600 hover:bg-amber-700 font-semibold">
                  Save Changes
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Tab: Create Challenge */}
      {activeTab === "create" && (
        <Card className="border-slate-200 dark:border-slate-800 shadow-md">
          <CardHeader>
            <CardTitle>Launch New Challenge</CardTitle>
            <CardDescription>Set scope, awards, deadlines, and parameters.</CardDescription>
          </CardHeader>
          <CardContent>
            <form action={async (fd) => {
              const res = await createChallenge({}, fd);
              if (res.success) {
                alert(res.message);
                setActiveTab("list");
                window.location.reload();
              } else {
                alert(res.message);
              }
            }} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* Left Side */}
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="title" className="font-semibold text-sm">Challenge Title</Label>
                    <Input id="title" name="title" placeholder="e.g. Smart Irrigation System" required />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="sponsorName" className="font-semibold text-sm">Sponsor Name</Label>
                    <Input id="sponsorName" name="sponsorName" placeholder="e.g. USAID, TIC" required />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="prizeAmount" className="font-semibold text-sm">Prize Pool (UGX)</Label>
                      <Input id="prizeAmount" name="prizeAmount" type="number" placeholder="10000000" required />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="maxSubmissions" className="font-semibold text-sm">Max Submissions</Label>
                      <Input id="maxSubmissions" name="maxSubmissions" type="number" placeholder="50" />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="sectorTagsString" className="font-semibold text-sm">Sectors (Comma separated)</Label>
                    <Input id="sectorTagsString" name="sectorTagsString" placeholder="AgriTech, BioTech, IoT" required />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="submissionDeadline" className="font-semibold text-sm">Submission Deadline</Label>
                      <Input id="submissionDeadline" name="submissionDeadline" type="datetime-local" required />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="judgingDeadline" className="font-semibold text-sm">Judging Deadline</Label>
                      <Input id="judgingDeadline" name="judgingDeadline" type="datetime-local" required />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="status" className="font-semibold text-sm">Initial Status</Label>
                    <select
                      id="status"
                      name="status"
                      defaultValue="draft"
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    >
                      <option value="draft">Draft / Coming Soon</option>
                      <option value="open">Open / Live</option>
                    </select>
                  </div>
                </div>

                {/* Right Side */}
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="description" className="font-semibold text-sm">Challenge Scope Description</Label>
                    <Textarea id="description" name="description" rows={6} placeholder="Detail the criteria, problem statements, expected deliverables, and judging rules..." required />
                  </div>

                  <div className="space-y-2">
                    <Label className="font-semibold text-sm block mb-1">Target UN SDGs</Label>
                    <div className="grid grid-cols-2 gap-2 max-h-[220px] overflow-y-auto border p-3 rounded-md bg-muted/20">
                      {Array.from({ length: 17 }, (_, i) => i + 1).map((num) => (
                        <label key={num} className="flex items-center gap-2 text-xs font-semibold cursor-pointer p-1 hover:bg-muted rounded">
                          <input
                            type="checkbox"
                            name={`sdg-${num}`}
                            className="rounded border-gray-300 text-primary focus:ring-primary h-3.5 w-3.5"
                          />
                          <span>SDG {num}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-4 border-t pt-4">
                <Button type="submit" disabled={isCreating} className="font-semibold shadow-sm">
                  {isCreating ? "Creating..." : "Launch Challenge"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Tab: Submissions */}
      {activeTab === "submissions" && (
        <Card className="border-slate-200 dark:border-slate-800 shadow-sm">
          <CardHeader className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <CardTitle>Challenge Entries & Grading</CardTitle>
              <CardDescription>Review submission proposals, inspect projects, and submit scores.</CardDescription>
            </div>
            
            {/* Filter by Challenge */}
            <div className="flex items-center gap-2">
              <Label htmlFor="challengeFilter" className="text-xs font-bold text-muted-foreground whitespace-nowrap">Filter Challenge:</Label>
              <select
                id="challengeFilter"
                value={selectedChallengeFilter}
                onChange={(e) => setSelectedChallengeFilter(e.target.value)}
                className="text-xs rounded border bg-background px-2 py-1"
              >
                <option value="all">All Challenges</option>
                {challenges.map(c => (
                  <option key={c.id} value={c.id}>{c.title}</option>
                ))}
              </select>
            </div>
          </CardHeader>
          <CardContent>
            {filteredSubmissions.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground text-sm border border-dashed rounded-lg">
                No submissions found for this challenge.
              </div>
            ) : (
              <div className="space-y-4">
                {filteredSubmissions.map((sub) => (
                  <div key={sub.id} className="p-4 border rounded-lg bg-muted/10 space-y-4">
                    
                    {/* Header info */}
                    <div className="flex flex-wrap items-start justify-between gap-4">
                      <div>
                        <span className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider block">
                          Challenge: {sub.challenges?.title || "Unknown Challenge"}
                        </span>
                        <h4 className="text-lg font-bold text-slate-900 dark:text-slate-50 mt-0.5">{sub.title}</h4>
                        <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1 font-semibold text-slate-700 dark:text-slate-350">
                            <User className="h-3.5 w-3.5 text-slate-400" /> By {sub.profiles?.full_name || "Unknown"} ({sub.profiles?.email})
                          </span>
                          <span>•</span>
                          <span>Submitted: {new Date(sub.created_at).toLocaleDateString()}</span>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-3">
                        {sub.judge_score_avg !== null && (
                          <div className="text-right">
                            <div className="text-[10px] text-muted-foreground font-semibold">Judge Score</div>
                            <div className="text-base font-extrabold text-indigo-600 dark:text-indigo-400">{sub.judge_score_avg}/100</div>
                          </div>
                        )}
                        <Badge variant="outline" className={`capitalize py-1 px-3 ${
                          sub.status === 'winner' ? 'bg-amber-500/10 text-amber-600 border-amber-500/20' :
                          sub.status === 'runner_up' ? 'bg-indigo-500/10 text-indigo-650 border-indigo-500/20' :
                          sub.status === 'shortlisted' ? 'bg-sky-500/10 text-sky-650 border-sky-500/20' :
                          'bg-slate-500/10 text-slate-650'
                        }`}>
                          {sub.status}
                        </Badge>
                      </div>
                    </div>

                    {/* Proposal Body */}
                    <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed whitespace-pre-wrap">
                      {sub.description}
                    </p>

                    {/* Linked Project info */}
                    {sub.project_id && sub.projects && (
                      <div className="p-2.5 rounded border border-slate-200 dark:border-slate-800 bg-background text-xs flex items-center justify-between">
                        <span className="text-muted-foreground">
                          Linked Portal Project: <strong className="text-slate-800 dark:text-slate-200">{sub.projects.title}</strong>
                        </span>
                        <Link
                          href={`/projects/${sub.projects.slug}`}
                          className={cn(buttonVariants({ variant: "ghost", size: "sm" }), "h-7 text-xs text-primary font-semibold hover:underline")}
                        >
                          Open Project Page <ChevronRight className="h-3 w-3 ml-0.5" />
                        </Link>
                      </div>
                    )}

                    {/* Grade Section Button */}
                    <div className="flex border-t pt-3 justify-end">
                      {gradingSubmission?.id === sub.id ? (
                        <form action={async (fd) => {
                          const res = await gradeSubmission({}, fd);
                          if (res.success) {
                            alert(res.message);
                            setGradingSubmission(null);
                            window.location.reload();
                          } else {
                            alert(res.message);
                          }
                        }} className="flex flex-wrap items-end gap-4 bg-muted/40 p-3 rounded border w-full md:w-auto">
                          <input type="hidden" name="submissionId" value={sub.id} />
                          
                          <div className="space-y-1.5 shrink-0">
                            <Label htmlFor="score" className="text-xs font-bold">Review Score (0 - 100)</Label>
                            <Input
                              id="score"
                              name="score"
                              type="number"
                              defaultValue={sub.judge_score_avg || ""}
                              placeholder="e.g. 85"
                              required
                              className="h-8 w-32 bg-background"
                            />
                          </div>

                          <div className="space-y-1.5 shrink-0">
                            <Label htmlFor="status" className="text-xs font-bold">Decision Status</Label>
                            <select
                              id="status"
                              name="status"
                              defaultValue={sub.status}
                              className="flex h-8 w-44 rounded-md border border-input bg-background px-3 text-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                            >
                              <option value="submitted">Submitted</option>
                              <option value="shortlisted">Shortlisted</option>
                              <option value="winner">Winner</option>
                              <option value="runner_up">Runner Up</option>
                              <option value="not_selected">Not Selected</option>
                            </select>
                          </div>

                          <div className="flex gap-2 h-8 items-end ml-auto">
                            <Button type="button" variant="outline" size="sm" className="h-8" onClick={() => setGradingSubmission(null)}>
                              Cancel
                            </Button>
                            <Button type="submit" size="sm" className="h-8 font-semibold bg-emerald-600 hover:bg-emerald-700">
                              Submit Grade
                            </Button>
                          </div>
                        </form>
                      ) : (
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="h-8"
                          onClick={() => setGradingSubmission(sub)}
                        >
                          Grade / Change Status
                        </Button>
                      )}
                    </div>

                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

    </div>
  );
}
