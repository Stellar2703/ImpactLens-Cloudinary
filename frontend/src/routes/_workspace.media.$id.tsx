import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { deleteMedia, getEvidencePassport, getMedia, getMediaById, getProject, retryMediaAnalysis, verifyMedia } from "@/lib/api";
import type { Asset, Project, Status } from "@/lib/demo-data";
import { useNavigate } from "@tanstack/react-router";
import { ArrowLeft, CheckCircle2, Download, Fingerprint, Trash2 } from "lucide-react";

export const Route = createFileRoute("/_workspace/media/$id")({
  head: () => ({ meta: [{ title: "Media asset — ImpactLens" }, { name: "description", content: "AI analysis, provenance and verification for a field media asset." }] }),
  component: AssetDetail,
});

function AssetDetail() {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const [a, setAsset] = useState<Asset>();
  const [p, setProject] = useState<Project>();
  const [status, setStatus] = useState<Status>();
  const [related, setRelated] = useState<Asset[]>([]);
  const [passport, setPassport] = useState<any>();
  const [error, setError] = useState("");
  const [deleting, setDeleting] = useState(false);

  const handleDelete = async () => {
    if (!a) return;
    if (!confirm(`Are you sure you want to delete "${a.title}"?`)) return;
    setDeleting(true);
    try {
      await deleteMedia(a.id);
      toast.success("Evidence asset deleted");
      navigate({ to: "/media" });
    } catch (err: any) {
      toast.error(err?.message || "Failed to delete asset");
      setDeleting(false);
    }
  };
  useEffect(() => {
    Promise.all([getMediaById(id), getEvidencePassport(id)]).then(([asset, evidencePassport]) => {
      setAsset(asset);
      setStatus(asset.status);
      setPassport(evidencePassport);
      return Promise.all([getProject(asset.projectId), getMedia({ projectId: asset.projectId })]);
    }).then(([project, media]) => {
      setProject(project);
      setRelated(media.filter((item) => item.id !== id).slice(0, 4));
    }).catch((err: Error) => setError(err.message));
  }, [id]);
  const set = async (nextStatus: Status) => {
    if (!a) return;
    try {
      await verifyMedia(a.id, nextStatus);
      setStatus(nextStatus);
      toast.success(`Marked as ${nextStatus}`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not update verification");
    }
  };
  const retryAnalysis = async () => {
    try {
      await retryMediaAnalysis(id);
      const refreshed = await getEvidencePassport(id);
      setPassport(refreshed);
      toast.success("AI analysis completed");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "AI analysis failed");
    }
  };
  if (error) return <div className="p-10 text-destructive">{error} <Link to="/media" className="text-primary">Back to media</Link></div>;
  if (!a || !p || !status) return <div className="p-10 text-muted-foreground">Loading media asset…</div>;

  return (
    <>
      <div className="mb-4 flex items-center justify-between">
        <Link to="/media" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" />
          Media Intelligence
        </Link>
        <button
          onClick={handleDelete}
          disabled={deleting}
          className="inline-flex items-center gap-1.5 rounded-lg border border-destructive/30 px-3 py-1.5 text-xs font-semibold text-destructive hover:bg-destructive/10 disabled:opacity-50"
        >
          <Trash2 className="h-3.5 w-3.5" />
          {deleting ? "Deleting..." : "Delete Asset"}
        </button>
      </div>
      <div className="grid gap-6 xl:grid-cols-[1.4fr_1fr]">
        <div className="space-y-6">
          <div className="overflow-hidden rounded-xl border bg-card">
            {a.src ? (
              <img src={a.src} alt={a.title} width={1024} height={768} className="w-full object-cover" />
            ) : (
              <div className="flex aspect-video w-full items-center justify-center bg-muted text-sm text-muted-foreground">
                No preview available
              </div>
            )}
            <div className="flex flex-wrap items-center justify-between gap-2 p-4">
              <div>
                <div className="font-mono text-xs text-muted-foreground">{a.id} · {a.type.toUpperCase()}</div>
                <h1 className="text-2xl">{a.title}</h1>
                <Link to="/projects/$id" params={{ id: p.id }} className="text-sm font-semibold text-primary">{p.name}</Link>
              </div>
              <StatusBadge status={status} />
            </div>
          </div>
          <Card title="Provenance & traceability" action={<Fingerprint className="h-4 w-4 text-primary" />}>
            <dl className="grid gap-x-6 gap-y-2 text-sm md:grid-cols-2">
              {[
                ["Original asset ID", passport?.source?.id || a.id],
                ["Cloudinary public ID", passport?.source?.cloudinaryPublicId || a.cloudinaryId],
                ["Cloudinary version", passport?.source?.cloudinaryVersion || "Unavailable"],
                ["Cloudinary asset ID", passport?.source?.cloudinaryAssetId || "Unavailable"],
                ["Upload timestamp", passport?.source?.uploadedAt ? new Date(passport.source.uploadedAt).toLocaleString() : "Unavailable"],
                ["Project", p.name],
                ["Location", a.location],
                ["SHA-256", passport?.source?.sha256 || "Not recorded"],
                ["File metadata", [passport?.source?.format, passport?.source?.width && `${passport.source.width}×${passport.source.height}`, passport?.source?.fileSize && `${passport.source.fileSize} bytes`].filter(Boolean).join(" · ") || "Unavailable"],
              ].map(([k, v]) => (
                <div key={k} className="flex justify-between gap-3 border-b py-1.5"><dt className="text-muted-foreground">{k}</dt><dd className="truncate font-mono text-xs">{v}</dd></div>
              ))}
            {passport?.source?.secureUrl && <a href={passport.source.secureUrl} target="_blank" rel="noreferrer" className="mt-4 inline-flex rounded-lg bg-primary px-3 py-2 text-sm font-semibold text-primary-foreground">View Original Evidence</a>}
            <p className="mt-2 text-xs text-muted-foreground">Stored in Cloudinary. Derived previews and transformations never overwrite this original evidence.</p>
            </dl>
            <h3 className="mb-2 mt-5 text-sm font-semibold">Processing history</h3>
            <ol className="space-y-2 border-l pl-4 text-sm">
              {(passport?.auditEvents || []).map((event: any) => `${new Date(event.createdAt).toLocaleString()} — ${event.description}`).concat(status === "verified" ? ["Verified by reviewer"] : ["Awaiting human review"]).map((s: string) => (
                <li key={s} className="relative"><span className="absolute -left-[21px] top-1.5 h-2 w-2 rounded-full bg-primary" />{s}</li>
              ))}
            </ol>
          </Card>
        </div>
        <div className="space-y-6">
          <Card title="AI understanding" action={<AIBadge />}>
            {passport?.source?.analysisStatus === "FAILED" && (
              <div className="mb-4 rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm">
                <div className="font-semibold text-destructive">Analysis failed</div>
                <div className="mt-1 text-muted-foreground">{passport.source.analysisError || "The configured AI provider did not return a valid result."}</div>
                <button onClick={retryAnalysis} className="mt-3 rounded-md bg-primary px-3 py-1.5 text-sm font-semibold text-primary-foreground">Retry analysis</button>
              </div>
            )}
            <div className="text-sm text-muted-foreground">Scene</div>
            <div className="mb-4 font-display text-xl">{a.scene}</div>
            {[["Detected objects", a.objects], ["Activities", a.activities], ["Environmental signals", a.signals], ["Semantic tags", a.tags]].map(([k, v]) => (
              <div key={k as string} className="mb-3">
                <div className="mb-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">{k as string}</div>
                <div className="flex flex-wrap gap-1">{(v as string[]).map((t) => <span key={t} className="rounded-md bg-secondary px-2 py-0.5 text-xs">{t}</span>)}</div>
              </div>
            ))}
            <div className="mt-4 flex items-center justify-between rounded-lg bg-muted p-3 text-sm">Project relevance <Confidence value={Math.min(99, a.confidence + 2)} /></div>
            <div className="mt-2 flex items-center justify-between rounded-lg bg-muted p-3 text-sm">Overall confidence <Confidence value={a.confidence} /></div>
          </Card>
          <Card title="Derived evidence">
            <div className="space-y-2 text-sm">
              {(passport?.derived?.comparisons || []).map((comparison: any) => <Link key={comparison.id} to="/compare" className="block rounded-md border p-2 text-primary hover:bg-muted">Comparison: {comparison.label}</Link>)}
              {(passport?.derived?.reports || []).map((report: any) => <Link key={report.id} to="/reports" className="block rounded-md border p-2 text-primary hover:bg-muted">Report: {report.title}</Link>)}
              {(passport?.derived?.stories || []).map((story: any) => <Link key={story.id} to="/story" className="block rounded-md border p-2 text-primary hover:bg-muted">Story: {story.title}</Link>)}
              {(passport?.derived?.transformations || []).map((transformation: any) => <a key={transformation.preset} href={transformation.url} target="_blank" rel="noreferrer" className="block rounded-md border p-2 text-primary hover:bg-muted">Cloudinary {transformation.preset} · derived from original</a>)}
              {!passport?.derived?.comparisons?.length && !passport?.derived?.reports?.length && !passport?.derived?.stories?.length && !passport?.derived?.transformations?.length && <p className="text-muted-foreground">No saved derived evidence is linked yet.</p>}
            </div>
          </Card>
          <Card title="Verification">
            <div className="grid grid-cols-3 gap-2">
              <button onClick={() => set("verified")} className="rounded-lg bg-success px-3 py-2 text-sm font-semibold text-primary-foreground"><CheckCircle2 className="mx-auto mb-0.5 h-4 w-4" />Verify</button>
              <button onClick={() => set("review")} className="rounded-lg border px-3 py-2 text-sm font-semibold">Needs review</button>
              <button onClick={() => set("rejected")} className="rounded-lg border border-destructive/40 px-3 py-2 text-sm font-semibold text-destructive">Reject</button>
            </div>
            <a href={passport?.source?.secureUrl || a.src} target="_blank" rel="noreferrer" className="mt-3 inline-flex items-center gap-2 text-sm text-muted-foreground"><Download className="h-4 w-4" />Open original</a>
          </Card>
          <Card title="Related evidence">
            <div className="grid grid-cols-2 gap-2">{related.map((r) => (
              r.src ? (
                <Link key={r.id} to="/media/$id" params={{ id: r.id }}><img src={r.src} alt={r.title} loading="lazy" className="aspect-[4/3] w-full rounded-lg object-cover" /></Link>
              ) : null
            ))}</div>
          </Card>
        </div>
      </div>
    </>
  );
}
