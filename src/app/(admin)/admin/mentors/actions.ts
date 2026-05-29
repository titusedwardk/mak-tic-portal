"use server";

import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";
import { z } from "zod";

const idSchema = z.string().uuid();

async function checkAdmin() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    throw new Error("Unauthorized");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "admin") {
    throw new Error("Access denied: Admin role required");
  }

  return { supabase, user };
}

async function updateMentorMenteesCount(supabase: any, mentorId: string) {
  const { data: activeAssignments } = await supabase
    .from("mentor_assignments")
    .select("id")
    .eq("mentor_id", mentorId)
    .eq("status", "active");

  const count = activeAssignments?.length || 0;

  await supabase
    .from("mentor_profiles")
    .update({ current_mentees: count })
    .eq("id", mentorId);
}

export async function activateAssignment(assignmentId: string) {
  try {
    idSchema.parse(assignmentId);
    const { supabase } = await checkAdmin();

    // Get the assignment details to find the mentor_id
    const { data: assignment, error: fetchError } = await supabase
      .from("mentor_assignments")
      .select("mentor_id")
      .eq("id", assignmentId)
      .single();

    if (fetchError || !assignment) {
      return { error: "Assignment not found" };
    }

    // Update status to active
    const { error: updateError } = await supabase
      .from("mentor_assignments")
      .update({
        status: "active",
        start_date: new Date().toISOString(),
      })
      .eq("id", assignmentId);

    if (updateError) {
      return { error: updateError.message };
    }

    // Update workload count for this mentor
    await updateMentorMenteesCount(supabase, assignment.mentor_id);

    revalidatePath("/admin/mentors");
    return { success: true };
  } catch (err: any) {
    return { error: err.message || "An error occurred" };
  }
}

export async function deleteAssignment(assignmentId: string) {
  try {
    idSchema.parse(assignmentId);
    const { supabase } = await checkAdmin();

    // Get the assignment details to find the mentor_id before deletion
    const { data: assignment, error: fetchError } = await supabase
      .from("mentor_assignments")
      .select("mentor_id")
      .eq("id", assignmentId)
      .single();

    if (fetchError || !assignment) {
      return { error: "Assignment not found" };
    }

    // Delete assignment
    const { error: deleteError } = await supabase
      .from("mentor_assignments")
      .delete()
      .eq("id", assignmentId);

    if (deleteError) {
      return { error: deleteError.message };
    }

    // Update workload count for this mentor
    await updateMentorMenteesCount(supabase, assignment.mentor_id);

    revalidatePath("/admin/mentors");
    return { success: true };
  } catch (err: any) {
    return { error: err.message || "An error occurred" };
  }
}
