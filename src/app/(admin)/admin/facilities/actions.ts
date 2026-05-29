"use server";

import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";

export async function updateBookingStatus(
  bookingId: string,
  status: "approved" | "rejected"
) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    throw new Error("Unauthorized");
  }

  // Verify administrator / reviewer permissions
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (!profile || (profile.role !== "admin" && profile.role !== "reviewer")) {
    throw new Error("Unauthorized: Only administrators or reviewers can manage bookings.");
  }

  // Update booking status
  const { error: updateErr } = await supabase
    .from("bookings")
    .update({
      status,
      approved_by: user.id,
    })
    .eq("id", bookingId);

  if (updateErr) {
    throw new Error(updateErr.message);
  }

  // Notify the user about booking status change
  try {
    const { data: booking } = await supabase
      .from("bookings")
      .select("booked_by, facilities(name)")
      .eq("id", bookingId)
      .single();

    if (booking) {
      const facilityName = (booking.facilities as any)?.name || "Facility Resource";
      const statusText = status === "approved" ? "approved" : "rejected";
      
      await supabase.from("notifications").insert({
        user_id: booking.booked_by,
        type: "booking_approved",
        title: `Booking Request ${status === "approved" ? "Approved" : "Rejected"}`,
        body: `Your booking reservation request for "${facilityName}" has been ${statusText} by the laboratory manager.`,
        link: "/facilities",
      });
    }
  } catch (notifyErr) {
    console.error("Failed to generate booking notification:", notifyErr);
  }

  revalidatePath("/admin/facilities");
  revalidatePath("/facilities");
}
