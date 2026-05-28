import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";

export const dynamic = 'force-dynamic';

export default async function PipelinePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Get user profile to check role
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  const isAdmin = profile?.role === "admin";

  // Fetch review assignments
  let query = supabase
    .from("review_assignments")
    .select(`
      id,
      gate,
      deadline,
      status,
      project_id,
      projects ( title, slug, stage ),
      reviewer_id,
      profiles:reviewer_id ( full_name, email )
    `)
    .order('deadline', { ascending: true });

  if (!isAdmin) {
    query = query.eq("reviewer_id", user.id);
  }

  const { data: assignments } = await query;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Review Pipeline</h1>
          <p className="text-muted-foreground mt-1">
            {isAdmin ? "Manage and track all project review assignments across stages." : "Your pending project review assignments."}
          </p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {assignments?.map((assignment: any) => (
          <Card key={assignment.id}>
            <CardHeader className="pb-3">
              <div className="flex justify-between items-start">
                <Badge variant={assignment.status === 'completed' ? 'default' : 'secondary'}>
                  {assignment.status}
                </Badge>
                <span className="text-xs text-muted-foreground">
                  Due: {new Date(assignment.deadline).toLocaleDateString()}
                </span>
              </div>
              <CardTitle className="mt-2 line-clamp-1">{assignment.projects?.title}</CardTitle>
              <CardDescription>Gate: {assignment.gate}</CardDescription>
            </CardHeader>
            <CardContent>
              {isAdmin && (
                <div className="mb-4 text-sm text-muted-foreground">
                  Reviewer: <span className="font-medium text-foreground">{assignment.profiles?.full_name}</span>
                </div>
              )}
              <Link 
                href={`/admin/projects/${assignment.projects?.slug}/review`}
                className={buttonVariants({ variant: "default", className: "w-full" })}
              >
                {assignment.status === 'completed' ? 'View Review' : 'Start Review'}
              </Link>
            </CardContent>
          </Card>
        ))}
        {(!assignments || assignments.length === 0) && (
          <div className="col-span-full py-12 text-center text-muted-foreground bg-muted/20 rounded-xl border border-dashed">
            No active review assignments found.
          </div>
        )}
      </div>
    </div>
  );
}
