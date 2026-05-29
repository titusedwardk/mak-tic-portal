"use server";

import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";

export async function createBooking(formData: {
  facilityId: string;
  projectId: string | null;
  startTime: string;
  endTime: string;
  purpose: string;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    throw new Error("Unauthorized");
  }

  // Fetch facility details
  const { data: facility, error: facErr } = await supabase
    .from("facilities")
    .select("*")
    .eq("id", formData.facilityId)
    .single();

  if (facErr || !facility) {
    throw new Error("Facility not found");
  }
  if (!facility.active) {
    throw new Error("This facility is currently inactive and cannot be booked.");
  }

  // Verify safety training if required
  if (facility.requires_training && facility.training_course_id) {
    // Get all module IDs for this training course
    const { data: modules } = await supabase
      .from("course_modules")
      .select("id")
      .eq("course_id", facility.training_course_id);

    const totalModules = modules?.length || 0;
    if (totalModules === 0) {
      throw new Error("This facility requires safety training, but the training course has no modules configured.");
    }

    // Get user's completed module progress
    const { data: progress } = await supabase
      .from("course_progress")
      .select("module_id")
      .eq("user_id", user.id)
      .eq("course_id", facility.training_course_id);

    const completedCount = progress?.length || 0;

    if (completedCount < totalModules) {
      // Fetch course title for helpful feedback
      const { data: course } = await supabase
        .from("courses")
        .select("title")
        .eq("id", facility.training_course_id)
        .single();
      const courseTitle = course?.title || "Safety Training";
      throw new Error(`Safety Training Required: You must complete the course "${courseTitle}" before you can book this facility.`);
    }
  }

  // Parse and validate times
  const start = new Date(formData.startTime);
  const end = new Date(formData.endTime);

  if (isNaN(start.getTime()) || isNaN(end.getTime())) {
    throw new Error("Invalid start or end date/time.");
  }

  if (start <= new Date()) {
    throw new Error("Booking start time must be in the future.");
  }

  if (end <= start) {
    throw new Error("Booking end time must be after the start time.");
  }

  // Check if booking exceeds reasonable limits (e.g. 24 hours)
  const durationMs = end.getTime() - start.getTime();
  const maxDurationMs = 24 * 60 * 60 * 1000; // 24 hours
  if (durationMs > maxDurationMs) {
    throw new Error("Booking duration cannot exceed 24 hours.");
  }

  // Check overlapping approved bookings for the same facility
  const { data: overlaps, error: overlapErr } = await supabase
    .from("bookings")
    .select("id")
    .eq("facility_id", formData.facilityId)
    .eq("status", "approved")
    .lt("start_time", end.toISOString())
    .gt("end_time", start.toISOString());

  if (overlapErr) {
    throw new Error("Failed to check for booking schedule conflicts.");
  }

  if (overlaps && overlaps.length > 0) {
    throw new Error("Time slot conflict: An approved booking already exists for this facility during the selected time.");
  }

  // Insert pending booking
  const { error: insertErr } = await supabase.from("bookings").insert({
    facility_id: formData.facilityId,
    booked_by: user.id,
    project_id: formData.projectId || null,
    start_time: start.toISOString(),
    end_time: end.toISOString(),
    purpose: formData.purpose,
    status: "pending",
  });

  if (insertErr) {
    throw new Error(insertErr.message);
  }

  revalidatePath("/facilities");
  return { success: true };
}
