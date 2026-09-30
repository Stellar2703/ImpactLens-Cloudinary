import { useEffect, useState } from "react";
import { FileText, Loader2, Plus, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { getProjects, getReports, generateReport, updateReport, type Report } from "@/lib/api";
import type { Project } from "@/lib/demo-data";
import { Card, Stat } from "./evidence";
import { Link } from "@tanstack/react-router";

export function ReportsPanel() {
  const [reports, setReports] = useState<Report[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [selected, setSelected] = useState<Report | null>(null);
  const [projectId, setProjectId] = useState("");
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [editing, setEditing] = useState(false);
  const [draftSummary, setDraftSummary] = useState("");

  async function load() {
    setLoading(true);
    try {
      const [nextReports, nextProjects] = await Promise.all([getReports(), getProjects()]);
      setReports(nextReports);
      setProjects(nextProjects);
      setProjectId((current) => current || nextProjects[0]?.id || "");
      setSelected((current) => {
        const next = current ? nextReports.find((report) => report.id === current.id) || null : nextReports[0] || null;
        setDraftSummary(next?.summary || "");
        return next;
      });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to load reports");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { void load(); }, []);

  async function createReport() {
    if (!projectId) return;
    setGenerating(true);
    try {
      const report = await generateReport({ projectId, type: "impact" });
      setReports((current) => [report, ...current]);
      setSelected(report);
      setDraftSummary(report.summary || "");
      toast.success("Report generated from verified evidence");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to generate report");
    } finally {
      setGenerating(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
        <Stat label="Reports" value={loading ? "—" : String(reports.length)} />
        <Stat label="Published" value={loading ? "—" : String(reports.filter((report) => report.status === "published").length)} />
        <Stat label="Projects covered" value={loading ? "—" : String(new Set(reports.map((report) => report.projectId)).size)} />
      </div>
      <div className="grid gap-6 lg:grid-cols-[320px_1fr]">
        <Card title="Reports" action={<button aria-label="Refresh reports" onClick={() => void load()} className="rounded p-1 hover:bg-muted"><RefreshCw className="h-4 w-4" /></button>}>
          <div className="mb-4 space-y-2">
            <select value={projectId} onChange={(event) => setProjectId(event.target.value)} className="w-full rounded-md border bg-background px-3 py-2 text-sm">
              <option value="">Select a project</option>
              {projects.map((project) => <option key={project.id} value={project.id}>{project.name}</option>)}
            </select>
            <button onClick={() => void createReport()} disabled={!projectId || generating} className="flex w-full items-center justify-center gap-2 rounded-md bg-primary px-3 py-2 text-sm font-semibold text-primary-foreground disabled:opacity-50">
              {generating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />} Generate report
            </button>
          </div>
          <div className="space-y-1">
            {reports.map((report) => <button key={report.id} onClick={() => setSelected(report)} className={`w-full rounded-md p-3 text-left ${selected?.id === report.id ? "bg-muted" : "hover:bg-muted/60"}`}>
              <div className="flex items-start gap-2"><FileText className="mt-0.5 h-4 w-4 text-primary" /><span className="min-w-0"><span className="block truncate text-sm font-semibold">{report.title}</span><span className="text-xs text-muted-foreground">{report.projectName} · {report.date}</span></span></div>
            </button>)}
            {!loading && reports.length === 0 && <p className="py-6 text-center text-sm text-muted-foreground">No reports yet. Generate one from a project.</p>}
          </div>
        </Card>
        <Card title={selected?.title || "Report preview"}>
          {selected ? <div className="space-y-5">
            <div className="flex flex-wrap items-center justify-between gap-2 text-sm text-muted-foreground"><span>{selected.projectName} · {selected.date}</span><span className="rounded-full bg-success/15 px-2 py-1 text-xs font-semibold text-success">{selected.status}</span></div>
            {editing ? <textarea value={draftSummary} onChange={(event) => setDraftSummary(event.target.value)} className="min-h-28 w-full rounded-md border bg-background p-3 text-sm" /> : <p className="text-sm leading-6">{selected.summary || "This report is ready for review."}</p>}
            <div className="grid gap-3 sm:grid-cols-2">{(selected.statistics || []).map((stat) => <div key={stat.label} className="rounded-lg border p-3"><div className="text-xs text-muted-foreground">{stat.label}</div><div className="mt-1 text-xl font-semibold">{stat.value}</div>{stat.change && <div className="text-xs text-success">{stat.change}</div>}</div>)}</div>
            <div className="flex flex-wrap gap-2 text-xs">
              {(selected.sourceAssets || selected.selectedEvidence || []).map((sourceId) => <Link key={sourceId} to="/media/$id" params={{ id: sourceId }} className="rounded-md border px-2 py-1 text-primary hover:bg-muted">Open evidence {sourceId}</Link>)}
            </div>
            {!!selected.limitations?.length && <div className="rounded-lg border border-warning/30 bg-warning/5 p-3 text-xs text-muted-foreground"><strong>Limitations:</strong> {selected.limitations.join(" ")}</div>}
            <div className="flex gap-2">
              {editing ? <button onClick={async () => { try { const updated = await updateReport(selected.id, { summary: draftSummary, status: "review" }); setSelected(updated); setReports((current) => current.map((report) => report.id === updated.id ? updated : report)); setEditing(false); toast.success("Report saved"); } catch (error) { toast.error(error instanceof Error ? error.message : "Unable to save report"); } }} className="rounded-md bg-primary px-3 py-2 text-sm font-semibold text-primary-foreground">Save report</button> : <button onClick={() => setEditing(true)} className="rounded-md border px-3 py-2 text-sm font-semibold">Edit report</button>}
              <button onClick={() => window.print()} className="rounded-md border px-3 py-2 text-sm font-semibold">Print / export</button>
            </div>
          </div> : <p className="text-sm text-muted-foreground">Select a report to preview it.</p>}
        </Card>
      </div>
    </div>
  );
}
