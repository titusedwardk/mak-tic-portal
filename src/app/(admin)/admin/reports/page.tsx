import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import ReportCharts from "./ReportCharts";

export const dynamic = 'force-dynamic';

export default async function ReportsPage() {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (profile?.role !== "admin") redirect("/dashboard");

  // Fetch all projects for analytics
  const { data: projects } = await supabase.from("projects").select("id, stage, sdg_tags");

  // Aggregate Stage Data
  const stages = ['submitted', 'screening', 'problem_validation', 'solution_viability', 'prototype_review', 'commercialization', 'graduated', 'rejected'];
  const stageCounts: Record<string, number> = {};
  stages.forEach(s => stageCounts[s] = 0);
  
  // Aggregate SDG Data
  const sdgCounts: Record<string, number> = {};

  projects?.forEach(p => {
    if (p.stage) stageCounts[p.stage] = (stageCounts[p.stage] || 0) + 1;
    if (p.sdg_tags && Array.isArray(p.sdg_tags)) {
      p.sdg_tags.forEach((tag: string) => {
        sdgCounts[tag] = (sdgCounts[tag] || 0) + 1;
      });
    }
  });

  const stageData = Object.entries(stageCounts).map(([name, count]) => ({
    name: name.replace('_', ' ').toUpperCase(),
    count
  }));

  const sdgData = Object.entries(sdgCounts)
    .sort((a, b) => b[1] - a[1]) // Sort descending
    .slice(0, 6) // Top 6 SDGs
    .map(([name, count]) => ({ name, count }));

  const rawStats = {
    total_projects: projects?.length || 0,
    projects_by_stage: stageCounts,
    top_sdgs: sdgCounts,
    timestamp: new Date().toISOString()
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Analytics & Reports</h1>
        <p className="text-muted-foreground mt-1">
          System-wide metrics and automated AI funder reporting.
        </p>
      </div>

      {/* Overview Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-xl border bg-card text-card-foreground shadow p-6">
          <div className="flex flex-row items-center justify-between space-y-0 pb-2">
            <h3 className="tracking-tight text-sm font-medium">Total Projects</h3>
          </div>
          <div className="text-2xl font-bold">{rawStats.total_projects}</div>
        </div>
        <div className="rounded-xl border bg-card text-card-foreground shadow p-6">
          <div className="flex flex-row items-center justify-between space-y-0 pb-2">
            <h3 className="tracking-tight text-sm font-medium">Commercialization</h3>
          </div>
          <div className="text-2xl font-bold">{stageCounts['commercialization'] || 0}</div>
        </div>
        <div className="rounded-xl border bg-card text-card-foreground shadow p-6">
          <div className="flex flex-row items-center justify-between space-y-0 pb-2">
            <h3 className="tracking-tight text-sm font-medium">Graduated Startups</h3>
          </div>
          <div className="text-2xl font-bold">{stageCounts['graduated'] || 0}</div>
        </div>
      </div>

      <ReportCharts 
        stageData={stageData} 
        sdgData={sdgData} 
        rawStats={rawStats} 
      />
    </div>
  );
}
