import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { FileText, PlayCircle, TrendingUp, DollarSign, Download, Lock } from "lucide-react";
import Link from "next/link";

export const dynamic = 'force-dynamic';

export default async function InvestorsPortal() {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    redirect("/login");
  }

  // Check if user has investor role
  const { data: profile } = await supabase
    .from("profiles")
    .select("role, full_name")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "investor" && profile?.role !== "admin") {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-6">
        <div className="h-20 w-20 bg-red-100 text-red-600 rounded-full flex items-center justify-center mb-6">
          <Lock className="h-10 w-10" />
        </div>
        <h1 className="text-3xl font-bold mb-2">Access Denied</h1>
        <p className="text-muted-foreground max-w-md">
          This portal is restricted to approved investors. If you are an investor, please contact the Mak-TIC administration to upgrade your account.
        </p>
        <Link href="/dashboard" className="mt-8">
          <Button variant="outline">Return to Dashboard</Button>
        </Link>
      </div>
    );
  }

  // Fetch investable projects (market_ready, commercialization, graduated)
  const { data: projects } = await supabase
    .from("projects")
    .select("id, title, description, stage, sector, support_needed, ai_score, pitch_video_url, created_at, profiles(full_name)")
    .in("stage", ["market_ready", "commercialization", "graduated"])
    .order("ai_score", { ascending: false });

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-8">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Investor Portal</h1>
          <p className="text-muted-foreground mt-1">
            Welcome back, {profile?.full_name}. Review high-potential startups and IP-ready projects from Makerere University.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <Download className="mr-2 h-4 w-4" /> Export Portfolio
          </Button>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
        {projects?.map((project: any) => (
          <Card key={project.id} className="flex flex-col relative overflow-hidden group border-border/50 shadow-sm hover:shadow-md transition-shadow">
            <div className="absolute top-0 right-0 w-24 h-24 bg-primary/5 rounded-bl-full -z-10 group-hover:scale-110 transition-transform" />
            <CardHeader className="pb-4">
              <div className="flex justify-between items-start mb-2">
                <Badge variant={project.ai_score > 80 ? "default" : "secondary"}>
                  {project.stage.replace('_', ' ')}
                </Badge>
                {project.ai_score && (
                  <div className="flex items-center text-sm font-semibold text-emerald-600 bg-emerald-100 px-2 py-1 rounded-md">
                    <TrendingUp className="h-3 w-3 mr-1" />
                    {project.ai_score}/100
                  </div>
                )}
              </div>
              <CardTitle className="text-xl line-clamp-1">{project.title}</CardTitle>
              <CardDescription>Lead: {project.profiles?.full_name}</CardDescription>
            </CardHeader>
            <CardContent className="flex-1 space-y-4">
              <p className="text-sm text-muted-foreground line-clamp-3">
                {project.description}
              </p>
              
              <div className="flex flex-wrap gap-2 pt-2">
                {project.sector?.slice(0, 2).map((s: string) => (
                  <Badge key={s} variant="outline" className="text-xs capitalize">{s}</Badge>
                ))}
              </div>

              <div className="pt-4 border-t border-border flex justify-between items-center text-sm">
                <div className="flex space-x-3 text-muted-foreground">
                  {project.pitch_video_url && (
                    <span className="flex items-center" title="Pitch Video Available">
                      <PlayCircle className="h-4 w-4 text-blue-500 mr-1" /> Video
                    </span>
                  )}
                  {project.support_needed?.includes("funding") && (
                    <span className="flex items-center" title="Seeking Funding">
                      <DollarSign className="h-4 w-4 text-amber-500 mr-1" /> Funding
                    </span>
                  )}
                </div>
                <Link href={`/projects/${project.id}`}>
                  <Button size="sm" variant="secondary" className="w-full">Review Deal</Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        ))}

        {(!projects || projects.length === 0) && (
          <div className="col-span-full p-12 text-center text-muted-foreground border border-dashed rounded-lg bg-muted/20">
            No investable projects are currently available in the pipeline.
          </div>
        )}
      </div>
    </div>
  );
}
