import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { toast } from "sonner";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Check, Loader2, Sparkles, FileText } from "lucide-react";
import { assets, getProject, images, notifications, projects, verificationPct, type Status } from "@/lib/demo-data";
import { storySteps, wait } from "@/lib/ai";
import { AIBadge, Card, Confidence, IndiaMap, Stat, StatusBadge } from "./evidence";

export function ComingPanel({ page }: { page: string }) {
  if (page === "verify") return <Verify />;
  if (page === "analytics") return <Analytics />;
  if (page === "story") return <Story />;
  if (page === "reports") return <Reports />;
  if (page === "map") return <MapPage />;
  if (page === "notifications") return <Card>{notifications.map((n) => <div key={n.id} className="border-b py-3"><div className="font-semibold">{n.title}</div><div className="text-sm text-muted-foreground">{n.body} · {n.time}</div></div>)}</Card>;
  return <Settings />;
}

function Verify() {
  const [st, setSt] = useState<Record<string, Status>>({});
  const queue = assets.filter((a) => a.status !== "verified").slice(0, 14);
  return (
    <Card>
      <div className="overflow-x-auto"><table className="w-full text-sm">
        <thead className="text-left text-xs text-muted-foreground"><tr><th className="p-2">Media</th><th>Project</th><th>AI classification</th><th>Confidence</th><th>Source</th><th>Date</th><th>Status</th><th>Actions</th></tr></thead>
        <tbody>{queue.map((a) => { const s = st[a.id] ?? a.status; const set = (v: Status) => { setSt({ ...st, [a.id]: v }); toast.success(`${a.id} → ${v}`); }; return (
          <tr key={a.id} className="border-t">
            <td className="p-2"><Link to="/media/$id" params={{ id: a.id }}><img src={a.src} alt={a.title} className="h-12 w-16 rounded object-cover" /></Link></td>
            <td>{getProject(a.projectId)?.name}</td><td>{a.scene}</td><td><Confidence value={a.confidence} /></td><td>{a.uploader}</td><td className="font-mono text-xs">{a.date}</td>
            <td><StatusBadge status={s} /></td>
            <td className="space-x-1 whitespace-nowrap"><button onClick={() => set("verified")} className="rounded bg-success px-2 py-1 text-xs font-semibold text-primary-foreground">Verify</button><button onClick={() => set("review")} className="rounded border px-2 py-1 text-xs">Review</button><button onClick={() => set("rejected")} className="rounded border px-2 py-1 text-xs text-destructive">Reject</button></td>
          </tr>); })}</tbody>
      </table></div>
    </Card>
  );
}

function Analytics() {
  const data = projects.map((p) => ({ name: p.name.split(" ")[0], verified: verificationPct(p.id), score: p.impactScore }));
  return (
    <>
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <Stat label="Hectares restored" value="126" delta="+37% vegetation" /><Stat label="People with water access" value="9,340" /><Stat label="CO₂ offset" value="740 t" /><Stat label="Waste recovered" value="134 t" />
      </div>
      <Card title="Verification & impact score by project" className="mt-6"><div className="h-72"><ResponsiveContainer><BarChart data={data}><CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} /><XAxis dataKey="name" fontSize={12} /><YAxis fontSize={12} /><Tooltip /><Bar dataKey="verified" fill="var(--chart-1)" radius={4} /><Bar dataKey="score" fill="var(--chart-4)" radius={4} /></BarChart></ResponsiveContainer></div></Card>
    </>
  );
}

function Story() {
  const [step, setStep] = useState(-1);
  const done = step >= storySteps.length;
  async function go() { for (let i = 0; i <= storySteps.length; i++) { setStep(i); await wait(600); } }
  if (step < 0) return <Card><div className="py-10 text-center"><Sparkles className="mx-auto h-10 w-10 text-primary" /><h2 className="mt-3 text-2xl">GreenRise Restoration</h2><p className="text-muted-foreground">Let AI assemble a story from verified evidence.</p><button onClick={go} className="mt-6 rounded-lg bg-primary px-5 py-3 font-semibold text-primary-foreground">Generate Impact Story</button></div></Card>;
  if (!done) return <Card><ol className="space-y-2">{storySteps.map((s, i) => <li key={s} className="flex items-center gap-2 text-sm">{i < step ? <Check className="h-4 w-4 text-success" /> : i === step ? <Loader2 className="h-4 w-4 animate-spin text-primary" /> : <span className="h-4 w-4 rounded-full border" />}{s}</li>)}</ol></Card>;
  return (
    <div className="space-y-6">
      <h2 className="text-4xl">Your evidence tells a story.</h2>
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4"><Stat label="Major changes detected" value="3" /><Stat label="Verified evidence assets" value="12" /><Stat label="Locations" value="4" /><Stat label="Evidence confidence" value="87%" /></div>
      <div className="grid gap-3 md:grid-cols-2"><img src={images.greenBefore} alt="Before" className="rounded-xl" /><img src={images.greenAfter} alt="After" className="rounded-xl" /></div>
      <Card title="Impact summary" action={<AIBadge label="AI-generated · demo" />}><p>Between January and August 2026, GreenRise Restoration transformed 126 hectares of degraded land near Chennai. Verified imagery shows vegetation cover up 37%, three kilometres of irrigation channel restored, and 41,200 native saplings established by 220 community stewards.</p></Card>
      <Link to="/reports" className="inline-block rounded-lg bg-navy px-5 py-3 font-semibold text-navy-foreground">Create Report</Link>
    </div>
  );
}

function Reports() {
  const [sections, setSections] = useState(["Executive summary", "Before / after evidence", "Impact metrics", "Evidence provenance"]);
  const all = ["Executive summary", "Before / after evidence", "Impact metrics", "Timeline", "Map", "Evidence provenance", "Beneficiary stories"];
  return (
    <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
      <Card title="Sections">{all.map((s) => <label key={s} className="flex items-center gap-2 py-1 text-sm"><input type="checkbox" className="accent-primary" checked={sections.includes(s)} onChange={() => setSections(sections.includes(s) ? sections.filter((x) => x !== s) : [...sections, s])} />{s}</label>)}
        <button onClick={() => toast.success("PDF exported (demo)")} className="mt-4 w-full rounded-lg bg-primary py-2 text-sm font-semibold text-primary-foreground">Export PDF</button></Card>
      <div className="rounded-xl border bg-card p-10 shadow-sm">
        <div className="text-xs uppercase tracking-widest text-primary">Impact Report · Q3 2026</div><h2 className="mt-2 text-4xl">GreenRise Restoration</h2>
        {sections.map((s) => <div key={s} className="mt-6 border-t pt-4"><h3 className="flex items-center gap-2 text-xl"><FileText className="h-4 w-4 text-primary" />{s}</h3>
          {s.startsWith("Before") ? <div className="mt-3 grid grid-cols-2 gap-2"><img src={images.greenBefore} alt="Before" className="rounded" /><img src={images.greenAfter} alt="After" className="rounded" /></div> : <p className="mt-2 text-sm text-muted-foreground">Auto-drafted from 12 verified assets with full traceability to originals.</p>}</div>)}
      </div>
    </div>
  );
}

function MapPage() {
  const [active, setActive] = useState(projects[0]!.id);
  const p = getProject(active)!;
  return (
    <div className="grid gap-6 md:grid-cols-[minmax(0,420px)_1fr]">
      <IndiaMap points={projects.map((x) => ({ id: x.id, x: x.coords[0], y: x.coords[1], label: x.name }))} active={active} onSelect={setActive} />
      <Card title={p.name}><img src={p.cover} alt={p.name} className="rounded-lg" /><p className="mt-3 text-sm text-muted-foreground">{p.location} · {verificationPct(p.id)}% verified</p><Link to="/projects/$id" params={{ id: p.id }} className="mt-3 inline-block text-sm font-semibold text-primary">Open workspace →</Link></Card>
    </div>
  );
}

function Settings() {
  return (
    <div className="grid gap-6 md:grid-cols-2">
      <Card title="Team & roles">{[["Abinisha A S", "Admin"], ["Priya Raman", "Program Manager"], ["Sneha Iyer", "Field Reviewer"], ["Arjun Mehta", "Viewer"]].map(([n, r]) => <div key={n} className="flex justify-between border-b py-2 text-sm">{n}<span className="text-muted-foreground">{r}</span></div>)}</Card>
      <Card title="Integrations">{[["Cloudinary media storage", "Demo"], ["Vision AI provider", "Demo"], ["Embeddings / semantic search", "Demo"]].map(([n, s]) => <div key={n} className="flex justify-between border-b py-2 text-sm">{n}<span className="rounded bg-muted px-2 text-xs">{s}</span></div>)}</Card>
    </div>
  );
}
