import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

const CLOUD_RUN_URL = "https://mak-tic-agents-58308878683.us-central1.run.app";
const FETCH_TIMEOUT_MS = 60_000;

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();

    // 1. Authenticate user
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 2. Authorize (Admin only)
    const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
    if (profile?.role !== "admin") {
      return NextResponse.json({ error: "Forbidden: Admins only" }, { status: 403 });
    }

    // 3. Parse request
    const body = await req.json();
    const stats = body.stats;

    if (!stats) {
      return NextResponse.json({ error: "Missing stats payload" }, { status: 400 });
    }

    // 4. Proxy to Python Service with timeout
    const pythonApiUrl = process.env.PYTHON_API_URL || CLOUD_RUN_URL;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

    try {
      const response = await fetch(`${pythonApiUrl}/agents/generate-report`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal: controller.signal,
        body: JSON.stringify({
          stats_json: JSON.stringify(stats, null, 2)
        }),
      });

      clearTimeout(timeout);

      if (!response.ok) {
        console.error("Python API Error in generate-report:", response.status);
        return NextResponse.json({ error: "AI report generation service unavailable" }, { status: response.status });
      }

      const result = await response.json();
      return NextResponse.json(result);
    } finally {
      clearTimeout(timeout);
    }
  } catch (error: any) {
    if (error.name === "AbortError") {
      return NextResponse.json({ error: "AI report generation timed out" }, { status: 504 });
    }
    console.error("Error in generate-report route:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
