import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export const dynamic = 'force-dynamic';

export default function ChallengesPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Open Innovation Challenges</h1>
        <p className="text-muted-foreground mt-1">Discover and submit to sponsored challenges.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Active Challenges</CardTitle>
          <CardDescription>Browse challenges looking for innovative solutions.</CardDescription>
        </CardHeader>
        <CardContent className="h-40 flex items-center justify-center border-t border-dashed bg-muted/20">
          <span className="text-muted-foreground">Challenge system coming soon</span>
        </CardContent>
      </Card>
    </div>
  );
}
