"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/utils/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Coins, Plus, TrendingUp, Loader2 } from "lucide-react";
import { Progress } from "@/components/ui/progress";

export default function AdminFundingDashboard() {
  const supabase = createClient();
  const [sources, setSources] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [updateOpen, setUpdateOpen] = useState(false);
  const [selectedSource, setSelectedSource] = useState<any>(null);

  const [newSource, setNewSource] = useState({
    name: "",
    total_budget: "",
    currency: "UGX",
    contact_email: "",
  });

  const [updateAmount, setUpdateAmount] = useState("");

  const fetchData = async () => {
    try {
      const { data, error } = await supabase
        .from("funding_sources")
        .select("*")
        .order("name");
      if (error) throw error;
      setSources(data || []);
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const { error } = await supabase
        .from("funding_sources")
        .insert([{
          name: newSource.name,
          total_budget: Number(newSource.total_budget),
          currency: newSource.currency,
          contact_email: newSource.contact_email,
        }]);
      if (error) throw error;
      toast.success("Funding track added.");
      setDialogOpen(false);
      fetchData();
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSource) return;
    try {
      const { error } = await supabase
        .from("funding_sources")
        .update({ disbursed: Number(updateAmount) })
        .eq("id", selectedSource.id);
      if (error) throw error;
      toast.success("Disbursed amount updated.");
      setUpdateOpen(false);
      fetchData();
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const totalBudget = sources.reduce((sum, s) => sum + Number(s.total_budget), 0);
  const totalDisbursed = sources.reduce((sum, s) => sum + Number(s.disbursed || 0), 0);

  if (loading) return <div className="p-8 text-center"><Loader2 className="animate-spin mx-auto h-8 w-8 text-primary" /></div>;

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Funding Tracks</h1>
          <p className="text-muted-foreground">Monitor innovation grants and budget tracking.</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button><Plus className="h-4 w-4 mr-2"/> Add Track</Button>
          </DialogTrigger>
          <DialogContent>
            <form onSubmit={handleAdd} className="space-y-4">
              <DialogHeader><DialogTitle>New Funding Track</DialogTitle></DialogHeader>
              <div className="space-y-2">
                <Label>Name</Label>
                <Input required value={newSource.name} onChange={e => setNewSource({...newSource, name: e.target.value})} />
              </div>
              <div className="space-y-2">
                <Label>Total Budget (UGX)</Label>
                <Input required type="number" value={newSource.total_budget} onChange={e => setNewSource({...newSource, total_budget: e.target.value})} />
              </div>
              <DialogFooter><Button type="submit">Create</Button></DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Pool</CardTitle>
            <Coins className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">UGX {totalBudget.toLocaleString()}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Disbursed</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-600">UGX {totalDisbursed.toLocaleString()}</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {sources.map(s => {
          const budget = Number(s.total_budget);
          const disbursed = Number(s.disbursed || 0);
          const pct = budget > 0 ? (disbursed / budget) * 100 : 0;
          return (
            <Card key={s.id}>
              <CardHeader>
                <CardTitle className="text-lg">{s.name}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>Disbursed: {s.currency} {disbursed.toLocaleString()}</span>
                    <span>{pct.toFixed(1)}%</span>
                  </div>
                  <Progress value={pct} className="h-2" />
                  <div className="text-xs text-muted-foreground mt-1">Total: {s.currency} {budget.toLocaleString()}</div>
                </div>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="w-full"
                  onClick={() => {
                    setSelectedSource(s);
                    setUpdateAmount(s.disbursed?.toString() || "0");
                    setUpdateOpen(true);
                  }}
                >
                  Update Disbursed Amount
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Dialog open={updateOpen} onOpenChange={setUpdateOpen}>
        <DialogContent>
          <form onSubmit={handleUpdate} className="space-y-4">
            <DialogHeader>
              <DialogTitle>Update Disbursement for {selectedSource?.name}</DialogTitle>
            </DialogHeader>
            <div className="space-y-2">
              <Label>Disbursed Amount (UGX)</Label>
              <Input required type="number" value={updateAmount} onChange={e => setUpdateAmount(e.target.value)} />
            </div>
            <DialogFooter>
              <Button type="submit">Save Update</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
