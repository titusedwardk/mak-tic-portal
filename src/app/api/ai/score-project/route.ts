import { createClient } from "@/utils/supabase/server";
import { google } from "@ai-sdk/google";
import { generateObject } from "ai";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const systemPrompt = `You are an expert innovation evaluator for the Mak-TIC (Makerere University Technology Innovation and Commercialization) portal.
Evaluate the following project submission based on its description, problem statement, and proposed solution.
Return a structured JSON object containing:
- viability_score: An integer out of 100 representing market viability and technical feasibility.
- ai_summary: A 2-3 sentence executive summary.
- sdg_tags: An array of integers (1-17) representing the UN Sustainable Development Goals addressed by this project.
`;

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { projectId } = await req.json();

    if (!projectId) {
      return NextResponse.json({ error: "Missing projectId" }, { status: 400 });
    }

    // Fetch project details
    const { data: project, error: dbError } = await supabase
      .from("projects")
      .select("*")
      .eq("id", projectId)
      .eq("owner_id", user.id)
      .single();

    if (dbError || !project) {
      return NextResponse.json({ error: "Project not found or access denied" }, { status: 404 });
    }

    const prompt = `Title: ${project.title}\nDescription: ${project.description}\nProblem: ${project.problem_statement}\nSolution: ${project.proposed_solution}`;

    // Call Gemini to generate score and summary
    const { object } = await generateObject({
      model: google("gemini-2.5-flash"),
      system: systemPrompt,
      prompt: prompt,
      schema: z.object({
        viability_score: z.number().min(0).max(100),
        ai_summary: z.string(),
        sdg_tags: z.array(z.number().min(1).max(17)),
      }),
    });

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
  } catch (error: any) {
    console.error("AI Scoring Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
