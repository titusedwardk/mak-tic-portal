import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import FacilityClient from "./facility-client";

export const dynamic = "force-dynamic";

interface DBCourse {
  id: string;
  title: string;
  course_modules: { id: string }[];
}

interface DBProgress {
  module_id: string;
  course_id: string;
}

export default async function FacilitiesPage() {
  const supabase = await createClient();

  // Validate user authentication
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    redirect("/login");
  }

  // Fetch facilities
  const { data: facilities } = await supabase
    .from("facilities")
    .select("*")
    .eq("active", true)
    .order("name", { ascending: true });

  // Fetch user's projects to link to bookings
  const { data: projects } = await supabase
    .from("projects")
    .select("id, title")
    .eq("owner_id", user.id);

  // Fetch user's existing bookings (joining facility details)
  const { data: bookingsData } = await supabase
    .from("bookings")
    .select(`
      id,
      facility_id,
      start_time,
      end_time,
      purpose,
      status,
      facilities (
        name,
        location,
        type
      )
    `)
    .eq("booked_by", user.id)
    .order("start_time", { ascending: false });

  const bookings = (bookingsData || []).map((booking: any) => ({
    id: booking.id,
    facility_id: booking.facility_id,
    start_time: booking.start_time,
    end_time: booking.end_time,
    purpose: booking.purpose,
    status: booking.status,
    facilities: booking.facilities
      ? {
          name: booking.facilities.name,
          location: booking.facilities.location,
          type: booking.facilities.type,
        }
      : { name: "Unknown Facility", location: "N/A", type: "other" },
  }));

  // Fetch all courses and modules to compute completion status
  const { data: coursesData } = await supabase
    .from("courses")
    .select("id, title, course_modules(id)");

  const courses = (coursesData || []) as unknown as DBCourse[];

  // Fetch user's completed modules
  const { data: progressData } = await supabase
    .from("course_progress")
    .select("module_id, course_id")
    .eq("user_id", user.id);

  const userProgress = (progressData || []) as DBProgress[];
  const completedModuleIds = new Set(userProgress.map((p) => p.module_id));

  // Compute completed courses mapping and titles dictionary
  const completedCourses: Record<string, boolean> = {};
  const trainingCoursesNames: Record<string, string> = {};

  courses.forEach((course) => {
    trainingCoursesNames[course.id] = course.title;
    
    const modules = course.course_modules || [];
    const total = modules.length;
    if (total === 0) {
      completedCourses[course.id] = false;
      return;
    }
    const completed = modules.filter((m) => completedModuleIds.has(m.id)).length;
    completedCourses[course.id] = completed === total;
  });

  return (
    <div className="py-2">
      <FacilityClient
        facilities={facilities || []}
        projects={projects || []}
        bookings={bookings}
        completedCourses={completedCourses}
        trainingCoursesNames={trainingCoursesNames}
      />
    </div>
  );
}
