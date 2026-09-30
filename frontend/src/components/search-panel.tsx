import { useEffect, useState } from "react";
import { useSearch } from "@tanstack/react-router";
import { Search, ExternalLink, Sparkles } from "lucide-react";
import { getProjects, searchMedia } from "@/lib/api";
import type { Project } from "@/lib/demo-data";
import { AssetCard, AIBadge } from "./evidence";

const examples = ["Find tree planting evidence", "Show vegetation near infrastructure", "Find flood-damaged roads"];

export function SearchPanel() {
  const { q: initial } = useSearch({ from: "/_workspace/search" });
  const [q, setQ] = useState(initial || "");
  const [run, setRun] = useState(initial || "");
  const [projects, setProjects] = useState<Project[]>([]);
  const [projectId, setProjectId] = useState("all");
  const [type, setType] = useState("all");
  const [verificationStatus, setVerificationStatus] = useState("all");
  const [date, setDate] = useState("");
  const [results, setResults] = useState<Array<{ asset: any; matchScore: number; matchReason: string }>>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => { getProjects().then(setProjects).catch((err: Error) => setError(err.message)); }, []);
  useEffect(() => {
    if (!run.trim()) { setResults([]); return; }
    setLoading(true);
    searchMedia(run, { projectId, type, verificationStatus, date })
      .then(setResults).catch((err: Error) => setError(err.message)).finally(() => setLoading(false));
  }, [run, projectId, type, verificationStatus, date]);

  const submit = (value = q) => { setError(""); setQ(value); setRun(value); };
  return <div>
    <form onSubmit={(event) => { event.preventDefault(); submit(); }} className="relative">
      <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
      <input value={q} onChange={(event) => setQ(event.target.value)} placeholder="Ask anything about your field evidence..." className="h-16 w-full rounded-xl border bg-card pl-12 pr-28 text-base outline-none focus:ring-2 focus:ring-ring" />
      <button className="absolute right-2 top-2 h-12 rounded-lg bg-primary px-5 text-sm font-semibold text-primary-foreground">Search</button>
    </form>
    <div className="mt-3 flex flex-wrap gap-2">{examples.map((example) => <button key={example} onClick={() => submit(example)} className="rounded-full border bg-card px-3 py-1.5 text-xs hover:bg-muted">{example}</button>)}</div>
    <div className="mt-6 grid gap-3 rounded-xl border bg-card p-4 md:grid-cols-4">
      <select aria-label="Project" value={projectId} onChange={(event) => setProjectId(event.target.value)} className="rounded-lg border bg-background px-3 py-2 text-sm"><option value="all">All projects</option>{projects.map((project) => <option key={project.id} value={project.id}>{project.name}</option>)}</select>
      <select aria-label="Media type" value={type} onChange={(event) => setType(event.target.value)} className="rounded-lg border bg-background px-3 py-2 text-sm"><option value="all">All media types</option><option value="image">Images</option><option value="video">Videos</option></select>
      <select aria-label="Verification status" value={verificationStatus} onChange={(event) => setVerificationStatus(event.target.value)} className="rounded-lg border bg-background px-3 py-2 text-sm"><option value="all">All verification statuses</option><option value="confirmed">Verified</option><option value="needs_inspection">Needs inspection</option><option value="false_positive">Rejected</option><option value="pending">Awaiting review</option></select>
      <input aria-label="Date" type="date" value={date} onChange={(event) => setDate(event.target.value)} className="rounded-lg border bg-background px-3 py-2 text-sm" />
    </div>
    {run && <div className="mt-6 rounded-xl border bg-card p-4"><div className="flex items-center gap-2 text-sm font-semibold"><Sparkles className="h-4 w-4 text-primary" />Metadata-ranked semantic search <AIBadge label="AI observations" /></div><p className="mt-1 text-sm text-muted-foreground">Results are ranked from persisted scene descriptions, objects, activities, tags, signals, projects, milestones, and review status.</p></div>}
    {error && <p className="mt-4 rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">{error}</p>}
    {loading ? <p className="mt-8 text-sm text-muted-foreground">Searching persisted evidence…</p> : run && !results.length && !error ? <div className="mt-8 rounded-xl border border-dashed p-10 text-center"><p className="font-semibold">No matching evidence found</p><p className="mt-1 text-sm text-muted-foreground">Try one of the example searches or broaden the filters.</p></div> : <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{results.map((result) => <div key={result.asset.id}><AssetCard asset={result.asset} /><div className="mt-2 flex items-center justify-between gap-2 text-xs text-muted-foreground"><span><b className="text-foreground">Relevance {result.matchScore}%</b> · {result.matchReason}</span><a href={result.asset.originalUrl} target="_blank" rel="noreferrer" onClick={(event) => event.stopPropagation()} className="shrink-0 text-primary hover:underline"><ExternalLink className="inline h-3 w-3" /> Original</a></div><p className="mt-1 text-xs text-muted-foreground">AI-generated observation · Confidence {result.asset.confidence}% · {result.asset.status}</p></div>)}</div>}
  </div>;
}
