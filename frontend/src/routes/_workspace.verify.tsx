import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState, useMemo } from "react";
import { toast } from "sonner";
import { AlertTriangle, Check, ExternalLink, ImageOff, Loader2, RotateCcw, X, CheckCircle2, ShieldCheck, Clock } from "lucide-react";
import { PageHeader } from "@/components/app-shell";
import { getVerifications, updateVerification, type Verification, type VerificationStatus } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

export const Route = createFileRoute("/_workspace/verify")({
  head: () => ({
    meta: [
      { title: "Evidence Verification — ImpactLens" },
      { name: "description", content: "Review AI-classified evidence and confirm provenance." },
      { property: "og:title", content: "Evidence Verification — ImpactLens" },
      { property: "og:description", content: "Review AI-classified evidence and confirm provenance." },
    ],
  }),
  component: Page,
});

function Page() {
  const [items, setItems] = useState<Verification[]>([]);
  const [comments, setComments] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [updating, setUpdating] = useState<string>();
  const [tab, setTab] = useState<"pending" | "finalised" | "all">("pending");

  const load = () => {
    setLoading(true);
    setError("");
    getVerifications()
      .then(setItems)
      .catch((err: Error) => setError(err.message || "Unable to load verification queue"))
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  const pendingItems = useMemo(() => items.filter((i) => i.status === "pending"), [items]);
  const finalisedItems = useMemo(() => items.filter((i) => i.status !== "pending"), [items]);

  const visibleItems = useMemo(() => {
    if (tab === "pending") return pendingItems;
    if (tab === "finalised") return finalisedItems;
    return items;
  }, [tab, pendingItems, finalisedItems, items]);

  const update = async (item: Verification, status: VerificationStatus) => {
    setUpdating(item.id);
    try {
      await updateVerification(item.id, { status, comment: comments[item.id]?.trim() || undefined });

      // Update the item status in local state
      setItems((current) =>
        current.map((entry) => (entry.id === item.id ? { ...entry, status } : entry))
      );

      if (status === "pending") {
        toast.info("Evidence reopened for review");
      } else {
        toast.success(`Evidence finalized as ${statusLabel(status)}`);
      }
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
        actions={
          <Button variant="outline" size="sm" onClick={load} disabled={loading}>
            <RotateCcw className="h-4 w-4" />
            Refresh
          </Button>
        }
      />

      {/* Tabs */}
      <div className="mb-6 flex flex-wrap items-center gap-2 border-b pb-3">
        <button
          type="button"
          onClick={() => setTab("pending")}
          className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold transition-all ${
            tab === "pending"
              ? "bg-primary text-primary-foreground shadow-sm"
              : "border bg-card text-muted-foreground hover:bg-muted hover:text-foreground"
          }`}
        >
          <Clock className="h-4 w-4" />
          Pending Review ({pendingItems.length})
        </button>

        <button
          type="button"
          onClick={() => setTab("finalised")}
          className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold transition-all ${
            tab === "finalised"
              ? "bg-primary text-primary-foreground shadow-sm"
              : "border bg-card text-muted-foreground hover:bg-muted hover:text-foreground"
          }`}
        >
          <ShieldCheck className="h-4 w-4" />
          Finalised ({finalisedItems.length})
        </button>

        <button
          type="button"
          onClick={() => setTab("all")}
          className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold transition-all ${
            tab === "all"
              ? "bg-primary text-primary-foreground shadow-sm"
              : "border bg-card text-muted-foreground hover:bg-muted hover:text-foreground"
          }`}
        >
          All Evidence ({items.length})
        </button>
      </div>

      {loading && (
        <div className="flex items-center gap-2 rounded-2xl border bg-card p-10 text-sm text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin text-primary" />
          Loading verification queue…
        </div>
      )}

      {!loading && error && (
        <div className="rounded-2xl border border-destructive/30 bg-destructive/5 p-6 text-sm text-destructive">
          {error}
          <Button className="ml-3" size="sm" variant="outline" onClick={load}>
            Try again
          </Button>
        </div>
      )}

      {!loading && !error && visibleItems.length === 0 && (
        <div className="rounded-2xl border border-dashed bg-card/60 p-12 text-center">
          {tab === "pending" ? (
            <>
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-success/15 text-success mb-3">
                <CheckCircle2 className="h-6 w-6" />
              </div>
              <h3 className="font-display text-lg font-bold">All evidence verified and finalised!</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                There are currently no evidence items waiting in the review queue.
              </p>
              {finalisedItems.length > 0 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setTab("finalised")}
                  className="mt-4 inline-flex items-center gap-1.5"
                >
                  <ShieldCheck className="h-4 w-4 text-primary" />
                  View {finalisedItems.length} Finalised Evidence Item{finalisedItems.length === 1 ? "" : "s"}
                </Button>
              )}
            </>
          ) : (
            <p className="text-sm text-muted-foreground">No evidence items in this view.</p>
          )}
        </div>
      )}

      {!loading && !error && visibleItems.length > 0 && (
        <div className="space-y-5">
          <div className="text-sm text-muted-foreground">
            Showing {visibleItems.length} {tab === "pending" ? "pending item" : tab === "finalised" ? "finalised item" : "item"}
            {visibleItems.length === 1 ? "" : "s"}
          </div>

          {visibleItems.map((item) => (
            <VerificationCard
              key={item.id}
              item={item}
              comment={comments[item.id] || ""}
              onComment={(value) => setComments((current) => ({ ...current, [item.id]: value }))}
              onUpdate={update}
              updating={updating === item.id}
            />
          ))}
        </div>
      )}
    </>
  );
}

function VerificationCard({
  item,
  comment,
  onComment,
  onUpdate,
  updating,
}: {
  item: Verification;
  comment: string;
  onComment: (value: string) => void;
  onUpdate: (item: Verification, status: VerificationStatus) => void;
  updating: boolean;
}) {
  const isFinalised = item.status !== "pending";

  return (
    <article className="overflow-hidden rounded-2xl border bg-card shadow-sm transition-shadow hover:shadow-md">
      <div className="grid md:grid-cols-[240px_1fr]">
        <div className="relative min-h-48 bg-muted">
          {item.mediaUrl ? (
            <img
              src={item.mediaUrl}
              alt={`Source evidence for ${item.project}`}
              className="h-full min-h-48 w-full object-cover"
              onError={(e) => {
                e.currentTarget.style.display = "none";
              }}
            />
          ) : (
            <div className="grid h-full min-h-48 place-items-center text-muted-foreground">
              <ImageOff className="h-8 w-8 opacity-40" />
            </div>
          )}
          <span
            className={`absolute left-3 top-3 rounded-full px-2.5 py-0.5 text-xs font-semibold backdrop-blur-sm shadow-sm ${
              item.status === "confirmed"
                ? "bg-emerald-500/90 text-white"
                : item.status === "false_positive"
                ? "bg-rose-500/90 text-white"
                : item.status === "needs_inspection"
                ? "bg-amber-500/90 text-white"
                : "bg-background/90 text-foreground"
            }`}
          >
            {statusLabel(item.status)}
          </span>
        </div>

        <div className="space-y-4 p-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2 className="text-lg font-bold tracking-tight">{item.project}</h2>
              <p className="text-sm text-muted-foreground">{item.location}</p>
            </div>
            <Link
              to="/media/$id"
              params={{ id: item.mediaId }}
              className="inline-flex items-center gap-1 text-sm font-semibold text-primary hover:underline"
            >
              Evidence Passport <ExternalLink className="h-3.5 w-3.5" />
            </Link>
          </div>

          <div className="grid gap-3 text-sm sm:grid-cols-3">
            <div className="rounded-xl bg-muted/60 p-3">
              <div className="mb-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                AI observation
              </div>
              <div className="text-xs leading-5">{item.aiObservation}</div>
            </div>

            <div className="rounded-xl bg-muted/60 p-3">
              <div className="mb-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Category / Risk
              </div>
              <div className="flex items-center gap-1 text-xs font-medium">
                <AlertTriangle className="h-3.5 w-3.5 text-amber-500 shrink-0" />
                {item.category || "Requires review"}
              </div>
            </div>

            <div className="rounded-xl bg-muted/60 p-3">
              <div className="mb-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Confidence / Timestamp
              </div>
              <div className="text-xs font-semibold">{item.confidence}%</div>
              <div className="text-[11px] text-muted-foreground mt-0.5">
                {formatTimestamp(item.timestamp)}
              </div>
            </div>
          </div>

          {/* If finalised, DO NOT show remaining action buttons! Show finalised banner instead. */}
          {isFinalised ? (
            <div
              className={`flex flex-wrap items-center justify-between gap-3 rounded-xl border p-3.5 text-xs ${
                item.status === "confirmed"
                  ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-800 dark:text-emerald-300"
                  : item.status === "false_positive"
                  ? "border-rose-500/30 bg-rose-500/10 text-rose-800 dark:text-rose-300"
                  : "border-amber-500/30 bg-amber-500/10 text-amber-800 dark:text-amber-300"
              }`}
            >
              <div className="flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 shrink-0" />
                <span>
                  <strong>Status Finalised:</strong> {statusLabel(item.status)}
                  {item.comment ? ` · Note: "${item.comment}"` : ""}
                </span>
              </div>

              <button
                type="button"
                onClick={() => onUpdate(item, "pending")}
                disabled={updating}
                className="inline-flex items-center gap-1 rounded-lg border border-current/30 px-2.5 py-1 text-xs font-semibold hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
              >
                <RotateCcw className="h-3 w-3" />
                Re-open for review
              </button>
            </div>
          ) : (
            <>
              <Textarea
                value={comment}
                onChange={(event) => onComment(event.target.value)}
                maxLength={1000}
                placeholder="Add a reviewer verification comment (optional)..."
                className="min-h-16 resize-y rounded-xl text-xs"
              />

              <div className="flex flex-wrap items-center gap-2 pt-1">
                <Button
                  size="sm"
                  onClick={() => onUpdate(item, "confirmed")}
                  disabled={updating}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white gap-1.5"
                >
                  <Check className="h-4 w-4" />
                  Confirm
                </Button>

                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => onUpdate(item, "needs_inspection")}
                  disabled={updating}
                  className="gap-1.5"
                >
                  <AlertTriangle className="h-4 w-4 text-amber-500" />
                  Needs inspection
                </Button>

                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => onUpdate(item, "false_positive")}
                  disabled={updating}
                  className="gap-1.5 hover:bg-destructive/10 hover:text-destructive hover:border-destructive/40"
                >
                  <X className="h-4 w-4 text-rose-500" />
                  False positive
                </Button>

                {updating && (
                  <Loader2 className="ml-1 h-4 w-4 animate-spin self-center text-muted-foreground" />
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </article>
  );
}

function statusLabel(status: VerificationStatus) {
  return status === "confirmed"
    ? "Confirmed"
    : status === "false_positive"
    ? "False positive"
    : status === "needs_inspection"
    ? "Needs inspection"
    : "Pending review";
}

function formatTimestamp(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString();
}
