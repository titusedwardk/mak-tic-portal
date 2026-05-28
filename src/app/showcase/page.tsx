import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { createClient } from "@/utils/supabase/server";
import { Badge } from "@/components/ui/badge";

export const dynamic = 'force-dynamic';

export default async function ShowcasePage() {
  const supabase = await createClient();

  // Fetch graduated/commercialized projects
  const { data: projects } = await supabase
    .from("projects")
    .select("id, title, description, stage, created_at, profiles(full_name)")
    .in("stage", ["commercialization", "graduated"])
    .order("created_at", { ascending: false });

  return (
    <div className="flex flex-col min-h-screen">
      <header className="px-4 lg:px-6 h-16 flex items-center border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
        <div className="flex items-center space-x-2">
          <Link href="/" className="flex items-center space-x-2">
            <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-lg">M</span>
            </div>
            <span className="font-bold text-xl tracking-tight">Mak-TIC</span>
          </Link>
        </div>
        <nav className="ml-auto flex gap-4 sm:gap-6 items-center">
          <Link className="text-sm font-medium hover:underline underline-offset-4" href="/">
            Home
          </Link>
          <Link href="/login">
            <Button size="sm" variant="outline">Sign In</Button>
          </Link>
        </nav>
      </header>

      <main className="flex-1 py-12 md:py-24 bg-muted/20">
        <div className="container px-4 md:px-6 mx-auto max-w-6xl">
          <div className="flex flex-col items-center space-y-4 text-center mb-12">
            <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl">
              Innovation Showcase
            </h1>
            <p className="mx-auto max-w-[700px] text-muted-foreground md:text-xl">
              Explore the cutting-edge commercialized research and graduated startups from Makerere University.
            </p>
          </div>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {projects?.map((project: any) => (
              <Card key={project.id} className="flex flex-col">
                <CardHeader>
                  <div className="flex justify-between items-start mb-2">
                    <Badge variant="default" className="capitalize">
                      {project.stage}
                    </Badge>
                  </div>
                  <CardTitle className="line-clamp-2">{project.title}</CardTitle>
                  <CardDescription>By {project.profiles?.full_name}</CardDescription>
                </CardHeader>
                <CardContent className="flex-1">
                  <p className="text-sm text-muted-foreground line-clamp-3">
                    {project.description}
                  </p>
                </CardContent>
              </Card>
            ))}
            
            {(!projects || projects.length === 0) && (
              <div className="col-span-full py-12 text-center text-muted-foreground border border-dashed rounded-xl bg-background">
                No public projects available at the moment. Check back later!
              </div>
            )}
          </div>
        </div>
      </main>
      <footer className="flex flex-col gap-2 sm:flex-row py-6 w-full shrink-0 items-center px-4 md:px-6 border-t bg-background">
        <p className="text-xs text-muted-foreground">
          © 2026 Makerere University Technology & Innovation Center (Mak-TIC). All rights reserved.
        </p>
      </footer>
    </div>
  );
}
