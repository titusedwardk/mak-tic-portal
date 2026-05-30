import { createClient } from "@/utils/supabase/server";

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

export const dynamic = "force-dynamic";

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

    // 5. Call Python microservice
    const baseUrl = process.env.PYTHON_API_URL || "http://localhost:8000";
    const response = await fetch(`${baseUrl}/agents/ip-scan`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        title: project.title,
        track: project.track,
        sector: project.sector,
        description: project.description,
        problem_statement: project.problem_statement,
        proposed_solution: project.proposed_solution,
      }),
    });

    if (!response.ok) {
      const errorData = await response.text();
      return NextResponse.json({ error: `Python service error: ${errorData}` }, { status: response.status });
    }

    const object = await response.json();

    return NextResponse.json({
      success: true,
      scanResult: object,
    });

  } catch (error: any) {
    console.error("IP Landscape Scan Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
