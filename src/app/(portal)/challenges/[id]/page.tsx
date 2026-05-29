import { createClient } from "@/utils/supabase/server";
import { getSdgInfo } from "@/components/ui/sdg-helper";
import { SubmissionForm } from "./SubmissionForm";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CountdownTimer } from "@/components/ui/countdown-timer";
import { 
  Trophy, 
  Calendar, 
  Target, 
  Tag, 
  Building, 
  ChevronLeft, 
  ArrowRight,
  ClipboardList,
  AlertTriangle,
  Clock,
  CheckCircle2
} from "lucide-react";
import { notFound } from "next/navigation";

export const dynamic = 'force-dynamic';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function ChallengeDetailPage({ params }: PageProps) {
  const resolvedParams = await params;
  const { id: challengeId } = resolvedParams;

  const supabase = await createClient();

  // 1. Fetch Challenge Details
  const { data: challenge, error: challengeError } = await supabase
    .from("challenges")
    .select("*")
    .eq("id", challengeId)
    .single();

  if (challengeError || !challenge) {
    notFound();
  }

  // 2. Fetch User & Submissions & Projects if authenticated
  const { data: { user } } = await supabase.auth.getUser();

  let userProjects: any[] = [];
  let userSubmissions: any[] = [];

  if (user) {
    // Get user projects
    const { data: projects } = await supabase
      .from("projects")
      .select("id, title, slug")
      .eq("owner_id", user.id);
    
    if (projects) {
      userProjects = projects;
    }

    // Get user submissions for this challenge
    const { data: submissions } = await supabase
      .from("challenge_submissions")
      .select("id, title, description, status, created_at, project_id, projects(title, slug)")
      .eq("challenge_id", challengeId)
      .eq("submitter_id", user.id);
    
    if (submissions) {
      userSubmissions = submissions;
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-UG", {
      style: "currency",
      currency: "UGX",
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-UG", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const hasPassed = new Date(challenge.submission_deadline) < new Date();
  const isOpen = challenge.status === "open" && !hasPassed;

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Back navigation */}
      <div className="flex items-center">
        <Link
          href="/challenges"
          className={cn(buttonVariants({ variant: "ghost" }), "text-muted-foreground hover:text-foreground")}
        >
          <ChevronLeft className="h-4 w-4 mr-1.5" /> Back to Challenges
        </Link>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Column: Challenge Details (2 cols on large screen) */}
        <div className="lg:col-span-2 space-y-6">
          <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-2">
              <Badge className="bg-primary/10 hover:bg-primary/20 text-primary border-primary/20 px-3 py-0.5 text-xs font-semibold">
                {challenge.sponsor_name || "Sponsored Challenge"}
              </Badge>
              {challenge.status && (
                <Badge variant={isOpen ? "default" : "secondary"} className="capitalize">
                  {isOpen ? "Active" : challenge.status}
                </Badge>
              )}
            </div>

            <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl text-slate-900 dark:text-slate-50">
              {challenge.title}
            </h1>

            <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <Building className="h-4 w-4 text-slate-400" />
                Sponsor: {challenge.sponsor_name || "TIC partner"}
              </span>
              <span className="flex items-center gap-1.5">
                <Calendar className="h-4 w-4 text-slate-400" />
                Deadline: {formatDate(challenge.submission_deadline)}
              </span>
            </div>
          </div>

          <Card className="border-slate-200 dark:border-slate-800">
            <CardHeader>
              <CardTitle className="text-lg font-bold">Challenge Scope & Problem Statement</CardTitle>
            </CardHeader>
            <CardContent className="prose dark:prose-invert text-slate-600 dark:text-slate-300 max-w-none space-y-4">
              <p className="whitespace-pre-wrap leading-relaxed text-sm">
                {challenge.description}
              </p>
            </CardContent>
          </Card>

          {/* SDG and Sector Tags Card */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="border-slate-200 dark:border-slate-800">
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-bold flex items-center gap-2">
                  <Target className="h-4 w-4 text-indigo-500" /> Targeted UN SDGs
                </CardTitle>
                <CardDescription>Aligned Sustainable Development Goals</CardDescription>
              </CardHeader>
              <CardContent>
                {challenge.sdg_tags && challenge.sdg_tags.length > 0 ? (
                  <div className="flex flex-col gap-2">
                    {challenge.sdg_tags.map((sdgNum: number) => {
                      const info = getSdgInfo(sdgNum);
                      return (
                        <div key={sdgNum} className="flex items-center gap-2.5">
                          <span className={`h-2.5 w-2.5 rounded-full shrink-0 ${info.color.split(" ")[0]}`} />
                          <span className="text-sm font-semibold">{info.name}</span>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <span className="text-xs text-muted-foreground">No specific SDGs tags.</span>
                )}
              </CardContent>
            </Card>

            <Card className="border-slate-200 dark:border-slate-800">
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-bold flex items-center gap-2">
                  <Tag className="h-4 w-4 text-indigo-500" /> Sector Scope
                </CardTitle>
                <CardDescription>Applicable technology domains</CardDescription>
              </CardHeader>
              <CardContent>
                {challenge.sector_tags && challenge.sector_tags.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {challenge.sector_tags.map((tag: string) => (
                      <Badge key={tag} variant="secondary" className="px-2.5 py-1 text-xs">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                ) : (
                  <span className="text-xs text-muted-foreground">No sector tags defined.</span>
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Right Column: Prize, Timers, Form & User Submissions (1 col) */}
        <div className="space-y-6">
          
          {/* Prize and Timeline Card */}
          <Card className="border-indigo-150/40 bg-gradient-to-br from-indigo-50/30 to-background dark:from-indigo-950/10 dark:to-background border">
            <CardContent className="pt-6 space-y-5">
              <div>
                <span className="text-xs text-muted-foreground font-semibold uppercase tracking-wider block">Award Pool</span>
                <div className="flex items-baseline gap-1 mt-1 text-primary">
                  <Trophy className="h-6 w-6 text-amber-500 mr-2 self-center" />
                  <span className="text-3xl font-extrabold">{formatCurrency(challenge.prize_amount || 0)}</span>
                </div>
              </div>

              <div className="border-t pt-4 space-y-3">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-muted-foreground font-medium flex items-center gap-1.5">
                    <Clock className="h-4 w-4 text-slate-400" /> Deadline
                  </span>
                  <span className="font-semibold text-slate-700 dark:text-slate-200">
                    {formatDate(challenge.submission_deadline)}
                  </span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-muted-foreground font-medium flex items-center gap-1.5">
                    <Calendar className="h-4 w-4 text-slate-400" /> Judging End
                  </span>
                  <span className="font-semibold text-slate-700 dark:text-slate-200">
                    {formatDate(challenge.judging_deadline)}
                  </span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-muted-foreground font-medium flex items-center gap-1.5">
                    <ClipboardList className="h-4 w-4 text-slate-400" /> Max Submissions
                  </span>
                  <span className="font-semibold text-slate-700 dark:text-slate-200">
                    {challenge.max_submissions || "Unlimited"}
                  </span>
                </div>
              </div>

              <div className="border-t pt-4 flex justify-center">
                <CountdownTimer deadline={challenge.submission_deadline} />
              </div>
            </CardContent>
          </Card>

          {/* User Submissions Details */}
          {user && userSubmissions.length > 0 && (
            <Card className="border-slate-200 dark:border-slate-800">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-bold flex items-center gap-1.5">
                  <CheckCircle2 className="h-4.5 w-4.5 text-emerald-500" /> Your Submissions
                </CardTitle>
                <CardDescription>You have entered {userSubmissions.length} solution(s) to this challenge</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {userSubmissions.map((sub) => (
                  <div key={sub.id} className="p-3 border rounded-md text-xs space-y-2 bg-muted/20">
                    <div className="flex justify-between items-center">
                      <span className="font-bold text-slate-800 dark:text-slate-200 block truncate max-w-[150px]">{sub.title}</span>
                      <Badge variant="outline" className={`capitalize scale-90 ${
                        sub.status === 'winner' ? 'border-amber-500/30 bg-amber-500/10 text-amber-600 font-semibold' :
                        sub.status === 'submitted' ? 'border-indigo-500/30 bg-indigo-500/10 text-indigo-600' : ''
                      }`}>
                        {sub.status}
                      </Badge>
                    </div>
                    {sub.project_id && sub.projects && (
                      <div className="text-[10px] text-muted-foreground">
                        Linked Project:{" "}
                        <Link href={`/projects/${sub.projects.slug}`} className="text-primary hover:underline font-medium inline-flex items-center gap-0.5">
                          {sub.projects.title} <ArrowRight className="h-2 w-2" />
                        </Link>
                      </div>
                    )}
                    <span className="text-[10px] text-muted-foreground block text-right">
                      Submitted on {formatDate(sub.created_at)}
                    </span>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Submission Form / Call to Action */}
          {!user ? (
            <Card className="border-amber-500/20 bg-amber-50/10 text-center py-6 px-4">
              <CardContent className="space-y-3">
                <AlertTriangle className="h-8 w-8 text-amber-500 mx-auto" />
                <h3 className="font-bold text-sm">Sign in to Submit</h3>
                <p className="text-xs text-muted-foreground">
                  You must be registered as an innovator in the portal to submit proposals.
                </p>
                <Link
                  href="/login"
                  className={cn(buttonVariants({ size: "sm" }), "w-full font-semibold")}
                >
                  Sign In
                </Link>
              </CardContent>
            </Card>
          ) : isOpen ? (
            <SubmissionForm challengeId={challengeId} userProjects={userProjects} />
          ) : (
            <Card className="border-slate-200 dark:border-slate-800 text-center py-6 px-4 bg-muted/20">
              <CardContent className="space-y-2">
                <Clock className="h-8 w-8 text-muted-foreground/60 mx-auto" />
                <h3 className="font-bold text-sm">Submissions Closed</h3>
                <p className="text-xs text-muted-foreground">
                  This challenge is no longer accepting submissions.
                </p>
              </CardContent>
            </Card>
          )}

        </div>
      </div>
    </div>
  );
}
