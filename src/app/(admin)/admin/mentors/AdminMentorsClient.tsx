"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { activateAssignment, deleteAssignment } from "./actions";
import { 
  Users, 
  Layers, 
  Sparkles, 
  Star, 
  TrendingUp, 
  Award, 
  Check, 
  Trash2, 
  AlertCircle,
  BrainCircuit,
  Loader2,
  ExternalLink
} from "lucide-react";
import { toast } from "sonner";

interface AdminMentorsClientProps {
  mentors: Array<{
    id: string;
    expertise_sectors: string[];
    max_mentees: number | null;
    current_mentees: number | null;
    rating_avg: number | null;
    total_sessions: number | null;
    bio_extended: string | null;
    profiles: {
      full_name: string;
      email: string;
      bio: string | null;
      affiliation: string;
    } | null;
  }>;
  assignments: Array<{
    id: string;
    project_id: string;
    mentor_id: string;
    status: string;
    start_date: string | null;
    compatibility_score: number | null;
    match_reasoning: string | null;
    projects: {
      title: string;
      track: string;
      sector: string[];
    } | null;
    profiles: {
      full_name: string;
      email: string;
    } | null;
  }>;
  unmatchedProjects: Array<{
    id: string;
    title: string;
    track: string;
    sector: string[];
  }>;
}

export default function AdminMentorsClient({
  mentors,
  assignments,
  unmatchedProjects,
}: AdminMentorsClientProps) {
  const [activeTab, setActiveTab] = useState("roster");
  const [isMatching, setIsMatching] = useState(false);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

  // Group assignments by status
  const activePairings = assignments.filter((a) => a.status === "active");
  const proposedPairings = assignments.filter((a) => a.status === "proposed");

  // Run AI Matchmaker
  const runAiMatcher = async () => {
    setIsMatching(true);
    toast.info("AI Matchmaker is analyzing unmatched projects and active mentors...");

    try {
      const res = await fetch("/api/ai/match-mentor", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });

      const data = await res.json();

      if (data.error) {
        toast.error(`Matchmaking failed: ${data.error}`);
      } else {
        toast.success(`Success! Suggested ${data.suggestions?.length || 0} pairs.`);
        // Reload page to show proposed matches
        window.location.reload();
      }
    } catch (err: any) {
      toast.error(err.message || "An error occurred during matchmaking");
    } finally {
      setIsMatching(false);
    }
  };

  // Approve Match
  const handleApprove = async (id: string) => {
    setActionLoadingId(id);
    try {
      const res = await activateAssignment(id);
      if (res.error) {
        toast.error(res.error);
      } else {
        toast.success("Mentorship match approved and activated!");
        window.location.reload();
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to activate match");
    } finally {
      setActionLoadingId(null);
    }
  };

  // Reject / Terminate Match
  const handleReject = async (id: string, isProposed: boolean) => {
    if (!confirm(isProposed ? "Are you sure you want to dismiss this match suggestion?" : "Are you sure you want to terminate this active mentorship assignment?")) {
      return;
    }
    setActionLoadingId(id);
    try {
      const res = await deleteAssignment(id);
      if (res.error) {
        toast.error(res.error);
      } else {
        toast.success(isProposed ? "Match suggestion dismissed." : "Mentorship assignment terminated.");
        window.location.reload();
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to delete assignment");
    } finally {
      setActionLoadingId(null);
    }
  };

  // Compatibility Color Helper
  const getScoreColor = (score: number) => {
    if (score >= 85) return "text-emerald-600 bg-emerald-50 dark:bg-emerald-950/20 border-emerald-200";
    if (score >= 70) return "text-indigo-600 bg-indigo-50 dark:bg-indigo-950/20 border-indigo-200";
    return "text-amber-600 bg-amber-50 dark:bg-amber-950/20 border-amber-200";
  };

  const getScoreProgressColor = (score: number) => {
    if (score >= 85) return "[&>div]:bg-emerald-500";
    if (score >= 70) return "[&>div]:bg-indigo-500";
    return "[&>div]:bg-amber-500";
  };

  return (
    <div className="space-y-6">
      {/* STATS OVERVIEW CARDS */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="border-slate-200/80 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Mentors</CardTitle>
            <Users className="h-4.5 w-4.5 text-slate-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-900 dark:text-white">{mentors.length}</div>
            <p className="text-xs text-slate-500 mt-0.5">Active profiles in database</p>
          </CardContent>
        </Card>

        <Card className="border-slate-200/80 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Active Pairings</CardTitle>
            <Layers className="h-4.5 w-4.5 text-slate-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-900 dark:text-white">{activePairings.length}</div>
            <p className="text-xs text-slate-500 mt-0.5">Ongoing active engagements</p>
          </CardContent>
        </Card>

        <Card className="border-slate-200/80 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Unmatched Projects</CardTitle>
            <AlertCircle className="h-4.5 w-4.5 text-rose-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-rose-600 dark:text-rose-400">{unmatchedProjects.length}</div>
            <p className="text-xs text-slate-500 mt-0.5">Awaiting mentor pairing</p>
          </CardContent>
        </Card>

        <Card className="border-slate-200/80 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Proposed Matches</CardTitle>
            <Sparkles className="h-4.5 w-4.5 text-indigo-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">{proposedPairings.length}</div>
            <p className="text-xs text-slate-500 mt-0.5">Pending admin approval</p>
          </CardContent>
        </Card>
      </div>

      {/* TABS CONTAINER */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <TabsList className="bg-slate-100/80 p-0.5">
            <TabsTrigger value="roster" className="data-[state=active]:bg-white data-[state=active]:shadow-sm">
              Mentor Roster
            </TabsTrigger>
            <TabsTrigger value="pairings" className="data-[state=active]:bg-white data-[state=active]:shadow-sm">
              Active Pairings
            </TabsTrigger>
            <TabsTrigger value="matchmaker" className="data-[state=active]:bg-white data-[state=active]:shadow-sm flex items-center gap-1.5">
              AI Matchmaker
              {unmatchedProjects.length > 0 && (
                <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
              )}
            </TabsTrigger>
          </TabsList>

          {activeTab === "matchmaker" && unmatchedProjects.length > 0 && (
            <Button 
              onClick={runAiMatcher} 
              disabled={isMatching}
              className="bg-indigo-600 hover:bg-indigo-700 text-white font-medium flex items-center gap-2"
            >
              {isMatching ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Generating Suggestions...
                </>
              ) : (
                <>
                  <BrainCircuit className="w-4.5 h-4.5" />
                  Run AI Matchmaker
                </>
              )}
            </Button>
          )}
        </div>

        {/* TAB CONTENT: MENTOR ROSTER */}
        <TabsContent value="roster" className="space-y-4">
          <Card className="border-slate-200/80 shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg">Expert Mentors Pool</CardTitle>
              <CardDescription>
                A roster of industry experts supporting innovation teams at Makerere University.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Mentor</TableHead>
                    <TableHead>Affiliation</TableHead>
                    <TableHead>Expertise Sectors</TableHead>
                    <TableHead className="text-center">Workload Capacity</TableHead>
                    <TableHead className="text-center">Rating</TableHead>
                    <TableHead className="text-center">Sessions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {mentors.map((m) => {
                    const p = m.profiles;
                    if (!p) return null;
                    const workloadPercent = m.max_mentees ? ((m.current_mentees || 0) / m.max_mentees) * 100 : 0;
                    return (
                      <TableRow key={m.id}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <Avatar className="h-9 w-9">
                              <AvatarFallback className="bg-indigo-950 text-white text-xs font-bold">
                                {p.full_name.split(" ").map((n) => n[0]).join("")}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <div className="font-semibold text-slate-900 dark:text-slate-100">{p.full_name}</div>
                              <div className="text-xs text-slate-500">{p.email}</div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="capitalize">{p.affiliation.replace("_", " ")}</TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-1 max-w-[280px]">
                            {m.expertise_sectors.map((sec) => (
                              <Badge key={sec} variant="outline" className="text-[10px] py-0 px-1 border-indigo-100 bg-indigo-50/20 text-indigo-700">
                                {sec}
                              </Badge>
                            ))}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col gap-1.5 w-[140px] mx-auto">
                            <div className="flex justify-between text-xs text-slate-500 font-medium">
                              <span>{m.current_mentees || 0} of {m.max_mentees || 3} Mentees</span>
                              <span>{Math.round(workloadPercent)}%</span>
                            </div>
                            <Progress value={workloadPercent} className={`h-1.5 ${
                              workloadPercent >= 90 ? "[&>div]:bg-rose-500" : 
                              workloadPercent >= 70 ? "[&>div]:bg-amber-500" : "[&>div]:bg-indigo-500"
                            }`} />
                          </div>
                        </TableCell>
                        <TableCell className="text-center">
                          <div className="inline-flex items-center text-amber-500 font-semibold text-sm">
                            <Star className="w-3.5 h-3.5 fill-amber-500 mr-1" />
                            {m.rating_avg ? m.rating_avg.toFixed(1) : "New"}
                          </div>
                        </TableCell>
                        <TableCell className="text-center font-medium text-slate-600 dark:text-slate-400">
                          {m.total_sessions || 0}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* TAB CONTENT: ACTIVE PAIRINGS */}
        <TabsContent value="pairings" className="space-y-4">
          <Card className="border-slate-200/80 shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg">Active Assignments</CardTitle>
              <CardDescription>
                Ongoing mentorship matches currently active in the innovation center.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {activePairings.length === 0 ? (
                <div className="text-center py-12 border border-dashed rounded-lg bg-slate-50/30">
                  <Layers className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                  <p className="text-slate-500 font-medium">No active pairings found.</p>
                  <p className="text-xs text-slate-400 mt-1">Pair unmatched projects with mentors in the AI Matchmaker tab.</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Project Title</TableHead>
                      <TableHead>Assigned Mentor</TableHead>
                      <TableHead>Track</TableHead>
                      <TableHead>Matched On</TableHead>
                      <TableHead className="w-[100px] text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {activePairings.map((a) => {
                      const proj = a.projects;
                      const ment = a.profiles;
                      if (!proj || !ment) return null;
                      return (
                        <TableRow key={a.id}>
                          <TableCell className="font-semibold text-slate-900 dark:text-slate-100">{proj.title}</TableCell>
                          <TableCell>
                            <div>
                              <div className="font-medium">{ment.full_name}</div>
                              <div className="text-xs text-slate-500">{ment.email}</div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className="capitalize text-xs font-normal">
                              {proj.track.replace("_", " ")}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-slate-500 text-sm">
                            {a.start_date ? new Date(a.start_date).toLocaleDateString() : "N/A"}
                          </TableCell>
                          <TableCell className="text-right">
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="text-rose-500 hover:text-rose-700 hover:bg-rose-50/50"
                              disabled={actionLoadingId === a.id}
                              onClick={() => handleReject(a.id, false)}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* TAB CONTENT: AI MATCHMAKER BOARD */}
        <TabsContent value="matchmaker" className="space-y-6">
          {/* UNMATCHED PROJECTS GRID */}
          <div className="grid gap-6 md:grid-cols-3">
            <div className="md:col-span-1 space-y-4">
              <Card className="border-slate-200 shadow-sm bg-slate-50/50">
                <CardHeader>
                  <CardTitle className="text-base font-bold flex items-center gap-1.5 text-slate-900 dark:text-white">
                    <TrendingUp className="w-4.5 h-4.5 text-rose-500" />
                    Unmatched Pipeline
                  </CardTitle>
                  <CardDescription>
                    Projects waiting for a mentor match.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3 max-h-[500px] overflow-y-auto">
                  {unmatchedProjects.length === 0 ? (
                    <div className="text-center py-8 text-xs text-slate-500 border border-dashed rounded bg-background">
                      All projects are successfully paired!
                    </div>
                  ) : (
                    unmatchedProjects.map((p) => (
                      <div key={p.id} className="p-3 border border-slate-100 rounded-lg bg-background shadow-xs">
                        <h4 className="text-sm font-semibold text-slate-900 line-clamp-1">{p.title}</h4>
                        <div className="flex gap-1.5 mt-2">
                          <Badge variant="outline" className="text-[10px] capitalize font-normal px-1 py-0 border-slate-200">
                            {p.track.replace("_", " ")}
                          </Badge>
                          {p.sector.slice(0, 2).map((s) => (
                            <Badge key={s} className="text-[10px] font-normal px-1 py-0 bg-slate-100 text-slate-700">
                              {s}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    ))
                  )}
                </CardContent>
              </Card>
            </div>

            {/* PROPOSED SUGGESTIONS BOARD */}
            <div className="md:col-span-2 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <BrainCircuit className="w-5 h-5 text-indigo-600" />
                  Proposed Pairings
                </h3>
                <span className="text-xs text-slate-500">{proposedPairings.length} Suggestions Generated</span>
              </div>

              {proposedPairings.length === 0 ? (
                <Card className="flex flex-col items-center justify-center p-12 text-center border-dashed border-slate-200 h-[380px]">
                  <Sparkles className="w-12 h-12 text-indigo-400 mb-4 stroke-[1.2]" />
                  <CardTitle className="text-lg font-bold">No Match Suggestions Available</CardTitle>
                  <CardDescription className="max-w-md mt-1.5 text-sm">
                    Generate matches using the AI Matchmaker. It analyzes project descriptions and matches them with mentors based on expertise, compatibility, and availability.
                  </CardDescription>
                  <Button 
                    onClick={runAiMatcher} 
                    disabled={isMatching}
                    className="mt-5 bg-indigo-600 hover:bg-indigo-700 text-white font-medium"
                  >
                    {isMatching ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin mr-2" />
                        Generating Matches...
                      </>
                    ) : (
                      "Compute Recommendations"
                    )}
                  </Button>
                </Card>
              ) : (
                <div className="space-y-4 max-h-[600px] overflow-y-auto pr-1">
                  {proposedPairings.map((suggestion) => {
                    const proj = suggestion.projects;
                    const ment = suggestion.profiles;
                    if (!proj || !ment) return null;
                    const score = suggestion.compatibility_score || 80;

                    return (
                      <div 
                        key={suggestion.id} 
                        className="p-5 border border-indigo-100/80 rounded-xl bg-indigo-50/5/30 shadow-xs hover:border-indigo-200 transition duration-150 relative"
                      >
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                          <div>
                            <div className="flex items-center gap-2.5 flex-wrap">
                              <h4 className="text-base font-bold text-slate-900 dark:text-slate-100">{proj.title}</h4>
                              <Badge className="text-xs capitalize font-normal px-2 bg-indigo-50 border border-indigo-100 text-indigo-700">
                                {proj.track.replace("_", " ")}
                              </Badge>
                            </div>
                            <div className="text-sm text-slate-500 mt-1 flex items-center gap-1.5">
                              Suggested Mentor: <strong className="text-slate-700 dark:text-slate-200">{ment.full_name}</strong>
                              <span className="text-slate-300">|</span>
                              <span className="text-xs text-slate-400">{ment.email}</span>
                            </div>
                          </div>

                          {/* Compatibility Badge */}
                          <div className={`text-xs font-bold border rounded-full px-3 py-1 flex items-center gap-1 ${getScoreColor(score)}`}>
                            <Star className="w-3.5 h-3.5 fill-current" />
                            {score}% Compatibility
                          </div>
                        </div>

                        {/* Match reasoning */}
                        {suggestion.match_reasoning && (
                          <div className="mt-3.5 text-sm bg-indigo-50/20 dark:bg-slate-900/50 p-3 rounded-lg border border-indigo-100/40">
                            <strong className="text-xs text-indigo-600 uppercase tracking-wide block mb-1">Matching Reasoning</strong>
                            <p className="text-slate-700 dark:text-slate-300 leading-relaxed italic">"{suggestion.match_reasoning}"</p>
                          </div>
                        )}

                        {/* Action buttons */}
                        <div className="mt-4 flex justify-end gap-2 border-t border-slate-100/60 pt-3.5">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-rose-600 hover:text-rose-700 hover:bg-rose-50"
                            disabled={actionLoadingId === suggestion.id}
                            onClick={() => handleReject(suggestion.id, true)}
                          >
                            Dismiss Suggestion
                          </Button>
                          <Button
                            size="sm"
                            className="bg-emerald-600 text-white hover:bg-emerald-700 flex items-center gap-1 font-semibold"
                            disabled={actionLoadingId === suggestion.id}
                            onClick={() => handleApprove(suggestion.id)}
                          >
                            {actionLoadingId === suggestion.id ? (
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            ) : (
                              <Check className="w-4 h-4" />
                            )}
                            Confirm Match
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
