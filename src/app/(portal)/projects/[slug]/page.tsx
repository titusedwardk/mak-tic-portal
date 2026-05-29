import { createClient } from "@/utils/supabase/server";
import { notFound } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";

interface ProjectDetailsProps {
  params: Promise<{
    slug: string;
  }>;
}

export default async function ProjectDetailsPage({ params }: ProjectDetailsProps) {
  const resolvedParams = await params;
  const slug = resolvedParams.slug;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: project, error } = await supabase
    .from("projects")
    .select(`
      *,
      profiles ( full_name, affiliation ),
      project_files ( file_name, storage_path, file_type )
    `)
    .eq("slug", slug)
    .single();

  if (error) {
    console.error("Supabase error fetching project:", error);
    return (
      <div className="max-w-4xl mx-auto space-y-6">
        <h1 className="text-2xl font-bold text-red-600">Error loading project</h1>
        <pre className="p-4 bg-muted text-sm rounded-md overflow-auto">{JSON.stringify(error, null, 2)}</pre>
      </div>
    );
  }

  if (!project) {
    notFound();
  }

  // Very basic RLS fallback check: if project is not public, and user is not owner, redirect or hide
  if (!project.is_public && project.owner_id !== user?.id) {
    // Assuming RLS handles this mostly, but if we get here we can show a 404
    notFound();
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <Link 
          href="/dashboard" 
          className={cn(buttonVariants({ variant: "ghost" }), "-ml-4 mb-2 text-muted-foreground")}
        >
          <ChevronLeft className="mr-2 h-4 w-4" />
          Back to Dashboard
        </Link>
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">{project.title}</h1>
            <div className="flex items-center gap-2 mt-3">
              <Badge variant="default" className="capitalize">{project.status}</Badge>
              <Badge variant="outline" className="capitalize">{project.track.replace("_", " ")}</Badge>
              <Badge variant="secondary" className="capitalize">{project.stage.replace("_", " ")}</Badge>
            </div>
          </div>
          {project.ai_score !== null && (
            <Card className="bg-primary/5 border-primary/20 text-center px-6 py-4">
              <div className="text-sm font-semibold text-primary uppercase tracking-wide">AI Score</div>
              <div className="text-4xl font-bold text-primary">{project.ai_score}</div>
              <div className="text-xs text-muted-foreground mt-1">/ 100 Viability</div>
            </Card>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Problem Statement</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="whitespace-pre-wrap">{project.problem_statement}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Proposed Solution</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="whitespace-pre-wrap">{project.proposed_solution}</p>
            </CardContent>
          </Card>

          {project.ai_summary && (
            <Card className="border-blue-200 bg-blue-50/50 dark:bg-blue-900/10 dark:border-blue-900/30">
              <CardHeader>
                <CardTitle className="text-blue-700 dark:text-blue-400 flex items-center gap-2">
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2v4"/><path d="M12 18v4"/><path d="M4.93 4.93l2.83 2.83"/><path d="M16.24 16.24l2.83 2.83"/><path d="M2 12h4"/><path d="M18 12h4"/><path d="M4.93 19.07l2.83-2.83"/><path d="M16.24 7.76l2.83-2.83"/></svg>
                  AI Evaluation Summary
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-blue-900/80 dark:text-blue-200/80 leading-relaxed">
                  {project.ai_summary}
                </p>
              </CardContent>
            </Card>
          )}
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Project Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <span className="text-sm text-muted-foreground block">Submitted By</span>
                <span className="font-medium">{project.profiles?.full_name}</span>
              </div>
              <div>
                <span className="text-sm text-muted-foreground block">Affiliation</span>
                <span className="font-medium capitalize">{project.profiles?.affiliation.replace("_", " ")}</span>
              </div>
              <div>
                <span className="text-sm text-muted-foreground block">Primary Sector</span>
                <div className="flex flex-wrap gap-1 mt-1">
                  {project.sector.map((sec: string) => (
                    <Badge key={sec} variant="outline" className="capitalize">{sec}</Badge>
                  ))}
                </div>
              </div>
              {project.sdg_tags && project.sdg_tags.length > 0 && (
                <div>
                  <span className="text-sm text-muted-foreground block mb-1">SDG Alignments</span>
                  <div className="flex flex-wrap gap-1">
                    {project.sdg_tags.map((sdg: number) => (
                      <Badge key={sdg} variant="secondary" className="bg-green-100 text-green-800 hover:bg-green-100 dark:bg-green-900/30 dark:text-green-300">
                        SDG {sdg}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
              {project.project_files && project.project_files.length > 0 && (
                <div>
                  <span className="text-sm text-muted-foreground block mb-1">Attached Files</span>
                  <div className="flex flex-col gap-2">
                    {project.project_files.map((file: any) => {
                      // Generate a signed URL or public URL depending on bucket settings
                      // For now, assuming we use supabase.storage to get public URL
                      const { data } = supabase.storage.from("project_files").getPublicUrl(file.storage_path);
                      return (
                        <a 
                          key={file.storage_path} 
                          href={data.publicUrl} 
                          target="_blank" 
                          rel="noreferrer"
                          className="text-sm text-blue-600 hover:underline flex items-center gap-1"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"></path><polyline points="13 2 13 9 20 9"></polyline></svg>
                          {file.file_name}
                        </a>
                      );
                    })}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
