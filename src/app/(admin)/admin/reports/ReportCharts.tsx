"use client";

import { Bar, BarChart, CartesianGrid, XAxis, YAxis, Tooltip as RechartsTooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from "recharts";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Bot, FileText, Loader2 } from "lucide-react";

const COLORS = ['#10b981', '#3b82f6', '#8b5cf6', '#f59e0b', '#ef4444', '#64748b'];

export default function ReportCharts({ 
  stageData, 
  sdgData, 
  rawStats 
}: { 
  stageData: any[], 
  sdgData: any[],
  rawStats: any
}) {
  const [generating, setGenerating] = useState(false);
  const [report, setReport] = useState<string | null>(null);

  const handleGenerateReport = async () => {
    setGenerating(true);
    try {
      const res = await fetch("/api/ai/generate-report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ stats: rawStats })
      });
      const data = await res.json();
      if (data.report) {
        setReport(data.report);
      } else {
        alert("Error generating report");
      }
    } catch (e) {
      console.error(e);
      alert("Failed to connect to AI service");
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Action Bar */}
      <div className="flex justify-end">
        <Button onClick={handleGenerateReport} disabled={generating} className="bg-indigo-600 hover:bg-indigo-700 text-white">
          {generating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Bot className="mr-2 h-4 w-4" />}
          {generating ? "Generating via Gemini..." : "Generate Funder Narrative (AI)"}
        </Button>
      </div>

      {/* AI Report Output */}
      {report && (
        <Card className="border-indigo-200 bg-indigo-50/30">
          <CardHeader>
            <CardTitle className="flex items-center text-indigo-800">
              <FileText className="mr-2 h-5 w-5" /> Executive Summary (Auto-Generated)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="prose prose-sm max-w-none text-indigo-950 whitespace-pre-wrap">
              {report}
            </div>
            <div className="mt-4 flex justify-end">
              <Button variant="outline" size="sm" onClick={() => navigator.clipboard.writeText(report)}>Copy to Clipboard</Button>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pipeline Distribution Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Innovation Pipeline</CardTitle>
            <CardDescription>Number of projects in each stage-gate.</CardDescription>
          </CardHeader>
          <CardContent className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stageData} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} />
                <XAxis type="number" />
                <YAxis dataKey="name" type="category" width={120} tick={{fontSize: 12}} />
                <RechartsTooltip cursor={{fill: 'rgba(0,0,0,0.05)'}} />
                <Bar dataKey="count" fill="#3b82f6" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* SDG Distribution Chart */}
        <Card>
          <CardHeader>
            <CardTitle>SDG Alignment</CardTitle>
            <CardDescription>Distribution of projects by UN Sustainable Development Goals.</CardDescription>
          </CardHeader>
          <CardContent className="h-[300px] flex items-center justify-center">
            {sdgData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={sdgData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={2}
                    dataKey="count"
                    nameKey="name"
                    labelLine={false}
                  >
                    {sdgData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <RechartsTooltip />
                  <Legend verticalAlign="bottom" height={36} iconType="circle" />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-muted-foreground text-sm">Not enough SDG data to display.</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
