"use server";

import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";
import { z } from "zod";

const scheduleSchema = z.object({
  assignmentId: z.string().uuid(),
  scheduledAt: z.string().refine((val) => !isNaN(Date.parse(val)), {
    message: "Invalid date format",
  }),
  durationMinutes: z.number().int().min(15).max(180),
  purpose: z.string().min(3, "Purpose must be at least 3 characters").max(500),
});

const feedbackSchema = z.object({
  sessionId: z.string().uuid(),
  rating: z.number().int().min(1).max(5),
  feedback: z.string().min(5, "Feedback must be at least 5 characters").max(1000),
});

export async function scheduleSession(rawData: {
  assignmentId: string;
  scheduledAt: string;
  durationMinutes: number;
  purpose: string;
}) {
  const parsed = scheduleSchema.safeParse(rawData);
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  const { assignmentId, scheduledAt, durationMinutes, purpose } = parsed.data;

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { error: "Unauthorized" };
  }

  // Verify the user is part of the project in this assignment
  const { data: assignment, error: assignmentError } = await supabase
    .from("mentor_assignments")
    .select("project_id, mentor_id")
    .eq("id", assignmentId)
    .single();

  if (assignmentError || !assignment) {
    return { error: "Mentor assignment not found" };
  }

  // Check if owner
  const { data: project } = await supabase
    .from("projects")
    .select("owner_id")
    .eq("id", assignment.project_id)
    .single();

  const isOwner = project?.owner_id === user.id;

  // Check if member
  const { data: member } = await supabase
    .from("project_members")
    .select("id")
    .eq("project_id", assignment.project_id)
    .eq("user_id", user.id)
    .maybeSingle();

  if (!isOwner && !member && assignment.mentor_id !== user.id) {
    return { error: "Access denied" };
  }

  // Insert session
  const { error: insertError } = await supabase.from("mentor_sessions").insert({
    assignment_id: assignmentId,
    scheduled_at: scheduledAt,
    duration_minutes: durationMinutes,
    purpose,
    status: "scheduled",
    meeting_link: "https://meet.google.com/mock-link-" + Math.random().toString(36).substring(2, 7),
  });

  if (insertError) {
    return { error: insertError.message };
  }

  revalidatePath("/mentors");
  return { success: true };
}

export async function submitSessionFeedback(rawData: {
  sessionId: string;
  rating: number;
  feedback: string;
}) {
  const parsed = feedbackSchema.safeParse(rawData);
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  const { sessionId, rating, feedback } = parsed.data;

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { error: "Unauthorized" };
  }

  // Get session and verify user project ownership/membership
  const { data: session, error: sessionError } = await supabase
    .from("mentor_sessions")
    .select("*, mentor_assignments(*)")
    .eq("id", sessionId)
    .single();

  if (sessionError || !session) {
    return { error: "Session not found" };
  }

  const assignment = session.mentor_assignments;
  if (!assignment) {
    return { error: "Assignment not found for this session" };
  }

  const { data: project } = await supabase
    .from("projects")
    .select("owner_id")
    .eq("id", assignment.project_id)
    .single();

  const isOwner = project?.owner_id === user.id;

  const { data: member } = await supabase
    .from("project_members")
    .select("id")
    .eq("project_id", assignment.project_id)
    .eq("user_id", user.id)
    .maybeSingle();

  if (!isOwner && !member) {
    return { error: "Only project innovators can submit feedback" };
  }

  // Update session
  const { error: updateError } = await supabase
    .from("mentor_sessions")
    .update({
      rating_innovator: rating,
      feedback_innovator: feedback,
      status: "completed", // If they give feedback, ensure it's marked completed
    })
    .eq("id", sessionId);

  if (updateError) {
    return { error: updateError.message };
  }

  // Recalculate average rating and total sessions for mentor
  const mentorId = assignment.mentor_id;

  // Get all assignments for this mentor
  const { data: assignments } = await supabase
    .from("mentor_assignments")
    .select("id")
    .eq("mentor_id", mentorId);

  if (assignments && assignments.length > 0) {
    const assignmentIds = assignments.map((a) => a.id);

    const { data: allSessions } = await supabase
      .from("mentor_sessions")
      .select("rating_innovator, status")
      .in("assignment_id", assignmentIds);

    if (allSessions) {
      const completedSessions = allSessions.filter((s) => s.status === "completed");
      const ratedSessions = completedSessions.filter((s) => s.rating_innovator !== null);
      
      const totalSessions = completedSessions.length;
      const ratingAvg = ratedSessions.length > 0
        ? ratedSessions.reduce((acc, s) => acc + (s.rating_innovator || 0), 0) / ratedSessions.length
        : 0;

      // Update mentor profile
      await supabase
        .from("mentor_profiles")
        .update({
          total_sessions: totalSessions,
          rating_avg: parseFloat(ratingAvg.toFixed(2)),
        })
        .eq("id", mentorId);
    }
  }

  revalidatePath("/mentors");
  return { success: true };
}
