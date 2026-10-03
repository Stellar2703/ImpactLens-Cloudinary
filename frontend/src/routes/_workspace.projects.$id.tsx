import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import {
  MapPin,
  Calendar,
  CheckCircle2,
  Sparkles,
  Image as ImageIcon,
  Images,
  Video,
  FileText,
  Plus,
  Link2,
  Upload,
  Download,
  Loader2,
} from "lucide-react";
import { AssetCard, Card, IndiaMap, Stat, StatusBadge, AIBadge } from "@/components/evidence";
import { CompareView, DetectedChanges } from "@/components/compare-view";
import { UploadDialog } from "@/components/upload-dialog";
import {
  createEvidenceRequirement,
  createMilestone,
  generateReport,
  getEvidenceRequirements,
  getMedia,
  getMilestones,
  getProject,
  getReports,
  type EvidenceRequirement,
  type Milestone,
  type Report,
} from "@/lib/api";
import type { Asset, Project } from "@/lib/demo-data";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_workspace/projects/$id")({
  head: () => ({
    meta: [
      { title: "Project Evidence Workspace — ImpactLens" },
      { name: "description", content: "Evidence, timeline and impact for an ImpactLens project." },
    ],
  }),
  notFoundComponent: () => (
    <div className="p-10">
      Project not found. <Link to="/projects" className="text-primary">All projects</Link>
    </div>
  ),
  component: Workspace,
});

const tabs = ["Overview", "Evidence", "Timeline", "Map", "Before / After", "Impact", "Reports"] as const;

function Workspace() {
  const { id } = Route.useParams();
  const [p, setProject] = useState<Project>();
  const [list, setList] = useState<Asset[]>([]);
  const [requirements, setRequirements] = useState<EvidenceRequirement[]>([]);
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [reports, setReports] = useState<Report[]>([]);
  const [generatingReport, setGeneratingReport] = useState(false);
  const [uploadOpen, setUploadOpen] = useState(false);
  const [showRequirementForm, setShowRequirementForm] = useState(false);
  const [showMilestoneForm, setShowMilestoneForm] = useState(false);
  const [requirementTitle, setRequirementTitle] = useState("");
  const [requirementCategory, setRequirementCategory] = useState("");
  const [milestoneTitle, setMilestoneTitle] = useState("");
  const [targetDate, setTargetDate] = useState("");
  const [error, setError] = useState("");
  const [tab, setTab] = useState<(typeof tabs)[number]>("Overview");

  useEffect(() => {
    if (!id) return;
    Promise.all([
      getProject(id),
      getMedia({ projectId: id }),
      getEvidenceRequirements(id),
      getMilestones(id),
      getReports({ projectId: id }),
    ])
      .then(([project, media, evidenceRequirements, projectMilestones, projectReports]) => {
        setProject(project);
        setList(Array.isArray(media) ? media : []);
        setRequirements(Array.isArray(evidenceRequirements) ? evidenceRequirements : []);
        setMilestones(Array.isArray(projectMilestones) ? projectMilestones : []);
        setReports(Array.isArray(projectReports) ? projectReports : []);
      })
      .catch((err: Error) => setError(err.message));
  }, [id]);

  if (error) {
    return (
      <div className="p-10 text-destructive">
        {error} <Link to="/projects" className="text-primary">All projects</Link>
      </div>
    );
  }
  if (!p) return <div className="p-10 text-muted-foreground">Loading project…</div>;

  const v = p.impactScore;
  const verifiedCount = list.filter((asset) => asset.status === "verified").length;
  const verificationCoverage = list.length ? Math.round((verifiedCount / list.length) * 100) : 0;
  const formatDate = (date?: string | null) =>
    date
      ? new Date(date).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })
      : "No target date";

  const submitRequirement = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!requirementTitle.trim() || !requirementCategory.trim()) return;
    try {
      const created = await createEvidenceRequirement(id, {
        title: requirementTitle,
        evidenceCategory: requirementCategory,
        targetDate: targetDate ? new Date(`${targetDate}T00:00:00`).toISOString() : undefined,
      });
      setRequirements((current) => [...current, { ...created, supportingAssetCount: 0, verifiedAssetCount: 0 }]);
      setRequirementTitle("");
      setRequirementCategory("");
      setTargetDate("");
      setShowRequirementForm(false);
      toast.success("Evidence requirement added");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not add requirement");
    }
  };

  const submitMilestone = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!milestoneTitle.trim()) return;
    try {
      const created = await createMilestone(id, {
        title: milestoneTitle,
        targetDate: targetDate ? new Date(`${targetDate}T00:00:00`).toISOString() : undefined,
      });
      setMilestones((current) =>
        [...current, created].sort((a, b) => (a.targetDate || "").localeCompare(b.targetDate || ""))
      );
      setMilestoneTitle("");
      setTargetDate("");
      setShowMilestoneForm(false);
      toast.success("Milestone added");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not add milestone");
    }
  };

  const handleGenerateReport = async () => {
    if (!id || !p) return;
    setGeneratingReport(true);
    try {
      const newReport = await generateReport({
        projectId: id,
        title: `${p.name} — AI Evidence Intelligence Report`,
        type: "impact",
      });
      setReports((current) => [newReport, ...current]);
      toast.success("AI project report generated successfully!");
    } catch (err: any) {
      toast.error(err?.message || "Failed to generate report");
    } finally {
      setGeneratingReport(false);
    }
  };

  const downloadReportFile = (report: Report) => {
    const text = `# ${report.title}\n\nProject: ${report.projectName}\nDate: ${report.date}\nType: ${report.type}\nStatus: ${report.status}\n\n## Executive Summary\n${report.summary || ""}\n\n## Key Statistics\n${(report.statistics || []).map((s) => `- ${s.label}: ${s.value} (${s.change || ""})`).join("\n")}\n\n## AI Observations\n${(report.aiObservations || []).map((o) => `- ${o}`).join("\n")}\n\n## Timeline Events\n${(report.timeline || []).map((t: any) => `- [${t.date || "Scheduled"}] ${t.title || ""}: ${t.description || ""}`).join("\n")}\n\n---\nImpactLens AI Media Intelligence & Provenance Platform`;
    const blob = new Blob([text], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${report.title.replace(/[^a-z0-9_-]/gi, "_")}.md`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Report downloaded");
  };

  return (
    <>
      <div className="relative -mx-4 -mt-6 mb-6 overflow-hidden md:-mx-8 md:-mt-8">
        {p.cover ? (
          <img
            src={p.cover}
            alt={p.name}
            width={1024}
            height={768}
            className="h-64 w-full object-cover"
            onError={(e) => {
              e.currentTarget.style.display = "none";
            }}
          />
        ) : (
          <div className="h-64 w-full bg-gradient-to-r from-slate-900 via-teal-950 to-slate-900" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-navy via-navy/60 to-transparent" />
        <div className="absolute bottom-6 left-4 right-4 text-navy-foreground md:left-8">
          <div className="text-xs font-semibold uppercase tracking-widest text-sidebar-primary">
            Project evidence workspace
          </div>
          <h1 className="mt-1 text-4xl font-bold">{p.name}</h1>
          <div className="mt-2 flex flex-wrap items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-4 text-sm text-sidebar-foreground">
              <span className="inline-flex items-center gap-1">
                <MapPin className="h-4 w-4" />
                {p.location}
              </span>
              <span className="inline-flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                {p.start ? new Date(p.start).toLocaleDateString(undefined, { month: "short", year: "numeric" }) : "Active"} – {p.end ? new Date(p.end).toLocaleDateString(undefined, { month: "short", year: "numeric" }) : "Ongoing"}
              </span>
              <span className="inline-flex items-center gap-1">
                <CheckCircle2 className="h-4 w-4" />
                {v}% verified
              </span>
              <span className="rounded-full bg-sidebar-primary px-2 text-xs font-semibold leading-5 text-sidebar-primary-foreground">
                {p.status}
              </span>
            </div>
            <button
              onClick={() => setUploadOpen(true)}
              className="inline-flex items-center gap-2 rounded-lg bg-primary px-3.5 py-1.5 text-xs font-semibold text-primary-foreground shadow-sm hover:opacity-90"
            >
              <Upload className="h-4 w-4" />
              Upload Evidence
            </button>
          </div>
        </div>
      </div>

      <div className="mb-6 flex gap-1 overflow-x-auto border-b">
        {tabs.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={cn(
              "whitespace-nowrap border-b-2 px-4 py-2.5 text-sm font-medium",
              tab === t ? "border-primary text-foreground" : "border-transparent text-muted-foreground hover:text-foreground"
            )}
          >
            {t}
          </button>
        ))}
      </div>

      {tab === "Overview" && (
        <div className="grid gap-6 xl:grid-cols-3">
          <div className="space-y-6 xl:col-span-2">
            <Card title="About this project">
              <p className="text-muted-foreground leading-relaxed">{p.description}</p>
              <h3 className="mb-2 mt-5 text-sm font-semibold">Strategic Objectives</h3>
              <ul className="space-y-1.5 text-sm">
                {(p.objectives || []).map((o) => (
                  <li key={o} className="flex gap-2 items-start">
                    <CheckCircle2 className="h-4 w-4 mt-0.5 text-success shrink-0" />
                    <span>{o}</span>
                  </li>
                ))}
              </ul>
            </Card>
            <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
              <Stat label="Evidence Assets" value={String(list.length)} />
              <Stat label="Verification" value={`${v}%`} />
              {(p.metrics || []).slice(0, 2).map((m) => (
                <Stat key={m.label} label={m.label} value={m.value} />
              ))}
            </div>
          </div>
          <Card title="Evidence coverage" action={<AIBadge label="Database-backed" />}>
            <div className="space-y-3 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Verification coverage</span>
                <strong>{verificationCoverage}%</strong>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-muted">
                <div className="h-full rounded-full bg-primary" style={{ width: `${verificationCoverage}%` }} />
              </div>
              <div className="grid grid-cols-2 gap-3 pt-2 text-xs">
                <div className="rounded-lg bg-muted p-3">
                  <strong className="block text-lg">{list.length}</strong>
                  assets collected
                </div>
                <div className="rounded-lg bg-muted p-3">
                  <strong className="block text-lg">
                    {requirements.filter((r) => r.status === "FULFILLED").length}/{requirements.length}
                  </strong>
                  requirements fulfilled
                </div>
              </div>
              <button
                onClick={() => setUploadOpen(true)}
                className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-lg border border-primary/30 bg-primary/10 px-4 py-2 text-xs font-semibold text-primary hover:bg-primary/20"
              >
                <Upload className="h-4 w-4" />
                Add Field Evidence to Project
              </button>
            </div>
            <Link
              to="/story"
              className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground"
            >
              <Sparkles className="h-4 w-4" />
              Generate Impact Story
            </Link>
          </Card>
        </div>
      )}

      {tab === "Overview" && (
        <div className="mt-6 grid gap-6 xl:grid-cols-2">
          <Card
            title="Evidence requirements"
            action={
              <button
                onClick={() => setShowRequirementForm((value) => !value)}
                className="inline-flex items-center gap-1 rounded-lg border px-3 py-1.5 text-xs font-semibold hover:bg-muted"
              >
                <Plus className="h-3.5 w-3.5" />
                Add requirement
              </button>
            }
          >
            {showRequirementForm && (
              <form onSubmit={submitRequirement} className="mb-4 grid gap-2 rounded-lg border bg-muted/40 p-3">
                <input
                  value={requirementTitle}
                  onChange={(event) => setRequirementTitle(event.target.value)}
                  placeholder="Requirement title"
                  className="rounded-md border bg-background px-3 py-2 text-sm"
                  required
                />
                <input
                  value={requirementCategory}
                  onChange={(event) => setRequirementCategory(event.target.value)}
                  placeholder="Evidence category (e.g. Vegetation Density)"
                  className="rounded-md border bg-background px-3 py-2 text-sm"
                  required
                />
                <div className="flex gap-2">
                  <input
                    type="date"
                    value={targetDate}
                    onChange={(event) => setTargetDate(event.target.value)}
                    className="rounded-md border bg-background px-3 py-2 text-sm"
                  />
                  <button className="rounded-md bg-primary px-3 py-2 text-sm font-semibold text-primary-foreground">
                    Save
                  </button>
                </div>
              </form>
            )}
            {requirements.length === 0 ? (
              <p className="text-sm text-muted-foreground">No evidence requirements defined for this project.</p>
            ) : (
              <div className="space-y-3">
                {requirements.map((requirement) => (
                  <div key={requirement.id} className="rounded-lg border p-3">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h3 className="text-sm font-semibold">{requirement.title}</h3>
                        <p className="mt-1 text-xs text-muted-foreground">
                          {requirement.evidenceCategory} · target {formatDate(requirement.targetDate)}
                        </p>
                        {requirement.description && (
                          <p className="mt-1 text-xs text-muted-foreground">{requirement.description}</p>
                        )}
                      </div>
                      <StatusBadge status={requirement.status === "FULFILLED" ? "verified" : "review"} />
                    </div>
                    <div className="mt-2 flex gap-4 text-xs text-muted-foreground">
                      <span>{requirement.supportingAssetCount} supporting assets</span>
                      <span>
                        {requirement.verifiedAssetCount}/{requirement.supportingAssetCount || 0} verified
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
          <Card
            title="Milestones"
            action={
              <button
                onClick={() => setShowMilestoneForm((value) => !value)}
                className="inline-flex items-center gap-1 rounded-lg border px-3 py-1.5 text-xs font-semibold hover:bg-muted"
              >
                <Plus className="h-3.5 w-3.5" />
                Add milestone
              </button>
            }
          >
            {showMilestoneForm && (
              <form onSubmit={submitMilestone} className="mb-4 flex gap-2 rounded-lg border bg-muted/40 p-3">
                <input
                  value={milestoneTitle}
                  onChange={(event) => setMilestoneTitle(event.target.value)}
                  placeholder="Milestone title"
                  className="min-w-0 flex-1 rounded-md border bg-background px-3 py-2 text-sm"
                  required
                />
                <input
                  type="date"
                  value={targetDate}
                  onChange={(event) => setTargetDate(event.target.value)}
                  className="rounded-md border bg-background px-3 py-2 text-sm"
                />
                <button className="rounded-md bg-primary px-3 py-2 text-sm font-semibold text-primary-foreground">
                  Save
                </button>
              </form>
            )}
            {milestones.length === 0 ? (
              <p className="text-sm text-muted-foreground">No milestones defined for this project.</p>
            ) : (
              <div className="space-y-3">
                {milestones.map((milestone) => (
                  <div key={milestone.id} className="rounded-lg border p-3">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h3 className="text-sm font-semibold">{milestone.title}</h3>
                        <p className="mt-1 text-xs text-muted-foreground">Target {formatDate(milestone.targetDate)}</p>
                        {milestone.description && (
                          <p className="mt-1 text-xs text-muted-foreground">{milestone.description}</p>
                        )}
                      </div>
                      <span className="rounded-full bg-muted px-2 py-1 text-[11px] font-semibold">
                        {milestone.status?.replace("_", " ") || "PLANNED"}
                      </span>
                    </div>
                    <div className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
                      <Link2 className="h-3.5 w-3.5" />
                      {milestone.mediaLinks?.length || 0} linked evidence assets
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      )}

      {tab === "Evidence" && (
        <div>
          <div className="mb-4 flex items-center justify-between">
            <span className="text-sm text-muted-foreground">
              {list.length} evidence asset{list.length === 1 ? "" : "s"} collected
            </span>
            <button
              onClick={() => setUploadOpen(true)}
              className="inline-flex items-center gap-2 rounded-lg bg-primary px-3.5 py-1.5 text-xs font-semibold text-primary-foreground shadow-sm hover:opacity-90"
            >
              <Upload className="h-3.5 w-3.5" />
              Add Evidence to Project
            </button>
          </div>
          {list.length === 0 ? (
            <div className="rounded-2xl border-2 border-dashed bg-card/60 p-12 text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                <Images className="h-7 w-7" />
              </div>
              <h2 className="mt-4 font-display text-xl font-bold">No evidence uploaded for this project yet</h2>
              <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
                Upload your field photos or videos directly to {p.name}. They will be stored in Cloudinary and analyzed by AI vision.
              </p>
              <button
                onClick={() => setUploadOpen(true)}
                className="mt-6 inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-sm hover:opacity-90"
              >
                <Upload className="h-4 w-4" />
                Upload Field Evidence
              </button>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
              {list.map((a) => (
                <AssetCard key={a.id} asset={a} />
              ))}
            </div>
          )}
        </div>
      )}

      {tab === "Timeline" && (
        <div>
          {milestones.length === 0 ? (
            <div className="rounded-2xl border-2 border-dashed bg-card/60 p-12 text-center">
              <p className="text-sm text-muted-foreground">No timeline milestones defined yet.</p>
              <button
                onClick={() => setShowMilestoneForm(true)}
                className="mt-4 inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground"
              >
                <Plus className="h-4 w-4" />
                Add First Milestone
              </button>
            </div>
          ) : (
            <ol className="relative space-y-8 border-l-2 pl-8">
              {milestones.map((milestone) => {
                const ev = milestone.mediaLinks || [];
                return (
                  <li key={milestone.id} className="relative">
                    <span className="absolute -left-[41px] top-1 grid h-5 w-5 place-items-center rounded-full border-2 border-primary bg-card">
                      <span className="h-2 w-2 rounded-full bg-primary" />
                    </span>
                    <div className="font-mono text-xs font-semibold text-primary">{formatDate(milestone.targetDate)}</div>
                    <h3 className="text-xl font-bold">{milestone.title}</h3>
                    <div className="mt-1 flex gap-4 text-xs text-muted-foreground">
                      <span className="inline-flex items-center gap-1">
                        <ImageIcon className="h-3 w-3" />
                        {ev.filter((a) => a?.media?.resourceType === "image").length} photos
                      </span>
                      <span className="inline-flex items-center gap-1">
                        <Video className="h-3 w-3" />
                        {ev.filter((a) => a?.media?.resourceType === "video").length} videos
                      </span>
                      <span className="rounded-full bg-muted px-2 py-0.5 text-[11px] font-semibold">
                        {milestone.status?.replace("_", " ") || "PLANNED"}
                      </span>
                    </div>
                    {ev.length > 0 && (
                      <div className="mt-3 flex gap-2">
                        {ev.map((a) =>
                          a?.media?.cloudinaryUrl ? (
                            <Link key={a.media.id} to="/media/$id" params={{ id: a.media.id }}>
                              <img
                                src={a.media.cloudinaryUrl}
                                alt={a.media.title}
                                loading="lazy"
                                className="h-20 w-28 rounded-lg object-cover"
                              />
                            </Link>
                          ) : null
                        )}
                      </div>
                    )}
                    <p className="mt-2 text-sm text-muted-foreground">{milestone.description}</p>
                  </li>
                );
              })}
            </ol>
          )}
        </div>
      )}

      {tab === "Map" && (
        <div className="grid gap-6 md:grid-cols-[340px_1fr]">
          <IndiaMap
            points={[{ id: p.id, x: p.coords?.[0] ?? 77, y: p.coords?.[1] ?? 20, label: p.name }]}
            active={p.id}
          />
          <Card title="Evidence locations & geocoding">
            <div className="mb-4 rounded-lg bg-muted/40 p-3 text-xs space-y-1">
              <div>Project Location: <strong className="text-foreground">{p.location}</strong> ({p.region})</div>
              <div>Estimated Coordinates: <span className="font-mono text-primary font-semibold">{((36 - (p.coords?.[1] ?? 20) * 0.3)).toFixed(4)}°N, {(68 + (p.coords?.[0] ?? 77) * 0.29).toFixed(4)}°E</span></div>
            </div>
            {[...new Set(list.map((a) => a.location))].map((l) => (
              <div key={l} className="flex justify-between border-b py-2 text-sm">
                <span className="inline-flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-primary" />
                  {l}
                </span>
                <span className="text-muted-foreground">{list.filter((a) => a.location === l).length} assets</span>
              </div>
            ))}
            {list.length === 0 && (
              <div className="py-4 text-sm text-muted-foreground">
                <p>No specific field evidence uploaded for this location yet.</p>
                <button
                  onClick={() => setUploadOpen(true)}
                  className="mt-3 inline-flex items-center gap-1.5 rounded-lg border bg-primary/10 px-3 py-1.5 text-xs font-semibold text-primary hover:bg-primary/20"
                >
                  <Upload className="h-3.5 w-3.5" />
                  Upload First Field Evidence
                </button>
              </div>
            )}
          </Card>
        </div>
      )}

      {tab === "Before / After" && (
        <div className="grid gap-6 xl:grid-cols-[1.6fr_1fr]">
          <Card>
            {p.before || p.after ? (
              <CompareView
                before={p.before}
                after={p.after}
                beforeLabel={`Before · ${p.start ? new Date(p.start).toLocaleDateString(undefined, { month: "short", year: "numeric" }) : "Baseline"}`}
                afterLabel={`After · ${p.end ? new Date(p.end).toLocaleDateString(undefined, { month: "short", year: "numeric" }) : "Target"}`}
              />
            ) : (
              <div className="flex aspect-[16/10] flex-col items-center justify-center rounded-xl bg-muted p-6 text-center text-muted-foreground">
                <Images className="mb-2 h-10 w-10 opacity-40" />
                <p className="text-sm font-medium">No comparison imagery available</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Upload baseline and follow-up media to compare changes over time.
                </p>
                <button
                  onClick={() => setUploadOpen(true)}
                  className="mt-4 inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground"
                >
                  <Upload className="h-3.5 w-3.5" />
                  Upload Media
                </button>
              </div>
            )}
          </Card>
          <Card>
            <DetectedChanges
              items={(p.metrics || []).map((m) => [m.label, m.value])}
              confidence={v}
              explanation="The comparison is based on the project metrics currently persisted by the backend."
            />
          </Card>
        </div>
      )}

      {tab === "Impact" && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            {(p.metrics || []).map((m) => (
              <Stat key={m.label} label={m.label} value={m.value} delta="Evidence-backed" />
            ))}
            <Stat label="Project progress" value={`${p.impactScore}%`} delta="Database-backed" />
          </div>
          <Card title="Impact & Evidence Requirements Status">
            {requirements.length === 0 ? (
              <p className="text-sm text-muted-foreground">No evidence requirements recorded yet.</p>
            ) : (
              <div className="grid gap-3 sm:grid-cols-2">
                {requirements.map((r) => (
                  <div key={r.id} className="rounded-lg border p-3">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-sm">{r.title}</span>
                      <StatusBadge status={r.status === "FULFILLED" ? "verified" : "review"} />
                    </div>
                    <div className="mt-1 text-xs text-muted-foreground">Category: {r.evidenceCategory}</div>
                    <div className="mt-2 text-xs font-mono">{r.verifiedAssetCount} verified of {r.supportingAssetCount} supporting</div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      )}

      {tab === "Reports" && (
        <div className="space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl border bg-card p-4">
            <div>
              <h2 className="font-display text-lg font-bold">Project Reports & AI Evidence Audits</h2>
              <p className="text-xs text-muted-foreground">
                Synthesized intelligence reports tailored to {p.name} based on verified field evidence and milestones.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handleGenerateReport}
                disabled={generatingReport}
                className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground shadow-sm hover:opacity-90 disabled:opacity-50"
              >
                {generatingReport ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                {generatingReport ? "Analyzing with AI..." : "Generate AI Project Report"}
              </button>
              <Link
                to="/reports"
                className="inline-flex items-center gap-1.5 rounded-lg border bg-background px-3 py-2 text-xs font-semibold hover:bg-muted"
              >
                Report Builder →
              </Link>
            </div>
          </div>

          {reports.length === 0 ? (
            <div className="rounded-2xl border-2 border-dashed bg-card/60 p-12 text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                <FileText className="h-7 w-7" />
              </div>
              <h3 className="mt-4 text-lg font-bold">No reports generated for this project yet</h3>
              <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
                Run an AI evidence synthesis for {p.name} to compile executive summaries, timeline audits, and verification metrics.
              </p>
              <button
                onClick={handleGenerateReport}
                disabled={generatingReport}
                className="mt-6 inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-sm hover:opacity-90 disabled:opacity-50"
              >
                {generatingReport ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                {generatingReport ? "Generating AI Report..." : "Generate First AI Project Report"}
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {reports.map((report) => {
                const stats = report.statistics || [];
                const observations = report.aiObservations || [];
                return (
                  <Card
                    key={report.id}
                    title={report.title}
                    action={
                      <div className="flex items-center gap-2">
                        <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-semibold text-primary capitalize">
                          {report.type}
                        </span>
                        <span className="rounded-full bg-success/15 px-2.5 py-0.5 text-xs font-semibold text-success capitalize">
                          {report.status}
                        </span>
                      </div>
                    }
                  >
                    <div className="text-xs text-muted-foreground mb-3">
                      Generated on {new Date(report.date).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })} · {report.projectName}
                    </div>
                    <p className="text-sm text-foreground/90 leading-relaxed bg-muted/30 p-3 rounded-lg border">
                      {report.summary || "Evidence report synthesized from project field observations."}
                    </p>

                    {stats.length > 0 && (
                      <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
                        {stats.slice(0, 4).map((s) => (
                          <div key={s.label} className="rounded-lg border bg-card p-3">
                            <div className="text-xs text-muted-foreground">{s.label}</div>
                            <div className="mt-1 text-lg font-bold">{s.value}</div>
                            {s.change && <div className="text-[11px] text-primary">{s.change}</div>}
                          </div>
                        ))}
                      </div>
                    )}

                    {observations.length > 0 && (
                      <div className="mt-4 space-y-1.5">
                        <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                          Key AI Observations
                        </div>
                        <ul className="space-y-1 text-xs">
                          {observations.slice(0, 4).map((obs, i) => (
                            <li key={i} className="flex items-start gap-2 text-foreground/80">
                              <CheckCircle2 className="h-3.5 w-3.5 mt-0.5 text-primary shrink-0" />
                              <span>{obs}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t pt-4">
                      <span className="text-xs text-muted-foreground">Immutable audit record · Stored in database</span>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => downloadReportFile(report)}
                          className="inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-semibold hover:bg-muted"
                        >
                          <Download className="h-3.5 w-3.5" />
                          Download Report
                        </button>
                        <Link
                          to="/reports"
                          className="inline-flex items-center gap-1 rounded-lg bg-navy px-3.5 py-1.5 text-xs font-semibold text-navy-foreground"
                        >
                          View in Builder →
                        </Link>
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      )}

      {uploadOpen && (
        <UploadDialog
          projectId={p.id}
          onUploaded={(asset) => {
            setList((current) => [asset, ...current]);
            toast.success("Evidence added to project");
          }}
          onClose={() => setUploadOpen(false)}
        />
      )}
    </>
  );
}
