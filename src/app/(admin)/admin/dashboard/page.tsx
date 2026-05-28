"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/utils/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import Link from "next/link";
import { ExternalLink } from "lucide-react";

export default function AdminDashboardPage() {
  const supabase = createClient();
  const [projects, setProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    try {
      const { data, error } = await supabase
        .from("projects")
        .select(`
          *,
          profiles (full_name, affiliation)
        `)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setProjects(data || []);
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  const updateProject = async (id: string, field: string, value: string) => {
    try {
      const { error } = await supabase
        .from("projects")
        .update({ [field]: value, updated_at: new Date().toISOString() })
        .eq("id", id);
      
      if (error) throw error;
      toast.success("Project updated successfully");
      fetchProjects();
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  if (loading) {
    return <div>Loading projects...</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">All Projects</h1>
        <p className="text-muted-foreground">Manage and review all project submissions across the platform.</p>
      </div>

      <div className="grid gap-4">
        {projects.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center text-muted-foreground">
              No projects found.
            </CardContent>
          </Card>
        ) : (
          projects.map((project) => (
            <Card key={project.id}>
              <CardContent className="p-6">
                <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-lg">{project.title}</h3>
                      <Link href={`/projects/${project.slug}`} target="_blank">
                        <ExternalLink className="h-4 w-4 text-muted-foreground hover:text-primary" />
                      </Link>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      By {project.profiles?.full_name} • {new Date(project.created_at).toLocaleDateString()}
                    </p>
                    <div className="flex gap-2 mt-2">
                      <Badge variant="outline" className="capitalize">{project.track.replace("_", " ")}</Badge>
                      {project.sector.map((sec: string) => (
                        <Badge key={sec} variant="secondary" className="capitalize">{sec}</Badge>
                      ))}
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row items-center gap-3">
                    {project.ai_score !== null && (
                      <div className="text-center px-4 border-r">
                        <div className="text-xs text-muted-foreground uppercase">AI Score</div>
                        <div className="font-bold text-xl text-primary">{project.ai_score}</div>
                      </div>
                    )}
                    
                    <div className="flex flex-col gap-1 min-w-[140px]">
                      <span className="text-xs text-muted-foreground font-medium">Stage</span>
                      <Select 
                        value={project.stage} 
                        onValueChange={(val) => updateProject(project.id, "stage", val)}
                      >
                        <SelectTrigger className="h-8 text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="submitted">Submitted</SelectItem>
                          <SelectItem value="screening">Screening</SelectItem>
                          <SelectItem value="solution_viability">Solution Viability</SelectItem>
                          <SelectItem value="team_capability">Team Capability</SelectItem>
                          <SelectItem value="economic_return">Economic Return</SelectItem>
                          <SelectItem value="impact">Impact</SelectItem>
                          <SelectItem value="approved">Approved</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="flex flex-col gap-1 min-w-[120px]">
                      <span className="text-xs text-muted-foreground font-medium">Status</span>
                      <Select 
                        value={project.status} 
                        onValueChange={(val) => updateProject(project.id, "status", val)}
                      >
                        <SelectTrigger className="h-8 text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="draft">Draft</SelectItem>
                          <SelectItem value="active">Active</SelectItem>
                          <SelectItem value="rejected">Rejected</SelectItem>
                          <SelectItem value="completed">Completed</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
