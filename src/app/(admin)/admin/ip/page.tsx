import { createClient } from "@/utils/supabase/server";
import { IPClient } from "./IPClient";

export const dynamic = 'force-dynamic';

export default async function AdminIpPage() {
  const supabase = await createClient();

  // 1. Fetch IP Records with associated project titles
  const { data: ipRecords, error: ipError } = await supabase
    .from("ip_records")
    .select(`
      id,
      type,
      filing_date,
      registration_number,
      status,
      jurisdiction,
      projects ( title )
    `)
    .order("filing_date", { ascending: false });

  if (ipError) {
    console.error("Failed to load IP records:", ipError);
  }

  // 2. Fetch active projects for the dropdown
  const { data: projects, error: projectsError } = await supabase
    .from("projects")
    .select("id, title")
    .eq("status", "active")
    .order("title");

  if (projectsError) {
    console.error("Failed to load projects for IP tracking:", projectsError);
  }

  return (
    <div className="max-w-7xl mx-auto">
      <IPClient 
        ipRecords={ipRecords as any || []} 
        projects={projects || []} 
      />
    </div>
  );
}
