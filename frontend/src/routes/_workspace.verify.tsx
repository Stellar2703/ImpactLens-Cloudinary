import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { AlertTriangle, Check, ExternalLink, ImageOff, Loader2, RotateCcw, X } from "lucide-react";
import { PageHeader } from "@/components/app-shell";
import { getVerifications, updateVerification, type Verification, type VerificationStatus } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

export const Route = createFileRoute("/_workspace/verify")({
  
  head: () => ({ meta: [{ title: "Evidence Verification — ImpactLens" }, { name: "description", content: "Review AI-classified evidence and confirm provenance." }, { property: "og:title", content: "Evidence Verification — ImpactLens" }, { property: "og:description", content: "Review AI-classified evidence and confirm provenance." }] }),
  component: Page,
});
function Page() {
  const [items, setItems] = useState<Verification[]>([]);
  const [comments, setComments] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [updating, setUpdating] = useState<string>();

  const load = () => {
    setLoading(true);
    setError("");
    getVerifications()
      .then(setItems)
      .catch((err: Error) => setError(err.message || "Unable to load verification queue"))
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  const update = async (item: Verification, status: VerificationStatus) => {
    setUpdating(item.id);
    try {
      await updateVerification(item.id, { status, comment: comments[item.id]?.trim() || undefined });
      // Keep the queue's normalized GET shape; the persistence response also contains
      // the nested Prisma media record when the database is enabled.
      setItems((current) => current.map((entry) => entry.id === item.id ? { ...entry, status } : entry));
      toast.success(statusLabel(status));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not update verification");
    } finally {
      setUpdating(undefined);
    }
  };

  return (
    <>
      <PageHeader
        title="Evidence Verification"
        subtitle="Review AI-classified evidence and confirm provenance."
        actions={<Button variant="outline" size="sm" onClick={load} disabled={loading}><RotateCcw className="h-4 w-4" />Refresh</Button>}
      />
      {loading && <div className="flex items-center gap-2 rounded-xl border bg-card p-8 text-sm text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" />Loading verification queue…</div>}
      {!loading && error && <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-5 text-sm text-destructive">{error}<Button className="ml-3" size="sm" variant="outline" onClick={load}>Try again</Button></div>}
      {!loading && !error && items.length === 0 && <div className="rounded-xl border bg-card p-10 text-center text-sm text-muted-foreground">No evidence is waiting for verification.</div>}
      {!loading && !error && items.length > 0 && (
        <div className="space-y-5">
          <div className="text-sm text-muted-foreground">{items.length} evidence {items.length === 1 ? "item" : "items"} in queue</div>
          {items.map((item) => (
            <VerificationCard key={item.id} item={item} comment={comments[item.id] || ""} onComment={(value) => setComments((current) => ({ ...current, [item.id]: value }))} onUpdate={update} updating={updating === item.id} />
          ))}
        </div>
      )}
    </>
  );
}

function VerificationCard({ item, comment, onComment, onUpdate, updating }: {
  item: Verification;
  comment: string;
  onComment: (value: string) => void;
  onUpdate: (item: Verification, status: VerificationStatus) => void;
  updating: boolean;
}) {
  return (
    <article className="overflow-hidden rounded-xl border bg-card shadow-sm">
      <div className="grid md:grid-cols-[220px_1fr]">
        <div className="relative min-h-48 bg-muted">
          {item.mediaUrl ? <img src={item.mediaUrl} alt={`Source evidence for ${item.project}`} className="h-full min-h-48 w-full object-cover" /> : <div className="grid h-full min-h-48 place-items-center text-muted-foreground"><ImageOff /></div>}
          <span className="absolute left-3 top-3 rounded-full bg-background/90 px-2 py-1 text-xs font-medium">{statusLabel(item.status)}</span>
        </div>
        <div className="space-y-4 p-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div><h2 className="text-lg font-semibold">{item.project}</h2><p className="text-sm text-muted-foreground">{item.location}</p></div>
            <Link to="/media/$id" params={{ id: item.mediaId }} className="inline-flex items-center gap-1 text-sm font-semibold text-primary hover:underline">Evidence Passport <ExternalLink className="h-3.5 w-3.5" /></Link>
          </div>
          <div className="grid gap-3 text-sm sm:grid-cols-3">
            <div className="rounded-lg bg-muted p-3"><div className="mb-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">AI observation</div><div>{item.aiObservation}</div></div>
            <div className="rounded-lg bg-muted p-3"><div className="mb-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Risk</div><div className="flex items-center gap-1"><AlertTriangle className="h-4 w-4 text-amber-600" />{item.category || "Requires review"}</div></div>
            <div className="rounded-lg bg-muted p-3"><div className="mb-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Confidence / timestamp</div><div>{item.confidence}%</div><div className="text-xs text-muted-foreground">{formatTimestamp(item.timestamp)}</div></div>
          </div>
          <Textarea value={comment} onChange={(event) => onComment(event.target.value)} maxLength={1000} placeholder="Add a reviewer comment (optional)" className="min-h-16 resize-y" />
          <div className="flex flex-wrap gap-2">
            <Button size="sm" onClick={() => onUpdate(item, "confirmed")} disabled={updating}><Check />Confirm</Button>
            <Button size="sm" variant="outline" onClick={() => onUpdate(item, "needs_inspection")} disabled={updating}><AlertTriangle />Needs inspection</Button>
            <Button size="sm" variant="outline" onClick={() => onUpdate(item, "false_positive")} disabled={updating}><X />False positive</Button>
            {updating && <Loader2 className="ml-1 h-4 w-4 animate-spin self-center text-muted-foreground" />}
          </div>
        </div>
      </div>
    </article>
  );
}

function statusLabel(status: VerificationStatus) {
  return status === "confirmed" ? "Confirmed" : status === "false_positive" ? "False positive" : status === "needs_inspection" ? "Needs inspection" : "Pending";
}

function formatTimestamp(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString();
}
