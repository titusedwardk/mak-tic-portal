"use client";

import { useState, useTransition, useMemo } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  Play,
  CheckCircle2,
  Circle,
  ChevronLeft,
  ChevronRight,
  BookOpen,
  Video,
  FileText,
  Award,
  ArrowLeft,
  Loader2,
} from "lucide-react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { toggleModuleCompletion } from "../actions";

interface CourseModule {
  id: string;
  course_id: string;
  title: string;
  content: string;
  video_url: string | null;
  sort_order: number;
}

interface Course {
  id: string;
  title: string;
  description: string;
  category: string;
  duration_minutes: number;
  is_required: boolean;
}

interface CoursePlayerProps {
  course: Course;
  modules: CourseModule[];
  initialCompletedModuleIds: string[];
}

export default function CoursePlayer({
  course,
  modules,
  initialCompletedModuleIds,
}: CoursePlayerProps) {
  const router = useRouter();
  const [completedIds, setCompletedIds] = useState<string[]>(initialCompletedModuleIds);
  const [activeModuleIndex, setActiveModuleIndex] = useState(0);
  const [isPending, startTransition] = useTransition();

  const activeModule = modules[activeModuleIndex];

  // Helper to parse YouTube URLs to safe embed links
  const embedUrl = useMemo(() => {
    if (!activeModule?.video_url) return null;
    const url = activeModule.video_url;
    if (url.includes("/embed/")) return url;

    try {
      let videoId = "";
      if (url.includes("youtu.be/")) {
        videoId = url.split("youtu.be/")[1]?.split(/[?#]/)[0] || "";
      } else if (url.includes("youtube.com/watch")) {
        const parts = url.split("?");
        if (parts.length > 1) {
          const urlParams = new URLSearchParams(parts[1]);
          videoId = urlParams.get("v") || "";
        }
      } else if (url.includes("youtube.com/embed/")) {
        videoId = url.split("youtube.com/embed/")[1]?.split(/[?#]/)[0] || "";
      }
      return videoId ? `https://www.youtube.com/embed/${videoId}?rel=0` : null;
    } catch (e) {
      console.error("YouTube URL parsing error:", e);
      return null;
    }
  }, [activeModule]);

  const totalModules = modules.length;
  const completedCount = modules.filter((m) => completedIds.includes(m.id)).length;
  const progressPercent =
    totalModules > 0 ? Math.round((completedCount / totalModules) * 100) : 0;
  const isCourseCompleted = completedCount === totalModules && totalModules > 0;

  const handleToggleComplete = async (moduleId: string) => {
    const isCompleted = completedIds.includes(moduleId);
    const newCompleted = isCompleted
      ? completedIds.filter((id) => id !== moduleId)
      : [...completedIds, moduleId];

    setCompletedIds(newCompleted);

    startTransition(async () => {
      try {
        await toggleModuleCompletion(course.id, moduleId, !isCompleted);
        if (!isCompleted) {
          toast.success("Module marked as completed!");
          // Auto advance to next module if available
          if (activeModuleIndex < totalModules - 1) {
            setTimeout(() => {
              setActiveModuleIndex((prev) => prev + 1);
            }, 800);
          } else if (newCompleted.length === totalModules) {
            toast.success("Congratulations! You have completed the entire course.", {
              icon: <Award className="h-5 w-5 text-amber-500 animate-bounce" />,
              duration: 5000,
            });
          }
        } else {
          toast.info("Module marked as incomplete.");
        }
        router.refresh();
      } catch (err: any) {
        // Rollback state on error
        setCompletedIds(completedIds);
        toast.error(err.message || "Failed to update module progress");
      }
    });
  };

  if (!activeModule) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-center p-8 bg-slate-50 dark:bg-slate-900/30 rounded-2xl border border-dashed">
        <BookOpen className="h-12 w-12 text-slate-400 mb-4" />
        <h3 className="text-lg font-semibold">No modules found</h3>
        <p className="text-muted-foreground mt-1">This course does not contain any modules yet.</p>
        <Link href="/courses" className="mt-4 text-primary hover:underline font-semibold flex items-center gap-1">
          <ArrowLeft className="h-4 w-4" /> Back to Courses
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Upper Navigation Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b pb-4">
        <div className="flex items-center gap-3">
          <Link
            href="/courses"
            className="p-2 border border-slate-200 dark:border-slate-800 rounded-lg bg-white dark:bg-slate-950 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-900 transition-colors shadow-sm"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <Badge className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 uppercase text-[10px] tracking-wider font-semibold">
                {course.category}
              </Badge>
              {course.is_required && (
                <Badge variant="destructive" className="uppercase text-[10px] tracking-wider font-semibold">
                  Required
                </Badge>
              )}
            </div>
            <h1 className="text-xl md:text-2xl font-bold tracking-tight text-slate-900 dark:text-white mt-1">
              {course.title}
            </h1>
          </div>
        </div>

        {/* Progress Tracker Widget */}
        <div className="flex flex-col md:items-end gap-1.5 w-full md:w-64 bg-slate-50 dark:bg-slate-900/50 p-3.5 rounded-xl border border-slate-200 dark:border-slate-800">
          <div className="flex justify-between w-full text-xs font-semibold text-slate-700 dark:text-slate-300">
            <span>Course Progress</span>
            <span>
              {completedCount}/{totalModules} Modules ({progressPercent}%)
            </span>
          </div>
          <Progress value={progressPercent} className="h-2 w-full bg-slate-200 dark:bg-slate-800" />
          {isCourseCompleted && (
            <span className="flex items-center text-[10px] font-bold text-emerald-600 dark:text-emerald-400 gap-1 mt-0.5">
              <Award className="h-3.5 w-3.5" /> Certified Course Completion
            </span>
          )}
        </div>
      </div>

      {/* Main Split Interface */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Sidebar - Syllabus */}
        <div className="lg:col-span-4 space-y-4 lg:sticky lg:top-24 h-fit">
          <Card className="shadow-sm border-slate-200 dark:border-slate-800">
            <CardHeader className="py-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/10">
              <CardTitle className="text-sm font-bold tracking-wider uppercase text-slate-500 dark:text-slate-400">
                Course Syllabus
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <nav className="divide-y divide-slate-100 dark:divide-slate-800">
                {modules.map((mod, idx) => {
                  const isModActive = idx === activeModuleIndex;
                  const isModCompleted = completedIds.includes(mod.id);

                  return (
                    <button
                      key={mod.id}
                      onClick={() => setActiveModuleIndex(idx)}
                      className={`w-full flex items-start gap-3 p-4 text-left transition-colors duration-200 hover:bg-slate-50 dark:hover:bg-slate-900/50 relative ${
                        isModActive
                          ? "bg-indigo-50/50 dark:bg-indigo-950/20 text-indigo-900 dark:text-indigo-200"
                          : "text-slate-700 dark:text-slate-300"
                      }`}
                    >
                      {/* Active Left Indicator Bar */}
                      {isModActive && (
                        <div className="absolute left-0 top-0 bottom-0 w-1 bg-indigo-600 dark:bg-indigo-500" />
                      )}

                      <div className="mt-0.5 flex-shrink-0">
                        {isModCompleted ? (
                          <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                        ) : isModActive ? (
                          <Play className="h-5 w-5 text-indigo-600 dark:text-indigo-400 fill-indigo-100 dark:fill-indigo-950/50 animate-pulse" />
                        ) : (
                          <Circle className="h-5 w-5 text-slate-300 dark:text-slate-700" />
                        )}
                      </div>

                      <div className="space-y-1">
                        <div className="flex items-center gap-1.5">
                          <span className="text-[10px] font-bold text-slate-400 dark:text-slate-600 tracking-wider">
                            MODULE {String(idx + 1).padStart(2, "0")}
                          </span>
                          {mod.video_url && (
                            <Badge className="bg-slate-100 dark:bg-slate-800 text-[9px] hover:bg-slate-200 border-none px-1 py-0 text-muted-foreground flex gap-0.5 items-center">
                              <Video className="h-2.5 w-2.5" /> Video
                            </Badge>
                          )}
                        </div>
                        <span className={`text-sm font-semibold leading-snug line-clamp-2 ${
                          isModActive ? "text-indigo-950 dark:text-indigo-300 font-bold" : ""
                        }`}>
                          {mod.title}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </nav>
            </CardContent>
          </Card>
        </div>

        {/* Right Main Panel - Player Area */}
        <div className="lg:col-span-8 space-y-6">
          {/* Video Player */}
          {embedUrl ? (
            <div className="relative overflow-hidden rounded-2xl bg-black border border-slate-200 dark:border-slate-800 shadow-sm aspect-video">
              <iframe
                src={embedUrl}
                title={activeModule.title}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowFullScreen
                className="absolute inset-0 w-full h-full border-0"
              />
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center p-8 bg-slate-50 dark:bg-slate-900/10 rounded-2xl border border-slate-200 dark:border-slate-800 h-48 text-center text-slate-500">
              <FileText className="h-10 w-10 text-slate-400 mb-2" />
              <p className="text-sm font-semibold">Reading Module</p>
              <p className="text-xs text-muted-foreground">This module consists of reading content. No video accompanying.</p>
            </div>
          )}

          {/* Module Content */}
          <Card className="shadow-sm border-slate-200 dark:border-slate-800">
            <CardHeader className="pb-4 border-b">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-400 dark:text-slate-600 tracking-wider">
                  MODULE {String(activeModuleIndex + 1).padStart(2, "0")} OF {totalModules}
                </span>
                <span className="text-xs font-medium text-slate-500 flex items-center gap-1 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-full">
                  {activeModule.video_url ? (
                    <>
                      <Video className="h-3 w-3 text-slate-400" /> Video & Reading
                    </>
                  ) : (
                    <>
                      <FileText className="h-3 w-3 text-slate-400" /> Reading Only
                    </>
                  )}
                </span>
              </div>
              <CardTitle className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white mt-1">
                {activeModule.title}
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              {/* Render content dynamically in a nice readable layout */}
              <div className="prose prose-slate dark:prose-invert max-w-none prose-sm sm:prose-base leading-relaxed text-slate-700 dark:text-slate-300">
                {activeModule.content.split("\n\n").map((para, i) => (
                  <p key={i} className="mb-4 last:mb-0">
                    {para.split("\n").map((line, j) => (
                      <span key={j} className="block">
                        {line}
                      </span>
                    ))}
                  </p>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Footer Controls / Navigation and Toggle Action */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-slate-50 dark:bg-slate-900/30 p-4 rounded-xl border border-slate-200 dark:border-slate-800">
            {/* Completion Toggle Button */}
            <Button
              onClick={() => handleToggleComplete(activeModule.id)}
              disabled={isPending}
              className={`w-full sm:w-auto font-bold px-6 shadow-sm rounded-lg ${
                completedIds.includes(activeModule.id)
                  ? "bg-slate-200 hover:bg-slate-300 text-slate-800 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-200"
                  : "bg-emerald-600 hover:bg-emerald-700 text-white dark:bg-emerald-500 dark:hover:bg-emerald-600"
              }`}
            >
              {isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Updating...
                </>
              ) : completedIds.includes(activeModule.id) ? (
                <>
                  <CheckCircle2 className="mr-2 h-4.5 w-4.5 text-emerald-500 fill-emerald-50" />
                  Completed (Click to Reset)
                </>
              ) : (
                "Mark Module as Completed"
              )}
            </Button>

            {/* Navigation Buttons */}
            <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-end">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setActiveModuleIndex((prev) => Math.max(0, prev - 1))}
                disabled={activeModuleIndex === 0}
                className="font-semibold rounded-lg flex items-center gap-1 px-4"
              >
                <ChevronLeft className="h-4 w-4" /> Prev
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setActiveModuleIndex((prev) => Math.min(totalModules - 1, prev + 1))}
                disabled={activeModuleIndex === totalModules - 1}
                className="font-semibold rounded-lg flex items-center gap-1 px-4"
              >
                Next <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
