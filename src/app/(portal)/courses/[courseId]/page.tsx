import { createClient } from "@/utils/supabase/server";
import { redirect, notFound } from "next/navigation";
import CoursePlayer from "./course-player";

export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ courseId: string }>;
}

export default async function CourseDetailPage({ params }: PageProps) {
  const supabase = await createClient();

  // Validate user authentication
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    redirect("/login");
  }

  // Await dynamic parameters (Next.js 16 constraint)
  const resolvedParams = await params;
  const courseId = resolvedParams.courseId;

  // Fetch course details
  const { data: course, error: courseError } = await supabase
    .from("courses")
    .select("id, title, description, category, duration_minutes, is_required")
    .eq("id", courseId)
    .single();

  if (courseError || !course) {
    notFound();
  }

  // Fetch all modules for this course
  const { data: modules, error: modulesError } = await supabase
    .from("course_modules")
    .select("id, course_id, title, content, video_url, sort_order")
    .eq("course_id", courseId)
    .order("sort_order", { ascending: true });

  if (modulesError) {
    throw new Error("Failed to fetch course modules");
  }

  // Fetch completed module progress for this user in this course
  const { data: progress, error: progressError } = await supabase
    .from("course_progress")
    .select("module_id")
    .eq("user_id", user.id)
    .eq("course_id", courseId);

  if (progressError) {
    throw new Error("Failed to fetch course progress details");
  }

  const completedModuleIds = (progress || []).map((p) => p.module_id);

  return (
    <div className="py-2">
      <CoursePlayer
        course={course}
        modules={modules || []}
        initialCompletedModuleIds={completedModuleIds}
      />
    </div>
  );
}
