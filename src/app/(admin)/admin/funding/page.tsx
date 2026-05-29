"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/utils/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "sonner";
import { 
  DollarSign, 
  Plus, 
  TrendingUp, 
  Coins, 
  Wallet, 
  ArrowUpRight, 
  CheckCircle2, 
  Loader2,
  RefreshCw
} from "lucide-react";
import { z } from "zod";

// Zod schemas for validation
const sourceSchema = z.object({
  name: z.string().min(3, "Name must be at least 3 characters"),
  total_budget: z.number().min(1000, "Budget must be at least 1,000"),
  currency: z.string().min(3, "Currency required"),
  contact_email: z.string().email("Invalid email address").or(z.literal("")),
});

const allocationSchema = z.object({
  project_id: z.string().uuid("Invalid project selected"),
  source_id: z.string().uuid("Invalid funding source selected"),
  total_amount: z.number().min(1000, "Allocation amount must be at least 1,000"),
  status: z.enum(["pending", "approved", "active", "completed", "suspended"]),
});

const trancheSchema = z.object({
  allocation_id: z.string().uuid("Invalid allocation selected"),
  amount: z.number().min(1000, "Tranche amount must be at least 1,000"),
  payment_method: z.enum(["mtn_momo", "airtel_money", "bank_transfer"]),
  status: z.enum(["pending", "milestone_met", "processing", "disbursed", "failed"]),
});

export default function AdminFundingPage() {
  const supabase = createClient();
  const [sources, setSources] = useState<any[]>([]);
  const [allocations, setAllocations] = useState<any[]>([]);
  const [tranches, setTranches] = useState<any[]>([]);
  const [projects, setProjects] = useState<any[]>([]);
  
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [disburseLoading, setDisburseLoading] = useState<Record<string, boolean>>({});

  // Dialog open states
  const [sourceDialogOpen, setSourceDialogOpen] = useState(false);
  const [allocDialogOpen, setAllocDialogOpen] = useState(false);
  const [trancheDialogOpen, setTrancheDialogOpen] = useState(false);

  // Form states
  const [newSource, setNewSource] = useState({
    name: "",
    total_budget: 0,
    currency: "UGX",
    contact_email: "",
  });

  const [newAlloc, setNewAlloc] = useState({
    project_id: "",
    source_id: "",
    total_amount: 0,
    status: "active" as const,
  });

  const [newTranche, setNewTranche] = useState({
    allocation_id: "",
    amount: 0,
    payment_method: "mtn_momo" as const,
    status: "pending" as const,
  });

  const fetchData = async () => {
    setRefreshing(true);
    try {
      // 1. Fetch sources
      const { data: sourcesData, error: sourcesErr } = await supabase
        .from("funding_sources")
        .select("*")
        .order("name", { ascending: true });
      if (sourcesErr) throw sourcesErr;

      // 2. Fetch allocations with joins
      const { data: allocationsData, error: allocationsErr } = await supabase
        .from("funding_allocations")
        .select("*, project:projects(title), source:funding_sources(name, currency)")
        .order("approved_at", { ascending: false });
      if (allocationsErr) throw allocationsErr;

      // 3. Fetch tranches with joins
      const { data: tranchesData, error: tranchesErr } = await supabase
        .from("funding_tranches")
        .select("*, allocation:funding_allocations(*, project:projects(title), source:funding_sources(name, currency))")
        .order("disbursed_at", { ascending: false, nullsFirst: true });
      if (tranchesErr) throw tranchesErr;

      // 4. Fetch active projects to assign allocations
      const { data: projectsData, error: projectsErr } = await supabase
        .from("projects")
        .select("id, title")
        .eq("status", "active")
        .order("title", { ascending: true });
      if (projectsErr) throw projectsErr;

      setSources(sourcesData || []);
      setAllocations(allocationsData || []);
      setTranches(tranchesData || []);
      setProjects(projectsData || []);
    } catch (err: any) {
      toast.error(`Error loading data: ${err.message}`);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Submit handlers
  const handleAddSource = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const validated = sourceSchema.parse({
        ...newSource,
        total_budget: Number(newSource.total_budget),
      });

      const { data, error } = await supabase
        .from("funding_sources")
        .insert([validated])
        .select();

      if (error) throw error;

      toast.success("Funding source added successfully!");
      setSourceDialogOpen(false);
      setNewSource({ name: "", total_budget: 0, currency: "UGX", contact_email: "" });
      fetchData();
    } catch (err: any) {
      if (err instanceof z.ZodError) {
        toast.error(err.issues[0].message);
      } else {
        toast.error(err.message || "Failed to add source");
      }
    }
  };

  const handleCreateAllocation = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const validated = allocationSchema.parse({
        ...newAlloc,
        total_amount: Number(newAlloc.total_amount),
      });

      // Get logged-in user id as approved_by
      const { data: { user } } = await supabase.auth.getUser();
      
      const { data, error } = await supabase
        .from("funding_allocations")
        .insert([{
          ...validated,
          approved_by: user?.id || null,
          approved_at: new Date().toISOString(),
        }])
        .select();

      if (error) throw error;

      toast.success("Funding allocation created successfully!");
      setAllocDialogOpen(false);
      setNewAlloc({ project_id: "", source_id: "", total_amount: 0, status: "active" });
      fetchData();
    } catch (err: any) {
      if (err instanceof z.ZodError) {
        toast.error(err.issues[0].message);
      } else {
        toast.error(err.message || "Failed to create allocation");
      }
    }
  };

  const handleCreateTranche = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const validated = trancheSchema.parse({
        ...newTranche,
        amount: Number(newTranche.amount),
      });

      const { data, error } = await supabase
        .from("funding_tranches")
        .insert([validated])
        .select();

      if (error) throw error;

      toast.success("Funding tranche created successfully!");
      setTrancheDialogOpen(false);
      setNewTranche({ allocation_id: "", amount: 0, payment_method: "mtn_momo", status: "pending" });
      fetchData();
    } catch (err: any) {
      if (err instanceof z.ZodError) {
        toast.error(err.issues[0].message);
      } else {
        toast.error(err.message || "Failed to create tranche");
      }
    }
  };

  // Disburse Payment Handler
  const handleDisburseTranche = async (trancheId: string) => {
    setDisburseLoading(prev => ({ ...prev, [trancheId]: true }));
    const loadingToast = toast.loading("Processing disbursement via operator networks...");
    
    try {
      const res = await fetch("/api/funding/disburse", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ trancheId }),
      });

      const result = await res.json();
      
      if (!res.ok) {
        throw new Error(result.error || "Disbursement failed");
      }

      if (result.success) {
        toast.success(`Disbursement successful! Ref: ${result.payment_ref}`, {
          id: loadingToast,
        });
      } else {
        toast.error(result.error || "Disbursement rejected by network provider", {
          id: loadingToast,
        });
      }
      fetchData();
    } catch (err: any) {
      toast.error(err.message || "An error occurred during disbursement", {
        id: loadingToast,
      });
    } finally {
      setDisburseLoading(prev => ({ ...prev, [trancheId]: false }));
    }
  };

  // Calculated Stats
  const totalBudget = sources.reduce((sum, s) => sum + Number(s.total_budget), 0);
  const totalDisbursed = sources.reduce((sum, s) => sum + Number(s.disbursed || 0), 0);
  const totalAllocated = allocations.reduce((sum, a) => sum + Number(a.total_amount), 0);
  const totalRemaining = totalBudget - totalAllocated;

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <Loader2 className="h-12 w-12 text-primary animate-spin" />
        <p className="text-muted-foreground font-semibold">Loading funding management panel...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-7xl mx-auto py-2">
      {/* Title & Actions */}
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">Funding & Disbursements</h1>
          <p className="text-sm text-muted-foreground">Manage multi-source budgets, create allocations, and disburse tranches to projects.</p>
        </div>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            onClick={fetchData} 
            disabled={refreshing}
            className="flex items-center gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
            Refresh Panel
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="shadow-sm border-slate-200 dark:border-slate-800">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Budget</CardTitle>
            <Coins className="h-4 w-4 text-slate-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">UGX {totalBudget.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground mt-1">Across {sources.length} sources</p>
          </CardContent>
        </Card>

        <Card className="shadow-sm border-slate-200 dark:border-slate-800">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Allocated</CardTitle>
            <Wallet className="h-4 w-4 text-indigo-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">UGX {totalAllocated.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground mt-1">Assigned to projects ({Math.round(totalBudget > 0 ? (totalAllocated / totalBudget) * 100 : 0)}%)</p>
          </CardContent>
        </Card>

        <Card className="shadow-sm border-slate-200 dark:border-slate-800">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Disbursed</CardTitle>
            <ArrowUpRight className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">UGX {totalDisbursed.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground mt-1">Released tranche payments ({Math.round(totalAllocated > 0 ? (totalDisbursed / totalAllocated) * 100 : 0)}%)</p>
          </CardContent>
        </Card>

        <Card className="shadow-sm border-slate-200 dark:border-slate-800">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium text-muted-foreground">Available Reserve</CardTitle>
            <TrendingUp className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-600 dark:text-amber-400">UGX {totalRemaining.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground mt-1">Unallocated grants pool</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Tabs */}
      <Tabs defaultValue="tranches" className="space-y-6">
        <TabsList className="bg-slate-100 dark:bg-slate-900 p-1 rounded-xl">
          <TabsTrigger value="tranches" className="rounded-lg">Tranche disbursements</TabsTrigger>
          <TabsTrigger value="allocations" className="rounded-lg">Project allocations</TabsTrigger>
          <TabsTrigger value="sources" className="rounded-lg">Funding sources</TabsTrigger>
        </TabsList>

        {/* Tranche Disbursements Tab */}
        <TabsContent value="tranches" className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">Milestone Tranches Releases</h3>
            
            <Dialog open={trancheDialogOpen} onOpenChange={setTrancheDialogOpen}>
              <DialogTrigger render={<Button className="bg-primary text-white font-semibold rounded-xl flex items-center gap-2" />}>
                <Plus className="h-4 w-4" />
                Create Tranche
              </DialogTrigger>
              <DialogContent className="sm:max-w-md">
                <form onSubmit={handleCreateTranche} className="space-y-4">
                  <DialogHeader>
                    <DialogTitle>Create Funding Tranche</DialogTitle>
                    <DialogDescription>
                      Assign a milestone payment tranche to an active project allocation.
                    </DialogDescription>
                  </DialogHeader>

                  <div className="space-y-3">
                    <div className="space-y-1.5">
                      <Label htmlFor="tranche-alloc">Select Project Allocation</Label>
                      <Select 
                        value={newTranche.allocation_id} 
                        onOpenChange={(open) => {
                          if (open && allocations.length > 0 && !newTranche.allocation_id) {
                            setNewTranche(prev => ({ ...prev, allocation_id: allocations[0].id }));
                          }
                        }}
                        onValueChange={(val) => setNewTranche(prev => ({ ...prev, allocation_id: val || "" }))}
                      >
                        <SelectTrigger id="tranche-alloc">
                          <SelectValue placeholder="Choose project allocation" />
                        </SelectTrigger>
                        <SelectContent>
                          {allocations.map((a) => (
                            <SelectItem key={a.id} value={a.id}>
                              {a.project?.title} ({a.source?.name})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-1.5">
                      <Label htmlFor="tranche-amount">Tranche Amount (UGX)</Label>
                      <Input 
                        id="tranche-amount" 
                        type="number" 
                        placeholder="e.g. 10000000"
                        value={newTranche.amount || ""}
                        onChange={(e) => setNewTranche(prev => ({ ...prev, amount: Number(e.target.value) }))}
                      />
                    </div>

                    <div className="space-y-1.5">
                      <Label htmlFor="tranche-method">Payment Channel</Label>
                      <Select 
                        value={newTranche.payment_method} 
                        onValueChange={(val: any) => setNewTranche(prev => ({ ...prev, payment_method: val || "mtn_momo" }))}
                      >
                        <SelectTrigger id="tranche-method">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="mtn_momo">MTN Mobile Money</SelectItem>
                          <SelectItem value="airtel_money">Airtel Money</SelectItem>
                          <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <DialogFooter>
                    <Button type="submit" className="w-full">Create Milestone Tranche</Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </div>

          <Card className="shadow-sm overflow-hidden border-slate-200 dark:border-slate-800">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Project</TableHead>
                  <TableHead>Funding Source</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Channel</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Reference</TableHead>
                  <TableHead>Released Date</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {tranches.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                      No funding tranches found.
                    </TableCell>
                  </TableRow>
                ) : (
                  tranches.map((tranche) => (
                    <TableRow key={tranche.id}>
                      <TableCell className="font-semibold text-slate-900 dark:text-slate-100 whitespace-normal max-w-[200px]">
                        {tranche.allocation?.project?.title || "Unknown Project"}
                      </TableCell>
                      <TableCell className="whitespace-normal max-w-[150px]">{tranche.allocation?.source?.name || "Unknown Source"}</TableCell>
                      <TableCell className="font-bold">
                        {tranche.allocation?.source?.currency || "UGX"} {Number(tranche.amount).toLocaleString()}
                      </TableCell>
                      <TableCell className="capitalize text-muted-foreground">
                        {tranche.payment_method?.replace("_", " ")}
                      </TableCell>
                      <TableCell>
                        <Badge className={
                          tranche.status === "disbursed"
                            ? "bg-emerald-500/10 text-emerald-600 dark:bg-emerald-950/20 dark:text-emerald-400"
                            : tranche.status === "pending"
                              ? "bg-amber-500/10 text-amber-600 dark:bg-amber-950/20 dark:text-amber-400"
                              : tranche.status === "processing"
                                ? "bg-blue-500/10 text-blue-600 dark:bg-blue-950/20 dark:text-blue-400 animate-pulse"
                                : "bg-rose-500/10 text-rose-600 dark:bg-rose-950/20 dark:text-rose-400"
                        }>
                          {tranche.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-mono text-xs">{tranche.payment_ref || "—"}</TableCell>
                      <TableCell className="text-muted-foreground">
                        {tranche.disbursed_at 
                          ? new Date(tranche.disbursed_at).toLocaleDateString()
                          : "—"
                        }
                      </TableCell>
                      <TableCell className="text-right">
                        {(tranche.status === "pending" || tranche.status === "failed") && (
                          <Button 
                            size="sm"
                            className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold rounded-lg shadow-sm"
                            onClick={() => handleDisburseTranche(tranche.id)}
                            disabled={disburseLoading[tranche.id]}
                          >
                            {disburseLoading[tranche.id] ? (
                              <>
                                <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                                Releasing...
                              </>
                            ) : (
                              "Release Payment"
                            )}
                          </Button>
                        )}
                        {tranche.status === "disbursed" && (
                          <span className="text-emerald-600 dark:text-emerald-400 text-xs font-bold inline-flex items-center gap-1">
                            <CheckCircle2 className="h-4 w-4" />
                            Settled
                          </span>
                        )}
                        {tranche.status === "processing" && (
                          <span className="text-blue-600 dark:text-blue-400 text-xs font-bold animate-pulse">
                            Processing
                          </span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>

        {/* Project Allocations Tab */}
        <TabsContent value="allocations" className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">Active Project Allocations</h3>
            
            <Dialog open={allocDialogOpen} onOpenChange={setAllocDialogOpen}>
              <DialogTrigger render={<Button className="bg-primary text-white font-semibold rounded-xl flex items-center gap-2" />}>
                <Plus className="h-4 w-4" />
                New Allocation
              </DialogTrigger>
              <DialogContent className="sm:max-w-md">
                <form onSubmit={handleCreateAllocation} className="space-y-4">
                  <DialogHeader>
                    <DialogTitle>Allocate Project Budget</DialogTitle>
                    <DialogDescription>
                      Assign a funding budget to an active innovator project from a grant source.
                    </DialogDescription>
                  </DialogHeader>

                  <div className="space-y-3">
                    <div className="space-y-1.5">
                      <Label htmlFor="alloc-project">Select Project</Label>
                      <Select 
                        value={newAlloc.project_id} 
                        onOpenChange={(open) => {
                          if (open && projects.length > 0 && !newAlloc.project_id) {
                            setNewAlloc(prev => ({ ...prev, project_id: projects[0].id }));
                          }
                        }}
                        onValueChange={(val) => setNewAlloc(prev => ({ ...prev, project_id: val || "" }))}
                      >
                        <SelectTrigger id="alloc-project">
                          <SelectValue placeholder="Choose project" />
                        </SelectTrigger>
                        <SelectContent>
                          {projects.map((p) => (
                            <SelectItem key={p.id} value={p.id}>{p.title}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-1.5">
                      <Label htmlFor="alloc-source">Select Funding Source</Label>
                      <Select 
                        value={newAlloc.source_id} 
                        onOpenChange={(open) => {
                          if (open && sources.length > 0 && !newAlloc.source_id) {
                            setNewAlloc(prev => ({ ...prev, source_id: sources[0].id }));
                          }
                        }}
                        onValueChange={(val) => setNewAlloc(prev => ({ ...prev, source_id: val || "" }))}
                      >
                        <SelectTrigger id="alloc-source">
                          <SelectValue placeholder="Choose funding source" />
                        </SelectTrigger>
                        <SelectContent>
                          {sources.map((s) => (
                            <SelectItem key={s.id} value={s.id}>
                              {s.name} ({s.currency} {Number(s.total_budget - s.disbursed).toLocaleString()} remaining)
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-1.5">
                      <Label htmlFor="alloc-amount">Allocation Amount (UGX)</Label>
                      <Input 
                        id="alloc-amount" 
                        type="number" 
                        placeholder="e.g. 50000000"
                        value={newAlloc.total_amount || ""}
                        onChange={(e) => setNewAlloc(prev => ({ ...prev, total_amount: Number(e.target.value) }))}
                      />
                    </div>

                    <div className="space-y-1.5">
                      <Label htmlFor="alloc-status">Status</Label>
                      <Select 
                        value={newAlloc.status} 
                        onValueChange={(val: any) => setNewAlloc(prev => ({ ...prev, status: val || "active" }))}
                      >
                        <SelectTrigger id="alloc-status">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="active">Active</SelectItem>
                          <SelectItem value="pending">Pending Board Approval</SelectItem>
                          <SelectItem value="completed">Completed / Closed</SelectItem>
                          <SelectItem value="suspended">Suspended</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <DialogFooter>
                    <Button type="submit" className="w-full">Create Allocation</Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </div>

          <Card className="shadow-sm overflow-hidden border-slate-200 dark:border-slate-800">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Project Title</TableHead>
                  <TableHead>Funding Source</TableHead>
                  <TableHead>Allocated Amount</TableHead>
                  <TableHead>Disbursed Amount</TableHead>
                  <TableHead>Usage Progress</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Date Approved</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {allocations.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                      No allocations created yet.
                    </TableCell>
                  </TableRow>
                ) : (
                  allocations.map((alloc) => {
                    const total = Number(alloc.total_amount);
                    const disbursed = Number(alloc.disbursed_amount || 0);
                    const percentage = total > 0 ? Math.round((disbursed / total) * 100) : 0;
                    
                    return (
                      <TableRow key={alloc.id}>
                        <TableCell className="font-semibold text-slate-900 dark:text-slate-100 whitespace-normal max-w-[200px]">
                          {alloc.project?.title || "Unknown Project"}
                        </TableCell>
                        <TableCell className="whitespace-normal max-w-[150px]">{alloc.source?.name}</TableCell>
                        <TableCell className="font-bold">
                          {alloc.source?.currency || "UGX"} {total.toLocaleString()}
                        </TableCell>
                        <TableCell className="text-emerald-600 dark:text-emerald-400 font-semibold">
                          {alloc.source?.currency || "UGX"} {disbursed.toLocaleString()}
                        </TableCell>
                        <TableCell className="min-w-[150px]">
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-muted-foreground font-semibold">{percentage}%</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge className={
                            alloc.status === "active"
                              ? "bg-indigo-500/10 text-indigo-600 dark:bg-indigo-950/20 dark:text-indigo-400"
                              : alloc.status === "pending"
                                ? "bg-amber-500/10 text-amber-600 dark:bg-amber-950/20 dark:text-amber-400"
                                : alloc.status === "completed"
                                  ? "bg-emerald-500/10 text-emerald-600 dark:bg-emerald-950/20 dark:text-emerald-400"
                                  : "bg-rose-500/10 text-rose-600 dark:bg-rose-950/20 dark:text-rose-400"
                          }>
                            {alloc.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right text-muted-foreground">
                          {alloc.approved_at 
                            ? new Date(alloc.approved_at).toLocaleDateString()
                            : "—"
                          }
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>

        {/* Funding Sources Tab */}
        <TabsContent value="sources" className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">Active Funding Budgets</h3>
            
            <Dialog open={sourceDialogOpen} onOpenChange={setSourceDialogOpen}>
              <DialogTrigger render={<Button className="bg-primary text-white font-semibold rounded-xl flex items-center gap-2" />}>
                <Plus className="h-4 w-4" />
                Add Funding Source
              </DialogTrigger>
              <DialogContent className="sm:max-w-md">
                <form onSubmit={handleAddSource} className="space-y-4">
                  <DialogHeader>
                    <DialogTitle>Add Funding Source</DialogTitle>
                    <DialogDescription>
                      Create a new multi-year innovation budget or donor fund.
                    </DialogDescription>
                  </DialogHeader>

                  <div className="space-y-3">
                    <div className="space-y-1.5">
                      <Label htmlFor="source-name">Fund Source Name</Label>
                      <Input 
                        id="source-name" 
                        placeholder="e.g. Government Innovation Fund"
                        value={newSource.name}
                        onChange={(e) => setNewSource(prev => ({ ...prev, name: e.target.value }))}
                      />
                    </div>

                    <div className="space-y-1.5">
                      <Label htmlFor="source-budget">Total Grant Budget (UGX)</Label>
                      <Input 
                        id="source-budget" 
                        type="number" 
                        placeholder="e.g. 250000000"
                        value={newSource.total_budget || ""}
                        onChange={(e) => setNewSource(prev => ({ ...prev, total_budget: Number(e.target.value) }))}
                      />
                    </div>

                    <div className="space-y-1.5">
                      <Label htmlFor="source-currency">Currency</Label>
                      <Input 
                        id="source-currency" 
                        placeholder="UGX" 
                        value={newSource.currency}
                        onChange={(e) => setNewSource(prev => ({ ...prev, currency: e.target.value }))}
                      />
                    </div>

                    <div className="space-y-1.5">
                      <Label htmlFor="source-email">Contact / Funder Email</Label>
                      <Input 
                        id="source-email" 
                        type="email" 
                        placeholder="funder@agency.com"
                        value={newSource.contact_email}
                        onChange={(e) => setNewSource(prev => ({ ...prev, contact_email: e.target.value }))}
                      />
                    </div>
                  </div>

                  <DialogFooter>
                    <Button type="submit" className="w-full">Create Funding Source</Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {sources.map((source) => {
              const total = Number(source.total_budget);
              const disbursed = Number(source.disbursed || 0);
              const remaining = total - disbursed;
              const percent = total > 0 ? Math.round((disbursed / total) * 100) : 0;
              
              return (
                <Card key={source.id} className="hover:shadow-md transition-shadow border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
                  <CardHeader className="pb-3 border-b border-slate-100 dark:border-slate-800">
                    <div className="flex justify-between items-start gap-4">
                      <div>
                        <CardTitle className="text-base font-bold line-clamp-1">{source.name}</CardTitle>
                        <CardDescription className="text-xs mt-0.5">{source.contact_email || "No contact listed"}</CardDescription>
                      </div>
                      <Badge className={source.active ? "bg-emerald-500/10 text-emerald-600 dark:bg-emerald-950/20 dark:text-emerald-400" : "bg-slate-100 text-slate-500"}>
                        {source.active ? "Active" : "Archived"}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-4 space-y-4">
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div>
                        <span className="text-muted-foreground block text-[10px]">Total Fund</span>
                        <span className="font-bold text-slate-900 dark:text-slate-100">{source.currency} {total.toLocaleString()}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground block text-[10px]">Released</span>
                        <span className="font-bold text-emerald-600 dark:text-emerald-400">{source.currency} {disbursed.toLocaleString()}</span>
                      </div>
                      <div className="col-span-2 pt-2 border-t">
                        <span className="text-muted-foreground block text-[10px]">Available Reserves</span>
                        <span className="font-extrabold text-indigo-600 dark:text-indigo-400 text-sm">{source.currency} {remaining.toLocaleString()}</span>
                      </div>
                    </div>

                    <div className="space-y-1">
                      <div className="flex justify-between text-[11px] font-semibold text-slate-500">
                        <span>Released Ratio</span>
                        <span>{percent}%</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
