import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { revalidatePath } from "next/cache";
import RunAIReviewButton from "./RunAIReviewButton";

export const dynamic = 'force-dynamic';

export default async function ReviewPage({ params }: { params: { slug: string } }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Get project by slug
  const { data: project } = await supabase
    .from("projects")
    .select("id, title, description, problem_statement, proposed_solution, stage, ai_score, ai_summary")
    .eq("slug", params.slug)
    .single();

  if (!project) {
    redirect("/admin/dashboard");
  }

  // Check if current user is assigned to this project for the current stage
  const { data: assignment } = await supabase
    .from("review_assignments")
    .select("*")
    .eq("project_id", project.id)
    .eq("reviewer_id", user.id)
    .eq("gate", project.stage)
    .maybeSingle();

  // Handle Review Submission
  const submitReview = async (formData: FormData) => {
    "use server";
    const supabaseClient = await createClient();
    const { data: { user } } = await supabaseClient.auth.getUser();
    if (!user) return;

    const score_impact = parseInt(formData.get("score_impact") as string);
    const score_feasibility = parseInt(formData.get("score_feasibility") as string);
    const score_team = parseInt(formData.get("score_team") as string);
    const score_innovation = parseInt(formData.get("score_innovation") as string);
    const score_market = parseInt(formData.get("score_market") as string);
    const comments = formData.get("comments") as string;
    const recommendation = formData.get("recommendation") as string;

    await supabaseClient.from("stage_gate_reviews").insert({
      project_id: project.id,
      reviewer_id: user.id,
      gate: project.stage,
      score_impact,
      score_feasibility,
      score_team,
      score_innovation,
      score_market,
      comments,
      recommendation
    });

    if (assignment) {
      await supabaseClient.from("review_assignments").update({ status: 'completed' }).eq("id", assignment.id);
    }

    revalidatePath(`/admin/pipeline`);
    redirect(`/admin/pipeline`);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Review: {project.title}</h1>
          <p className="text-muted-foreground mt-1">
            Stage Gate: <span className="font-medium capitalize">{project.stage.replace('_', ' ')}</span>
          </p>
        </div>
        <RunAIReviewButton projectId={project.id} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Project Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="font-semibold text-sm text-muted-foreground mb-1">Problem Statement</h3>
                <p className="text-sm">{project.problem_statement}</p>
              </div>
              <div>
                <h3 className="font-semibold text-sm text-muted-foreground mb-1">Proposed Solution</h3>
                <p className="text-sm">{project.proposed_solution}</p>
              </div>
            </CardContent>
          </Card>

          {project.ai_score !== null && (
            <Card className="bg-primary/5 border-primary/20">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex justify-between">
                  <span>AI Pre-Screening</span>
                  <span className="text-primary font-bold">{project.ai_score}/100</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">{project.ai_summary}</p>
              </CardContent>
            </Card>
          )}
        </div>

        <Card>
          <form action={submitReview}>
            <CardHeader>
              <CardTitle>Evaluation Rubric</CardTitle>
              <CardDescription>Rate each criteria from 1 (Poor) to 10 (Excellent).</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4 items-center">
                <label className="text-sm font-medium">Impact Potential (25%)</label>
                <input type="number" name="score_impact" min="1" max="10" required className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50" defaultValue="5" />
                
                <label className="text-sm font-medium">Feasibility (20%)</label>
                <input type="number" name="score_feasibility" min="1" max="10" required className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50" defaultValue="5" />
                
                <label className="text-sm font-medium">Team Capability (20%)</label>
                <input type="number" name="score_team" min="1" max="10" required className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50" defaultValue="5" />
                
                <label className="text-sm font-medium">Innovation/Novelty (15%)</label>
                <input type="number" name="score_innovation" min="1" max="10" required className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50" defaultValue="5" />
                
                <label className="text-sm font-medium">Market Potential (20%)</label>
                <input type="number" name="score_market" min="1" max="10" required className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50" defaultValue="5" />
              </div>
              
              <div className="space-y-2 pt-4">
                <label className="text-sm font-medium">Qualitative Feedback</label>
                <textarea name="comments" rows={3} required className="flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50" placeholder="Provide constructive feedback for the innovator..."></textarea>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Recommendation</label>
                <select name="recommendation" required className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50">
                  <option value="advance">Advance to Next Stage</option>
                  <option value="revise_resubmit">Revise & Resubmit</option>
                  <option value="hold">Hold for Review</option>
                  <option value="reject">Reject</option>
                </select>
              </div>
            </CardContent>
            <CardFooter>
              <Button type="submit" className="w-full">Submit Evaluation</Button>
            </CardFooter>
          </form>
        </Card>
      </div>
    </div>
  );
}
