import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { PageHeader } from "@/components/app-shell";
import { Card, Stat } from "@/components/evidence";
import { getAnalytics } from "@/lib/api";

export const Route = createFileRoute("/_workspace/analytics")({ component: Page });
const COLORS = ["#0f766e", "#f59e0b", "#ef4444", "#64748b", "#2563eb"];
const labelize = (value: string) => value.replaceAll("_", " ").replace(/\b\w/g, (letter) => letter.toUpperCase());

function Page() {
  const [data, setData] = useState<any>();
  const [error, setError] = useState("");
  useEffect(() => { getAnalytics().then(setData).catch((e: Error) => setError(e.message)); }, []);
  if (error) return <><PageHeader title="Impact Analytics" subtitle="Database-backed evidence coverage and review analytics." /><p className="rounded-lg border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">{error}</p></>;
  if (!data) return <><PageHeader title="Impact Analytics" subtitle="Database-backed evidence coverage and review analytics." /><p className="text-muted-foreground">Loading analytics…</p></>;
  const verification = Object.entries(data.verification || {}).map(([name, value]) => ({ name: labelize(name), value }));
  const analysis = Object.entries(data.analysis || {}).map(([name, value]) => ({ name: labelize(name), value }));
  const projects = (data.projectEvidence || []).map((item: any) => ({ name: item.name.length > 18 ? `${item.name.slice(0, 18)}…` : item.name, assets: item.assets, verified: item.verified || 0 }));
  const tags = (data.tagDistribution || []).slice(0, 8);
  return <><PageHeader title="Impact Analytics" subtitle="A live view of evidence coverage, verification, and analysis status from PostgreSQL." />
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4"><Stat label="Projects" value={String(data.evidenceCoverage.projects)} /><Stat label="Evidence assets" value={String(data.evidenceCoverage.media)} /><Stat label="Human reviewed" value={String(data.evidenceCoverage.verified)} /><Stat label="Evidence gaps" value={String(data.evidenceGaps?.length || 0)} /></div>
      <div className="grid gap-6 lg:grid-cols-2">
        <Card title="Verification funnel"><div className="h-64"><ResponsiveContainer width="100%" height="100%"><PieChart><Pie data={verification} dataKey="value" nameKey="name" innerRadius={58} outerRadius={88} paddingAngle={3}>{verification.map((item, index) => <Cell key={item.name} fill={COLORS[index % COLORS.length]} />)}</Pie><Tooltip /></PieChart></ResponsiveContainer></div><div className="flex flex-wrap gap-3 text-xs">{verification.map((item, index) => <span key={item.name} className="inline-flex items-center gap-1.5"><i className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }} />{item.name}: {item.value as number}</span>)}</div></Card>
        <Card title="AI analysis status"><div className="h-64"><ResponsiveContainer width="100%" height="100%"><BarChart data={analysis} layout="vertical" margin={{ left: 10, right: 20 }}><CartesianGrid strokeDasharray="3 3" horizontal={false} /><XAxis type="number" allowDecimals={false} /><YAxis dataKey="name" type="category" width={100} tick={{ fontSize: 11 }} /><Tooltip /><Bar dataKey="value" fill="#0f766e" radius={[0, 5, 5, 0]} /></BarChart></ResponsiveContainer></div></Card>
        <Card title="Evidence by project"><div className="h-64"><ResponsiveContainer width="100%" height="100%"><BarChart data={projects} margin={{ left: 0, right: 10 }}><CartesianGrid strokeDasharray="3 3" vertical={false} /><XAxis dataKey="name" tick={{ fontSize: 10 }} /><YAxis allowDecimals={false} /><Tooltip /><Bar dataKey="assets" name="Assets" fill="#2563eb" radius={[5, 5, 0, 0]} /><Bar dataKey="verified" name="Verified" fill="#0f766e" radius={[5, 5, 0, 0]} /></BarChart></ResponsiveContainer></div></Card>
        <Card title="Most common evidence tags"><div className="space-y-3">{tags.length ? tags.map((item: any, index: number) => <div key={item.tag}><div className="mb-1 flex justify-between text-sm"><span>{item.tag}</span><strong>{item.count}</strong></div><div className="h-2 rounded-full bg-muted"><div className="h-full rounded-full" style={{ width: `${Math.min(100, (item.count / Math.max(tags[0].count, 1)) * 100)}%`, backgroundColor: COLORS[index % COLORS.length] }} /></div></div>) : <p className="text-sm text-muted-foreground">No analyzed tags are available yet.</p>}</div></Card>
      </div>
      <Card title="Evidence gaps"><div className="grid gap-3 md:grid-cols-2">{(data.evidenceGaps || []).map((gap: any) => <div key={gap.id || gap.title} className="rounded-lg border p-3"><div className="flex justify-between gap-3 text-sm font-medium"><span>{gap.title}</span><span className="text-warning">{gap.status || "Needs evidence"}</span></div><p className="mt-1 text-xs text-muted-foreground">{gap.projectName || "Project"} · {gap.supportingAssetCount || 0} supporting assets</p></div>)}</div>{!data.evidenceGaps?.length && <p className="text-sm text-muted-foreground">All current evidence requirements have supporting assets.</p>}</Card>
    </div>
  </>;
}
