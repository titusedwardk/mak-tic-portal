import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export const dynamic = 'force-dynamic';

export default function AdminChallengesPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Challenge Management</h1>
        <p className="text-muted-foreground mt-1">Create and manage Open Innovation Challenges and Sponsors.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Challenges</CardTitle>
          <CardDescription>Draft, Open, or Closed challenges across the portal.</CardDescription>
        </CardHeader>
        <CardContent className="h-40 flex items-center justify-center border-t border-dashed bg-muted/20">
          <span className="text-muted-foreground">Challenge management coming soon</span>
        </CardContent>
      </Card>
    </div>
  );
}
