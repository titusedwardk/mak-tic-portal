import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import MentorsClient from "./MentorsClient";
import { Star, Award, Compass, HeartHandshake } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function MentorsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // 1. Fetch user's projects (owned)
  const { data: ownedProjects } = await supabase
    .from("projects")
    .select("id, title, track")
    .eq("owner_id", user.id);

  // 2. Fetch user's projects (membered)
  const { data: memberedLinks } = await supabase
    .from("project_members")
    .select("project_id")
    .eq("user_id", user.id);

  const memberedProjectIds = memberedLinks?.map((l) => l.project_id) || [];

  const projectIds = Array.from(
    new Set([
      ...(ownedProjects?.map((p) => p.id) || []),
      ...memberedProjectIds,
    ])
  );

  // If the user has no projects, show empty state
  if (projectIds.length === 0) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Mentorship Program</h1>
          <p className="text-muted-foreground mt-1">Connect with industry experts to accelerate your innovation.</p>
        </div>

        <Card className="flex flex-col items-center justify-center p-12 text-center border-dashed border-slate-200">
          <HeartHandshake className="w-12 h-12 text-indigo-500 mb-4 stroke-[1.5]" />
          <CardTitle className="text-xl font-bold">No Projects Registered</CardTitle>
          <CardDescription className="max-w-md mt-2">
            You must register a project before you can participate in the Mentorship Program. 
            Once you submit a project, our administrators will match you with a mentor.
          </CardDescription>
        </Card>
      </div>
    );
  }

  // 3. Fetch active mentor assignment
  const { data: assignments } = await supabase
    .from("mentor_assignments")
    .select("id, project_id, mentor_id, status, start_date")
    .in("project_id", projectIds)
    .eq("status", "active");

  const activeAssignment = assignments?.[0];

  if (activeAssignment) {
    // 4. Fetch Mentor's profile details
    const { data: mentorProfile } = await supabase
      .from("profiles")
      .select("full_name, email, avatar_url, affiliation, bio")
      .eq("id", activeAssignment.mentor_id)
      .single();

    const { data: mentorDetails } = await supabase
      .from("mentor_profiles")
      .select("expertise_sectors, availability, languages, rating_avg, total_sessions, bio_extended")
      .eq("id", activeAssignment.mentor_id)
      .single();

    const { data: sessions } = await supabase
      .from("mentor_sessions")
      .select("*")
      .eq("assignment_id", activeAssignment.id)
      .order("scheduled_at", { ascending: false });

    const { data: project } = await supabase
      .from("projects")
      .select("title, track")
      .eq("id", activeAssignment.project_id)
      .single();

    if (mentorProfile && mentorDetails && project) {
      return (
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 bg-clip-text text-transparent">
              Mentorship Program
            </h1>
            <p className="text-muted-foreground mt-1">
              Collaborating on project: <strong className="text-slate-800 dark:text-slate-200">{project.title}</strong>
            </p>
          </div>

          <MentorsClient
            assignment={activeAssignment}
            project={project}
            mentorProfile={mentorProfile}
            mentorDetails={mentorDetails as any}
            sessions={sessions || []}
          />
        </div>
      );
    }
  }

  // If no active assignment, show matching status & Directory of Mentors
  const { data: allMentors } = await supabase
    .from("mentor_profiles")
    .select(`
      id,
      expertise_sectors,
      languages,
      rating_avg,
      total_sessions,
      bio_extended,
      profiles (
        full_name,
        email,
        avatar_url,
        affiliation,
        bio
      )
    `);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Mentorship Program</h1>
        <p className="text-muted-foreground mt-1">Connect with industry experts to scale your project.</p>
      </div>

      <Card className="border-indigo-100 bg-indigo-50/10 shadow-sm">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-50 rounded-lg text-indigo-600">
              <Compass className="w-5 h-5" />
            </div>
            <div>
              <CardTitle className="text-lg">Matching In Progress</CardTitle>
              <CardDescription className="mt-0.5">
                Your project is currently in the matching queue. An admin will pair you with a mentor shortly.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
      </Card>

      <div>
        <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-4">Meet Our Mentors</h2>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {allMentors && allMentors.length > 0 ? (
            allMentors.map((mentor: any) => {
              const p = mentor.profiles;
              if (!p) return null;
              return (
                <Card key={mentor.id} className="flex flex-col hover:shadow-md transition-shadow">
                  <CardHeader className="flex flex-row items-center gap-4 pb-4">
                    <Avatar className="w-12 h-12">
                      <AvatarImage src={p.avatar_url || ""} />
                      <AvatarFallback className="bg-indigo-950 text-white font-bold">
                        {p.full_name.split(" ").map((n: string) => n[0]).join("")}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <CardTitle className="text-base line-clamp-1">{p.full_name}</CardTitle>
                      <CardDescription className="text-xs capitalize mt-0.5">
                        {p.affiliation.replace("_", " ")}
                      </CardDescription>
                    </div>
                  </CardHeader>
                  <CardContent className="flex-1 flex flex-col justify-between">
                    <div className="space-y-3">
                      <p className="text-sm text-muted-foreground line-clamp-3">
                        {p.bio || mentor.bio_extended || "No bio available."}
                      </p>
                      <div className="flex flex-wrap gap-1">
                        {mentor.expertise_sectors.map((sec: string) => (
                          <Badge key={sec} variant="secondary" className="text-[10px] py-0 px-1.5 font-medium">
                            {sec}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    <div className="flex items-center justify-between border-t border-slate-100 pt-3 mt-4 text-xs text-slate-500">
                      <div className="flex items-center text-amber-500 font-semibold">
                        <Star className="w-3.5 h-3.5 fill-amber-500 mr-1" />
                        {mentor.rating_avg ? mentor.rating_avg.toFixed(1) : "New"}
                      </div>
                      <div className="flex items-center gap-1">
                        <Award className="w-3.5 h-3.5" />
                        {mentor.total_sessions || 0} Sessions
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })
          ) : (
            <div className="col-span-full text-center text-muted-foreground py-12">
              No mentor profiles available.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
