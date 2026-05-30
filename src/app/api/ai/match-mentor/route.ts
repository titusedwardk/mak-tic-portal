import { createClient } from "@/utils/supabase/server";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

export const dynamic = "force-dynamic";

const CLOUD_RUN_URL = "https://mak-tic-agents-58308878683.us-central1.run.app";
const FETCH_TIMEOUT_MS = 60_000;

const requestSchema = z.object({
  projectId: z.string().uuid().optional(), // Optionally restrict matching to a single project
});

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    // 1. Verify user is logged in
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 2. Verify user is an Admin
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (profile?.role !== "admin") {
      return NextResponse.json({ error: "Forbidden: Admin access required" }, { status: 403 });
    }

    // Parse body parameters optionally
    let targetProjectId: string | undefined;
    try {
      const body = await req.json();
      const parsed = requestSchema.safeParse(body);
      if (parsed.success) {
        targetProjectId = parsed.data.projectId;
      }
    } catch {
      // Ignore if body is empty
    }

    // 3. Fetch unmatched projects
    const projectsQuery = supabase
      .from("projects")
      .select("id, title, description, problem_statement, proposed_solution, track, sector, support_needed")
      .eq("status", "active");

    if (targetProjectId) {
      projectsQuery.eq("id", targetProjectId);
    }

    const { data: allActiveProjects, error: projError } = await projectsQuery;

    if (projError || !allActiveProjects) {
      return NextResponse.json({ error: "Failed to fetch projects" }, { status: 500 });
    }

    // Get projects that ALREADY have active or completed assignments
    const { data: assignedMatches } = await supabase
      .from("mentor_assignments")
      .select("project_id")
      .in("status", ["active", "completed"]);

    const assignedIds = assignedMatches?.map((a) => a.project_id) || [];
    const unmatchedProjects = allActiveProjects.filter((p) => !assignedIds.includes(p.id));

    if (unmatchedProjects.length === 0) {
      return NextResponse.json({ 
        success: true, 
        message: "All active projects already have assigned mentors.",
        suggestions: [] 
      });
    }

    // 4. Fetch active mentors
    const { data: mentors, error: mentorsError } = await supabase
      .from("mentor_profiles")
      .select(`
        id,
        expertise_sectors,
        max_mentees,
        current_mentees,
        rating_avg,
        bio_extended,
        profiles (
          full_name,
          email,
          bio
        )
      `);

    if (mentorsError || !mentors) {
      return NextResponse.json({ error: "Failed to fetch mentors" }, { status: 500 });
    }

    if (mentors.length === 0) {
      return NextResponse.json({ error: "No mentors registered in the system" }, { status: 400 });
    }

    // 5. Structure prompt for Gemini (null-safe array access)
    const projectsText = unmatchedProjects.map((p, idx) => `
PROJECT #${idx + 1}
ID: ${p.id}
Title: ${p.title}
Track: ${p.track}
Sectors: ${(p.sector || []).join(", ") || "N/A"}
Support Needed: ${(p.support_needed || []).join(", ") || "N/A"}
Description: ${p.description}
Problem: ${p.problem_statement}
Solution: ${p.proposed_solution}
---
`).join("\n");

    const mentorsText = mentors.map((m, idx) => {
      const p = Array.isArray(m.profiles) ? m.profiles[0] : (m.profiles as any);
      return `
MENTOR #${idx + 1}
ID: ${m.id}
Name: ${p?.full_name || "Unknown"}
Expertise Sectors: ${(m.expertise_sectors || []).join(", ") || "N/A"}
Current Workload: ${m.current_mentees || 0} / ${m.max_mentees || 3} mentees
Average Rating: ${m.rating_avg || "N/A"}
Bio: ${p?.bio || ""} ${m.bio_extended || ""}
---
`;
    }).join("\n");

    // 6. Call Python microservice with timeout
    const baseUrl = process.env.PYTHON_API_URL || CLOUD_RUN_URL;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

    try {
      const response = await fetch(`${baseUrl}/agents/match-mentor`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal: controller.signal,
        body: JSON.stringify({
          unmatched_projects_text: projectsText,
          mentors_text: mentorsText,
        }),
      });

      clearTimeout(timeout);

      if (!response.ok) {
        console.error("Python service error in match-mentor:", response.status);
        return NextResponse.json({ error: "AI matching service unavailable" }, { status: response.status });
      }

      const object = await response.json();
      const suggestions = object.suggestions || [];

      // 7. Register suggestions in database as 'proposed' assignments
      const registeredSuggestions = [];

      for (const match of suggestions) {
        // Check if this exact proposed pair already exists in the assignments
        const { data: existing } = await supabase
          .from("mentor_assignments")
          .select("id, status")
          .eq("project_id", match.projectId)
          .eq("mentor_id", match.mentorId)
          .maybeSingle();

        if (!existing) {
          const { data: newAssignment, error: insertError } = await supabase
            .from("mentor_assignments")
            .insert({
              project_id: match.projectId,
              mentor_id: match.mentorId,
              status: "proposed",
              compatibility_score: match.compatibilityScore,
              match_reasoning: match.reasoning,
            })
            .select("id")
            .single();

          if (!insertError && newAssignment) {
            registeredSuggestions.push({
              ...match,
              assignmentId: newAssignment.id,
              status: "proposed",
            });
          }
        } else {
          // If it already exists as proposed, update the score and reasoning
          if (existing.status === "proposed") {
            await supabase
              .from("mentor_assignments")
              .update({
                compatibility_score: match.compatibilityScore,
                match_reasoning: match.reasoning,
              })
              .eq("id", existing.id);
          }

          registeredSuggestions.push({
            ...match,
            assignmentId: existing.id,
            status: existing.status,
          });
        }
      }

      return NextResponse.json({
        success: true,
        suggestions: registeredSuggestions,
      });
    } finally {
      clearTimeout(timeout);
    }
  } catch (error: any) {
    if (error.name === "AbortError") {
      return NextResponse.json({ error: "AI matching timed out" }, { status: 504 });
    }
    console.error("Mentor Matchmaking Error:", error);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
