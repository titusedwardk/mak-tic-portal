"use server";

import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";

export async function toggleModuleCompletion(
  courseId: string,
  moduleId: string,
  completed: boolean
) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    throw new Error("Unauthorized");
  }

  if (completed) {
    // Check if progress already exists
    const { data: existing } = await supabase
      .from("course_progress")
      .select("id")
      .eq("user_id", user.id)
      .eq("course_id", courseId)
      .eq("module_id", moduleId)
      .maybeSingle();

    if (!existing) {
      const { error } = await supabase.from("course_progress").insert({
        user_id: user.id,
        course_id: courseId,
        module_id: moduleId,
        completed_at: new Date().toISOString(),
      });
      if (error) {
        throw new Error(error.message);
      }
    }
  } else {
    const { error } = await supabase
      .from("course_progress")
      .delete()
      .eq("user_id", user.id)
      .eq("course_id", courseId)
      .eq("module_id", moduleId);

    if (error) {
      throw new Error(error.message);
    }
  }

  revalidatePath(`/courses/${courseId}`);
  revalidatePath(`/courses`);
}
