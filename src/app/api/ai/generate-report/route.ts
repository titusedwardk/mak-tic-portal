import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

export async function POST(req: Request) {
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

    // 4. Proxy to Python Service
    const pythonApiUrl = process.env.PYTHON_API_URL || "http://127.0.0.1:8000";
    
    const response = await fetch(`${pythonApiUrl}/agents/generate-report`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        stats_json: JSON.stringify(stats, null, 2)
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Python API Error:", errorText);
      return NextResponse.json({ error: "AI Service Error" }, { status: response.status });
    }

    const result = await response.json();
    return NextResponse.json(result);

  } catch (error) {
    console.error("Error in generate-report route:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
