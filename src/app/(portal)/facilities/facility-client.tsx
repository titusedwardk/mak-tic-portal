"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  Calendar,
  MapPin,
  Users,
  CheckCircle2,
  Lock,
  Unlock,
  Clock,
  Plus,
  AlertCircle,
  Building,
  Cpu,
  Wrench,
  X,
  Loader2,
  Check,
} from "lucide-react";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { createBooking } from "./actions";

interface Facility {
  id: string;
  name: string;
  type: "maker_space" | "design_lab" | "meeting_room" | "event_space" | "equipment";
  description: string | null;
  capacity: number | null;
  location: string;
  requires_training: boolean;
  training_course_id: string | null;
  active: boolean;
}

interface Project {
  id: string;
  title: string;
}

interface Booking {
  id: string;
  facility_id: string;
  start_time: string;
  end_time: string;
  purpose: string;
  status: "pending" | "approved" | "rejected" | "cancelled" | "completed";
  facilities: {
    name: string;
    location: string;
    type: string;
  };
}

interface FacilityClientProps {
  facilities: Facility[];
  projects: Project[];
  bookings: Booking[];
  completedCourses: Record<string, boolean>;
  trainingCoursesNames: Record<string, string>;
}

export default function FacilityClient({
  facilities,
  projects,
  bookings,
  completedCourses,
  trainingCoursesNames,
}: FacilityClientProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<string>("all");
  const [selectedFacility, setSelectedFacility] = useState<Facility | null>(null);
  const [isBookingOpen, setIsBookingOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  // Form states
  const [projectId, setProjectId] = useState<string>("none");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [purpose, setPurpose] = useState("");

  const filteredFacilities = facilities.filter((fac) => {
    if (activeTab === "all") return true;
    if (activeTab === "spaces") {
      return ["maker_space", "design_lab", "meeting_room", "event_space"].includes(fac.type);
    }
    if (activeTab === "equipment") {
      return fac.type === "equipment";
    }
    return fac.type === activeTab;
  });

  const getFacilityIcon = (type: string) => {
    switch (type) {
      case "maker_space":
        return <Building className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />;
      case "design_lab":
        return <Cpu className="h-5 w-5 text-purple-600 dark:text-purple-400" />;
      case "meeting_room":
        return <Users className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />;
      case "event_space":
        return <Calendar className="h-5 w-5 text-amber-600 dark:text-amber-400" />;
      case "equipment":
        return <Wrench className="h-5 w-5 text-rose-600 dark:text-rose-400" />;
      default:
        return <Building className="h-5 w-5 text-slate-600" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "approved":
        return <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 uppercase text-[10px] font-semibold dark:bg-emerald-950/20 dark:text-emerald-400 dark:border-emerald-900/30">Approved</Badge>;
      case "pending":
        return <Badge className="bg-amber-50 text-amber-700 border-amber-200 uppercase text-[10px] font-semibold dark:bg-amber-950/20 dark:text-amber-400 dark:border-amber-900/30">Pending</Badge>;
      case "rejected":
        return <Badge className="bg-rose-50 text-rose-700 border-rose-200 uppercase text-[10px] font-semibold dark:bg-rose-950/20 dark:text-rose-400 dark:border-rose-900/30">Rejected</Badge>;
      case "completed":
        return <Badge className="bg-slate-100 text-slate-700 border-slate-200 uppercase text-[10px] font-semibold dark:bg-slate-900 dark:text-slate-400">Completed</Badge>;
      default:
        return <Badge className="bg-slate-50 text-slate-500 border-slate-200 uppercase text-[10px] font-semibold">Cancelled</Badge>;
    }
  };

  const handleOpenBooking = (facility: Facility) => {
    // Check safety training
    if (facility.requires_training && facility.training_course_id) {
      const isCompleted = completedCourses[facility.training_course_id] || false;
      if (!isCompleted) {
        const courseName = trainingCoursesNames[facility.training_course_id] || "required course";
        toast.error(`Access Blocked: You must complete the course "${courseName}" before booking this resource.`, {
          duration: 6000,
        });
        return;
      }
    }
    setSelectedFacility(facility);
    setIsBookingOpen(true);
  };

  const handleSubmitBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFacility) return;

    if (!startTime || !endTime) {
      toast.error("Please enter both start and end times.");
      return;
    }

    if (!purpose.trim()) {
      toast.error("Please describe the purpose of your booking.");
      return;
    }

    startTransition(async () => {
      try {
        await createBooking({
          facilityId: selectedFacility.id,
          projectId: projectId === "none" ? null : projectId,
          startTime,
          endTime,
          purpose,
        });

        toast.success("Booking request submitted! Pending administrator approval.");
        setIsBookingOpen(false);
        // Reset form
        setProjectId("none");
        setStartTime("");
        setEndTime("");
        setPurpose("");
        router.refresh();
      } catch (err: any) {
        toast.error(err.message || "Failed to submit booking");
      }
    });
  };

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2">
      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-indigo-950 via-slate-900 to-indigo-950 text-white p-8 md:p-12 shadow-lg border border-slate-800">
        <div className="absolute right-0 top-0 translate-x-12 -translate-y-12 w-96 h-96 rounded-full bg-amber-500/10 blur-3xl pointer-events-none" />
        <div className="absolute left-1/4 bottom-0 translate-y-1/2 w-64 h-64 rounded-full bg-indigo-500/5 blur-3xl pointer-events-none" />
        <div className="relative z-10 max-w-3xl space-y-4">
          <Badge className="bg-indigo-500/20 text-indigo-300 border-indigo-500/30 hover:bg-indigo-500/30 px-3 py-1 font-semibold uppercase tracking-wider text-xs">
            Resource Access
          </Badge>
          <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight">
            Facility & Equipment Bookings
          </h1>
          <p className="text-slate-300 text-base md:text-lg max-w-2xl leading-relaxed">
            Reserve collaborative rooms, MakerSpaces, prototyping benches, and rapid prototyping hardware.
            Some physical resources require safety clearance before you can book.
          </p>
        </div>
      </div>

      {/* Main Interface Split */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
        {/* Left Column: Facilities Explorer */}
        <div className="xl:col-span-8 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b pb-4 border-slate-200 dark:border-slate-800">
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Available Facilities</h2>
            <div className="flex flex-wrap gap-2">
              <Button
                variant={activeTab === "all" ? "default" : "outline"}
                size="sm"
                onClick={() => setActiveTab("all")}
                className="rounded-full px-4 text-xs font-semibold"
              >
                All
              </Button>
              <Button
                variant={activeTab === "spaces" ? "default" : "outline"}
                size="sm"
                onClick={() => setActiveTab("spaces")}
                className="rounded-full px-4 text-xs font-semibold"
              >
                Labs & Rooms
              </Button>
              <Button
                variant={activeTab === "equipment" ? "default" : "outline"}
                size="sm"
                onClick={() => setActiveTab("equipment")}
                className="rounded-full px-4 text-xs font-semibold"
              >
                Equipment
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {filteredFacilities.map((fac) => {
              const isLocked = !!(
                fac.requires_training &&
                fac.training_course_id &&
                !completedCourses[fac.training_course_id]
              );
              const courseName = fac.training_course_id
                ? trainingCoursesNames[fac.training_course_id]
                : "";

              return (
                <Card
                  key={fac.id}
                  className="flex flex-col justify-between hover:shadow-md transition-shadow duration-300 border border-slate-200 dark:border-slate-800"
                >
                  <CardHeader className="space-y-2 pb-4">
                    <div className="flex items-center justify-between">
                      <div className="p-2 bg-slate-100 dark:bg-slate-900 rounded-lg">
                        {getFacilityIcon(fac.type)}
                      </div>
                      <Badge className="capitalize bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border-none font-semibold text-[10px] tracking-wide">
                        {fac.type.replace("_", " ")}
                      </Badge>
                    </div>
                    <CardTitle className="text-lg font-bold text-slate-900 dark:text-white leading-tight">
                      {fac.name}
                    </CardTitle>
                    <CardDescription className="text-sm text-slate-500 line-clamp-3">
                      {fac.description || "No description provided."}
                    </CardDescription>
                  </CardHeader>

                  <CardContent className="space-y-4 py-0">
                    <div className="space-y-2 border-t border-b py-3 text-xs font-semibold text-slate-600 dark:text-slate-400 border-slate-100 dark:border-slate-800">
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-slate-400" />
                        <span>{fac.location}</span>
                      </div>
                      {fac.capacity && (
                        <div className="flex items-center gap-2">
                          <Users className="h-4 w-4 text-slate-400" />
                          <span>Max Capacity: {fac.capacity} people</span>
                        </div>
                      )}
                    </div>

                    {fac.requires_training && (
                      <div className={`p-3 rounded-lg flex items-start gap-2.5 border ${
                        isLocked
                          ? "bg-rose-50/50 border-rose-100 text-rose-700 dark:bg-rose-950/10 dark:border-rose-900/30 dark:text-rose-400"
                          : "bg-emerald-50/50 border-emerald-100 text-emerald-700 dark:bg-emerald-950/10 dark:border-emerald-900/30 dark:text-emerald-400"
                      }`}>
                        {isLocked ? (
                          <>
                            <Lock className="h-4 w-4 mt-0.5 flex-shrink-0 text-rose-500" />
                            <div className="text-xs space-y-1">
                              <p className="font-bold">Safety Clearance Required</p>
                              <p className="leading-snug text-muted-foreground text-[11px]">
                                Complete course:{" "}
                                <Link
                                  href={`/courses/${fac.training_course_id}`}
                                  className="underline text-rose-600 hover:text-rose-800 dark:text-rose-400 font-bold"
                                >
                                  {courseName}
                                </Link>
                              </p>
                            </div>
                          </>
                        ) : (
                          <>
                            <CheckCircle2 className="h-4 w-4 mt-0.5 flex-shrink-0 text-emerald-500" />
                            <div className="text-xs">
                              <p className="font-bold">Safety Clearance Verified</p>
                              <p className="text-[11px] text-muted-foreground">You are cleared to book this resource.</p>
                            </div>
                          </>
                        )}
                      </div>
                    )}
                  </CardContent>

                  <CardFooter className="pt-4 mt-auto">
                    <Button
                      onClick={() => handleOpenBooking(fac)}
                      disabled={isLocked}
                      className="w-full font-bold rounded-lg shadow-sm"
                    >
                      {isLocked ? (
                        <>
                          <Lock className="mr-2 h-4 w-4" /> Locked
                        </>
                      ) : (
                        "Book Resource"
                      )}
                    </Button>
                  </CardFooter>
                </Card>
              );
            })}
          </div>
        </div>

        {/* Right Column: User Bookings List */}
        <div className="xl:col-span-4 space-y-6">
          <Card className="shadow-sm border-slate-200 dark:border-slate-800">
            <CardHeader className="border-b bg-slate-50/50 dark:bg-slate-900/10 py-4">
              <CardTitle className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Clock className="h-4.5 w-4.5 text-indigo-500" /> My Booking History
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0 max-h-[600px] overflow-y-auto">
              {bookings.length === 0 ? (
                <div className="p-8 text-center text-slate-500">
                  <Calendar className="h-8 w-8 text-slate-400 mx-auto mb-2" />
                  <p className="text-sm font-semibold">No bookings yet</p>
                  <p className="text-xs text-muted-foreground">Your booking requests will appear here.</p>
                </div>
              ) : (
                <div className="divide-y">
                  {bookings.map((booking) => (
                    <div key={booking.id} className="p-4 space-y-2 hover:bg-slate-50/50 dark:hover:bg-slate-900/50 transition-colors">
                      <div className="flex items-start justify-between gap-2">
                        <span className="font-bold text-sm text-slate-900 dark:text-white">
                          {booking.facilities?.name}
                        </span>
                        {getStatusBadge(booking.status)}
                      </div>
                      <div className="text-xs text-slate-500 space-y-1">
                        <div className="flex items-center gap-1.5 font-medium">
                          <MapPin className="h-3 w-3 text-slate-400" />
                          <span>{booking.facilities?.location}</span>
                        </div>
                        <div className="flex items-center gap-1.5 font-medium">
                          <Calendar className="h-3 w-3 text-slate-400" />
                          <span>Start: {formatDate(booking.start_time)}</span>
                        </div>
                        <div className="flex items-center gap-1.5 font-medium">
                          <Clock className="h-3 w-3 text-slate-400" />
                          <span>End: {formatDate(booking.end_time)}</span>
                        </div>
                      </div>
                      <div className="bg-slate-100/50 dark:bg-slate-900/60 p-2 rounded text-[11px] leading-snug text-slate-600 dark:text-slate-400 border">
                        <strong className="text-slate-700 dark:text-slate-300 font-bold block">Purpose:</strong>
                        {booking.purpose}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Booking Form Dialog */}
      <Dialog open={isBookingOpen} onOpenChange={setIsBookingOpen}>
        <DialogContent className="max-w-md rounded-xl sm:max-w-lg border border-slate-200 dark:border-slate-800">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold flex items-center gap-2">
              Book Resource
            </DialogTitle>
            <DialogDescription>
              Submit a booking request for &quot;{selectedFacility?.name}&quot; located at &quot;{selectedFacility?.location}&quot;.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmitBooking} className="space-y-4 py-2">
            {/* Project association */}
            <div className="space-y-1.5">
              <Label htmlFor="project" className="font-bold text-xs text-slate-700 dark:text-slate-300">
                Link to Project (Optional)
              </Label>
              <Select value={projectId} onValueChange={(val) => setProjectId(val || "none")}>
                <SelectTrigger id="project" className="rounded-lg">
                  <SelectValue placeholder="Select a project" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Independent / Personal Use</SelectItem>
                  {projects.map((proj) => (
                    <SelectItem key={proj.id} value={proj.id}>
                      {proj.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Date-time ranges */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="startTime" className="font-bold text-xs text-slate-700 dark:text-slate-300">
                  Start Date &amp; Time
                </Label>
                <Input
                  id="startTime"
                  type="datetime-local"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  required
                  className="rounded-lg w-full"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="endTime" className="font-bold text-xs text-slate-700 dark:text-slate-300">
                  End Date &amp; Time
                </Label>
                <Input
                  id="endTime"
                  type="datetime-local"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  required
                  className="rounded-lg w-full"
                />
              </div>
            </div>

            {/* Booking Purpose */}
            <div className="space-y-1.5">
              <Label htmlFor="purpose" className="font-bold text-xs text-slate-700 dark:text-slate-300">
                Purpose of Booking
              </Label>
              <Textarea
                id="purpose"
                placeholder="Describe your design, prototyping work, or meeting agenda..."
                value={purpose}
                onChange={(e) => setPurpose(e.target.value)}
                required
                rows={3}
                className="rounded-lg"
              />
            </div>

            <DialogFooter className="pt-4 flex flex-col sm:flex-row gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsBookingOpen(false)}
                className="w-full sm:w-auto font-semibold rounded-lg"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isPending}
                className="w-full sm:w-auto font-bold rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white"
              >
                {isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  "Submit Request"
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
