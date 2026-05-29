"use server";

import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";
import { z } from "zod";

const postSchema = z.object({
  title: z.string().min(5, "Title must be at least 5 characters"),
  categoryId: z.string().uuid("Invalid category ID selected"),
  body: z.string().min(10, "Post body must be at least 10 characters"),
});

const replySchema = z.object({
  postId: z.string().uuid("Invalid post ID"),
  parentReplyId: z.string().uuid("Invalid parent reply ID").nullable().optional(),
  body: z.string().min(2, "Reply must be at least 2 characters"),
});

export async function createForumPost(prevState: any, formData: FormData) {
  try {
    const validatedFields = postSchema.safeParse({
      title: formData.get("title"),
      categoryId: formData.get("categoryId"),
      body: formData.get("body"),
    });

    if (!validatedFields.success) {
      return {
        success: false,
        errors: validatedFields.error.flatten().fieldErrors,
        message: "Validation failed. Please fill all fields correctly.",
      };
    }

    const { title, categoryId, body } = validatedFields.data;

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return {
        success: false,
        message: "You must be signed in to create a forum post.",
      };
    }

    // Insert the post
    const { error: insertError } = await supabase
      .from("forum_posts")
      .insert({
        title,
        category_id: categoryId,
        author_id: user.id,
        body,
        reply_count: 0,
      });

    if (insertError) {
      console.error("Post insert error:", insertError);
      return {
        success: false,
        message: `Database error: ${insertError.message}`,
      };
    }

    revalidatePath("/forum");
    return {
      success: true,
      message: "Post created successfully!",
    };
  } catch (error) {
    console.error("Forum post error:", error);
    return {
      success: false,
      message: "An unexpected error occurred.",
    };
  }
}

export async function createForumReply(prevState: any, formData: FormData) {
  try {
    const validatedFields = replySchema.safeParse({
      postId: formData.get("postId"),
      parentReplyId: formData.get("parentReplyId") || null,
      body: formData.get("body"),
    });

    if (!validatedFields.success) {
      return {
        success: false,
        errors: validatedFields.error.flatten().fieldErrors,
        message: "Validation failed. Message must be at least 2 characters.",
      };
    }

    const { postId, parentReplyId, body } = validatedFields.data;

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return {
        success: false,
        message: "You must be signed in to write a reply.",
      };
    }

    // Insert the reply
    const { error: insertError } = await supabase
      .from("forum_replies")
      .insert({
        post_id: postId,
        parent_reply_id: parentReplyId || null,
        author_id: user.id,
        body,
      });

    if (insertError) {
      console.error("Reply insert error:", insertError);
      return {
        success: false,
        message: `Database error: ${insertError.message}`,
      };
    }

    // Increment reply count on the post
    const { data: postData } = await supabase
      .from("forum_posts")
      .select("reply_count")
      .eq("id", postId)
      .single();
    
    const newCount = (postData?.reply_count || 0) + 1;

    await supabase
      .from("forum_posts")
      .update({ reply_count: newCount })
      .eq("id", postId);

    revalidatePath(`/forum/${postId}`);
    revalidatePath("/forum");
    
    return {
      success: true,
      message: "Reply added!",
    };
  } catch (error) {
    console.error("Forum reply error:", error);
    return {
      success: false,
      message: "An unexpected error occurred.",
    };
  }
}
