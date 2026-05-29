import { createClient } from "@/utils/supabase/server";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const disburseSchema = z.object({
  trancheId: z.string().uuid(),
});

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if user is an admin
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (profile?.role !== "admin") {
      return NextResponse.json({ error: "Access denied: Admin role required" }, { status: 403 });
    }

    const body = await req.json();
    const parsed = disburseSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid request data", details: parsed.error.format() }, { status: 400 });
    }

    const { trancheId } = parsed.data;

    // Fetch the tranche details
    const { data: tranche, error: trancheError } = await supabase
      .from("funding_tranches")
      .select("*, allocation:funding_allocations(*)")
      .eq("id", trancheId)
      .single();

    if (trancheError || !tranche) {
      return NextResponse.json({ error: "Tranche not found" }, { status: 404 });
    }

    if (tranche.status === "disbursed") {
      return NextResponse.json({ error: "Tranche is already disbursed" }, { status: 400 });
    }

    // 1. Update status to 'processing'
    await supabase
      .from("funding_tranches")
      .update({ status: "processing" })
      .eq("id", trancheId);

    // 2. Simulate payment request wait
    await new Promise((resolve) => setTimeout(resolve, 1500));

    // Simulate outcome (95% success rate)
    const isSuccess = Math.random() < 0.95;
    const method = tranche.payment_method || "mtn_momo";
    const refPrefix = method === "mtn_momo" ? "MTN-MOMO" : method === "airtel_money" ? "AIRTEL" : "BANK";
    const randomRef = `${refPrefix}-${Math.floor(100000 + Math.random() * 900000)}`;

    if (isSuccess) {
      // 3. Webhook Trigger Simulation: Update status to disbursed
      const { error: updateTrancheError } = await supabase
        .from("funding_tranches")
        .update({
          status: "disbursed",
          payment_ref: randomRef,
          disbursed_at: new Date().toISOString(),
        })
        .eq("id", trancheId);

      if (updateTrancheError) {
        throw new Error(`Failed to update tranche: ${updateTrancheError.message}`);
      }

      // Recalculate allocation disbursed_amount
      const allocationId = tranche.allocation_id;
      const { data: tranches } = await supabase
        .from("funding_tranches")
        .select("amount")
        .eq("allocation_id", allocationId)
        .eq("status", "disbursed");

      const totalDisbursed = (tranches || []).reduce((sum, t) => sum + Number(t.amount), 0);

      // Update allocation disbursed_amount
      await supabase
        .from("funding_allocations")
        .update({ disbursed_amount: totalDisbursed })
        .eq("id", allocationId);

      // Recalculate source disbursed amount
      const sourceId = tranche.allocation.source_id;
      const { data: allocations } = await supabase
        .from("funding_allocations")
        .select("disbursed_amount")
        .eq("source_id", sourceId);

      const totalSourceDisbursed = (allocations || []).reduce((sum, a) => sum + Number(a.disbursed_amount || 0), 0);

      await supabase
        .from("funding_sources")
        .update({ disbursed: totalSourceDisbursed })
        .eq("id", sourceId);

      // Fetch the project to notify owner
      const { data: project } = await supabase
        .from("projects")
        .select("owner_id, title")
        .eq("id", tranche.allocation.project_id)
        .single();

      if (project) {
        // Send a notification
        await supabase.from("notifications").insert({
          user_id: project.owner_id,
          type: "funding_disbursed",
          title: "Funding Tranche Disbursed",
          body: `A tranche of UGX ${Number(tranche.amount).toLocaleString()} for project "${project.title}" has been successfully disbursed via ${method.replace("_", " ").toUpperCase()}. Reference: ${randomRef}.`,
          link: `/dashboard`,
        });
      }

      // Log to audit_log table
      await supabase.from("audit_log").insert({
        actor_id: user.id,
        action: "DISBURSE_FUNDING_TRANCHE",
        entity_type: "funding_tranches",
        entity_id: trancheId,
        metadata: {
          allocation_id: allocationId,
          amount: tranche.amount,
          payment_method: method,
          payment_ref: randomRef,
          status: "success",
        },
      });

      return NextResponse.json({
        success: true,
        status: "disbursed",
        payment_ref: randomRef,
        amount: tranche.amount,
      });
    } else {
      // Update tranche status to failed
      await supabase
        .from("funding_tranches")
        .update({ status: "failed" })
        .eq("id", trancheId);

      // Fetch the project to notify owner
      const { data: project } = await supabase
        .from("projects")
        .select("owner_id, title")
        .eq("id", tranche.allocation.project_id)
        .single();

      if (project) {
        await supabase.from("notifications").insert({
          user_id: project.owner_id,
          type: "system",
          title: "Funding Disbursement Failed",
          body: `Disbursement of UGX ${Number(tranche.amount).toLocaleString()} for project "${project.title}" failed. Please contact administration.`,
          link: `/dashboard`,
        });
      }

      // Log audit_log
      await supabase.from("audit_log").insert({
        actor_id: user.id,
        action: "DISBURSE_FUNDING_TRANCHE",
        entity_type: "funding_tranches",
        entity_id: trancheId,
        metadata: {
          allocation_id: tranche.allocation_id,
          amount: tranche.amount,
          payment_method: method,
          status: "failed",
        },
      });

      return NextResponse.json({
        success: false,
        status: "failed",
        error: "Disbursement transaction was rejected by mobile operator",
      });
    }
  } catch (error: any) {
    console.error("Disbursement Error:", error);
    return NextResponse.json({ error: error.message || "An unexpected error occurred" }, { status: 500 });
  }
}
