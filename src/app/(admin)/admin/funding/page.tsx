import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export const dynamic = 'force-dynamic';

export default function AdminFundingPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Funding & Grants</h1>
        <p className="text-muted-foreground mt-1">Manage funding sources, allocations, and tranche disbursements.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Funding Allocations</CardTitle>
          <CardDescription>Track funds distributed to active projects.</CardDescription>
        </CardHeader>
        <CardContent className="h-40 flex items-center justify-center border-t border-dashed bg-muted/20">
          <span className="text-muted-foreground">Funding management coming soon</span>
        </CardContent>
      </Card>
    </div>
  );
}
