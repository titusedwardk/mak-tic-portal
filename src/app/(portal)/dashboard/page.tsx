import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  Plus, 
  BookOpen, 
  Calendar, 
  Award, 
  Users, 
  Clock, 
  ChevronRight, 
  ExternalLink,
  DollarSign, 
  CheckCircle2, 
  Hourglass,
  AlertCircle,
  PlayCircle,
  HelpCircle,
  Video,
  FileText,
  User,
  ShieldCheck,
  TrendingUp,
  MapPin,
  Trophy
} from "lucide-react";

export const dynamic = "force-dynamic";

const PIPELINE_STAGES = [
  { key: "submitted", label: "Submitted", desc: "Initial entry" },
  { key: "screening", label: "Screening", desc: "Staff review" },
  { key: "problem_validation", label: "Problem Validation", desc: "Customer proof" },
  { key: "solution_viability", label: "Solution Viability", desc: "Prototype build" },
  { key: "impact_assessment", label: "Impact Assessment", desc: "SDG alignment" },
  { key: "prototype_review", label: "Prototype Review", desc: "Technical test" },
  { key: "commercialization", label: "Commercialization", desc: "Market launch" },
  { key: "graduated", label: "Graduated", desc: "Ready for exit" }
];

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Fetch all user profile information
  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  // Fetch innovator projects
  const { data: projects } = await supabase
    .from("projects")
    .select("*")
    .eq("owner_id", user.id)
    .order("created_at", { ascending: false });

  const activeProject = projects?.[0];

  // Fetch project milestones
  const { data: milestones } = activeProject ? await supabase
    .from("project_milestones")
    .select("*")
    .eq("project_id", activeProject.id)
    .order("due_date", { ascending: true }) : { data: null };

  // Fetch funding details
  const { data: allocations } = activeProject ? await supabase
    .from("funding_allocations")
    .select("*, source:funding_sources(*)")
    .eq("project_id", activeProject.id) : { data: null };

  const allocationIds = allocations?.map(a => a.id) || [];
  
  const { data: tranches } = allocationIds.length > 0 ? await supabase
    .from("funding_tranches")
    .select("*")
    .in("allocation_id", allocationIds)
    .order("disbursed_at", { ascending: false, nullsFirst: true }) : { data: null };

  // Fetch mentor sessions
  const { data: assignments } = projects && projects.length > 0 ? await supabase
    .from("mentor_assignments")
    .select("*")
    .in("project_id", projects.map(p => p.id))
    .eq("status", "active") : { data: null };

  const mentorIds = Array.from(new Set((assignments || []).map(a => a.mentor_id)));

  const { data: mentorProfiles } = mentorIds.length > 0 ? await supabase
    .from("profiles")
    .select("id, full_name, avatar_url")
    .in("id", mentorIds) : { data: null };

  const assignmentIds = (assignments || []).map(a => a.id);

  const { data: upcomingSessions } = assignmentIds.length > 0 ? await supabase
    .from("mentor_sessions")
    .select("*")
    .in("assignment_id", assignmentIds)
    .gte("scheduled_at", new Date().toISOString())
    .order("scheduled_at", { ascending: true }) : { data: null };

  const sessionsWithDetails = (upcomingSessions || []).map(session => {
    const assignment = (assignments || []).find(a => a.id === session.assignment_id);
    const mentor = (mentorProfiles || []).find(m => m.id === assignment?.mentor_id);
    return {
      ...session,
      mentorName: mentor?.full_name || "Assigned Mentor",
      mentorAvatar: mentor?.avatar_url || null
    };
  });

  const nextSession = sessionsWithDetails?.[0];

  // Fetch bookings
  const { data: bookings } = await supabase
    .from("bookings")
    .select("*, facility:facilities(*)")
    .eq("booked_by", user.id)
    .order("start_time", { ascending: true });

  // Fetch LMS progress
  const { data: courses } = await supabase
    .from("courses")
    .select("*, course_modules(*)")
    .eq("published", true)
    .order("sort_order", { ascending: true });

  const { data: progress } = await supabase
    .from("course_progress")
    .select("*")
    .eq("user_id", user.id);

  const coursesWithProgress = (courses || []).map(course => {
    const totalModules = course.course_modules?.length || 0;
    if (totalModules === 0) return { ...course, progressPercent: 0, completedModules: 0, totalModules: 0 };
    
    const completedModuleIds = new Set(
      (progress || [])
        .filter(p => p.course_id === course.id)
        .map(p => p.module_id)
    );
    
    const completedCount = course.course_modules.filter((m: any) => completedModuleIds.has(m.id)).length;
    const percent = Math.round((completedCount / totalModules) * 100);
    
    return {
      ...course,
      progressPercent: percent,
      completedModules: completedCount,
      totalModules: totalModules
    };
  });

  // Fetch challenges
  const { data: activeChallenges } = await supabase
    .from("challenges")
    .select("*")
    .eq("status", "open")
    .gte("submission_deadline", new Date().toISOString())
    .order("submission_deadline", { ascending: true });

  // UI calculations
  const activeStageIndex = activeProject 
    ? PIPELINE_STAGES.findIndex(s => s.key === activeProject.stage)
    : -1;

  return (
    <div className="space-y-8 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2">
      {/* Premium Dashboard Header Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-slate-950 via-slate-900 to-indigo-950 text-white p-6 md:p-8 shadow-xl border border-slate-800">
        <div className="absolute right-0 top-0 translate-x-16 -translate-y-16 w-80 h-80 rounded-full bg-amber-500/10 blur-3xl pointer-events-none" />
        <div className="absolute left-1/3 bottom-0 translate-y-1/2 w-60 h-60 rounded-full bg-indigo-500/10 blur-3xl pointer-events-none" />
        
        <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <Badge className="bg-amber-500/20 text-amber-300 border-amber-500/30 font-semibold px-2.5 py-0.5 text-xs uppercase tracking-wider">
                Innovator Command Center
              </Badge>
              {profile?.department && (
                <Badge variant="outline" className="text-slate-300 border-slate-700">
                  {profile.department}
                </Badge>
              )}
            </div>
            <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight">
              Welcome back, <span className="bg-gradient-to-r from-amber-400 via-amber-200 to-white bg-clip-text text-transparent">{profile?.full_name || "Innovator"}</span>
            </h1>
            <p className="text-slate-400 text-sm max-w-xl">
              Track your project pipeline status, manage facility access, book mentor sessions, and keep your learning milestones on track.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <Link href="/projects/new">
              <Button className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold rounded-xl shadow-lg shadow-amber-500/10 flex items-center gap-2">
                <Plus className="h-4 w-4 stroke-[3]" />
                New Project
              </Button>
            </Link>
            <Link href="/facilities">
              <Button variant="outline" className="border-slate-700 hover:bg-slate-800 text-slate-200 font-semibold rounded-xl">
                Book Space / Tools
              </Button>
            </Link>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Columns - Project Pipeline & Details */}
        <div className="lg:col-span-2 space-y-8">
          {activeProject ? (
            <>
              {/* Project Status & Stepper Tracker */}
              <Card className="shadow-lg border-slate-200 dark:border-slate-800 overflow-hidden">
                <CardHeader className="bg-slate-50/50 dark:bg-slate-900/30 border-b border-slate-100 dark:border-slate-800/80">
                  <div className="flex justify-between items-start gap-4">
                    <div>
                      <CardTitle className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
                        {activeProject.title}
                      </CardTitle>
                      <CardDescription className="line-clamp-2 mt-1.5 text-sm">
                        {activeProject.description}
                      </CardDescription>
                    </div>
                    <div className="flex flex-col items-end gap-1.5 shrink-0">
                      <Badge className="bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-950/30 dark:text-indigo-400 dark:border-indigo-900/30 font-semibold capitalize text-xs">
                        {activeProject.track.replace("_", " ")}
                      </Badge>
                      <Badge variant="outline" className="capitalize text-xs">
                        {activeProject.status}
                      </Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-6">
                  {/* Stepper Pipeline UI */}
                  <div className="space-y-6">
                    <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-500 flex items-center gap-2">
                      <TrendingUp className="h-4 w-4 text-amber-500" />
                      Mak-TIC Pipeline Progression
                    </h3>
                    <div className="relative">
                      {/* Connector Line */}
                      <div className="absolute top-[18px] left-[15px] right-[15px] h-[3px] bg-slate-100 dark:bg-slate-800 -z-0" />
                      <div 
                        className="absolute top-[18px] left-[15px] h-[3px] bg-amber-500 transition-all duration-500 -z-0" 
                        style={{ width: `${activeStageIndex >= 0 ? (activeStageIndex / (PIPELINE_STAGES.length - 1)) * 100 : 0}%` }}
                      />

                      {/* Stepper Steps */}
                      <div className="relative z-10 flex justify-between">
                        {PIPELINE_STAGES.map((stage, idx) => {
                          const isCompleted = idx < activeStageIndex;
                          const isActive = idx === activeStageIndex;
                          
                          return (
                            <div key={stage.key} className="flex flex-col items-center group">
                              <div className={`w-9 h-9 rounded-full flex items-center justify-center border-2 transition-all duration-300 ${
                                isCompleted 
                                  ? "bg-amber-500 border-amber-500 text-slate-950" 
                                  : isActive 
                                    ? "bg-slate-900 dark:bg-slate-100 border-amber-500 text-amber-500 shadow-md shadow-amber-500/30 animate-pulse" 
                                    : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-400"
                              }`}>
                                {isCompleted ? (
                                  <CheckCircle2 className="h-5 w-5 stroke-[2.5]" />
                                ) : (
                                  <span className="text-xs font-bold">{idx + 1}</span>
                                )}
                              </div>
                              <span className={`text-[10px] md:text-xs font-semibold mt-2.5 text-center max-w-[64px] md:max-w-[80px] line-clamp-1 transition-colors ${
                                isActive 
                                  ? "text-amber-600 dark:text-amber-400 font-bold" 
                                  : isCompleted 
                                    ? "text-slate-800 dark:text-slate-200" 
                                    : "text-slate-400"
                              }`}>
                                {stage.label}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="bg-slate-50/30 dark:bg-slate-900/10 border-t border-slate-100 dark:border-slate-800 pb-4 pt-4 flex justify-between items-center text-xs">
                  <div className="flex items-center gap-1.5 text-muted-foreground">
                    <Clock className="h-3.5 w-3.5" />
                    <span>Last updated: {new Date(activeProject.updated_at || activeProject.created_at).toLocaleDateString()}</span>
                  </div>
                  <Link href={`/projects/${activeProject.slug}`}>
                    <Button variant="ghost" size="sm" className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 font-semibold p-0 flex items-center gap-1 h-auto">
                      Review Submission Details
                      <ChevronRight className="h-3.5 w-3.5" />
                    </Button>
                  </Link>
                </CardFooter>
              </Card>

              {/* Project Milestones Progress */}
              <Card className="shadow-lg border-slate-200 dark:border-slate-800">
                <CardHeader>
                  <CardTitle className="text-xl font-bold flex items-center gap-2 text-slate-900 dark:text-slate-100">
                    <CheckCircle2 className="h-5 w-5 text-amber-500" />
                    Project Milestones
                  </CardTitle>
                  <CardDescription>
                    Complete these milestones to unlock subsequent project funding tranches.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {milestones && milestones.length > 0 ? (
                    <div className="space-y-4">
                      {milestones.map((milestone) => {
                        const isCompleted = milestone.status === "completed";
                        const isInProgress = milestone.status === "in_progress";
                        
                        return (
                          <div 
                            key={milestone.id} 
                            className={`flex items-start gap-4 p-4 rounded-xl border transition-all ${
                              isCompleted 
                                ? "bg-slate-50/40 border-slate-100 dark:bg-slate-900/10 dark:border-slate-800/50" 
                                : isInProgress
                                  ? "bg-amber-50/20 border-amber-100 dark:bg-amber-950/5 dark:border-amber-900/20 shadow-sm"
                                  : "border-slate-100 dark:border-slate-800/60"
                            }`}
                          >
                            <div className="mt-0.5">
                              {isCompleted ? (
                                <Badge className="bg-emerald-500/10 text-emerald-600 dark:bg-emerald-950/20 dark:text-emerald-400 p-1 rounded-full border border-emerald-500/20">
                                  <CheckCircle2 className="h-4 w-4" />
                                </Badge>
                              ) : isInProgress ? (
                                <Badge className="bg-amber-500/10 text-amber-600 dark:bg-amber-950/20 dark:text-amber-400 p-1 rounded-full border border-amber-500/20 animate-pulse">
                                  <Hourglass className="h-4 w-4" />
                                </Badge>
                              ) : (
                                <Badge className="bg-slate-100 text-slate-400 dark:bg-slate-800 dark:text-slate-600 p-1 rounded-full border border-slate-200 dark:border-slate-800">
                                  <Clock className="h-4 w-4" />
                                </Badge>
                              )}
                            </div>
                            <div className="space-y-1 flex-1">
                              <div className="flex justify-between items-start gap-4">
                                <h4 className={`text-sm font-bold leading-tight ${isCompleted ? "text-slate-500 line-through" : "text-slate-900 dark:text-slate-100"}`}>
                                  {milestone.title}
                                </h4>
                                {milestone.due_date && (
                                  <span className="text-xs text-muted-foreground whitespace-nowrap">
                                    Due: {new Date(milestone.due_date).toLocaleDateString()}
                                  </span>
                                )}
                              </div>
                              <p className="text-xs text-muted-foreground leading-relaxed">
                                {milestone.description}
                              </p>
                              {milestone.evidence_url && (
                                <a 
                                  href={milestone.evidence_url} 
                                  target="_blank" 
                                  rel="noopener noreferrer" 
                                  className="inline-flex items-center gap-1 text-[11px] text-indigo-600 dark:text-indigo-400 hover:underline pt-1.5 font-medium"
                                >
                                  <FileText className="h-3 w-3" />
                                  View Submitted Evidence
                                  <ExternalLink className="h-2.5 w-2.5" />
                                </a>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="text-center py-8 bg-slate-50/50 dark:bg-slate-900/20 border border-dashed rounded-2xl border-slate-200 dark:border-slate-800">
                      <HelpCircle className="h-10 w-10 text-slate-400 mx-auto mb-2" />
                      <p className="text-sm font-medium text-slate-600 dark:text-slate-400">No milestones registered yet</p>
                      <p className="text-xs text-muted-foreground mt-0.5">Please consult your coordinator to set up project milestones.</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Funding & Tranches overview */}
              <Card className="shadow-lg border-slate-200 dark:border-slate-800">
                <CardHeader>
                  <CardTitle className="text-xl font-bold flex items-center gap-2 text-slate-900 dark:text-slate-100">
                    <DollarSign className="h-5 w-5 text-amber-500" />
                    Funding Allocations & Tranches
                  </CardTitle>
                  <CardDescription>
                    Review grants assigned to your project and track payment disbursement status.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {allocations && allocations.length > 0 ? (
                    <div className="space-y-6">
                      {allocations.map((alloc) => {
                        const total = Number(alloc.total_amount);
                        const disbursed = Number(alloc.disbursed_amount || 0);
                        const percentage = total > 0 ? Math.round((disbursed / total) * 100) : 0;
                        
                        return (
                          <div key={alloc.id} className="space-y-4">
                            <div className="bg-slate-50 dark:bg-slate-900/30 p-4 rounded-xl border border-slate-100 dark:border-slate-800">
                              <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2 mb-3">
                                <div>
                                  <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                                    {alloc.source?.name || "Innovation Grant"}
                                  </h4>
                                  <p className="text-xs text-muted-foreground">Source: {alloc.source?.currency || "UGX"}</p>
                                </div>
                                <div className="text-right">
                                  <span className="text-lg font-bold text-slate-900 dark:text-slate-100">
                                    {alloc.source?.currency || "UGX"} {disbursed.toLocaleString()}
                                  </span>
                                  <span className="text-xs text-muted-foreground block">
                                    of {total.toLocaleString()} allocated
                                  </span>
                                </div>
                              </div>
                              <div className="space-y-1.5">
                                <div className="flex justify-between text-xs text-muted-foreground">
                                  <span>Disbursement Progress</span>
                                  <span>{percentage}% Complete</span>
                                </div>
                                <Progress value={percentage} className="h-2 bg-slate-100 dark:bg-slate-800" />
                              </div>
                            </div>

                            {/* Tranches for this allocation */}
                            <div className="space-y-3">
                              <h5 className="text-xs font-bold uppercase tracking-wider text-slate-500">Tranches Releases</h5>
                              
                              {tranches && tranches.filter(t => t.allocation_id === alloc.id).length > 0 ? (
                                <div className="overflow-x-auto">
                                  <table className="w-full text-left text-xs border-collapse">
                                    <thead>
                                      <tr className="border-b border-slate-200 dark:border-slate-800 text-muted-foreground font-semibold">
                                        <th className="py-2.5 px-3">Tranche Amount</th>
                                        <th className="py-2.5 px-3">Method</th>
                                        <th className="py-2.5 px-3">Payment Reference</th>
                                        <th className="py-2.5 px-3">Status</th>
                                        <th className="py-2.5 px-3 text-right">Date</th>
                                      </tr>
                                    </thead>
                                    <tbody>
                                      {tranches.filter(t => t.allocation_id === alloc.id).map((tranche) => (
                                        <tr key={tranche.id} className="border-b border-slate-100 dark:border-slate-800/60 hover:bg-slate-50/50 dark:hover:bg-slate-900/10">
                                          <td className="py-3 px-3 font-bold text-slate-900 dark:text-slate-100">
                                            {alloc.source?.currency || "UGX"} {Number(tranche.amount).toLocaleString()}
                                          </td>
                                          <td className="py-3 px-3 capitalize text-muted-foreground">
                                            {tranche.payment_method?.replace("_", " ")}
                                          </td>
                                          <td className="py-3 px-3 font-mono text-[11px] text-muted-foreground">
                                            {tranche.payment_ref || "—"}
                                          </td>
                                          <td className="py-3 px-3">
                                            <Badge className={
                                              tranche.status === "disbursed"
                                                ? "bg-emerald-500/15 text-emerald-600 dark:bg-emerald-950/20 dark:text-emerald-400 hover:bg-emerald-500/20"
                                                : tranche.status === "pending"
                                                  ? "bg-amber-500/15 text-amber-600 dark:bg-amber-950/20 dark:text-amber-400 hover:bg-amber-500/20"
                                                  : tranche.status === "processing"
                                                    ? "bg-blue-500/15 text-blue-600 dark:bg-blue-950/20 dark:text-blue-400 hover:bg-blue-500/20 animate-pulse"
                                                    : "bg-rose-500/15 text-rose-600 dark:bg-rose-950/20 dark:text-rose-400 hover:bg-rose-500/20"
                                            }>
                                              {tranche.status}
                                            </Badge>
                                          </td>
                                          <td className="py-3 px-3 text-right text-muted-foreground">
                                            {tranche.disbursed_at 
                                              ? new Date(tranche.disbursed_at).toLocaleDateString()
                                              : "Pending"
                                            }
                                          </td>
                                        </tr>
                                      ))}
                                    </tbody>
                                  </table>
                                </div>
                              ) : (
                                <p className="text-xs text-muted-foreground italic pl-3">No funding tranches requested for this allocation yet.</p>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="text-center py-8 bg-slate-50/50 dark:bg-slate-900/20 border border-dashed rounded-2xl border-slate-200 dark:border-slate-800">
                      <DollarSign className="h-10 w-10 text-slate-400 mx-auto mb-2" />
                      <p className="text-sm font-medium text-slate-600 dark:text-slate-400">No active funding allocations</p>
                      <p className="text-xs text-muted-foreground mt-0.5">Your project will receive funding details once approved by the board.</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </>
          ) : (
            /* Empty state for Projects */
            <Card className="flex flex-col items-center justify-center p-12 text-center shadow-md border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
              <div className="h-12 w-12 rounded-full bg-amber-500/10 flex items-center justify-center text-amber-600 dark:text-amber-400 mb-4">
                <Plus className="h-6 w-6" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100">Start Your Innovation Journey</h3>
              <p className="text-slate-500 dark:text-slate-400 mt-2 max-w-sm text-sm">
                You haven't submitted any projects to the Mak-TIC platform yet. Pitch your idea or prototype to gain mentorship and funding.
              </p>
              <div className="mt-6">
                <Link href="/projects/new">
                  <Button className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold px-6 py-2.5 rounded-xl shadow-lg shadow-amber-500/10">
                    Submit New Project
                  </Button>
                </Link>
              </div>
            </Card>
          )}
        </div>

        {/* Right Sidebar - Mentorship, Learning, Bookings, Challenges */}
        <div className="space-y-8">
          {/* Mentorship Highlights */}
          <Card className="shadow-lg overflow-hidden border-none bg-gradient-to-br from-indigo-950 via-slate-950 to-indigo-900 text-white">
            <CardHeader className="pb-3 border-b border-white/5">
              <CardTitle className="text-lg font-bold flex items-center gap-2">
                <Users className="h-5 w-5 text-amber-400" />
                Mentorship Session
              </CardTitle>
              <CardDescription className="text-indigo-200/60 text-xs">
                Learn from industry and academic leaders.
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-5 space-y-4">
              {nextSession ? (
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-white/10 flex items-center justify-center overflow-hidden border border-white/10 text-white font-bold text-sm shrink-0">
                      {nextSession.mentorAvatar ? (
                        <img src={nextSession.mentorAvatar} alt={nextSession.mentorName} className="object-cover h-full w-full" />
                      ) : (
                        <User className="h-5 w-5" />
                      )}
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-white leading-snug">{nextSession.mentorName}</h4>
                      <Badge className="bg-amber-500/20 text-amber-300 border-none text-[10px] mt-0.5 py-0">
                        Primary Mentor
                      </Badge>
                    </div>
                  </div>

                  <div className="space-y-2 p-3 bg-white/5 rounded-xl border border-white/10 text-xs">
                    <div className="flex items-center gap-2 text-indigo-200">
                      <Calendar className="h-3.5 w-3.5" />
                      <span>{new Date(nextSession.scheduled_at).toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" })}</span>
                    </div>
                    <div className="flex items-center gap-2 text-indigo-200">
                      <Clock className="h-3.5 w-3.5" />
                      <span>{new Date(nextSession.scheduled_at).toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" })} ({nextSession.duration_minutes} mins)</span>
                    </div>
                  </div>

                  {nextSession.meeting_link && (
                    <a 
                      href={nextSession.meeting_link} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className={buttonVariants({
                        className: "w-full bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold rounded-xl shadow-lg flex items-center justify-center gap-2 text-xs py-2.5",
                      })}
                    >
                      <Video className="h-4 w-4" />
                      Join Google Meet
                    </a>
                  )}
                </div>
              ) : (
                <div className="text-center py-6">
                  <Users className="h-8 w-8 text-white/20 mx-auto mb-2" />
                  <p className="text-xs font-semibold text-indigo-200">No scheduled sessions</p>
                  <p className="text-[11px] text-indigo-300/60 mt-0.5">Your mentor will schedule your next evaluation session soon.</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Enrolled Courses / LMS Progress */}
          <Card className="shadow-lg border-slate-200 dark:border-slate-800">
            <CardHeader className="pb-3 border-b border-slate-100 dark:border-slate-800">
              <CardTitle className="text-lg font-bold flex items-center gap-2 text-slate-900 dark:text-slate-100">
                <BookOpen className="h-5 w-5 text-amber-500" />
                Academy Progress
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4 space-y-4">
              {coursesWithProgress && coursesWithProgress.length > 0 ? (
                <div className="space-y-4">
                  {coursesWithProgress.slice(0, 3).map((course) => (
                    <div key={course.id} className="space-y-2">
                      <div className="flex justify-between items-start gap-4">
                        <div>
                          <Link href={`/courses/${course.id}`} className="text-xs font-bold text-slate-900 dark:text-slate-100 hover:underline line-clamp-1">
                            {course.title}
                          </Link>
                          <span className="text-[10px] text-muted-foreground capitalize">{course.category}</span>
                        </div>
                        <span className="text-xs font-bold text-slate-700 dark:text-slate-300 whitespace-nowrap">
                          {course.progressPercent}%
                        </span>
                      </div>
                      <Progress value={course.progressPercent} className="h-1.5 bg-slate-100 dark:bg-slate-800" />
                    </div>
                  ))}
                  <Link href="/courses" className="block text-center mt-2">
                    <Button variant="outline" size="sm" className="w-full text-xs font-semibold rounded-xl">
                      Browse Academy Catalog
                    </Button>
                  </Link>
                </div>
              ) : (
                <div className="text-center py-6">
                  <BookOpen className="h-8 w-8 text-slate-300 dark:text-slate-700 mx-auto mb-2" />
                  <p className="text-xs font-semibold">No active courses</p>
                  <Link href="/courses" className="mt-2 inline-block">
                    <Button size="sm" variant="outline" className="text-xs font-semibold rounded-xl">
                      Explore Academy
                    </Button>
                  </Link>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Facility Bookings */}
          <Card className="shadow-lg border-slate-200 dark:border-slate-800">
            <CardHeader className="pb-3 border-b border-slate-100 dark:border-slate-800">
              <CardTitle className="text-lg font-bold flex items-center gap-2 text-slate-900 dark:text-slate-100">
                <Calendar className="h-5 w-5 text-amber-500" />
                MakerSpace Bookings
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4 space-y-4">
              {bookings && bookings.length > 0 ? (
                <div className="space-y-3">
                  {bookings.slice(0, 3).map((booking) => {
                    const status = booking.status || "pending";
                    return (
                      <div key={booking.id} className="p-3 bg-slate-50/50 dark:bg-slate-900/10 border border-slate-100 dark:border-slate-800 rounded-xl flex items-center justify-between gap-4 text-xs">
                        <div className="space-y-1">
                          <h4 className="font-bold text-slate-900 dark:text-slate-100 line-clamp-1">{booking.facility?.name || "Facility"}</h4>
                          <div className="flex items-center gap-1.5 text-muted-foreground">
                            <Clock className="h-3 w-3" />
                            <span>
                              {new Date(booking.start_time).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
                              {" • "}
                              {new Date(booking.start_time).toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" })}
                            </span>
                          </div>
                          {booking.facility?.location && (
                            <div className="flex items-center gap-1.5 text-muted-foreground text-[10px]">
                              <MapPin className="h-3 w-3" />
                              <span>{booking.facility.location}</span>
                            </div>
                          )}
                        </div>
                        <Badge className={
                          status === "approved"
                            ? "bg-emerald-500/10 text-emerald-600 dark:bg-emerald-950/20 dark:text-emerald-400 border border-emerald-500/20 font-semibold"
                            : status === "pending"
                              ? "bg-amber-500/10 text-amber-600 dark:bg-amber-950/20 dark:text-amber-400 border border-amber-500/20 font-semibold animate-pulse"
                              : "bg-rose-500/10 text-rose-600 dark:bg-rose-950/20 dark:text-rose-400 border border-rose-500/20 font-semibold"
                        }>
                          {status}
                        </Badge>
                      </div>
                    );
                  })}
                  <Link href="/facilities" className="block text-center mt-2">
                    <Button variant="outline" size="sm" className="w-full text-xs font-semibold rounded-xl">
                      Book Another Facility
                    </Button>
                  </Link>
                </div>
              ) : (
                <div className="text-center py-6">
                  <Calendar className="h-8 w-8 text-slate-300 dark:text-slate-700 mx-auto mb-2" />
                  <p className="text-xs font-semibold">No equipment bookings</p>
                  <p className="text-[11px] text-muted-foreground mt-0.5">Need a 3D printer or IoT bench? Reserve space below.</p>
                  <Link href="/facilities" className="mt-3 inline-block">
                    <Button size="sm" variant="outline" className="text-xs font-semibold rounded-xl">
                      Book MakerSpace
                    </Button>
                  </Link>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Active Challenges */}
          <Card className="shadow-lg border-slate-200 dark:border-slate-800">
            <CardHeader className="pb-3 border-b border-slate-100 dark:border-slate-800">
              <CardTitle className="text-lg font-bold flex items-center gap-2 text-slate-900 dark:text-slate-100">
                <Trophy className="h-5 w-5 text-amber-500" />
                Active Challenges
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4 space-y-4">
              {activeChallenges && activeChallenges.length > 0 ? (
                <div className="space-y-3">
                  {activeChallenges.slice(0, 2).map((challenge) => (
                    <div key={challenge.id} className="p-3 bg-slate-50/50 dark:bg-slate-900/10 border border-slate-100 dark:border-slate-800 rounded-xl space-y-2 text-xs">
                      <div>
                        <h4 className="font-bold text-slate-900 dark:text-slate-100 line-clamp-1">{challenge.title}</h4>
                        <span className="text-[10px] text-muted-foreground">Sponsor: {challenge.sponsor_name || "Mak-TIC"}</span>
                      </div>
                      
                      <div className="flex justify-between items-center pt-1 border-t border-slate-100 dark:border-slate-800/80">
                        <span className="font-bold text-emerald-600 dark:text-emerald-400">
                          UGX {Number(challenge.prize_amount).toLocaleString()}
                        </span>
                        <span className="text-[10px] text-muted-foreground">
                          Ends: {new Date(challenge.submission_deadline).toLocaleDateString()}
                        </span>
                      </div>
                      <Link href="/challenges" className="block pt-1">
                        <Button size="sm" className="w-full text-[10px] h-7 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg">
                          Apply / Submit
                        </Button>
                      </Link>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-6">
                  <Trophy className="h-8 w-8 text-slate-300 dark:text-slate-700 mx-auto mb-2" />
                  <p className="text-xs font-semibold">No active challenges</p>
                  <p className="text-[11px] text-muted-foreground mt-0.5 font-medium">New hackathons will appear here.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

