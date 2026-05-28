import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export const dynamic = 'force-dynamic';

export default function ForumPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Community Forum</h1>
        <p className="text-muted-foreground mt-1">Connect, discuss, and collaborate with other innovators.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent Discussions</CardTitle>
          <CardDescription>Join the conversation across various topics.</CardDescription>
        </CardHeader>
        <CardContent className="h-40 flex items-center justify-center border-t border-dashed bg-muted/20">
          <span className="text-muted-foreground">Forum features coming soon</span>
        </CardContent>
      </Card>
    </div>
  );
}
