import { createClient } from "@/utils/supabase/server";
import { ThreadReplies } from "./ThreadReplies";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { ChevronLeft, User, Clock, MessageSquare, Pin } from "lucide-react";
import { notFound } from "next/navigation";

export const dynamic = 'force-dynamic';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function ForumThreadPage({ params }: PageProps) {
  const resolvedParams = await params;
  const { id: postId } = resolvedParams;

  const supabase = await createClient();

  // 1. Fetch Post Details (with author details and category details)
  const { data: post, error: postError } = await supabase
    .from("forum_posts")
    .select(`
      id,
      title,
      body,
      is_pinned,
      reply_count,
      created_at,
      profiles ( full_name, role ),
      forum_categories ( name, slug )
    `)
    .eq("id", postId)
    .single();

  if (postError || !post) {
    notFound();
  }

  const category = Array.isArray(post.forum_categories)
    ? post.forum_categories[0]
    : post.forum_categories;

  const profile = Array.isArray(post.profiles)
    ? post.profiles[0]
    : post.profiles;

  // 2. Fetch Post Replies (with author details)
  const { data: replies, error: repliesError } = await supabase
    .from("forum_replies")
    .select(`
      id,
      post_id,
      parent_reply_id,
      body,
      created_at,
      profiles ( full_name, role, avatar_url )
    `)
    .eq("post_id", postId)
    .order("created_at", { ascending: true });

  if (repliesError) {
    console.error("Error loading replies:", repliesError);
  }

  const mappedReplies = (replies || []).map((reply) => {
    const replyProfile = Array.isArray(reply.profiles) ? reply.profiles[0] : reply.profiles;
    return {
      ...reply,
      profiles: replyProfile ? {
        full_name: replyProfile.full_name || "Unknown Author",
        role: replyProfile.role || "Innovator",
        avatar_url: replyProfile.avatar_url || null,
      } : null,
    };
  });

  // 3. Check User Session
  const { data: { user } } = await supabase.auth.getUser();

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-UG", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    });
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      
      {/* Back to Forum navigation */}
      <div className="flex items-center">
        <Link
          href="/forum"
          className={cn(buttonVariants({ variant: "ghost" }), "text-muted-foreground hover:text-foreground")}
        >
          <ChevronLeft className="h-4 w-4 mr-1.5" /> Back to Forum
        </Link>
      </div>

      {/* Main Post Card */}
      <Card className="border-slate-200 dark:border-slate-800 shadow-md">
        <CardHeader className="space-y-4 pb-4">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="outline" className="text-xs border-indigo-500/20 text-indigo-650 bg-indigo-500/5">
              {category?.name}
            </Badge>
            {post.is_pinned && (
              <Badge className="bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20 flex items-center gap-1 py-0.5 px-2 text-[10px] font-bold">
                <Pin className="h-3 w-3 fill-amber-500 text-amber-500" /> Pinned
              </Badge>
            )}
          </div>

          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-slate-50">
            {post.title}
          </h1>

          <div className="flex items-center gap-3 text-xs text-muted-foreground flex-wrap">
            <span className="flex items-center gap-1 font-semibold text-slate-700 dark:text-slate-350">
              <User className="h-3.5 w-3.5 text-slate-400" /> By {profile?.full_name || "Unknown Author"}
            </span>
            <span>•</span>
            <span className="flex items-center gap-1">
              <Clock className="h-3.5 w-3.5 text-slate-400" /> {formatDate(post.created_at)}
            </span>
          </div>
        </CardHeader>
        
        {/* Render HTML content safely inside a custom structured prose layout */}
        <CardContent className="border-t pt-6">
          <div 
            className="prose dark:prose-invert max-w-none text-slate-700 dark:text-slate-300 leading-relaxed text-sm whitespace-pre-wrap
              [&>p]:mb-4 [&>ul]:list-disc [&>ul]:pl-6 [&>ul]:mb-4 [&>ol]:list-decimal [&>ol]:pl-6 [&>ol]:mb-4
              [&>h1]:text-xl [&>h1]:font-black [&>h1]:mt-6 [&>h1]:mb-3 [&>h2]:text-lg [&>h2]:font-bold [&>h2]:mt-5 [&>h2]:mb-2
              [&>blockquote]:border-l-4 [&>blockquote]:border-primary/50 [&>blockquote]:pl-4 [&>blockquote]:italic [&>blockquote]:my-4
              [&>pre]:bg-muted [&>pre]:p-3 [&>pre]:rounded [&>pre]:overflow-x-auto [&>pre]:my-4 [&>pre]:text-xs"
            dangerouslySetInnerHTML={{ __html: post.body }}
          />
        </CardContent>
      </Card>

      {/* Contributions / Replies section */}
      <ThreadReplies 
        postId={postId} 
        flatReplies={mappedReplies} 
        userLoggedIn={!!user} 
      />

    </div>
  );
}
