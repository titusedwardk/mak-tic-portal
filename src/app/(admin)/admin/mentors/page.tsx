import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export const dynamic = 'force-dynamic';

export default function AdminMentorsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Mentorship Administration</h1>
        <p className="text-muted-foreground mt-1">Manage mentor profiles, verify applications, and assign mentees.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Mentor Roster</CardTitle>
          <CardDescription>View all active mentors and their current load.</CardDescription>
        </CardHeader>
        <CardContent className="h-40 flex items-center justify-center border-t border-dashed bg-muted/20">
          <span className="text-muted-foreground">Mentor administration coming soon</span>
        </CardContent>
      </Card>
    </div>
  );
}
