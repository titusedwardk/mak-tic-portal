import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import AdminView from "./admin-view";

export const dynamic = "force-dynamic";

interface DBBookingRaw {
  id: string;
  facility_id: string;
  booked_by: string;
  project_id: string | null;
  start_time: string;
  end_time: string;
  purpose: string;
  status: "pending" | "approved" | "rejected" | "cancelled" | "completed";
  facilities: {
    name: string;
    location: string;
    type: string;
  } | null;
  projects: {
    title: string;
  } | null;
}

export default async function AdminFacilitiesPage() {
  const supabase = await createClient();

  // Validate user authentication and check role
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (!profile || (profile.role !== "admin" && profile.role !== "reviewer")) {
    redirect("/dashboard");
  }

  // Fetch all bookings with facility and project details
  const { data: bookingsRaw, error: bookingsErr } = await supabase
    .from("bookings")
    .select(`
      id,
      facility_id,
      booked_by,
      project_id,
      start_time,
      end_time,
      purpose,
      status,
      facilities (
        name,
        location,
        type
      ),
      projects (
        title
      )
    `)
    .order("start_time", { ascending: false });

  if (bookingsErr) {
    throw new Error(`Failed to load booking requests: ${bookingsErr.message}`);
  }

  const rawBookings = (bookingsRaw || []) as unknown as DBBookingRaw[];

  // Retrieve user profiles in a separate query to prevent multi-foreign-key join issues in Supabase
  const userIds = Array.from(new Set(rawBookings.map((b) => b.booked_by)));
  
  const profilesMap: Record<string, { full_name: string; email: string }> = {};
  if (userIds.length > 0) {
    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, full_name, email")
      .in("id", userIds);

    if (profiles) {
      profiles.forEach((p) => {
        profilesMap[p.id] = {
          full_name: p.full_name || "Unknown User",
          email: p.email || "N/A",
        };
      });
    }
  }

  // Map the raw bookings to the combined shape expected by the admin view
  const formattedBookings = rawBookings.map((booking) => {
    const userProfile = profilesMap[booking.booked_by] || {
      full_name: "Unknown Innovator",
      email: "N/A",
    };

    return {
      id: booking.id,
      start_time: booking.start_time,
      end_time: booking.end_time,
      purpose: booking.purpose,
      status: booking.status,
      facility: booking.facilities
        ? {
            name: booking.facilities.name,
            location: booking.facilities.location,
            type: booking.facilities.type,
          }
        : { name: "Unknown Facility", location: "N/A", type: "other" },
      user: userProfile,
      project: booking.projects
        ? {
            title: booking.projects.title,
          }
        : null,
    };
  });

  return (
    <div className="py-2">
      <AdminView bookings={formattedBookings} />
    </div>
  );
}
