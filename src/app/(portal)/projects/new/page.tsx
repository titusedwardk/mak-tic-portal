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
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";

export const dynamic = 'force-dynamic';

const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB
const ALLOWED_MIME_TYPES = [
  "application/pdf", 
  "application/vnd.ms-powerpoint", 
  "application/vnd.openxmlformats-officedocument.presentationml.presentation", 
  "application/msword", 
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document", 
  "video/mp4", 
  "video/quicktime"
];

const projectSchema = z.object({
  title: z.string().trim().min(3, "Title must be at least 3 characters").max(100, "Title is too long"),
  track: z.enum(["early_idea", "prototype", "market_ready", "ip_only"]),
  sector: z.enum(["agriculture", "health", "education", "energy", "fintech", "other"]),
  support_needed: z.enum(["mentorship", "funding", "lab_space", "equipment", "ip_filing", "other"]),
  description: z.string().trim().min(10, "Description must be at least 10 characters").max(300, "Description is too long"),
  problem_statement: z.string().trim().min(20, "Problem statement must be at least 20 characters").max(2000, "Problem statement is too long"),
  proposed_solution: z.string().trim().min(20, "Proposed solution must be at least 20 characters").max(2000, "Proposed solution is too long"),
});

type ProjectFormValues = z.infer<typeof projectSchema>;

export default function NewProjectPage() {
  const router = useRouter();
  const supabase = createClient();
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadStatus, setUploadStatus] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [fileError, setFileError] = useState("");

  const { register, handleSubmit, control, trigger, getValues, formState: { errors } } = useForm<ProjectFormValues>({
    resolver: zodResolver(projectSchema),
    defaultValues: {
      title: "",
      description: "",
      problem_statement: "",
      proposed_solution: "",
    }
  });

  const handleNext = async () => {
    let fieldsToValidate: any[] = [];
    if (step === 1) fieldsToValidate = ["title", "track", "sector", "support_needed"];
    if (step === 2) fieldsToValidate = ["description", "problem_statement", "proposed_solution"];

    const isStepValid = await trigger(fieldsToValidate);
    
    // Manual file validation on step 2
    if (step === 2 && file) {
      if (file.size > MAX_FILE_SIZE) {
        setFileError("File size exceeds the 50MB limit.");
        return;
      }
      if (!ALLOWED_MIME_TYPES.includes(file.type)) {
        setFileError("Invalid file type. Please upload a supported format.");
        return;
      }
      setFileError("");
    }

    if (isStepValid) {
      setStep((prev) => prev + 1);
    }
  };

  const handleBack = () => setStep((prev) => prev - 1);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      setFile(selectedFile);
      if (selectedFile.size > MAX_FILE_SIZE) {
        setFileError("File size exceeds the 50MB limit.");
      } else if (!ALLOWED_MIME_TYPES.includes(selectedFile.type)) {
        setFileError("Invalid file type. Please upload a supported format.");
      } else {
        setFileError("");
      }
    }
  };

  const onSubmit = async (data: ProjectFormValues) => {
    if (fileError) {
      toast.error("Please fix file errors before submitting.");
      return;
    }

    setIsSubmitting(true);
    setUploadStatus("Uploading file...");

    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        toast.error("You must be logged in to submit a project.");
        return;
      }

      let filePath = "";
      // 1. Upload File First (to ensure it succeeds before creating project)
      if (file) {
        const fileExt = file.name.split('.').pop() || "bin";
        filePath = `${user.id}/project-${Date.now()}.${fileExt}`;
        
        const { error: uploadError } = await supabase.storage
          .from("project_files")
          .upload(filePath, file);

        if (uploadError) {
          throw new Error(`File upload failed: ${uploadError.message}`);
        }
      }

      setUploadStatus("Saving project details...");

      // 2. Insert Project
      const { data: project, error: dbError } = await supabase
        .from("projects")
        .insert({
          title: data.title,
          description: data.description,
          problem_statement: data.problem_statement,
          proposed_solution: data.proposed_solution,
          owner_id: user.id,
          track: data.track,
          sector: [data.sector],
          support_needed: [data.support_needed],
        })
        .select()
        .single();

      if (dbError) throw dbError;

      // 3. Insert Project File Record
      if (file && filePath) {
        await supabase.from("project_files").insert({
          project_id: project.id,
          uploaded_by: user.id,
          file_name: file.name,
          file_type: "other",
          storage_path: filePath,
          file_size_bytes: file.size,
          mime_type: file.type || "application/octet-stream"
        });
      }

      toast.success("Project submitted successfully! Redirecting...");
      router.push(`/dashboard`);
    } catch (error: any) {
      console.error(error);
      toast.error(error.message || "Failed to submit project.");
    } finally {
      setIsSubmitting(false);
      setUploadStatus("");
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
                  {...register("title")}
                />
                {errors.title && <p className="text-sm text-destructive">{errors.title.message}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="track">Submission Track</Label>
                <Controller
                  name="track"
                  control={control}
                  render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange}>
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
                  )}
                />
                {errors.track && <p className="text-sm text-destructive">{errors.track.message}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="sector">Primary Sector</Label>
                <Controller
                  name="sector"
                  control={control}
                  render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange}>
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
                  )}
                />
                {errors.sector && <p className="text-sm text-destructive">{errors.sector.message}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="support_needed">Primary Support Needed</Label>
                <Controller
                  name="support_needed"
                  control={control}
                  render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select support type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="mentorship">Mentorship & Guidance</SelectItem>
                        <SelectItem value="funding">Funding & Grants</SelectItem>
                        <SelectItem value="lab_space">Lab Space / Facility</SelectItem>
                        <SelectItem value="equipment">Specialized Equipment</SelectItem>
                        <SelectItem value="ip_filing">IP Filing / Legal</SelectItem>
                        <SelectItem value="other">Other / General</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                />
                {errors.support_needed && <p className="text-sm text-destructive">{errors.support_needed.message}</p>}
              </div>
            </CardContent>
            <CardFooter className="flex justify-end">
              <Button onClick={handleNext}>Next Step</Button>
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
                  {...register("description")}
                />
                {errors.description && <p className="text-sm text-destructive">{errors.description.message}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="problem_statement">Problem Statement</Label>
                <Textarea
                  id="problem_statement"
                  className="min-h-[100px]"
                  placeholder="What specific problem are you solving? Who is affected?"
                  {...register("problem_statement")}
                />
                {errors.problem_statement && <p className="text-sm text-destructive">{errors.problem_statement.message}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="proposed_solution">Proposed Solution</Label>
                <Textarea
                  id="proposed_solution"
                  className="min-h-[100px]"
                  placeholder="How does your project solve this problem? What is the technology/innovation?"
                  {...register("proposed_solution")}
                />
                {errors.proposed_solution && <p className="text-sm text-destructive">{errors.proposed_solution.message}</p>}
              </div>
              <div className="space-y-2 pt-4 border-t">
                <Label htmlFor="file_upload">Supporting Document (Pitch Deck, Demo Video, etc.)</Label>
                <Input
                  id="file_upload"
                  type="file"
                  onChange={handleFileChange}
                  accept=".pdf,.ppt,.pptx,.doc,.docx,.mp4,.mov"
                />
                <p className="text-xs text-muted-foreground">Optional. Maximum 50MB. Allowed: PDF, Word, PPT, MP4, MOV.</p>
                {fileError && <p className="text-sm text-destructive">{fileError}</p>}
              </div>
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button variant="outline" onClick={handleBack}>Back</Button>
              <Button onClick={handleNext}>Review</Button>
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
                  <p>{getValues("title")}</p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-semibold text-sm text-muted-foreground">Track</h4>
                    <p className="capitalize">{(getValues("track") || "").replace("_", " ")}</p>
                  </div>
                  <div>
                    <h4 className="font-semibold text-sm text-muted-foreground">Sector</h4>
                    <p className="capitalize">{getValues("sector")}</p>
                  </div>
                  <div>
                    <h4 className="font-semibold text-sm text-muted-foreground">Support Needed</h4>
                    <p className="capitalize">{(getValues("support_needed") || "").replace("_", " ")}</p>
                  </div>
                </div>
                <div>
                  <h4 className="font-semibold text-sm text-muted-foreground">Description</h4>
                  <p className="text-sm">{getValues("description")}</p>
                </div>
                <div>
                  <h4 className="font-semibold text-sm text-muted-foreground">Problem</h4>
                  <p className="text-sm whitespace-pre-wrap">{getValues("problem_statement")}</p>
                </div>
                <div>
                  <h4 className="font-semibold text-sm text-muted-foreground">Solution</h4>
                  <p className="text-sm whitespace-pre-wrap">{getValues("proposed_solution")}</p>
                </div>
                {file && (
                  <div>
                    <h4 className="font-semibold text-sm text-muted-foreground">Attached File</h4>
                    <p className="text-sm">{file.name} ({(file.size / (1024 * 1024)).toFixed(2)} MB)</p>
                  </div>
                )}
              </div>
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button variant="outline" onClick={handleBack} disabled={isSubmitting}>Back</Button>
              <Button onClick={handleSubmit(onSubmit)} disabled={isSubmitting}>
                {isSubmitting ? uploadStatus : "Submit Project"}
              </Button>
            </CardFooter>
          </>
        )}
      </Card>
    </div>
  );
}
