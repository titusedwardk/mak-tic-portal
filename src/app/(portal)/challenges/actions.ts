"use server";

import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";
import { z } from "zod";

const submissionSchema = z.object({
  challengeId: z.string().uuid("Invalid challenge ID"),
  projectId: z.string().uuid("Invalid project ID").nullable().optional(),
  title: z.string().min(5, "Title must be at least 5 characters"),
  description: z.string().min(20, "Proposal must be at least 20 characters"),
});

export type ChallengeSubmissionState = {
  success: boolean;
  message?: string;
  errors?: {
    challengeId?: string[];
    projectId?: string[];
    title?: string[];
    description?: string[];
  };
};

export async function submitChallengeEntry(
  prevState: ChallengeSubmissionState,
  formData: FormData
): Promise<ChallengeSubmissionState> {
  try {
    const validatedFields = submissionSchema.safeParse({
      challengeId: formData.get("challengeId"),
      projectId: formData.get("projectId") || null,
      title: formData.get("title"),
      description: formData.get("description"),
    });

    if (!validatedFields.success) {
      return {
        success: false,
        errors: validatedFields.error.flatten().fieldErrors,
      };
    }

    const { challengeId, projectId, title, description } = validatedFields.data;

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return {
        success: false,
        message: "You must be logged in to submit a solution.",
      };
    }

    // 1. Verify that the challenge exists and is open
    const { data: challenge, error: challengeError } = await supabase
      .from("challenges")
      .select("status, submission_deadline")
      .eq("id", challengeId)
      .single();

    if (challengeError || !challenge) {
      return {
        success: false,
        message: "Challenge not found.",
      };
    }

    if (challenge.status !== "open") {
      return {
        success: false,
        message: "This challenge is no longer open for submissions.",
      };
    }

    if (new Date(challenge.submission_deadline) < new Date()) {
      return {
        success: false,
        message: "The deadline for this challenge has already passed.",
      };
    }

    // 2. Save the submission
    const { error: insertError } = await supabase
      .from("challenge_submissions")
      .insert({
        challenge_id: challengeId,
        project_id: projectId || null,
        submitter_id: user.id,
        title,
        description,
        status: "submitted",
      });

    if (insertError) {
      console.error("Insert error:", insertError);
      return {
        success: false,
        message: "Database error: Failed to submit solution. Make sure you own the selected project.",
      };
    }

    revalidatePath(`/challenges/${challengeId}`);
    return {
      success: true,
      message: "Solution submitted successfully! The coordinators will review your submission shortly.",
    };
  } catch (error) {
    console.error("Submission error:", error);
    return {
      success: false,
      message: "An unexpected error occurred. Please try again.",
    };
  }
}
