"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { BrainCircuit, Search, FileCheck, Landmark } from "lucide-react";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createIpRecord } from "./actions";

type Project = { id: string; title: string };
type IPRecord = {
  id: string;
  type: string;
  filing_date: string | null;
  registration_number: string | null;
  status: string;
  jurisdiction: string | null;
  projects: { title: string } | null;
};

export function IPClient({ ipRecords, projects }: { ipRecords: IPRecord[], projects: Project[] }) {
  const [scanOpen, setScanOpen] = useState(false);
  const [selectedProjectId, setSelectedProjectId] = useState<string>("");
  const [isScanning, setIsScanning] = useState(false);
  const [scanResult, setScanResult] = useState<any>(null);

  const [addOpen, setAddOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [newIp, setNewIp] = useState({
    project_id: "",
    type: "Patent",
    status: "pending",
    jurisdiction: "Uganda (URSB)",
    filing_date: "",
    registration_number: ""
  });

  const handleScan = async () => {
    if (!selectedProjectId) {
      toast.error("Please select a project to scan.");
      return;
    }

    setIsScanning(true);
    setScanResult(null);

    try {
      const res = await fetch("/api/ai/ip-scan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectId: selectedProjectId })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to scan IP landscape");

      setScanResult(data.scanResult);
      toast.success("IP Scan completed!");
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setIsScanning(false);
    }
  };

  const handleAddIp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newIp.project_id) {
      toast.error("Please select a project.");
      return;
    }
    
    setIsSubmitting(true);
    try {
      await createIpRecord(newIp);
      toast.success("IP record created successfully");
      setAddOpen(false);
      setNewIp({ ...newIp, project_id: "", filing_date: "", registration_number: "" });
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">IP Tracking Dashboard</h1>
          <p className="text-muted-foreground mt-1">
            Manage intellectual property records, patent filings, and run AI landscape scans.
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => setScanOpen(true)} variant="secondary" className="gap-2">
            <BrainCircuit className="w-4 h-4" />
            AI IP Scan
          </Button>
          <Button onClick={() => setAddOpen(true)} className="gap-2">
            <FileCheck className="w-4 h-4" />
            Add IP Record
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>IP Filings & Records</CardTitle>
          <CardDescription>All IP registrations associated with innovator projects.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Project</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Jurisdiction</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Filing Date</TableHead>
                <TableHead>Registration No.</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {ipRecords.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                    No IP records found. Add one or run an AI scan to get started.
                  </TableCell>
                </TableRow>
              ) : (
                ipRecords.map((ip) => (
                  <TableRow key={ip.id}>
                    <TableCell className="font-medium">{ip.projects?.title || "Unknown Project"}</TableCell>
                    <TableCell>{ip.type}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Landmark className="w-3 h-3 text-muted-foreground" />
                        {ip.jurisdiction || "-"}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={
                        ip.status === "granted" ? "default" :
                        ip.status === "rejected" ? "destructive" :
                        "outline"
                      }>
                        {ip.status}
                      </Badge>
                    </TableCell>
                    <TableCell>{ip.filing_date ? new Date(ip.filing_date).toLocaleDateString() : "-"}</TableCell>
                    <TableCell className="font-mono text-sm">{ip.registration_number || "-"}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* AI Scan Dialog */}
      <Dialog open={scanOpen} onOpenChange={setScanOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <BrainCircuit className="w-5 h-5 text-primary" />
              AI IP Landscape Scanner
            </DialogTitle>
            <DialogDescription>
              Select a project to analyze its concept against potential prior art and get IP strategy recommendations.
            </DialogDescription>
          </DialogHeader>

          {!scanResult && (
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label>Target Project</Label>
                <Select value={selectedProjectId} onValueChange={(val) => setSelectedProjectId(val || "")}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select an active project..." />
                  </SelectTrigger>
                  <SelectContent>
                    {projects.map((p) => (
                      <SelectItem key={p.id} value={p.id}>{p.title}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}

          {scanResult && (
            <div className="space-y-4 py-4">
              <div className="bg-secondary/20 p-4 rounded-lg border">
                <h4 className="font-semibold mb-2 flex items-center gap-2">
                  <Search className="w-4 h-4 text-blue-500" />
                  Potential IP Types
                </h4>
                <div className="flex gap-2 flex-wrap">
                  {scanResult.potentialIpTypes?.map((t: string) => (
                    <Badge key={t} variant="secondary">{t}</Badge>
                  ))}
                </div>
              </div>
              
              <div className="bg-secondary/20 p-4 rounded-lg border">
                <h4 className="font-semibold mb-2 text-amber-600">Prior Art Risks</h4>
                <p className="text-sm text-muted-foreground">{scanResult.priorArtRisks}</p>
              </div>

              <div className="bg-secondary/20 p-4 rounded-lg border">
                <h4 className="font-semibold mb-2 text-green-600">Recommended Strategy</h4>
                <p className="text-sm text-muted-foreground">{scanResult.recommendedStrategy}</p>
              </div>
            </div>
          )}

          <DialogFooter>
            {!scanResult ? (
              <Button onClick={handleScan} disabled={isScanning || !selectedProjectId} className="gap-2">
                {isScanning ? (
                  <>Scanning Landscape...</>
                ) : (
                  <>
                    <Search className="w-4 h-4" />
                    Run Scan
                  </>
                )}
              </Button>
            ) : (
              <Button onClick={() => setScanOpen(false)}>Done</Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add IP Dialog */}
      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add IP Record</DialogTitle>
            <DialogDescription>Manually record a filed or granted intellectual property.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleAddIp} className="space-y-4 py-4">
            <div className="grid gap-2">
              <Label>Project</Label>
              <Select value={newIp.project_id} onValueChange={(val) => setNewIp({...newIp, project_id: val || ""})}>
                <SelectTrigger>
                  <SelectValue placeholder="Select project" />
                </SelectTrigger>
                <SelectContent>
                  {projects.map((p) => (
                    <SelectItem key={p.id} value={p.id}>{p.title}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>IP Type</Label>
                <Select value={newIp.type} onValueChange={(val) => setNewIp({...newIp, type: val || ""})}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Patent">Patent</SelectItem>
                    <SelectItem value="Copyright">Copyright</SelectItem>
                    <SelectItem value="Trademark">Trademark</SelectItem>
                    <SelectItem value="Utility Model">Utility Model</SelectItem>
                    <SelectItem value="Trade Secret">Trade Secret</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label>Status</Label>
                <Select value={newIp.status} onValueChange={(val) => setNewIp({...newIp, status: val || ""})}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="granted">Granted</SelectItem>
                    <SelectItem value="rejected">Rejected</SelectItem>
                    <SelectItem value="abandoned">Abandoned</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid gap-2">
              <Label>Jurisdiction / Authority</Label>
              <Input 
                value={newIp.jurisdiction} 
                onChange={(e) => setNewIp({...newIp, jurisdiction: e.target.value})} 
                placeholder="e.g. URSB, ARIPO, WIPO" 
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>Filing Date</Label>
                <Input 
                  type="date" 
                  value={newIp.filing_date} 
                  onChange={(e) => setNewIp({...newIp, filing_date: e.target.value})} 
                />
              </div>
              <div className="grid gap-2">
                <Label>Registration No.</Label>
                <Input 
                  value={newIp.registration_number} 
                  onChange={(e) => setNewIp({...newIp, registration_number: e.target.value})} 
                  placeholder="Optional" 
                />
              </div>
            </div>

            <DialogFooter className="mt-4">
              <Button type="button" variant="outline" onClick={() => setAddOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={isSubmitting}>Save Record</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
