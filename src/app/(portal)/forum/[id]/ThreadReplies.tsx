"use client";

import { useActionState, startTransition, useState, useEffect } from "react";
import { createForumReply } from "../actions";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { MessageSquare, CornerDownRight, Reply, AlertCircle, CheckCircle2, User, Clock } from "lucide-react";
import Link from "next/link";

interface ReplyItem {
  id: string;
  post_id: string;
  parent_reply_id: string | null;
  body: string;
  created_at: string;
  profiles: {
    full_name: string;
    role: string;
    avatar_url: string | null;
  } | null;
}

interface ReplyNode extends ReplyItem {
  replies: ReplyNode[];
}

interface ThreadRepliesProps {
  postId: string;
  flatReplies: ReplyItem[];
  userLoggedIn: boolean;
}

const initialState = {
  success: false,
  message: "",
  errors: {} as Record<string, string[]>,
};

export function ThreadReplies({ postId, flatReplies, userLoggedIn }: ThreadRepliesProps) {
  const [activeReplyId, setActiveReplyId] = useState<string | null>(null); // tracks which reply is being answered inline
  const [mainReplyText, setMainReplyText] = useState("");
  const [inlineReplyText, setInlineReplyText] = useState("");

  const [state, formAction, isPending] = useActionState(createForumReply, initialState);

  // Sync state changes
  useEffect(() => {
    if (state.success) {
      setMainReplyText("");
      setInlineReplyText("");
      setActiveReplyId(null);
      window.location.reload(); // refresh to fetch and show replies
    }
  }, [state.success]);

  // Construct reply tree
  const buildRepliesTree = (list: ReplyItem[]): ReplyNode[] => {
    const map: Record<string, ReplyNode> = {};
    const roots: ReplyNode[] = [];

    list.forEach((item) => {
      map[item.id] = { ...item, replies: [] };
    });

    list.forEach((item) => {
      const node = map[item.id];
      if (item.parent_reply_id && map[item.parent_reply_id]) {
        map[item.parent_reply_id].replies.push(node);
      } else {
        roots.push(node);
      }
    });

    return roots;
  };

  const repliesTree = buildRepliesTree(flatReplies);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-UG", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    });
  };

  // Submit handler for main top-level reply
  const handleMainSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData();
    formData.set("postId", postId);
    formData.set("body", mainReplyText);
    startTransition(() => {
      formAction(formData);
    });
  };

  // Submit handler for inline nested reply
  const handleInlineSubmit = (event: React.FormEvent<HTMLFormElement>, parentId: string) => {
    event.preventDefault();
    const formData = new FormData();
    formData.set("postId", postId);
    formData.set("parentReplyId", parentId);
    formData.set("body", inlineReplyText);
    startTransition(() => {
      formAction(formData);
    });
  };

  // Recursive reply node renderer
  const renderReplyNode = (node: ReplyNode, depth = 0) => {
    const isReplyingThis = activeReplyId === node.id;

    return (
      <div key={node.id} className="space-y-3">
        {/* Reply Body Card */}
        <div className="bg-slate-50/50 dark:bg-slate-900/20 p-4 rounded-xl border border-slate-100 dark:border-slate-800 hover:shadow-sm transition-all">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <div className="h-7 w-7 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-xs shrink-0">
                {node.profiles?.full_name?.charAt(0).toUpperCase() || "U"}
              </div>
              <div>
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                  {node.profiles?.full_name || "Anonymous"}
                </span>
                <Badge variant="outline" className="text-[9px] py-0 px-1 ml-1.5 capitalize scale-90 origin-left">
                  {node.profiles?.role || "Innovator"}
                </Badge>
              </div>
            </div>
            <span className="text-[10px] text-muted-foreground flex items-center gap-1">
              <Clock className="h-3 w-3" /> {formatDate(node.created_at)}
            </span>
          </div>

          <div className="mt-2.5 text-sm text-slate-700 dark:text-slate-350 leading-relaxed whitespace-pre-wrap pl-1">
            {node.body}
          </div>

          {/* Action buttons */}
          {userLoggedIn && (
            <div className="mt-3 flex justify-end">
              <Button
                variant="ghost"
                size="sm"
                className="h-7 text-xs font-semibold text-muted-foreground hover:text-foreground hover:bg-muted/50 gap-1"
                onClick={() => {
                  if (isReplyingThis) {
                    setActiveReplyId(null);
                    setInlineReplyText("");
                  } else {
                    setActiveReplyId(node.id);
                    setInlineReplyText("");
                  }
                }}
              >
                <Reply className="h-3.5 w-3.5" /> Reply
              </Button>
            </div>
          )}
        </div>

        {/* Inline Reply Form */}
        {isReplyingThis && (
          <div className="pl-6 border-l-2 border-indigo-400 dark:border-indigo-600 mt-2">
            <form onSubmit={(e) => handleInlineSubmit(e, node.id)} className="space-y-2">
              <Textarea
                value={inlineReplyText}
                onChange={(e) => setInlineReplyText(e.target.value)}
                placeholder={`Reply to ${node.profiles?.full_name || "User"}...`}
                rows={2}
                className="text-xs bg-background"
                required
                disabled={isPending}
              />
              <div className="flex gap-2 justify-end">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-7 text-[10px]"
                  onClick={() => {
                    setActiveReplyId(null);
                    setInlineReplyText("");
                  }}
                  disabled={isPending}
                >
                  Cancel
                </Button>
                <Button type="submit" size="sm" className="h-7 text-[10px] font-semibold" disabled={isPending}>
                  {isPending && activeReplyId === node.id ? "Adding..." : "Post Reply"}
                </Button>
              </div>
            </form>
          </div>
        )}

        {/* Render child replies recursively */}
        {node.replies && node.replies.length > 0 && (
          <div className="pl-6 border-l border-slate-200 dark:border-slate-800 space-y-3 mt-3">
            {node.replies.map((child) => renderReplyNode(child, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      
      {/* 1. Main reply input form at bottom/top */}
      {userLoggedIn ? (
        <Card className="border-slate-200 dark:border-slate-800 shadow-sm p-4">
          <form onSubmit={handleMainSubmit} className="space-y-3">
            <Label htmlFor="mainReply" className="text-xs font-bold text-slate-700 dark:text-slate-350">
              Leave a Reply
            </Label>
            <Textarea
              id="mainReply"
              value={mainReplyText}
              onChange={(e) => setMainReplyText(e.target.value)}
              placeholder="Join the discussion... Type your reply here."
              rows={3}
              className="text-sm bg-background"
              required
              disabled={isPending}
            />
            
            {state.message && !state.success && (
              <p className="text-xs font-semibold text-destructive flex items-center gap-1 mt-1">
                <AlertCircle className="h-3.5 w-3.5" /> {state.message}
              </p>
            )}

            <div className="flex justify-end">
              <Button type="submit" disabled={isPending} className="font-semibold h-9 text-xs">
                {isPending && !activeReplyId ? "Posting reply..." : "Submit Reply"}
              </Button>
            </div>
          </form>
        </Card>
      ) : (
        <div className="p-4 border rounded-lg text-center bg-muted/20">
          <p className="text-sm text-muted-foreground">
            You must be <Link href="/login" className="text-primary font-bold hover:underline">signed in</Link> to contribute to this discussion.
          </p>
        </div>
      )}

      {/* 2. Replies tree header */}
      <div className="border-t pt-4 border-slate-200 dark:border-slate-800">
        <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5 mb-4">
          <MessageSquare className="h-4.5 w-4.5 text-indigo-500" /> Contributions ({flatReplies.length})
        </h3>
        
        {repliesTree.length === 0 ? (
          <div className="text-center py-8 text-sm text-muted-foreground border border-dashed rounded-lg bg-muted/5">
            No replies yet. Be the first to add a reply!
          </div>
        ) : (
          <div className="space-y-4">
            {repliesTree.map((rootNode) => renderReplyNode(rootNode))}
          </div>
        )}
      </div>

    </div>
  );
}
