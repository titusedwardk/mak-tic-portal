import { createClient } from "@/utils/supabase/server";
import { ChallengeManager } from "./ChallengeManager";

export const dynamic = 'force-dynamic';

export default async function AdminChallengesPage() {
  const supabase = await createClient();

  // 1. Fetch Challenges
  const { data: challenges, error: challengesError } = await supabase
    .from("challenges")
    .select("*")
    .order("created_at", { ascending: false });

  if (challengesError) {
    console.error("Failed to load challenges for admin:", challengesError);
  }

  // 2. Fetch Submissions with profiles, challenge details, and projects details
  const { data: submissions, error: submissionsError } = await supabase
    .from("challenge_submissions")
    .select(`
      *,
      profiles(full_name, email),
      challenges(title),
      projects(title, slug)
    `)
    .order("created_at", { ascending: false });

  if (submissionsError) {
    console.error("Failed to load submissions for admin:", submissionsError);
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Challenge Management</h1>
        <p className="text-muted-foreground mt-1">
          Create innovation challenges, configure judging deadlines and target sectors, and review solution entries.
        </p>
      </div>

      <ChallengeManager
        challenges={challenges || []}
        submissions={submissions || []}
      />
    </div>
  );
}

