import { createClient } from "@/utils/supabase/server";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const CLOUD_RUN_URL = "https://mak-tic-agents-58308878683.us-central1.run.app";
const FETCH_TIMEOUT_MS = 60_000;

const requestSchema = z.object({
  projectId: z.string().uuid(),
});

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const parsed = requestSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid projectId" }, { status: 400 });
    }

    const { projectId } = parsed.data;

    // Fetch project details
    const { data: project, error: dbError } = await supabase
      .from("projects")
      .select("*")
      .eq("id", projectId)
      .single();

    if (dbError || !project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    // Check permissions (Owner OR Admin/Reviewer)
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();
    
    const isOwner = project.owner_id === user.id;
    const isStaff = profile?.role === "admin" || profile?.role === "reviewer" || profile?.role === "staff";

    if (!isOwner && !isStaff) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    // Call Python microservice with timeout
    const baseUrl = process.env.PYTHON_API_URL || CLOUD_RUN_URL;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

    try {
      const response = await fetch(`${baseUrl}/agents/score-project`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal: controller.signal,
        body: JSON.stringify({
          title: project.title,
          track: project.track,
          sector: project.sector || [],
          description: project.description,
          problem_statement: project.problem_statement,
          proposed_solution: project.proposed_solution,
        }),
      });

      clearTimeout(timeout);

      if (!response.ok) {
        console.error("Python service error in score-project:", response.status);
        return NextResponse.json({ error: "AI scoring service unavailable" }, { status: response.status });
      }

      const object = await response.json();

      // Update project in DB
      const { error: updateError } = await supabase
        .from("projects")
        .update({
          ai_score: object.viability_score,
          ai_summary: object.ai_summary,
          sdg_tags: object.sdg_tags,
        })
        .eq("id", projectId);

      if (updateError) {
        console.error("Failed to update project with AI scores:", updateError);
        return NextResponse.json({ error: "Failed to save scores to database" }, { status: 500 });
      }

      return NextResponse.json({ success: true, result: object });
    } finally {
      clearTimeout(timeout);
    }
  } catch (error: any) {
    if (error.name === "AbortError") {
      return NextResponse.json({ error: "AI scoring timed out" }, { status: 504 });
    }
    console.error("AI Scoring Error:", error);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
