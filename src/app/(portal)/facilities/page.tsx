import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export const dynamic = 'force-dynamic';

export default function FacilitiesPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Lab & Facility Bookings</h1>
        <p className="text-muted-foreground mt-1">Book equipment and lab spaces for your project.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Available Facilities</CardTitle>
          <CardDescription>Browse and book MakerSpaces, Design Labs, and more.</CardDescription>
        </CardHeader>
        <CardContent className="h-40 flex items-center justify-center border-t border-dashed bg-muted/20">
          <span className="text-muted-foreground">Booking system coming soon</span>
        </CardContent>
      </Card>
    </div>
  );
}
