import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const CLOUD_RUN_URL = "https://mak-tic-agents-58308878683.us-central1.run.app";
const FETCH_TIMEOUT_MS = 60_000;

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get("authorization");
    const secret = process.env.WEBHOOK_SECRET;

    if (!secret || authHeader !== `Bearer ${secret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const payload = await req.json();

    // pg_net sends the raw row as the body (not wrapped in { record: ... })
    // Supabase Database Webhooks send { record: ... }
    // Handle both formats for compatibility
    const record = payload.record ?? payload;

    if (!record || !record.id) {
      return NextResponse.json({ error: "No record found" }, { status: 400 });
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
          title: record.title,
          track: record.track,
          sector: record.sector || [],
          description: record.description,
          problem_statement: record.problem_statement,
          proposed_solution: record.proposed_solution,
        }),
      });

      clearTimeout(timeout);

      if (!response.ok) {
        console.error("Python service returned non-OK:", response.status);
        return NextResponse.json({ error: "AI scoring service error" }, { status: response.status });
      }

      const object = await response.json();

      // Update project in DB using the Security Definer RPC
      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      );

      const rpcSecret = process.env.WEBHOOK_SECRET!;

      const { error: updateError } = await supabase.rpc("update_project_ai_score", {
        p_id: record.id,
        p_score: object.viability_score,
        p_summary: object.ai_summary,
        p_tags: object.sdg_tags,
        p_secret: rpcSecret,
      });

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
      console.error("Webhook AI Scoring timed out");
      return NextResponse.json({ error: "AI scoring timed out" }, { status: 504 });
    }
    console.error("Webhook AI Scoring Error:", error);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
