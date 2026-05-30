"use server";

import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";

export async function createIpRecord(data: {
  project_id: string;
  type: string;
  filing_date?: string | null;
  registration_number?: string | null;
  status?: string;
  jurisdiction?: string | null;
}) {
  const supabase = await createClient();

  const { error } = await supabase.from("ip_records").insert([{
    project_id: data.project_id,
    type: data.type,
    filing_date: data.filing_date || null,
    registration_number: data.registration_number || null,
    status: data.status || "pending",
    jurisdiction: data.jurisdiction || null,
  }]);

  if (error) {
    throw new Error(`Failed to create IP record: ${error.message}`);
  }

  revalidatePath("/admin/ip");
  return { success: true };
}

export async function updateIpRecord(id: string, data: {
  type?: string;
  filing_date?: string | null;
  registration_number?: string | null;
  status?: string;
  jurisdiction?: string | null;
}) {
  const supabase = await createClient();

  const { error } = await supabase
    .from("ip_records")
    .update(data)
    .eq("id", id);

  if (error) {
    throw new Error(`Failed to update IP record: ${error.message}`);
  }

  revalidatePath("/admin/ip");
  return { success: true };
}

export async function deleteIpRecord(id: string) {
  const supabase = await createClient();

  const { error } = await supabase
    .from("ip_records")
    .delete()
    .eq("id", id);

  if (error) {
    throw new Error(`Failed to delete IP record: ${error.message}`);
  }

  revalidatePath("/admin/ip");
  return { success: true };
}
