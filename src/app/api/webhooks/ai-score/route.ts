import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get("authorization");
    const secret = process.env.WEBHOOK_SECRET;

    if (!secret || authHeader !== `Bearer ${secret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const payload = await req.json();

    // Supabase Webhooks send the inserted record in the 'record' property
    const record = payload.record;

    if (!record || !record.id) {
      return NextResponse.json({ error: "No record found" }, { status: 400 });
    }

    // Call Python microservice
    const baseUrl = process.env.PYTHON_API_URL || "https://mak-tic-agents-58308878683.us-central1.run.app";
    const response = await fetch(`${baseUrl}/agents/score-project`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        title: record.title,
        track: record.track,
        sector: record.sector,
        description: record.description,
        problem_statement: record.problem_statement,
        proposed_solution: record.proposed_solution,
      }),
    });

    if (!response.ok) {
      const errorData = await response.text();
      return NextResponse.json({ error: `Python service error: ${errorData}` }, { status: response.status });
    }

    const object = await response.json();

    // Update project in DB using the Security Definer RPC so we don't need the Service Role Key
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    const { error: updateError } = await supabase.rpc("update_project_ai_score", {
      p_id: record.id,
      p_score: object.viability_score,
      p_summary: object.ai_summary,
      p_tags: object.sdg_tags,
      p_secret: "mak_tic_webhook_secret_2026"
    });

    if (updateError) {
      console.error("Failed to update project with AI scores:", updateError);
      return NextResponse.json({ error: "Failed to save scores to database" }, { status: 500 });
    }

    return NextResponse.json({ success: true, result: object });
  } catch (error: any) {
    console.error("Webhook AI Scoring Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
