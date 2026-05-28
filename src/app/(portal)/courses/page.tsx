import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export const dynamic = 'force-dynamic';

export default function CoursesPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Learning Management System</h1>
        <p className="text-muted-foreground mt-1">Access required training modules and resources.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>My Courses</CardTitle>
          <CardDescription>Track your progress across enrolled training modules.</CardDescription>
        </CardHeader>
        <CardContent className="h-40 flex items-center justify-center border-t border-dashed bg-muted/20">
          <span className="text-muted-foreground">LMS features coming soon</span>
        </CardContent>
      </Card>
    </div>
  );
}
