"use client";

import { useActionState, startTransition } from "react";
import { submitChallengeEntry, type ChallengeSubmissionState } from "../actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Send, FileText, CheckCircle2, AlertCircle } from "lucide-react";

interface ProjectItem {
  id: string;
  title: string;
  slug: string;
}

interface SubmissionFormProps {
  challengeId: string;
  userProjects: ProjectItem[];
}

const initialState: ChallengeSubmissionState = {
  success: false,
  message: "",
  errors: {},
};

export function SubmissionForm({ challengeId, userProjects }: SubmissionFormProps) {
  const [state, formAction, isPending] = useActionState(
    submitChallengeEntry,
    initialState
  );

  if (state.success) {
    return (
      <Card className="border-emerald-500/20 bg-emerald-50/30 dark:bg-emerald-950/10">
        <CardHeader>
          <div className="flex items-center gap-3">
            <CheckCircle2 className="h-8 w-8 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <div>
              <CardTitle className="text-emerald-800 dark:text-emerald-300">Entry Submitted!</CardTitle>
              <CardDescription className="text-emerald-600/80 dark:text-emerald-400/80 mt-1">
                {state.message}
              </CardDescription>
            </div>
          </div>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card className="border-slate-200 dark:border-slate-800 shadow-md">
      <CardHeader>
        <CardTitle className="text-lg font-bold flex items-center gap-2">
          <FileText className="h-5 w-5 text-indigo-500" /> Submit Your Solution
        </CardTitle>
        <CardDescription>
          Present your technology or idea. You can link this solution to one of your active projects.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form action={formAction} className="space-y-5">
          <input type="hidden" name="challengeId" value={challengeId} />

          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="title" className="font-semibold text-sm">Submission / Solution Title</Label>
            <Input
              id="title"
              name="title"
              placeholder="e.g., SolarDry: Low-cost Smart Solar Dehydrator"
              required
              disabled={isPending}
            />
            {state.errors?.title && (
              <p className="text-xs font-semibold text-destructive mt-1 flex items-center gap-1">
                <AlertCircle className="h-3.5 w-3.5" /> {state.errors.title[0]}
              </p>
            )}
          </div>

          {/* Project dropdown */}
          <div className="space-y-2">
            <Label htmlFor="projectId" className="font-semibold text-sm">Link to Portal Project (Optional)</Label>
            {userProjects.length === 0 ? (
              <div className="text-xs text-muted-foreground p-3 rounded-md bg-muted/30 border border-dashed">
                You don't have any active projects listed in the portal yet. You can submit without linking a project, or create one in the <a href="/projects/new" className="text-primary font-semibold hover:underline">Projects workspace</a>.
              </div>
            ) : (
              <select
                id="projectId"
                name="projectId"
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                disabled={isPending}
              >
                <option value="">-- Do not link a project --</option>
                {userProjects.map((proj) => (
                  <option key={proj.id} value={proj.id}>
                    {proj.title}
                  </option>
                ))}
              </select>
            )}
            {state.errors?.projectId && (
              <p className="text-xs font-semibold text-destructive mt-1 flex items-center gap-1">
                <AlertCircle className="h-3.5 w-3.5" /> {state.errors.projectId[0]}
              </p>
            )}
          </div>

          {/* Proposal Description */}
          <div className="space-y-2">
            <Label htmlFor="description" className="font-semibold text-sm">Solution Proposal / Description</Label>
            <Textarea
              id="description"
              name="description"
              placeholder="Provide a detailed explanation of your proposal. Describe the technology, design, implementation roadmap, and how it directly addresses the challenge criteria."
              rows={6}
              required
              disabled={isPending}
            />
            {state.errors?.description && (
              <p className="text-xs font-semibold text-destructive mt-1 flex items-center gap-1">
                <AlertCircle className="h-3.5 w-3.5" /> {state.errors.description[0]}
              </p>
            )}
          </div>

          {state.message && !state.success && (
            <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-md text-sm font-semibold text-destructive flex items-center gap-2">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{state.message}</span>
            </div>
          )}

          <Button type="submit" disabled={isPending} className="w-full font-bold shadow-sm">
            {isPending ? (
              <span className="flex items-center gap-2">
                Submitting solution...
              </span>
            ) : (
              <span className="flex items-center gap-1.5 justify-center">
                Submit Solution <Send className="h-4 w-4" />
              </span>
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
