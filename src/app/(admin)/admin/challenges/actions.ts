"use server";

import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";
import { z } from "zod";

const challengeSchema = z.object({
  title: z.string().min(5, "Title must be at least 5 characters"),
  description: z.string().min(10, "Description must be at least 10 characters"),
  sponsorName: z.string().min(2, "Sponsor name is required"),
  prizeAmount: z.coerce.number().min(0, "Prize must be 0 or more"),
  sectorTagsString: z.string().min(2, "Sectors are required"),
  sdgTags: z.array(z.coerce.number()),
  submissionDeadline: z.string().refine((val) => !isNaN(Date.parse(val)), "Invalid submission deadline date"),
  judgingDeadline: z.string().refine((val) => !isNaN(Date.parse(val)), "Invalid judging deadline date"),
  status: z.enum(["draft", "open", "judging", "closed", "archived"]),
  maxSubmissions: z.coerce.number().nullable().optional(),
});

const gradeSchema = z.object({
  submissionId: z.string().uuid("Invalid submission ID"),
  score: z.coerce.number().min(0).max(100, "Score must be between 0 and 100"),
  status: z.enum(["submitted", "shortlisted", "winner", "runner_up", "not_selected"]),
});

// Helper to check if current user is an admin
async function checkAdmin(supabase: any) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return false;

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  return profile?.role === "admin";
}

export async function createChallenge(prevState: any, formData: FormData) {
  try {
    const supabase = await createClient();
    if (!(await checkAdmin(supabase))) {
      return { success: false, message: "Unauthorized. Admin privileges required." };
    }

    // Parse SDGs from the checkboxes
    const sdgTags: number[] = [];
    for (let i = 1; i <= 17; i++) {
      if (formData.get(`sdg-${i}`) === "on") {
        sdgTags.push(i);
      }
    }

    const validatedFields = challengeSchema.safeParse({
      title: formData.get("title"),
      description: formData.get("description"),
      sponsorName: formData.get("sponsorName"),
      prizeAmount: formData.get("prizeAmount"),
      sectorTagsString: formData.get("sectorTagsString"),
      sdgTags,
      submissionDeadline: formData.get("submissionDeadline"),
      judgingDeadline: formData.get("judgingDeadline"),
      status: formData.get("status"),
      maxSubmissions: formData.get("maxSubmissions") || null,
    });

    if (!validatedFields.success) {
      return {
        success: false,
        errors: validatedFields.error.flatten().fieldErrors,
        message: "Validation failed. Please correct form errors.",
      };
    }

    const data = validatedFields.data;
    const sectors = data.sectorTagsString.split(",").map(s => s.trim()).filter(Boolean);

    const { data: { user } } = await supabase.auth.getUser();

    const { error } = await supabase
      .from("challenges")
      .insert({
        title: data.title,
        description: data.description,
        sponsor_name: data.sponsorName,
        prize_amount: data.prizeAmount,
        sector_tags: sectors,
        sdg_tags: data.sdgTags,
        submission_deadline: new Date(data.submissionDeadline).toISOString(),
        judging_deadline: new Date(data.judgingDeadline).toISOString(),
        status: data.status,
        max_submissions: data.maxSubmissions || null,
        created_by: user?.id,
      });

    if (error) {
      console.error(error);
      return { success: false, message: `Database Error: ${error.message}` };
    }

    revalidatePath("/admin/challenges");
    revalidatePath("/challenges");
    return { success: true, message: "Challenge created successfully!" };
  } catch (err: any) {
    return { success: false, message: err.message || "An error occurred." };
  }
}

export async function updateChallenge(challengeId: string, prevState: any, formData: FormData) {
  try {
    const supabase = await createClient();
    if (!(await checkAdmin(supabase))) {
      return { success: false, message: "Unauthorized. Admin privileges required." };
    }

    const sdgTags: number[] = [];
    for (let i = 1; i <= 17; i++) {
      if (formData.get(`sdg-${i}`) === "on") {
        sdgTags.push(i);
      }
    }

    const validatedFields = challengeSchema.safeParse({
      title: formData.get("title"),
      description: formData.get("description"),
      sponsorName: formData.get("sponsorName"),
      prizeAmount: formData.get("prizeAmount"),
      sectorTagsString: formData.get("sectorTagsString"),
      sdgTags,
      submissionDeadline: formData.get("submissionDeadline"),
      judgingDeadline: formData.get("judgingDeadline"),
      status: formData.get("status"),
      maxSubmissions: formData.get("maxSubmissions") || null,
    });

    if (!validatedFields.success) {
      return {
        success: false,
        errors: validatedFields.error.flatten().fieldErrors,
        message: "Validation failed. Please correct form errors.",
      };
    }

    const data = validatedFields.data;
    const sectors = data.sectorTagsString.split(",").map(s => s.trim()).filter(Boolean);

    const { error } = await supabase
      .from("challenges")
      .update({
        title: data.title,
        description: data.description,
        sponsor_name: data.sponsorName,
        prize_amount: data.prizeAmount,
        sector_tags: sectors,
        sdg_tags: data.sdgTags,
        submission_deadline: new Date(data.submissionDeadline).toISOString(),
        judging_deadline: new Date(data.judgingDeadline).toISOString(),
        status: data.status,
        max_submissions: data.maxSubmissions || null,
      })
      .eq("id", challengeId);

    if (error) {
      console.error(error);
      return { success: false, message: `Database Error: ${error.message}` };
    }

    revalidatePath("/admin/challenges");
    revalidatePath(`/challenges/${challengeId}`);
    revalidatePath("/challenges");
    return { success: true, message: "Challenge updated successfully!" };
  } catch (err: any) {
    return { success: false, message: err.message || "An error occurred." };
  }
}

export async function gradeSubmission(prevState: any, formData: FormData) {
  try {
    const supabase = await createClient();
    if (!(await checkAdmin(supabase))) {
      return { success: false, message: "Unauthorized. Admin privileges required." };
    }

    const validatedFields = gradeSchema.safeParse({
      submissionId: formData.get("submissionId"),
      score: formData.get("score"),
      status: formData.get("status"),
    });

    if (!validatedFields.success) {
      return {
        success: false,
        errors: validatedFields.error.flatten().fieldErrors,
        message: "Validation failed. Check your score range (0-100).",
      };
    }

    const { submissionId, score, status } = validatedFields.data;

    const { error } = await supabase
      .from("challenge_submissions")
      .update({
        judge_score_avg: score,
        status: status,
      })
      .eq("id", submissionId);

    if (error) {
      console.error(error);
      return { success: false, message: `Database Error: ${error.message}` };
    }

    // Trigger revalidations
    const { data: sub } = await supabase
      .from("challenge_submissions")
      .select("challenge_id")
      .eq("id", submissionId)
      .single();

    if (sub) {
      revalidatePath(`/challenges/${sub.challenge_id}`);
    }
    revalidatePath("/admin/challenges");

    return { success: true, message: "Submission graded successfully!" };
  } catch (err: any) {
    return { success: false, message: err.message || "An error occurred." };
  }
}
