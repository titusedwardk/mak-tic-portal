import { createClient } from "@/utils/supabase/server";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { CountdownTimer } from "@/components/ui/countdown-timer";
import { getSdgInfo } from "@/components/ui/sdg-helper";
import { Trophy, Target, Calendar, Tag, ExternalLink, RefreshCw } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export const dynamic = 'force-dynamic';

interface PageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function ChallengesPage({ searchParams }: PageProps) {
  const resolvedSearchParams = await searchParams;
  const statusFilter = typeof resolvedSearchParams.status === 'string' ? resolvedSearchParams.status : 'open';

  const supabase = await createClient();
  
  // Fetch challenges based on selected status filter
  let query = supabase.from("challenges").select("*");
  
  if (statusFilter !== 'all') {
    query = query.eq("status", statusFilter);
  } else {
    query = query.in("status", ["open", "judging", "closed"]);
  }

  const { data: challenges, error } = await query.order("submission_deadline", { ascending: true });

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-UG", {
      style: "currency",
      currency: "UGX",
      maximumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      {/* Header section with gradient backdrop */}
      <div className="relative rounded-2xl overflow-hidden bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 p-8 text-white shadow-xl">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(99,102,241,0.15),transparent)] pointer-events-none" />
        <div className="relative z-10 max-w-2xl">
          <Badge className="bg-primary/20 hover:bg-primary/30 text-indigo-300 border-indigo-500/30 mb-3 px-3 py-1 text-xs uppercase tracking-wider font-semibold">
            Open Innovation
          </Badge>
          <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl bg-gradient-to-r from-white via-slate-100 to-indigo-200 bg-clip-text text-transparent">
            TIC Innovation Challenges
          </h1>
          <p className="mt-3 text-lg text-slate-300 font-medium">
            Solve real-world industry problems, win funding, and match with SDGs to advance your research and prototype projects.
          </p>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b pb-4 border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-2 p-1 bg-muted rounded-lg">
          <Link
            href="/challenges?status=open"
            className={`px-4 py-2 text-sm font-semibold rounded-md transition-all ${
              statusFilter === "open"
                ? "bg-background shadow text-foreground"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Active Challenges
          </Link>
          <Link
            href="/challenges?status=judging"
            className={`px-4 py-2 text-sm font-semibold rounded-md transition-all ${
              statusFilter === "judging"
                ? "bg-background shadow text-foreground"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Judging
          </Link>
          <Link
            href="/challenges?status=closed"
            className={`px-4 py-2 text-sm font-semibold rounded-md transition-all ${
              statusFilter === "closed"
                ? "bg-background shadow text-foreground"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Closed
          </Link>
          <Link
            href="/challenges?status=all"
            className={`px-4 py-2 text-sm font-semibold rounded-md transition-all ${
              statusFilter === "all"
                ? "bg-background shadow text-foreground"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            All
          </Link>
        </div>

        <Link href="/challenges" className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground">
          <RefreshCw className="h-3 w-3" /> Refresh
        </Link>
      </div>

      {/* Challenges Grid */}
      {error && (
        <div className="p-4 bg-destructive/15 text-destructive rounded-lg border border-destructive/20 text-center font-medium">
          Error loading challenges. Please try again.
        </div>
      )}

      {!error && (!challenges || challenges.length === 0) ? (
        <div className="text-center py-16 border rounded-2xl bg-muted/10 border-dashed space-y-3">
          <Trophy className="h-12 w-12 text-muted-foreground/50 mx-auto" />
          <h3 className="text-lg font-bold">No challenges found</h3>
          <p className="text-muted-foreground max-w-sm mx-auto text-sm">
            There are no challenges listed under this filter at the moment. Check back soon for upcoming sponsor hackathons.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {challenges?.map((challenge) => {
            const hasPassed = new Date(challenge.submission_deadline) < new Date();
            const statusLabel = challenge.status === "open" && !hasPassed ? "Active" : challenge.status;
            
            return (
              <Card key={challenge.id} className="flex flex-col border border-slate-200 dark:border-slate-800 hover:shadow-lg hover:border-slate-350 dark:hover:border-slate-700 transition-all group overflow-hidden">
                <CardHeader className="relative pb-4">
                  <div className="flex justify-between items-start gap-4">
                    <div className="space-y-1">
                      <span className="text-xs font-semibold text-primary uppercase tracking-wider">{challenge.sponsor_name || "Sponsored Challenge"}</span>
                      <CardTitle className="text-xl font-bold group-hover:text-primary transition-colors pr-2">
                        {challenge.title}
                      </CardTitle>
                    </div>
                    <Badge variant={challenge.status === "open" ? "default" : "secondary"} className="capitalize shrink-0">
                      {statusLabel}
                    </Badge>
                  </div>
                </CardHeader>
                
                <CardContent className="flex-1 space-y-4">
                  <p className="text-sm text-muted-foreground line-clamp-3 leading-relaxed">
                    {challenge.description}
                  </p>

                  {/* Prize Amount */}
                  <div className="flex items-center gap-3 p-3 rounded-lg bg-indigo-50/50 dark:bg-indigo-950/20 border border-indigo-100/50 dark:border-indigo-900/20">
                    <Trophy className="h-5 w-5 text-amber-500 shrink-0" />
                    <div>
                      <div className="text-xs text-muted-foreground font-semibold">Prize Budget</div>
                      <div className="text-lg font-extrabold text-indigo-700 dark:text-indigo-400">
                        {formatCurrency(challenge.prize_amount || 0)}
                      </div>
                    </div>
                  </div>

                  {/* Target SDGs */}
                  {challenge.sdg_tags && challenge.sdg_tags.length > 0 && (
                    <div className="space-y-2">
                      <div className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5">
                        <Target className="h-3.5 w-3.5" /> Target SDGs
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {challenge.sdg_tags.map((sdgNum: number) => {
                          const info = getSdgInfo(sdgNum);
                          return (
                            <Badge key={sdgNum} className={`text-xs px-2.5 py-0.5 border-none font-medium shadow-sm ${info.color}`}>
                              {info.name}
                            </Badge>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Sector Tags */}
                  {challenge.sector_tags && challenge.sector_tags.length > 0 && (
                    <div className="space-y-2">
                      <div className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5">
                        <Tag className="h-3.5 w-3.5" /> Sectors
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {challenge.sector_tags.map((tag: string) => (
                          <Badge key={tag} variant="secondary" className="text-xs">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>

                <CardFooter className="bg-muted/10 border-t flex flex-wrap gap-4 items-center justify-between py-4">
                  {/* Countdown Timer */}
                  <CountdownTimer deadline={challenge.submission_deadline} />

                  <Link
                    href={`/challenges/${challenge.id}`}
                    className={cn(buttonVariants({ size: "sm" }), "font-semibold shadow-sm group/btn")}
                  >
                    View Challenge
                    <ExternalLink className="ml-1.5 h-3.5 w-3.5 transition-transform group-hover/btn:translate-x-0.5" />
                  </Link>
                </CardFooter>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

