import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export const dynamic = 'force-dynamic';

export default async function ScoringDashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "admin") {
    redirect("/admin/dashboard");
  }

  // Get all projects with their reviews
  const { data: projects } = await supabase
    .from("projects")
    .select(`
      id,
      title,
      ai_score,
      stage,
      stage_gate_reviews (
        weighted_total
      )
    `)
    .order('created_at', { ascending: false });

  const scoringData = projects?.map(p => {
    const reviews = p.stage_gate_reviews || [];
    const humanAvg = reviews.length > 0 
      ? reviews.reduce((sum: number, r: any) => sum + Number(r.weighted_total), 0) / reviews.length 
      : null;
    
    // Scale human avg (out of 10) to AI score scale (out of 100) for comparison
    const humanScore100 = humanAvg ? humanAvg * 10 : null;
    const aiScore = p.ai_score ? Number(p.ai_score) : null;
    
    let discrepancy = null;
    if (humanScore100 !== null && aiScore !== null) {
      discrepancy = Math.abs(humanScore100 - aiScore);
    }

    return {
      ...p,
      humanAvg: humanScore100,
      discrepancy,
      reviewCount: reviews.length
    };
  }) || [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">AI vs Human Scoring</h1>
        <p className="text-muted-foreground mt-1">
          Compare the initial AI viability score against aggregated human evaluations.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Score Discrepancy Analysis</CardTitle>
          <CardDescription>
            Projects with a high discrepancy (&gt;20 points) may require additional human auditing.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Project</TableHead>
                <TableHead>Stage</TableHead>
                <TableHead>Reviews</TableHead>
                <TableHead>AI Score</TableHead>
                <TableHead>Human Avg (Scaled to 100)</TableHead>
                <TableHead>Discrepancy</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {scoringData.map((project: any) => (
                <TableRow key={project.id}>
                  <TableCell className="font-medium">{project.title}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className="capitalize">{project.stage.replace('_', ' ')}</Badge>
                  </TableCell>
                  <TableCell>{project.reviewCount}</TableCell>
                  <TableCell>
                    {project.ai_score ? (
                      <Badge variant="secondary">{Number(project.ai_score).toFixed(1)}</Badge>
                    ) : (
                      <span className="text-muted-foreground text-sm">N/A</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {project.humanAvg ? (
                      <Badge variant="secondary">{project.humanAvg.toFixed(1)}</Badge>
                    ) : (
                      <span className="text-muted-foreground text-sm">No reviews</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {project.discrepancy !== null ? (
                      <Badge variant={project.discrepancy > 20 ? "destructive" : "default"}>
                        {project.discrepancy.toFixed(1)} pts
                      </Badge>
                    ) : (
                      <span className="text-muted-foreground text-sm">-</span>
                    )}
                  </TableCell>
                </TableRow>
              ))}
              {scoringData.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="h-24 text-center">
                    No projects found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
