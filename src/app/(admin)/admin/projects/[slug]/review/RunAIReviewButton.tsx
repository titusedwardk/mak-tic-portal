"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

export default function RunAIReviewButton({ projectId }: { projectId: string }) {
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleRunAI = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/ai/score-project", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectId }),
      });

      if (!res.ok) {
        throw new Error("Failed to run AI review");
      }

      toast.success("AI review completed successfully!");
      router.refresh();
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Button 
      variant="secondary" 
      onClick={handleRunAI} 
      disabled={isLoading}
      type="button"
    >
      {isLoading ? "Running AI Review..." : "Run AI Review"}
    </Button>
  );
}
