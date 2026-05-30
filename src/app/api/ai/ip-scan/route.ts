import { createClient } from "@/utils/supabase/server";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

export const dynamic = "force-dynamic";

const CLOUD_RUN_URL = "https://mak-tic-agents-58308878683.us-central1.run.app";
const FETCH_TIMEOUT_MS = 60_000;

const requestSchema = z.object({
  projectId: z.string().uuid(),
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

    // Parse body parameters
    const body = await req.json();
    const parsed = requestSchema.safeParse(body);
    
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid request payload" }, { status: 400 });
    }

    const { projectId } = parsed.data;

    // 3. Fetch the project
    const { data: project, error: projError } = await supabase
      .from("projects")
      .select("id, title, description, problem_statement, proposed_solution, track, sector")
      .eq("id", projectId)
      .single();

    if (projError || !project) {
      return NextResponse.json({ error: "Failed to fetch project" }, { status: 404 });
    }

    // 4. Call Python microservice with timeout
    const baseUrl = process.env.PYTHON_API_URL || CLOUD_RUN_URL;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

    try {
      const response = await fetch(`${baseUrl}/agents/ip-scan`, {
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
        console.error("Python service error in ip-scan:", response.status);
        return NextResponse.json({ error: "AI IP scan service unavailable" }, { status: response.status });
      }

      const object = await response.json();

      return NextResponse.json({
        success: true,
        scanResult: object,
      });
    } finally {
      clearTimeout(timeout);
    }
  } catch (error: any) {
    if (error.name === "AbortError") {
      return NextResponse.json({ error: "AI IP scan timed out" }, { status: 504 });
    }
    console.error("IP Landscape Scan Error:", error);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
