import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export const dynamic = 'force-dynamic';

export default function MentorsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Mentorship Program</h1>
        <p className="text-muted-foreground mt-1">Connect with industry experts and track your mentoring sessions.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>My Mentors</CardTitle>
          <CardDescription>You have no assigned mentors yet. Request matching once your project is approved.</CardDescription>
        </CardHeader>
        <CardContent className="h-40 flex items-center justify-center border-t border-dashed bg-muted/20">
          <span className="text-muted-foreground">Mentorship features coming soon</span>
        </CardContent>
      </Card>
    </div>
  );
}
