"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  Check,
  X,
  Clock,
  Calendar,
  User,
  MapPin,
  AlertCircle,
  Loader2,
  FileText,
  Search,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { updateBookingStatus } from "./actions";

interface DBBooking {
  id: string;
  start_time: string;
  end_time: string;
  purpose: string;
  status: "pending" | "approved" | "rejected" | "cancelled" | "completed";
  facility: {
    name: string;
    location: string;
    type: string;
  };
  user: {
    full_name: string;
    email: string;
  };
  project: {
    title: string;
  } | null;
}

interface AdminViewProps {
  bookings: DBBooking[];
}

export default function AdminView({ bookings }: AdminViewProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [searchTerm, setSearchTerm] = useState("");

  // Statistics calculations
  const pendingBookings = bookings.filter((b) => b.status === "pending");
  const approvedBookings = bookings.filter((b) => b.status === "approved");
  const totalCount = bookings.length;

  const pastBookings = bookings.filter((b) => b.status !== "pending");

  const filteredPastBookings = pastBookings.filter((b) => {
    const searchLower = searchTerm.toLowerCase();
    return (
      b.facility.name.toLowerCase().includes(searchLower) ||
      b.user.full_name.toLowerCase().includes(searchLower) ||
      b.user.email.toLowerCase().includes(searchLower) ||
      b.purpose.toLowerCase().includes(searchLower) ||
      (b.project && b.project.title.toLowerCase().includes(searchLower))
    );
  });

  const handleStatusChange = async (bookingId: string, status: "approved" | "rejected") => {
    startTransition(async () => {
      try {
        await updateBookingStatus(bookingId, status);
        toast.success(`Booking request successfully ${status}!`);
        router.refresh();
      } catch (err: any) {
        toast.error(err.message || "Failed to update booking status");
      }
    });
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
        return <Badge className="bg-slate-100 text-slate-700 border-slate-200 uppercase text-[10px] font-semibold">Completed</Badge>;
      default:
        return <Badge className="bg-slate-50 text-slate-500 border-slate-200 uppercase text-[10px] font-semibold">Cancelled</Badge>;
    }
  };

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  };

  return (
    <div className="space-y-8">
      {/* Top Banner Header */}
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
          Facility Bookings Manager
        </h1>
        <p className="text-muted-foreground mt-1">
          Review, approve, or decline laboratory spaces and prototyping equipment requests.
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="shadow-sm border-slate-200 dark:border-slate-800">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-semibold text-muted-foreground">Pending Requests</CardTitle>
            <Clock className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-600 dark:text-amber-400">{pendingBookings.length}</div>
            <p className="text-xs text-muted-foreground mt-1">Requiring immediate attention</p>
          </CardContent>
        </Card>

        <Card className="shadow-sm border-slate-200 dark:border-slate-800">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-semibold text-muted-foreground">Active Approved Bookings</CardTitle>
            <Check className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">{approvedBookings.length}</div>
            <p className="text-xs text-muted-foreground mt-1">Currently reserved slots</p>
          </CardContent>
        </Card>

        <Card className="shadow-sm border-slate-200 dark:border-slate-800">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-semibold text-muted-foreground">Total Requests Logged</CardTitle>
            <Calendar className="h-4 w-4 text-slate-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalCount}</div>
            <p className="text-xs text-muted-foreground mt-1">All time bookings record</p>
          </CardContent>
        </Card>
      </div>

      {/* Pending Bookings Area */}
      <div className="space-y-4">
        <div className="border-b pb-2 flex items-center justify-between">
          <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            Pending Queue <Badge variant="secondary" className="rounded-full px-2.5 py-0.5">{pendingBookings.length}</Badge>
          </h2>
        </div>

        {pendingBookings.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-12 text-center bg-slate-50 dark:bg-slate-900/10 rounded-xl border border-dashed">
            <Check className="h-10 w-10 text-emerald-500 bg-emerald-50 dark:bg-emerald-950/20 p-2 rounded-full mb-3" />
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">All Clear!</h3>
            <p className="text-xs text-slate-500 mt-0.5">There are no pending facility bookings to review.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {pendingBookings.map((booking) => (
              <Card
                key={booking.id}
                className="flex flex-col justify-between border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden"
              >
                {/* Visual indicator card top border */}
                <div className="absolute top-0 left-0 right-0 h-1 bg-amber-500" />

                <CardHeader className="pb-3 pt-5">
                  <div className="flex items-start justify-between gap-4">
                    <div className="space-y-1">
                      <span className="text-[10px] font-bold tracking-wider uppercase text-slate-400">
                        {booking.facility.type.replace("_", " ")}
                      </span>
                      <CardTitle className="text-lg font-bold text-slate-900 dark:text-white">
                        {booking.facility.name}
                      </CardTitle>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 mt-2">
                    <MapPin className="h-3.5 w-3.5 text-slate-400" />
                    <span>{booking.facility.location}</span>
                  </div>
                </CardHeader>

                <CardContent className="space-y-3.5 pb-4">
                  {/* Who booked */}
                  <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-900/40 p-2.5 rounded-lg border">
                    <User className="h-4 w-4 text-indigo-500" />
                    <div className="text-xs">
                      <span className="font-bold text-slate-900 dark:text-white">{booking.user.full_name}</span>
                      <span className="text-slate-500 block text-[10px]">{booking.user.email}</span>
                    </div>
                  </div>

                  {/* Booking schedule */}
                  <div className="text-xs font-semibold text-slate-600 dark:text-slate-400 space-y-1 bg-indigo-50/20 dark:bg-indigo-950/10 p-2.5 rounded-lg border border-indigo-100/40">
                    <div className="flex justify-between items-center">
                      <span className="text-slate-400 text-[10px] uppercase font-bold tracking-wider">Start Time</span>
                      <span>{formatDate(booking.start_time)}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-slate-400 text-[10px] uppercase font-bold tracking-wider">End Time</span>
                      <span>{formatDate(booking.end_time)}</span>
                    </div>
                  </div>

                  {/* Associated project */}
                  {booking.project && (
                    <div className="text-xs bg-slate-50 dark:bg-slate-900/30 p-2.5 rounded-lg border">
                      <span className="text-slate-400 text-[10px] uppercase font-bold tracking-wider block mb-0.5">
                        Linked Project
                      </span>
                      <span className="font-semibold text-slate-800 dark:text-slate-300">{booking.project.title}</span>
                    </div>
                  )}

                  {/* Purpose description */}
                  <div className="bg-slate-100/30 dark:bg-slate-900/60 p-2.5 rounded-lg border text-xs leading-normal">
                    <strong className="text-slate-700 dark:text-slate-300 font-bold block mb-1">Purpose:</strong>
                    <p className="text-slate-600 dark:text-slate-400 font-medium italic">{booking.purpose}</p>
                  </div>
                </CardContent>

                <CardFooter className="pt-3 border-t bg-slate-50/50 dark:bg-slate-900/20 flex gap-3">
                  <Button
                    onClick={() => handleStatusChange(booking.id, "rejected")}
                    disabled={isPending}
                    variant="outline"
                    className="w-full font-semibold border-rose-200 text-rose-700 hover:bg-rose-50 dark:border-rose-900/30 dark:text-rose-400 dark:hover:bg-rose-950/20 rounded-lg flex items-center justify-center gap-1.5"
                  >
                    <X className="h-4.5 w-4.5" /> Decline
                  </Button>
                  <Button
                    onClick={() => handleStatusChange(booking.id, "approved")}
                    disabled={isPending}
                    className="w-full font-bold bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg flex items-center justify-center gap-1.5"
                  >
                    {isPending ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <>
                        <Check className="h-4.5 w-4.5" /> Approve
                      </>
                    )}
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Historical Logs Area */}
      <div className="space-y-4 pt-4">
        <div className="border-b pb-2 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">Past Bookings Log</h2>
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-400" />
            <Input
              type="text"
              placeholder="Search history..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8 py-1 h-9 rounded-lg text-xs"
            />
          </div>
        </div>

        <Card className="shadow-sm border-slate-200 dark:border-slate-800">
          <CardContent className="p-0">
            {filteredPastBookings.length === 0 ? (
              <div className="p-8 text-center text-slate-500">
                <AlertCircle className="h-8 w-8 text-slate-400 mx-auto mb-2" />
                <p className="text-sm font-semibold">No booking history matches your search</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="font-bold text-xs uppercase tracking-wider text-slate-400">Resource / Facility</TableHead>
                    <TableHead className="font-bold text-xs uppercase tracking-wider text-slate-400">Reserved By</TableHead>
                    <TableHead className="font-bold text-xs uppercase tracking-wider text-slate-400">Reserved Period</TableHead>
                    <TableHead className="font-bold text-xs uppercase tracking-wider text-slate-400">Purpose</TableHead>
                    <TableHead className="font-bold text-xs uppercase tracking-wider text-slate-400 text-right">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredPastBookings.map((booking) => (
                    <TableRow key={booking.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/50">
                      <TableCell className="font-semibold text-slate-900 dark:text-white max-w-[200px]">
                        <div className="truncate font-bold">{booking.facility.name}</div>
                        <div className="text-[10px] text-slate-400 font-medium">{booking.facility.location}</div>
                      </TableCell>
                      <TableCell className="font-medium text-slate-700 dark:text-slate-300 text-xs">
                        <div>{booking.user.full_name}</div>
                        <div className="text-[10px] text-slate-400 font-medium">{booking.user.email}</div>
                      </TableCell>
                      <TableCell className="text-slate-600 dark:text-slate-400 text-xs font-semibold">
                        <div>{formatDate(booking.start_time)}</div>
                        <div className="text-[10px] font-bold text-slate-400">to {formatDate(booking.end_time)}</div>
                      </TableCell>
                      <TableCell className="text-slate-500 max-w-[250px]">
                        <div className="truncate text-xs italic font-medium">{booking.purpose}</div>
                        {booking.project && (
                          <div className="text-[9px] text-indigo-500 font-bold uppercase tracking-wider mt-0.5">
                            Proj: {booking.project.title}
                          </div>
                        )}
                      </TableCell>
                      <TableCell className="text-right">{getStatusBadge(booking.status)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
