import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { buttonVariants } from "@/components/ui/button";
import { BookOpen, Clock, CheckCircle2, AlertCircle, Award, PlayCircle, ShieldCheck } from "lucide-react";
import Link from "next/link";

export const dynamic = "force-dynamic";

interface CourseModule {
  id: string;
}

interface DBProgress {
  module_id: string;
  course_id: string;
}

interface DBCourse {
  id: string;
  title: string;
  description: string;
  category: "entrepreneurship" | "technical" | "legal" | "financial" | "safety";
  duration_minutes: number;
  is_required: boolean;
  published: boolean;
  sort_order: number;
  course_modules: CourseModule[];
}

export default async function CoursesPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string }>;
}) {
  const supabase = await createClient();
  
  // Verify authenticated user
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    redirect("/login");
  }

  const resolvedSearchParams = await searchParams;
  const activeCategory = resolvedSearchParams.category || "all";

  // Fetch all published courses and their modules
  const { data: coursesData } = await supabase
    .from("courses")
    .select("*, course_modules(id)")
    .eq("published", true)
    .order("sort_order", { ascending: true });

  const courses = (coursesData || []) as unknown as DBCourse[];

  // Fetch logged in user's course progress
  const { data: progressData } = await supabase
    .from("course_progress")
    .select("module_id, course_id")
    .eq("user_id", user.id);

  const userProgress = (progressData || []) as DBProgress[];
  const completedModuleIds = new Set(userProgress.map((p) => p.module_id));

  // Process courses to attach progress information
  const coursesWithProgress = courses.map((course) => {
    const totalModules = course.course_modules?.length || 0;
    const completedModules = (course.course_modules || []).filter((m) =>
      completedModuleIds.has(m.id)
    ).length;
    const progressPercent =
      totalModules > 0 ? Math.round((completedModules / totalModules) * 100) : 0;
    const isCompleted = totalModules > 0 && completedModules === totalModules;

    return {
      ...course,
      totalModules,
      completedModules,
      progressPercent,
      isCompleted,
    };
  });

  // Calculate statistics
  const totalCoursesCount = coursesWithProgress.length;
  const completedCount = coursesWithProgress.filter((c) => c.isCompleted).length;
  const ongoingCount = coursesWithProgress.filter(
    (c) => c.progressPercent > 0 && !c.isCompleted
  ).length;
  const requiredPendingCount = coursesWithProgress.filter(
    (c) => c.is_required && !c.isCompleted
  ).length;

  // Filter courses based on active category selection
  const filteredCourses =
    activeCategory === "all"
      ? coursesWithProgress
      : coursesWithProgress.filter(
          (c) => c.category.toLowerCase() === activeCategory.toLowerCase()
        );

  const categories = [
    { value: "all", label: "All Categories" },
    { value: "safety", label: "Safety" },
    { value: "technical", label: "Technical" },
    { value: "entrepreneurship", label: "Entrepreneurship" },
    { value: "legal", label: "Legal" },
    { value: "financial", label: "Financial" },
  ];

  // Helper for category badge styling
  const getCategoryStyles = (category: string) => {
    switch (category) {
      case "safety":
        return "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/20 dark:text-rose-400 dark:border-rose-900/30";
      case "entrepreneurship":
        return "bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-950/20 dark:text-indigo-400 dark:border-indigo-900/30";
      case "technical":
        return "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/20 dark:text-emerald-400 dark:border-emerald-900/30";
      case "legal":
        return "bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-900 dark:text-slate-400 dark:border-slate-800";
      case "financial":
        return "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/20 dark:text-amber-400 dark:border-amber-900/30";
      default:
        return "bg-primary/10 text-primary border-primary/20";
    }
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2">
      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-8 md:p-12 shadow-lg border border-slate-800">
        <div className="absolute right-0 top-0 translate-x-12 -translate-y-12 w-96 h-96 rounded-full bg-indigo-500/10 blur-3xl pointer-events-none" />
        <div className="absolute left-1/3 bottom-0 translate-y-1/2 w-64 h-64 rounded-full bg-amber-500/5 blur-3xl pointer-events-none" />
        <div className="relative z-10 max-w-3xl space-y-4">
          <Badge className="bg-amber-500/20 text-amber-300 border-amber-500/30 hover:bg-amber-500/30 px-3 py-1 font-semibold uppercase tracking-wider text-xs">
            Mak-TIC Academy
          </Badge>
          <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight">
            Technology & Innovation LMS
          </h1>
          <p className="text-slate-300 text-base md:text-lg max-w-2xl leading-relaxed">
            Gain vital skills in entrepreneurship, safety standards, legal protection, and product design.
            Complete safety courses to unlock high-end hardware bookings in the MakerSpace.
          </p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="shadow-sm border-slate-200 dark:border-slate-800">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Courses</CardTitle>
            <BookOpen className="h-4 w-4 text-slate-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalCoursesCount}</div>
            <p className="text-xs text-muted-foreground mt-1">Available learning pathways</p>
          </CardContent>
        </Card>

        <Card className="shadow-sm border-slate-200 dark:border-slate-800">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium text-muted-foreground">Completed Pathways</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">{completedCount}</div>
            <p className="text-xs text-muted-foreground mt-1">Fully completed courses</p>
          </CardContent>
        </Card>

        <Card className="shadow-sm border-slate-200 dark:border-slate-800">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium text-muted-foreground">In Progress</CardTitle>
            <PlayCircle className="h-4 w-4 text-indigo-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">{ongoingCount}</div>
            <p className="text-xs text-muted-foreground mt-1">Actively learning modules</p>
          </CardContent>
        </Card>

        <Card className="shadow-sm border-slate-200 dark:border-slate-800">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium text-muted-foreground">Required Pending</CardTitle>
            <AlertCircle className="h-4 w-4 text-rose-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-rose-600 dark:text-rose-400">{requiredPendingCount}</div>
            <p className="text-xs text-muted-foreground mt-1">Mandatory modules remaining</p>
          </CardContent>
        </Card>
      </div>

      {/* Filter and Content Grid */}
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b pb-4 border-slate-200 dark:border-slate-800">
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Explore Courses</h2>
          <div className="flex flex-wrap gap-2">
            {categories.map((cat) => (
              <Link
                key={cat.value}
                href={cat.value === "all" ? "/courses" : `/courses?category=${cat.value}`}
                className={`${
                  activeCategory === cat.value
                    ? "bg-slate-900 text-white dark:bg-white dark:text-slate-950 font-semibold"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-900 dark:text-slate-400 dark:hover:bg-slate-800"
                } text-xs md:text-sm px-3.5 py-1.5 rounded-full transition duration-200`}
              >
                {cat.label}
              </Link>
            ))}
          </div>
        </div>

        {filteredCourses.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-12 text-center bg-slate-50 dark:bg-slate-900/30 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800">
            <BookOpen className="h-12 w-12 text-slate-400 dark:text-slate-600 mb-4" />
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white">No courses found</h3>
            <p className="text-muted-foreground max-w-sm mt-1">
              There are no courses matching the category &quot;{activeCategory}&quot; at the moment. Check back later!
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredCourses.map((course) => (
              <Card
                key={course.id}
                className="flex flex-col h-full hover:shadow-md transition-shadow duration-300 border border-slate-200 dark:border-slate-800 relative group overflow-hidden"
              >
                {course.is_required && (
                  <div className="absolute top-0 right-0 overflow-hidden w-28 h-28 pointer-events-none">
                    <div className="bg-rose-500 text-white font-bold text-[10px] text-center uppercase tracking-wider py-1 transform rotate-45 translate-x-8 translate-y-4 shadow-sm w-full">
                      Required
                    </div>
                  </div>
                )}
                
                <CardHeader className="space-y-3 pb-4">
                  <div className="flex items-center justify-between">
                    <Badge className={`border uppercase text-[10px] font-semibold tracking-wider ${getCategoryStyles(course.category)}`}>
                      {course.category}
                    </Badge>
                    <div className="flex items-center text-xs text-muted-foreground font-medium gap-1.5">
                      <Clock className="h-3.5 w-3.5" />
                      <span>{course.duration_minutes} mins</span>
                    </div>
                  </div>
                  <CardTitle className="line-clamp-2 text-xl font-bold tracking-tight text-slate-900 dark:text-slate-100 group-hover:text-primary transition-colors">
                    {course.title}
                  </CardTitle>
                  <CardDescription className="line-clamp-3 text-sm text-slate-500 dark:text-slate-400">
                    {course.description}
                  </CardDescription>
                </CardHeader>

                <CardContent className="mt-auto pt-0 space-y-4">
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-xs font-semibold text-slate-700 dark:text-slate-300">
                      <span>Progress</span>
                      <span>
                        {course.completedModules} / {course.totalModules} Modules ({course.progressPercent}%)
                      </span>
                    </div>
                    <Progress value={course.progressPercent} className="h-2 bg-slate-100 dark:bg-slate-800" />
                  </div>
                </CardContent>

                <CardFooter className="pt-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/10 flex justify-between items-center">
                  <div className="flex items-center gap-1.5">
                    {course.isCompleted ? (
                      <span className="flex items-center text-xs font-semibold text-emerald-600 dark:text-emerald-400 gap-1">
                        <Award className="h-4 w-4" />
                        Completed
                      </span>
                    ) : course.is_required && course.category === "safety" ? (
                      <span className="flex items-center text-xs font-semibold text-rose-500 dark:text-rose-400 gap-1">
                        <ShieldCheck className="h-4 w-4" />
                        Locks Bookings
                      </span>
                    ) : (
                      <span className="text-xs text-muted-foreground">Self-paced</span>
                    )}
                  </div>

                  <Link
                    href={`/courses/${course.id}`}
                    className={buttonVariants({
                      variant: course.isCompleted ? "outline" : "default",
                      size: "sm",
                      className: "shadow-sm font-semibold rounded-lg",
                    })}
                  >
                    {course.isCompleted ? "Review Modules" : course.progressPercent > 0 ? "Resume" : "Start Course"}
                  </Link>
                </CardFooter>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
