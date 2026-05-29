"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { scheduleSession, submitSessionFeedback } from "./actions";
import { 
  Calendar, 
  Clock, 
  Star, 
  User, 
  Mail, 
  BookOpen, 
  MessageSquare, 
  Video, 
  Award, 
  CheckCircle2, 
  AlertCircle,
  Sparkles,
  BookMarked
} from "lucide-react";
import { toast } from "sonner";

interface MentorsClientProps {
  assignment: {
    id: string;
    project_id: string;
    mentor_id: string;
    status: string;
    start_date: string;
  };
  project: {
    title: string;
    track: string;
  };
  mentorProfile: {
    full_name: string;
    email: string;
    avatar_url: string | null;
    affiliation: string;
    bio: string | null;
  };
  mentorDetails: {
    expertise_sectors: string[];
    availability: Record<string, string[]>;
    languages: string[] | null;
    rating_avg: number | null;
    total_sessions: number | null;
    bio_extended: string | null;
  };
  sessions: Array<{
    id: string;
    scheduled_at: string;
    duration_minutes: number | null;
    status: string | null;
    meeting_link: string | null;
    notes_mentor: string | null;
    feedback_innovator: string | null;
    rating_innovator: number | null;
    purpose: string | null;
  }>;
}

export default function MentorsClient({
  assignment,
  project,
  mentorProfile,
  mentorDetails,
  sessions: initialSessions,
}: MentorsClientProps) {
  const [sessions, setSessions] = useState(initialSessions);
  
  // Schedule Form State
  const [scheduleDate, setScheduleDate] = useState("");
  const [scheduleTime, setScheduleTime] = useState("");
  const [duration, setDuration] = useState("45");
  const [purpose, setPurpose] = useState("");
  const [isScheduling, setIsScheduling] = useState(false);

  // Feedback State
  const [activeFeedbackSessionId, setActiveFeedbackSessionId] = useState<string | null>(null);
  const [feedbackRating, setFeedbackRating] = useState<number>(5);
  const [feedbackText, setFeedbackText] = useState("");
  const [isSubmittingFeedback, setIsSubmittingFeedback] = useState(false);

  // Handlers
  const handleSchedule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!scheduleDate || !scheduleTime || !purpose) {
      toast.error("Please fill in all scheduling fields");
      return;
    }

    setIsScheduling(true);
    const scheduledDateTime = new Date(`${scheduleDate}T${scheduleTime}`).toISOString();
    
    try {
      const result = await scheduleSession({
        assignmentId: assignment.id,
        scheduledAt: scheduledDateTime,
        durationMinutes: parseInt(duration),
        purpose,
      });

      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success("Session scheduled successfully!");
        setPurpose("");
        setScheduleDate("");
        setScheduleTime("");
        
        // Optimistically add session or just trigger a page refresh
        // For simplicity and alignment with revalidatePath, we can reload or update local state
        window.location.reload();
      }
    } catch (err: any) {
      toast.error(err.message || "Something went wrong");
    } finally {
      setIsScheduling(false);
    }
  };

  const handleFeedbackSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeFeedbackSessionId || !feedbackText) {
      toast.error("Please fill in the feedback description");
      return;
    }

    setIsSubmittingFeedback(true);
    try {
      const result = await submitSessionFeedback({
        sessionId: activeFeedbackSessionId,
        rating: feedbackRating,
        feedback: feedbackText,
      });

      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success("Thank you for your feedback!");
        setFeedbackText("");
        setFeedbackRating(5);
        setActiveFeedbackSessionId(null);
        window.location.reload();
      }
    } catch (err: any) {
      toast.error(err.message || "Something went wrong");
    } finally {
      setIsSubmittingFeedback(false);
    }
  };

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      {/* LEFT COLUMN: Mentor Profile Card */}
      <div className="space-y-6 lg:col-span-1">
        <Card className="overflow-hidden border-slate-200 shadow-md">
          {/* Header Banner */}
          <div className="h-24 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-950 relative">
            <div className="absolute right-4 top-4 bg-amber-500/20 text-amber-400 font-semibold px-2.5 py-0.5 rounded-full text-xs flex items-center gap-1 border border-amber-500/30">
              <Sparkles className="w-3.5 h-3.5" />
              Active Match
            </div>
          </div>
          <CardContent className="pt-0 relative px-6 pb-6">
            {/* Avatar Shifted Up */}
            <div className="flex justify-center -mt-12 mb-4">
              <Avatar className="w-24 h-24 border-4 border-background shadow-lg">
                <AvatarImage src={mentorProfile.avatar_url || ""} />
                <AvatarFallback className="bg-gradient-to-tr from-slate-700 to-indigo-950 text-white text-2xl font-bold">
                  {mentorProfile.full_name.split(" ").map(n => n[0]).join("")}
                </AvatarFallback>
              </Avatar>
            </div>

            {/* Title & Affiliation */}
            <div className="text-center">
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">{mentorProfile.full_name}</h2>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">{mentorProfile.email}</p>
              <div className="flex items-center justify-center gap-2 mt-2">
                <Badge variant="secondary" className="capitalize">
                  {mentorProfile.affiliation.replace("_", " ")}
                </Badge>
                <div className="flex items-center text-amber-500 text-sm font-semibold">
                  <Star className="w-4 h-4 fill-amber-500 mr-1" />
                  {mentorDetails.rating_avg ? mentorDetails.rating_avg.toFixed(1) : "N/A"}
                </div>
              </div>
            </div>

            <hr className="my-5 border-slate-100" />

            {/* Bios */}
            <div className="space-y-4">
              <div>
                <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">About Mentor</h4>
                <p className="text-sm text-slate-600 dark:text-slate-300 mt-1 leading-relaxed">
                  {mentorProfile.bio || "No biography provided."}
                </p>
                {mentorDetails.bio_extended && (
                  <p className="text-sm text-slate-600 dark:text-slate-300 mt-2 leading-relaxed italic">
                    "{mentorDetails.bio_extended}"
                  </p>
                )}
              </div>

              <div>
                <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Expertise Sectors</h4>
                <div className="flex flex-wrap gap-1.5 mt-1.5">
                  {mentorDetails.expertise_sectors.map((sec) => (
                    <Badge key={sec} variant="outline" className="bg-indigo-50/50 text-indigo-700 border-indigo-100 font-medium">
                      {sec}
                    </Badge>
                  ))}
                </div>
              </div>

              {mentorDetails.languages && mentorDetails.languages.length > 0 && (
                <div>
                  <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Languages</h4>
                  <p className="text-sm text-slate-600 dark:text-slate-300 mt-1">
                    {mentorDetails.languages.join(", ")}
                  </p>
                </div>
              )}

              <div>
                <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Availability Slots</h4>
                <div className="mt-2 space-y-1">
                  {Object.entries(mentorDetails.availability).map(([day, slots]) => (
                    <div key={day} className="flex justify-between text-xs py-1 border-b border-dashed border-slate-100 last:border-0">
                      <span className="font-semibold text-slate-600 dark:text-slate-300 capitalize">{day}</span>
                      <span className="text-slate-500">{slots.join(", ")}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-2 text-center text-xs text-slate-400 border-t border-slate-100 flex items-center justify-center gap-1.5">
                <BookMarked className="w-3.5 h-3.5 text-slate-400" />
                Assigned to: <strong className="text-slate-600 dark:text-slate-300">{project.title}</strong>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* RIGHT COLUMN: Scheduler & Session Logs */}
      <div className="space-y-6 lg:col-span-2">
        {/* Scheduler Card */}
        <Card className="border-slate-200 shadow-md">
          <CardHeader className="bg-slate-50/50 border-b border-slate-100">
            <CardTitle className="text-lg font-bold flex items-center gap-2">
              <Calendar className="w-5 h-5 text-indigo-600" />
              Schedule a Mentorship Session
            </CardTitle>
            <CardDescription>
              Select a date/time matching your mentor's availability and describe what you want to discuss.
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <form onSubmit={handleSchedule} className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-3">
                <div className="space-y-2">
                  <Label htmlFor="date">Session Date</Label>
                  <Input 
                    id="date" 
                    type="date" 
                    value={scheduleDate} 
                    onChange={(e) => setScheduleDate(e.target.value)} 
                    required 
                    min={new Date().toISOString().split("T")[0]}
                    className="w-full"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="time">Preferred Time</Label>
                  <Input 
                    id="time" 
                    type="time" 
                    value={scheduleTime} 
                    onChange={(e) => setScheduleTime(e.target.value)} 
                    required 
                    className="w-full"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="duration">Duration</Label>
                  <Select value={duration} onValueChange={(val) => { if (val) setDuration(val); }}>
                    <SelectTrigger id="duration">
                      <SelectValue placeholder="Select duration" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="30">30 Minutes</SelectItem>
                      <SelectItem value="45">45 Minutes</SelectItem>
                      <SelectItem value="60">60 Minutes</SelectItem>
                      <SelectItem value="90">90 Minutes</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="purpose">Purpose of Session</Label>
                <Textarea 
                  id="purpose" 
                  placeholder="Detail the technical or business challenges you'd like guidance on (e.g., prototype testing plan, pitch deck feedback)." 
                  value={purpose}
                  onChange={(e) => setPurpose(e.target.value)}
                  rows={3}
                  required
                  className="resize-none"
                />
              </div>

              <div className="flex justify-end">
                <Button type="submit" disabled={isScheduling} className="bg-indigo-600 hover:bg-indigo-700 text-white font-medium">
                  {isScheduling ? "Scheduling..." : "Book Mentoring Slot"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Session Logs Card */}
        <Card className="border-slate-200 shadow-md">
          <CardHeader className="bg-slate-50/50 border-b border-slate-100">
            <CardTitle className="text-lg font-bold flex items-center gap-2">
              <Clock className="w-5 h-5 text-indigo-600" />
              Session History & Feedback
            </CardTitle>
            <CardDescription>
              Track your past engagements, access mentor notes, and provide feedback.
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            {sessions.length === 0 ? (
              <div className="text-center py-10 border border-dashed rounded-lg bg-slate-50/30">
                <MessageSquare className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                <p className="text-slate-500 font-medium">No sessions logged yet.</p>
                <p className="text-xs text-slate-400 mt-1">Book your first session above to get started.</p>
              </div>
            ) : (
              <div className="space-y-6">
                {sessions.map((session) => {
                  const sessionDate = new Date(session.scheduled_at);
                  const isPast = sessionDate < new Date();
                  const showFeedbackForm = activeFeedbackSessionId === session.id;

                  return (
                    <div key={session.id} className="p-5 border rounded-xl bg-background shadow-sm hover:border-slate-300 transition duration-150">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2.5">
                            <span className="font-semibold text-slate-900 dark:text-slate-100">
                              {sessionDate.toLocaleDateString(undefined, { 
                                weekday: 'long', 
                                year: 'numeric', 
                                month: 'long', 
                                day: 'numeric' 
                              })}
                            </span>
                            <Badge className="text-xs uppercase px-2 font-semibold tracking-wider" variant={
                              session.status === "completed" ? "success" as any :
                              session.status === "scheduled" ? "secondary" : "destructive"
                            }>
                              {session.status}
                            </Badge>
                          </div>
                          <div className="flex flex-wrap items-center gap-y-1 gap-x-4 text-xs text-slate-500">
                            <span className="flex items-center gap-1">
                              <Clock className="w-3.5 h-3.5 text-slate-400" />
                              {sessionDate.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })} ({session.duration_minutes || 45} mins)
                            </span>
                            {session.meeting_link && session.status === "scheduled" && (
                              <a href={session.meeting_link} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-indigo-600 hover:underline font-semibold">
                                <Video className="w-3.5 h-3.5" />
                                Join Meeting
                              </a>
                            )}
                          </div>
                        </div>

                        {session.status === "completed" && !session.rating_innovator && !showFeedbackForm && (
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="self-start sm:self-center border-indigo-600 text-indigo-600 hover:bg-indigo-50 font-semibold"
                            onClick={() => {
                              setActiveFeedbackSessionId(session.id);
                              setFeedbackText("");
                              setFeedbackRating(5);
                            }}
                          >
                            Submit Rating
                          </Button>
                        )}
                      </div>

                      {/* Display Session Purpose */}
                      {session.purpose && (
                        <div className="mt-3.5 text-sm bg-slate-50/50 dark:bg-slate-900/50 p-3 rounded-lg border border-slate-100">
                          <strong className="text-xs text-slate-500 uppercase tracking-wide block mb-1">Session Purpose</strong>
                          <p className="text-slate-700 dark:text-slate-300">{session.purpose}</p>
                        </div>
                      )}

                      {/* Display Mentor Notes */}
                      {session.notes_mentor && (
                        <div className="mt-3 text-sm bg-indigo-50/30 dark:bg-slate-900/30 p-3 rounded-lg border border-indigo-100/40">
                          <strong className="text-xs text-indigo-600 uppercase tracking-wide block mb-1 flex items-center gap-1">
                            <Award className="w-3.5 h-3.5" />
                            Mentor Action Items & Notes
                          </strong>
                          <p className="text-slate-700 dark:text-slate-300 italic">"{session.notes_mentor}"</p>
                        </div>
                      )}

                      {/* Display Submitted Feedback */}
                      {session.rating_innovator && (
                        <div className="mt-3 pt-3 border-t border-slate-100 flex flex-col gap-2">
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs text-slate-400 uppercase tracking-wide font-medium">Your Rating:</span>
                            <div className="flex text-amber-500">
                              {Array.from({ length: 5 }).map((_, i) => (
                                <Star key={i} className={`w-3.5 h-3.5 ${i < (session.rating_innovator || 0) ? "fill-amber-500 text-amber-500" : "text-slate-200"}`} />
                              ))}
                            </div>
                          </div>
                          {session.feedback_innovator && (
                            <p className="text-xs text-slate-500 dark:text-slate-400 bg-slate-50/50 p-2.5 rounded border">
                              <strong>Your Feedback:</strong> "{session.feedback_innovator}"
                            </p>
                          )}
                        </div>
                      )}

                      {/* Feedback Form (Inline Toggle) */}
                      {showFeedbackForm && (
                        <form onSubmit={handleFeedbackSubmit} className="mt-4 p-4 border border-indigo-100 bg-indigo-50/20 rounded-xl space-y-3.5">
                          <div className="flex items-center justify-between">
                            <h4 className="text-sm font-bold text-slate-900">Session Feedback & Rating</h4>
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              className="text-xs text-slate-400 hover:text-slate-600"
                              onClick={() => setActiveFeedbackSessionId(null)}
                              type="button"
                            >
                              Cancel
                            </Button>
                          </div>

                          <div className="space-y-1.5">
                            <Label className="text-xs text-slate-600">Rate this session</Label>
                            <div className="flex gap-1.5">
                              {[1, 2, 3, 4, 5].map((star) => (
                                <button
                                  key={star}
                                  type="button"
                                  onClick={() => setFeedbackRating(star)}
                                  className="focus:outline-none transition hover:scale-110"
                                >
                                  <Star className={`w-6 h-6 ${star <= feedbackRating ? "fill-amber-400 text-amber-400" : "text-slate-300"}`} />
                                </button>
                              ))}
                            </div>
                          </div>

                          <div className="space-y-1.5">
                            <Label htmlFor={`feedback-${session.id}`} className="text-xs text-slate-600">What went well? Any issues or follow-ups?</Label>
                            <Textarea 
                              id={`feedback-${session.id}`}
                              placeholder="Write a brief evaluation (e.g. Dr. Florence was very helpful, discussed milestones...)"
                              value={feedbackText}
                              onChange={(e) => setFeedbackText(e.target.value)}
                              rows={2}
                              required
                              className="bg-background resize-none"
                            />
                          </div>

                          <div className="flex justify-end gap-2">
                            <Button 
                              type="button" 
                              variant="ghost" 
                              size="sm"
                              className="text-xs" 
                              onClick={() => setActiveFeedbackSessionId(null)}
                            >
                              Dismiss
                            </Button>
                            <Button 
                              type="submit" 
                              size="sm" 
                              disabled={isSubmittingFeedback}
                              className="bg-indigo-600 text-white hover:bg-indigo-700 text-xs font-semibold px-4"
                            >
                              {isSubmittingFeedback ? "Submitting..." : "Submit Rating"}
                            </Button>
                          </div>
                        </form>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
