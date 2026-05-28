"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { createClient } from "@/utils/supabase/client";

export default function NewProjectPage() {
  const router = useRouter();
  const supabase = createClient();
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    title: "",
    track: "",
    sector: "",
    description: "",
    problem_statement: "",
    proposed_solution: "",
  });

  const handleNext = () => setStep((prev) => prev + 1);
  const handleBack = () => setStep((prev) => prev - 1);

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    toast.info("Submitting your project and running AI evaluation...");

    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        toast.error("You must be logged in to submit a project.");
        return;
      }

      // First, insert into Supabase
      const { data: project, error: dbError } = await supabase
        .from("projects")
        .insert({
          title: formData.title,
          description: formData.description,
          problem_statement: formData.problem_statement,
          proposed_solution: formData.proposed_solution,
          owner_id: user.id,
          track: formData.track,
          sector: [formData.sector], // stored as array
        })
        .select()
        .single();

      if (dbError) throw dbError;

      // Call Next.js API route to run Gemini Evaluation and update project
      const aiResponse = await fetch("/api/ai/score-project", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectId: project.id }),
      });

      if (!aiResponse.ok) {
        console.error("AI scoring failed");
        // We don't throw here so the user still gets redirected
      }

      toast.success("Project submitted successfully! Redirecting...");
      router.push(`/dashboard`);
    } catch (error: any) {
      console.error(error);
      toast.error(error.message || "Failed to submit project.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Submit New Project</h1>
        <p className="text-muted-foreground">Follow the steps to submit your idea to the Mak-TIC ecosystem.</p>
      </div>

      <div className="flex justify-between text-sm font-medium text-muted-foreground mb-4 px-4">
        <span className={step >= 1 ? "text-primary" : ""}>1. Basic Info</span>
        <span className={step >= 2 ? "text-primary" : ""}>2. Details</span>
        <span className={step >= 3 ? "text-primary" : ""}>3. Review</span>
      </div>

      <Card>
        {step === 1 && (
          <>
            <CardHeader>
              <CardTitle>Basic Information</CardTitle>
              <CardDescription>Give your project a name and categorize it.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">Project Title</Label>
                <Input
                  id="title"
                  placeholder="e.g. AgriTech Smart Sensors"
                  value={formData.title}
                  onChange={(e) => handleChange("title", e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="track">Submission Track</Label>
                <Select value={formData.track} onValueChange={(v) => handleChange("track", v)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a track" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="early_idea">Early Idea / Concept</SelectItem>
                    <SelectItem value="prototype">Working Prototype</SelectItem>
                    <SelectItem value="market_ready">Market Ready</SelectItem>
                    <SelectItem value="ip_only">IP / Patent Only</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="sector">Primary Sector</Label>
                <Select value={formData.sector} onValueChange={(v) => handleChange("sector", v)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a sector" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="agriculture">Agriculture & Food</SelectItem>
                    <SelectItem value="health">Healthcare & Bio</SelectItem>
                    <SelectItem value="education">Education</SelectItem>
                    <SelectItem value="energy">Energy & Environment</SelectItem>
                    <SelectItem value="fintech">FinTech</SelectItem>
                    <SelectItem value="other">Other / Multi-sector</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
            <CardFooter className="flex justify-end">
              <Button onClick={handleNext} disabled={!formData.title || !formData.track || !formData.sector}>
                Next Step
              </Button>
            </CardFooter>
          </>
        )}

        {step === 2 && (
          <>
            <CardHeader>
              <CardTitle>Project Details</CardTitle>
              <CardDescription>Explain the problem and your proposed solution.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="description">Short Description (Elevator Pitch)</Label>
                <Textarea
                  id="description"
                  placeholder="Summarize your project in 1-2 sentences..."
                  value={formData.description}
                  onChange={(e) => handleChange("description", e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="problem_statement">Problem Statement</Label>
                <Textarea
                  id="problem_statement"
                  className="min-h-[100px]"
                  placeholder="What specific problem are you solving? Who is affected?"
                  value={formData.problem_statement}
                  onChange={(e) => handleChange("problem_statement", e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="proposed_solution">Proposed Solution</Label>
                <Textarea
                  id="proposed_solution"
                  className="min-h-[100px]"
                  placeholder="How does your project solve this problem? What is the technology/innovation?"
                  value={formData.proposed_solution}
                  onChange={(e) => handleChange("proposed_solution", e.target.value)}
                />
              </div>
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button variant="outline" onClick={handleBack}>Back</Button>
              <Button onClick={handleNext} disabled={!formData.description || !formData.problem_statement || !formData.proposed_solution}>
                Review
              </Button>
            </CardFooter>
          </>
        )}

        {step === 3 && (
          <>
            <CardHeader>
              <CardTitle>Review & Submit</CardTitle>
              <CardDescription>Please review your information before final submission.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="rounded-lg border p-4 space-y-4">
                <div>
                  <h4 className="font-semibold text-sm text-muted-foreground">Title</h4>
                  <p>{formData.title}</p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-semibold text-sm text-muted-foreground">Track</h4>
                    <p className="capitalize">{formData.track.replace("_", " ")}</p>
                  </div>
                  <div>
                    <h4 className="font-semibold text-sm text-muted-foreground">Sector</h4>
                    <p className="capitalize">{formData.sector}</p>
                  </div>
                </div>
                <div>
                  <h4 className="font-semibold text-sm text-muted-foreground">Description</h4>
                  <p className="text-sm">{formData.description}</p>
                </div>
                <div>
                  <h4 className="font-semibold text-sm text-muted-foreground">Problem</h4>
                  <p className="text-sm">{formData.problem_statement}</p>
                </div>
                <div>
                  <h4 className="font-semibold text-sm text-muted-foreground">Solution</h4>
                  <p className="text-sm">{formData.proposed_solution}</p>
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button variant="outline" onClick={handleBack} disabled={isSubmitting}>Back</Button>
              <Button onClick={handleSubmit} disabled={isSubmitting}>
                {isSubmitting ? "Submitting..." : "Submit for AI Evaluation"}
              </Button>
            </CardFooter>
          </>
        )}
      </Card>
    </div>
  );
}
