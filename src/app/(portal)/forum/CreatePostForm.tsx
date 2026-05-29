"use client";

import { useActionState, startTransition, useState, useEffect } from "react";
import { createForumPost } from "./actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { TipTapEditor } from "@/components/ui/editor";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PenTool, MessageSquare, CheckCircle2, AlertCircle } from "lucide-react";

interface Category {
  id: string;
  name: string;
}

interface CreatePostFormProps {
  categories: Category[];
}

const initialState = {
  success: false,
  message: "",
  errors: {} as Record<string, string[]>,
};

export function CreatePostForm({ categories }: CreatePostFormProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [editorContent, setEditorContent] = useState("");
  const [state, formAction, isPending] = useActionState(
    createForumPost,
    initialState
  );

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    formData.set("body", editorContent); // inject tip tap content
    startTransition(() => {
      formAction(formData);
    });
  };

  useEffect(() => {
    if (state.success) {
      setEditorContent("");
      setIsOpen(false);
      window.location.reload(); // refresh to show new post
    }
  }, [state.success]);

  return (
    <div className="space-y-4">
      {!isOpen ? (
        <Button onClick={() => setIsOpen(true)} className="font-semibold shadow-sm w-full md:w-auto">
          <PenTool className="mr-2 h-4 w-4" /> Start a New Discussion
        </Button>
      ) : (
        <Card className="border-slate-200 dark:border-slate-800 shadow-md">
          <CardHeader className="pb-3 flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-lg font-bold flex items-center gap-2">
                <MessageSquare className="h-5 w-5 text-indigo-500" /> New Discussion Thread
              </CardTitle>
              <CardDescription>Share questions, share your milestone, or spark a conversation.</CardDescription>
            </div>
            <Button variant="ghost" size="sm" onClick={() => setIsOpen(false)} className="text-muted-foreground hover:text-foreground">
              Cancel
            </Button>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-5">
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Title */}
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="title" className="font-semibold text-sm">Discussion Title</Label>
                  <Input
                    id="title"
                    name="title"
                    placeholder="e.g. Tips for winning the SDG Zero Hunger Challenge?"
                    required
                    disabled={isPending}
                  />
                  {state.errors?.title && (
                    <p className="text-xs text-destructive mt-1 flex items-center gap-1 font-semibold">
                      <AlertCircle className="h-3.5 w-3.5" /> {state.errors.title[0]}
                    </p>
                  )}
                </div>

                {/* Category selection */}
                <div className="space-y-2">
                  <Label htmlFor="categoryId" className="font-semibold text-sm">Forum Category</Label>
                  <select
                    id="categoryId"
                    name="categoryId"
                    required
                    disabled={isPending}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    <option value="">-- Select Category --</option>
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                  {state.errors?.categoryId && (
                    <p className="text-xs text-destructive mt-1 flex items-center gap-1 font-semibold">
                      <AlertCircle className="h-3.5 w-3.5" /> {state.errors.categoryId[0]}
                    </p>
                  )}
                </div>
              </div>

              {/* Rich Text Editor */}
              <div className="space-y-2">
                <Label className="font-semibold text-sm">Post Body</Label>
                <TipTapEditor
                  value={editorContent}
                  onChange={setEditorContent}
                  placeholder="Tell the community what is on your mind..."
                />
                {state.errors?.body && (
                  <p className="text-xs text-destructive mt-1 flex items-center gap-1 font-semibold">
                    <AlertCircle className="h-3.5 w-3.5" /> {state.errors.body[0]}
                  </p>
                )}
              </div>

              {state.message && !state.success && (
                <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-md text-sm font-semibold text-destructive flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <span>{state.message}</span>
                </div>
              )}

              <div className="flex gap-3 justify-end border-t pt-4">
                <Button type="button" variant="outline" onClick={() => setIsOpen(false)} disabled={isPending}>
                  Cancel
                </Button>
                <Button type="submit" disabled={isPending} className="font-semibold">
                  {isPending ? "Publishing..." : "Publish Post"}
                </Button>
              </div>

            </form>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
