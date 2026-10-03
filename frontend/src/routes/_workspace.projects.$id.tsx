import { createFileRoute, Link, useParams } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { MapPin, Calendar, CheckCircle2, Sparkles, Image as ImageIcon, Images, Video, FileText, Plus, Link2 } from "lucide-react";
import { AssetCard, Card, IndiaMap, Stat, StatusBadge, AIBadge } from "@/components/evidence";
import { CompareView, DetectedChanges } from "@/components/compare-view";
import { createEvidenceRequirement, createMilestone, getEvidenceRequirements, getMedia, getMilestones, getProject } from "@/lib/api";
import type { EvidenceRequirement, Milestone } from "@/lib/api";
import type { Asset, Project } from "@/lib/demo-data";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_workspace/projects/$id")({
  head: () => ({
    meta: [{ title: "Project Evidence Workspace — ImpactLens" }, { name: "description", content: "Evidence, timeline and impact for an ImpactLens project." }],
  }),
  notFoundComponent: () => <div className="p-10">Project not found. <Link to="/projects" className="text-primary">All projects</Link></div>,
  component: Workspace,
});

const tabs = ["Overview", "Evidence", "Timeline", "Map", "Before / After", "Impact", "Reports"] as const;

function Workspace() {
  const { id } = Route.useParams();
  const [p, setProject] = useState<Project>();
  const [list, setList] = useState<Asset[]>([]);
  const [requirements, setRequirements] = useState<EvidenceRequirement[]>([]);
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [showRequirementForm, setShowRequirementForm] = useState(false);
  const [showMilestoneForm, setShowMilestoneForm] = useState(false);
  const [requirementTitle, setRequirementTitle] = useState("");
  const [requirementCategory, setRequirementCategory] = useState("");
  const [milestoneTitle, setMilestoneTitle] = useState("");
  const [targetDate, setTargetDate] = useState("");
  const [error, setError] = useState("");
  useEffect(() => {
    if (!id) return;
    Promise.all([getProject(id), getMedia({ projectId: id }), getEvidenceRequirements(id), getMilestones(id)])
      .then(([project, media, evidenceRequirements, projectMilestones]) => {
        setProject(project);
        setList(Array.isArray(media) ? media : []);
        setRequirements(Array.isArray(evidenceRequirements) ? evidenceRequirements : []);
        setMilestones(Array.isArray(projectMilestones) ? projectMilestones : []);
      })
      .catch((err: Error) => setError(err.message));
  }, [id]);
  const [tab, setTab] = useState<(typeof tabs)[number]>("Overview");
  if (error) return <div className="p-10 text-destructive">{error} <Link to="/projects" className="text-primary">All projects</Link></div>;
  if (!p) return <div className="p-10 text-muted-foreground">Loading project…</div>;
  const v = p.impactScore;
  const verifiedCount = list.filter((asset) => asset.status === "verified").length;
  const verificationCoverage = list.length ? Math.round((verifiedCount / list.length) * 100) : 0;
  const formatDate = (date?: string | null) => date ? new Date(date).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" }) : "No target date";
  const submitRequirement = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!requirementTitle.trim() || !requirementCategory.trim()) return;
    try {
      const created = await createEvidenceRequirement(id, { title: requirementTitle, evidenceCategory: requirementCategory, targetDate: targetDate ? new Date(`${targetDate}T00:00:00`).toISOString() : undefined });
      setRequirements((current) => [...current, { ...created, supportingAssetCount: 0, verifiedAssetCount: 0 }]);
      setRequirementTitle(""); setRequirementCategory(""); setTargetDate(""); setShowRequirementForm(false);
      toast.success("Evidence requirement added");
    } catch (err) { toast.error(err instanceof Error ? err.message : "Could not add requirement"); }
  };
  const submitMilestone = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!milestoneTitle.trim()) return;
    try {
      const created = await createMilestone(id, { title: milestoneTitle, targetDate: targetDate ? new Date(`${targetDate}T00:00:00`).toISOString() : undefined });
      setMilestones((current) => [...current, created].sort((a, b) => (a.targetDate || "").localeCompare(b.targetDate || "")));
      setMilestoneTitle(""); setTargetDate(""); setShowMilestoneForm(false);
      toast.success("Milestone added");
    } catch (err) { toast.error(err instanceof Error ? err.message : "Could not add milestone"); }
  };

  return (
    <>
      <div className="relative -mx-4 -mt-6 mb-6 overflow-hidden md:-mx-8 md:-mt-8">
        {p.cover ? (
          <img src={p.cover} alt={p.name} width={1024} height={768} className="h-64 w-full object-cover" onError={(e) => { e.currentTarget.style.display = 'none'; }} />
        ) : (
          <div className="h-64 w-full bg-gradient-to-r from-slate-900 via-teal-950 to-slate-900" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-navy via-navy/60 to-transparent" />
        <div className="absolute bottom-6 left-4 right-4 text-navy-foreground md:left-8">
          <div className="text-xs font-semibold uppercase tracking-widest text-sidebar-primary">Project evidence workspace</div>
          <h1 className="mt-1 text-4xl">{p.name}</h1>
          <div className="mt-2 flex flex-wrap gap-4 text-sm text-sidebar-foreground">
            <span className="inline-flex items-center gap-1"><MapPin className="h-4 w-4" />{p.location}</span>
            <span className="inline-flex items-center gap-1"><Calendar className="h-4 w-4" />{p.start} – {p.end}</span>
            <span className="inline-flex items-center gap-1"><CheckCircle2 className="h-4 w-4" />{v}% verified</span>
            <span className="rounded-full bg-sidebar-primary px-2 text-xs font-semibold leading-5 text-sidebar-primary-foreground">{p.status}</span>
          </div>
        </div>
      </div>

      <div className="mb-6 flex gap-1 overflow-x-auto border-b">
        {tabs.map((t) => (
          <button key={t} onClick={() => setTab(t)} className={cn("whitespace-nowrap border-b-2 px-4 py-2.5 text-sm font-medium", tab === t ? "border-primary text-foreground" : "border-transparent text-muted-foreground hover:text-foreground")}>{t}</button>
        ))}
      </div>

      {tab === "Overview" && (
        <div className="grid gap-6 xl:grid-cols-3">
          <div className="space-y-6 xl:col-span-2">
            <Card title="About this project">
              <p className="text-muted-foreground">{p.description}</p>
              <h3 className="mb-2 mt-5 text-sm font-semibold">Objectives</h3>
              <ul className="space-y-1.5 text-sm">{(p.objectives || []).map((o) => <li key={o} className="flex gap-2"><CheckCircle2 className="h-4 w-4 text-success" />{o}</li>)}</ul>
            </Card>
            <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
              <Stat label="Media" value={String(list.length)} />
              <Stat label="Verified" value={`${v}%`} />
              {(p.metrics || []).slice(0, 2).map((m) => <Stat key={m.label} label={m.label} value={m.value} />)}
            </div>
          </div>
          <Card title="Evidence coverage" action={<AIBadge label="Database-backed" />}>
            <div className="space-y-3 text-sm">
              <div className="flex items-center justify-between"><span className="text-muted-foreground">Verification coverage</span><strong>{verificationCoverage}%</strong></div>
              <div className="h-2 overflow-hidden rounded-full bg-muted"><div className="h-full rounded-full bg-primary" style={{ width: `${verificationCoverage}%` }} /></div>
              <div className="grid grid-cols-2 gap-3 pt-2 text-xs"><div className="rounded-lg bg-muted p-3"><strong className="block text-lg">{list.length}</strong>assets collected</div><div className="rounded-lg bg-muted p-3"><strong className="block text-lg">{requirements.filter((r) => r.status === "FULFILLED").length}/{requirements.length}</strong>requirements fulfilled</div></div>
            </div>
            <Link to="/story" className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground"><Sparkles className="h-4 w-4" />Generate Impact Story</Link>
          </Card>
        </div>
      )}

      {tab === "Overview" && (
        <div className="mt-6 grid gap-6 xl:grid-cols-2">
          <Card title="Evidence gaps" action={<button onClick={() => setShowRequirementForm((value) => !value)} className="inline-flex items-center gap-1 rounded-lg border px-3 py-1.5 text-xs font-semibold hover:bg-muted"><Plus className="h-3.5 w-3.5" />Add requirement</button>}>
            {showRequirementForm && <form onSubmit={submitRequirement} className="mb-4 grid gap-2 rounded-lg border bg-muted/40 p-3"><input value={requirementTitle} onChange={(event) => setRequirementTitle(event.target.value)} placeholder="Requirement title" className="rounded-md border bg-background px-3 py-2 text-sm" required /><input value={requirementCategory} onChange={(event) => setRequirementCategory(event.target.value)} placeholder="Evidence category (e.g. water quality)" className="rounded-md border bg-background px-3 py-2 text-sm" required /><div className="flex gap-2"><input type="date" value={targetDate} onChange={(event) => setTargetDate(event.target.value)} className="rounded-md border bg-background px-3 py-2 text-sm" /><button className="rounded-md bg-primary px-3 py-2 text-sm font-semibold text-primary-foreground">Save</button></div></form>}
            {requirements.length === 0 ? <p className="text-sm text-muted-foreground">No evidence requirements have been defined for this project.</p> : <div className="space-y-3">{requirements.map((requirement) => <div key={requirement.id} className="rounded-lg border p-3"><div className="flex items-start justify-between gap-3"><div><h3 className="text-sm font-semibold">{requirement.title}</h3><p className="mt-1 text-xs text-muted-foreground">{requirement.evidenceCategory} · target {formatDate(requirement.targetDate)}</p></div><StatusBadge status={requirement.status === "FULFILLED" ? "verified" : "review"} /></div><div className="mt-2 flex gap-4 text-xs text-muted-foreground"><span>{requirement.supportingAssetCount} supporting assets</span><span>{requirement.verifiedAssetCount}/{requirement.supportingAssetCount || 0} verified</span></div></div>)}</div>}
          </Card>
          <Card title="Milestones" action={<button onClick={() => setShowMilestoneForm((value) => !value)} className="inline-flex items-center gap-1 rounded-lg border px-3 py-1.5 text-xs font-semibold hover:bg-muted"><Plus className="h-3.5 w-3.5" />Add milestone</button>}>
            {showMilestoneForm && <form onSubmit={submitMilestone} className="mb-4 flex gap-2 rounded-lg border bg-muted/40 p-3"><input value={milestoneTitle} onChange={(event) => setMilestoneTitle(event.target.value)} placeholder="Milestone title" className="min-w-0 flex-1 rounded-md border bg-background px-3 py-2 text-sm" required /><input type="date" value={targetDate} onChange={(event) => setTargetDate(event.target.value)} className="rounded-md border bg-background px-3 py-2 text-sm" /><button className="rounded-md bg-primary px-3 py-2 text-sm font-semibold text-primary-foreground">Save</button></form>}
            {milestones.length === 0 ? <p className="text-sm text-muted-foreground">No milestones have been defined for this project.</p> : <div className="space-y-3">{milestones.map((milestone) => <div key={milestone.id} className="rounded-lg border p-3"><div className="flex items-start justify-between gap-3"><div><h3 className="text-sm font-semibold">{milestone.title}</h3><p className="mt-1 text-xs text-muted-foreground">Target {formatDate(milestone.targetDate)}</p></div><span className="rounded-full bg-muted px-2 py-1 text-[11px] font-semibold">{milestone.status?.replace("_", " ") || "PLANNED"}</span></div><div className="mt-2 flex items-center gap-2 text-xs text-muted-foreground"><Link2 className="h-3.5 w-3.5" />{milestone.mediaLinks?.length || 0} linked evidence assets</div></div>)}</div>}
          </Card>
        </div>
      )}

      {tab === "Evidence" && <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">{list.map((a) => <AssetCard key={a.id} asset={a} />)}</div>}

      {tab === "Timeline" && (
        <ol className="relative space-y-8 border-l-2 pl-8">
          {milestones.map((milestone) => {
            const ev = milestone.mediaLinks || [];
            return (
              <li key={milestone.id} className="relative">
                <span className="absolute -left-[41px] top-1 grid h-5 w-5 place-items-center rounded-full border-2 border-primary bg-card"><span className="h-2 w-2 rounded-full bg-primary" /></span>
                <div className="font-mono text-xs font-semibold text-primary">{formatDate(milestone.targetDate)}</div>
                <h3 className="text-xl">{milestone.title}</h3>
                <div className="mt-1 flex gap-4 text-xs text-muted-foreground">
                  <span className="inline-flex items-center gap-1"><ImageIcon className="h-3 w-3" />{ev.filter((a) => a?.media?.resourceType === "image").length} photos</span>
                  <span className="inline-flex items-center gap-1"><Video className="h-3 w-3" />{ev.filter((a) => a?.media?.resourceType === "video").length} videos</span>
                  <span className="rounded-full bg-muted px-2 py-0.5 text-[11px] font-semibold">{milestone.status?.replace("_", " ") || "PLANNED"}</span>
                </div>
                <div className="mt-3 flex gap-2">
                  {ev.map((a) =>
                    a?.media?.cloudinaryUrl ? (
                      <Link key={a.media.id} to="/media/$id" params={{ id: a.media.id }}>
                        <img src={a.media.cloudinaryUrl} alt={a.media.title} loading="lazy" className="h-20 w-28 rounded-lg object-cover" />
                      </Link>
                    ) : null
                  )}
                </div>
                <p className="mt-2 text-sm text-muted-foreground">{milestone.description || "No milestone description provided."}</p>
              </li>
            );
          })}
        </ol>
      )}

      {tab === "Map" && (
        <div className="grid gap-6 md:grid-cols-[320px_1fr]">
          <IndiaMap points={[{ id: p.id, x: p.coords?.[0] ?? 77, y: p.coords?.[1] ?? 20, label: p.name }]} active={p.id} />
          <Card title="Evidence locations">
            {[...new Set(list.map((a) => a.location))].map((l) => (
            <div key={l} className="flex justify-between border-b py-2 text-sm"><span className="inline-flex items-center gap-2"><MapPin className="h-4 w-4 text-primary" />{l}</span><span className="text-muted-foreground">{list.filter((a) => a.location === l).length} assets</span></div>
            ))}
          </Card>
        </div>
      )}

      {tab === "Before / After" && (
        <div className="grid gap-6 xl:grid-cols-[1.6fr_1fr]">
          <Card>
            {p.before || p.after ? (
              <CompareView before={p.before} after={p.after} beforeLabel={`Before · ${p.start}`} afterLabel={`After · ${p.end}`} />
            ) : (
              <div className="flex aspect-[16/10] flex-col items-center justify-center rounded-xl bg-muted p-6 text-center text-muted-foreground">
                <Images className="mb-2 h-10 w-10 opacity-40" />
                <p className="text-sm font-medium">No comparison imagery available</p>
                <p className="mt-1 text-xs text-muted-foreground">Upload baseline and follow-up media to compare changes over time.</p>
              </div>
            )}
          </Card>
          <Card><DetectedChanges items={(p.metrics || []).map((m) => [m.label, m.value])} confidence={v} explanation="The comparison is based on the project metrics currently persisted by the backend." /></Card>
        </div>
      )}

      {tab === "Impact" && (
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          {(p.metrics || []).map((m) => <Stat key={m.label} label={m.label} value={m.value} delta="Evidence-backed" />)}
          <Stat label="Project progress" value={`${p.impactScore}%`} delta="Database-backed" />
        </div>
      )}

      {tab === "Reports" && (
        <Card title="Reports">
          {["Q3 Donor Impact Report", "Monthly Field Evidence Summary — Aug", "Government Compliance Pack"].map((r, i) => (
            <div key={r} className="flex items-center justify-between border-b py-3 text-sm">
              <span className="inline-flex items-center gap-2"><FileText className="h-4 w-4 text-primary" />{r}</span>
              <button onClick={() => toast.success("Report download started (demo)")} className="text-primary">{i === 0 ? "Download PDF" : "Open"}</button>
            </div>
          ))}
          <Link to="/reports" className="mt-4 inline-block rounded-lg bg-navy px-4 py-2 text-sm font-semibold text-navy-foreground">New report</Link>
        </Card>
      )}
    </>
  );
}
