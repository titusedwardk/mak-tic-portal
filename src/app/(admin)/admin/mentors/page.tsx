import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import AdminMentorsClient from "./AdminMentorsClient";

export const dynamic = "force-dynamic";

export default async function AdminMentorsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Verify that the logged-in user is an Admin
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "admin") {
    redirect("/dashboard");
  }

  // 1. Fetch all mentors pool
  const { data: mentors } = await supabase
    .from("mentor_profiles")
    .select(`
      id,
      expertise_sectors,
      max_mentees,
      current_mentees,
      rating_avg,
      total_sessions,
      bio_extended,
      profiles (
        full_name,
        email,
        bio,
        affiliation
      )
    `)
    .order("id");

  // 2. Fetch all assignments (active and proposed)
  const { data: assignments } = await supabase
    .from("mentor_assignments")
    .select(`
      id,
      project_id,
      mentor_id,
      status,
      start_date,
      compatibility_score,
      match_reasoning,
      projects (
        title,
        track,
        sector
      ),
      profiles (
        full_name,
        email
      )
    `)
    .order("created_at", { ascending: false });

  // 3. Fetch unmatched projects
  const { data: allActiveProjects } = await supabase
    .from("projects")
    .select("id, title, track, sector")
    .eq("status", "active");

  const activeOrCompletedAssignments = assignments?.filter(
    (a) => a.status === "active" || a.status === "completed"
  ) || [];

  const activeMatchedProjectIds = activeOrCompletedAssignments.map(
    (a) => a.project_id
  );

  const unmatchedProjects = allActiveProjects?.filter(
    (p) => !activeMatchedProjectIds.includes(p.id)
  ) || [];

  const formattedMentors = (mentors || []).map((m) => {
    const rawProfile = Array.isArray(m.profiles) ? m.profiles[0] : m.profiles;
    return {
      id: m.id,
      expertise_sectors: m.expertise_sectors,
      max_mentees: m.max_mentees,
      current_mentees: m.current_mentees,
      rating_avg: m.rating_avg,
      total_sessions: m.total_sessions,
      bio_extended: m.bio_extended,
      profiles: rawProfile ? {
        full_name: rawProfile.full_name || "",
        email: rawProfile.email || "",
        bio: rawProfile.bio || null,
        affiliation: rawProfile.affiliation || "",
      } : null,
    };
  });

  const formattedAssignments = (assignments || []).map((a) => {
    const rawProfile = Array.isArray(a.profiles) ? a.profiles[0] : a.profiles;
    const rawProject = Array.isArray(a.projects) ? a.projects[0] : a.projects;
    return {
      id: a.id,
      project_id: a.project_id,
      mentor_id: a.mentor_id,
      status: a.status,
      start_date: a.start_date,
      compatibility_score: a.compatibility_score,
      match_reasoning: a.match_reasoning,
      projects: rawProject ? {
        title: rawProject.title || "",
        track: rawProject.track || "",
        sector: rawProject.sector || [],
      } : null,
      profiles: rawProfile ? {
        full_name: rawProfile.full_name || "",
        email: rawProfile.email || "",
      } : null,
    };
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 bg-clip-text text-transparent">
          Mentorship Administration
        </h1>
        <p className="text-muted-foreground mt-1">
          Manage mentor profiles, verify workloads, and assign matched mentors using AI recommendations.
        </p>
      </div>

      <AdminMentorsClient
        mentors={formattedMentors}
        assignments={formattedAssignments}
        unmatchedProjects={unmatchedProjects}
      />
    </div>
  );
}
