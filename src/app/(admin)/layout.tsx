import { ReactNode } from "react";
import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { LayoutDashboard, Users, Settings, FileText, Calendar } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";

export const dynamic = 'force-dynamic';

export default async function AdminLayout({ children }: { children: ReactNode }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Check role
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (!profile || (profile.role !== "admin" && profile.role !== "reviewer")) {
    redirect("/dashboard"); // Redirect normal users back to their portal
  }

  return (
    <div className="flex min-h-screen flex-col lg:flex-row">
      <aside className="w-full lg:w-64 border-r bg-muted/20">
        <div className="flex h-14 lg:h-16 items-center border-b px-4 lg:px-6">
          <Link href="/admin/dashboard" className="flex items-center gap-2 font-semibold">
            <span className="text-primary font-bold text-xl">Mak-TIC Admin</span>
          </Link>
        </div>
        <nav className="p-4 space-y-2">
          <Link 
            href="/admin/dashboard" 
            className={buttonVariants({ variant: "ghost", className: "w-full justify-start" })}
          >
            <LayoutDashboard className="mr-2 h-4 w-4" />
            Projects
          </Link>
          <Link 
            href="/admin/pipeline" 
            className={buttonVariants({ variant: "ghost", className: "w-full justify-start" })}
          >
            <FileText className="mr-2 h-4 w-4" />
            Review Pipeline
          </Link>
          <Link 
            href="/admin/scoring" 
            className={buttonVariants({ variant: "ghost", className: "w-full justify-start" })}
          >
            <Settings className="mr-2 h-4 w-4" />
            AI vs Human Scoring
          </Link>
          <Link 
            href="/admin/facilities" 
            className={buttonVariants({ variant: "ghost", className: "w-full justify-start" })}
          >
            <Calendar className="mr-2 h-4 w-4" />
            Facility Bookings
          </Link>
          {profile.role === "admin" && (
            <>
              <Link 
                href="/admin/users"
                className={buttonVariants({ variant: "ghost", className: "w-full justify-start" })}
              >
                <Users className="mr-2 h-4 w-4" />
                Users
              </Link>
              <Link 
                href="/admin/mentors"
                className={buttonVariants({ variant: "ghost", className: "w-full justify-start" })}
              >
                <Users className="mr-2 h-4 w-4" />
                Mentors
              </Link>
              <Link 
                href="/admin/challenges"
                className={buttonVariants({ variant: "ghost", className: "w-full justify-start" })}
              >
                <FileText className="mr-2 h-4 w-4" />
                Challenges
              </Link>
              <Link 
                href="/admin/funding"
                className={buttonVariants({ variant: "ghost", className: "w-full justify-start" })}
              >
                <Settings className="mr-2 h-4 w-4" />
                Funding Tracks
              </Link>

              <Link 
                href="/admin/ip"
                className={buttonVariants({ variant: "ghost", className: "w-full justify-start" })}
              >
                <FileText className="mr-2 h-4 w-4" />
                IP Tracking
              </Link>
            </>
          )}
        </nav>
      </aside>
      <main className="flex-1">
        <header className="flex h-14 lg:h-16 items-center border-b px-4 lg:px-6 justify-end gap-4">
          <div className="text-sm text-muted-foreground flex items-center gap-2">
            <span>{user.email}</span>
            <span className="px-2 py-0.5 rounded-full bg-primary/10 text-primary text-xs capitalize font-medium">
              {profile.role}
            </span>
          </div>
          <form action="/auth/signout" method="post">
            <Button variant="outline" size="sm">Sign Out</Button>
          </form>
        </header>
        <div className="p-4 lg:p-8">
          {children}
        </div>
      </main>
    </div>
  );
}
