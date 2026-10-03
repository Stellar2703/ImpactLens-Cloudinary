import { useState, useEffect } from "react";
import { Link } from "@tanstack/react-router";
import { PlayCircle, MapPin, Calendar, CheckCircle2, AlertCircle, CircleDashed, XCircle, Sparkles, ImageOff } from "lucide-react";
import { getProject, type Asset, type Status } from "@/lib/demo-data";
import { cn } from "@/lib/utils";

const statusMeta: Record<Status, { label: string; cls: string; icon: typeof CheckCircle2 }> = {
  verified: { label: "Verified", cls: "bg-success/12 text-success", icon: CheckCircle2 },
  review: { label: "Needs review", cls: "bg-warning/15 text-warning", icon: AlertCircle },
  unverified: { label: "Unverified", cls: "bg-muted text-muted-foreground", icon: CircleDashed },
  rejected: { label: "Rejected", cls: "bg-destructive/10 text-destructive", icon: XCircle },
};

export function StatusBadge({ status }: { status: Status }) {
  const m = statusMeta[status];
  return (
    <span className={cn("inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold", m.cls)}>
      <m.icon className="h-3 w-3" />{m.label}
    </span>
  );
}

export function AIBadge({ label = "AI-generated" }: { label?: string }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-accent px-2 py-0.5 text-[11px] font-semibold text-accent-foreground">
      <Sparkles className="h-3 w-3" />{label}
    </span>
  );
}

export function Confidence({ value }: { value: number }) {
  return (
    <div className="flex items-center gap-2">
      <div className="h-1.5 w-16 overflow-hidden rounded-full bg-muted">
        <div className="h-full rounded-full bg-primary" style={{ width: `${value}%` }} />
      </div>
      <span className="font-mono text-xs">{value}%</span>
    </div>
  );
}

export function AssetCard({ asset }: { asset: Asset }) {
  const p = getProject(asset.projectId);
  const [imgSrc, setImgSrc] = useState(asset.src);
  const [hasError, setHasError] = useState(!asset.src);

  useEffect(() => {
    setImgSrc(asset.src);
    setHasError(!asset.src);
  }, [asset.src]);

  const handleImageError = () => {
    if (asset.originalUrl && imgSrc !== asset.originalUrl) {
      setImgSrc(asset.originalUrl);
    } else {
      setHasError(true);
    }
  };

  return (
    <div
      className="group overflow-hidden rounded-xl border bg-card transition-all hover:-translate-y-0.5 hover:shadow-lg">
      <Link to="/media/$id" params={{ id: asset.id }} className="block">
        <div className="relative aspect-[4/3] overflow-hidden bg-muted">
          {!hasError && imgSrc ? (
            <img
              src={imgSrc}
              alt={asset.title}
              loading="lazy"
              width={1024}
              height={768}
              onError={handleImageError}
              className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-muted-foreground">
              <ImageOff className="h-8 w-8 opacity-40" />
            </div>
          )}
          {asset.type === "video" && (
            <span className="absolute left-2 top-2 inline-flex items-center gap-1 rounded-md bg-navy/80 px-1.5 py-0.5 text-[11px] font-semibold text-navy-foreground">
              <PlayCircle className="h-3 w-3" /> 0:{String(20 + (asset.confidence % 40)).padStart(2, "0")}
            </span>
          )}
          <span className="absolute right-2 top-2"><StatusBadge status={asset.status} /></span>
        </div>
      </Link>
      <div className="space-y-2 p-3">
        <div className="flex items-center justify-between gap-2">
          {asset.projectId ? (
            <Link
              to="/projects/$id"
              params={{ id: asset.projectId }}
              className="truncate text-xs font-semibold text-primary hover:underline"
              title={asset.projectName || p?.name || "Project"}
            >
              {asset.projectName || p?.name || "Project"}
            </Link>
          ) : (
            <span className="truncate text-xs font-semibold text-primary">{asset.projectName || p?.name || "Project"}</span>
          )}
          <span className="shrink-0 font-mono text-[11px] text-muted-foreground">{asset.id}</span>
        </div>
        <Link to="/media/$id" params={{ id: asset.id }} className="block space-y-2">
          <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted-foreground">
            <span className="inline-flex items-center gap-1"><MapPin className="h-3 w-3" />{asset.location.split(",")[0]}</span>
            <span className="inline-flex items-center gap-1"><Calendar className="h-3 w-3" />{asset.date}</span>
          </div>
          <div className="flex flex-wrap gap-1">
            {(asset.tags || []).slice(0, 4).map((t) => <span key={t} className="rounded bg-secondary px-1.5 py-0.5 text-[11px] text-secondary-foreground">{t}</span>)}
          </div>
          <div className="flex items-center justify-between pt-1 text-xs text-muted-foreground">AI confidence <Confidence value={asset.confidence} /></div>
        </Link>
      </div>
    </div>
  );
}

export function Stat({ label, value, delta, icon: Icon }: { label: string; value: string; delta?: string; icon?: typeof CheckCircle2 }) {
  return (
    <div className="rounded-xl border bg-card p-4">
      <div className="flex items-center justify-between text-xs font-medium text-muted-foreground">
        {label}{Icon && <Icon className="h-4 w-4 text-primary" />}
      </div>
      <div className="mt-2 font-display text-3xl font-medium">{value}</div>
      {delta && <div className="mt-1 text-xs font-semibold text-success">{delta}</div>}
    </div>
  );
}

export function Card({ title, action, children, className }: { title?: string; action?: React.ReactNode; children: React.ReactNode; className?: string }) {
  return (
    <section className={cn("min-w-0 rounded-xl border bg-card p-5", className)}>
      {title && <div className="mb-4 flex items-center justify-between"><h2 className="text-lg font-medium">{title}</h2>{action}</div>}
      {children}
    </section>
  );
}

export function IndiaMap({ points, onSelect, active }: { points: { id: string; x: number; y: number; label: string }[]; onSelect?: (id: string) => void; active?: string }) {
  const displayPoints = points.map((point, index) => {
    const cluster = points.filter((candidate) => Math.abs(candidate.x - point.x) < 8 && Math.abs(candidate.y - point.y) < 8);
    if (cluster.length < 2) return point;

    const clusterIndex = cluster.findIndex((candidate) => candidate.id === point.id);
    const offsets = [
      { x: -4, y: -3 },
      { x: 4, y: -3 },
      { x: -4, y: 4 },
      { x: 4, y: 4 },
    ];
    const offset = offsets[clusterIndex % offsets.length];
    return { ...point, x: point.x + offset.x, y: point.y + offset.y };
  });

  return (
    <div className="relative aspect-[4/5] w-full overflow-hidden rounded-lg bg-navy">
      <svg viewBox="0 0 100 125" className="absolute inset-0 h-full w-full">
        <defs>
          <pattern id="dots" width="3" height="3" patternUnits="userSpaceOnUse"><circle cx="1.5" cy="1.5" r="0.35" fill="currentColor" /></pattern>
        </defs>
        <path className="text-navy-foreground/25" fill="url(#dots)"
          d="M30 8 L45 5 L55 10 L62 8 L70 14 L66 22 L78 26 L90 30 L88 38 L76 40 L70 46 L66 56 L60 66 L56 80 L52 96 L48 108 L44 100 L40 88 L34 76 L30 64 L22 58 L14 50 L18 42 L24 36 L22 26 L28 18 Z" />
      </svg>
      {displayPoints.map((pt) => (
        <button key={pt.id} onClick={() => onSelect?.(pt.id)} style={{ left: `${pt.x}%`, top: `${pt.y * 0.8}%` }}
          className="group absolute -translate-x-1/2 -translate-y-1/2" aria-label={pt.label}>
          <span className={cn("absolute inset-0 animate-ping rounded-full bg-sidebar-primary/50", active === pt.id ? "" : "opacity-60")} />
          <span className={cn("relative block h-3 w-3 rounded-full border-2 border-navy bg-sidebar-primary", active === pt.id && "h-4 w-4")} />
          <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 whitespace-nowrap rounded bg-card px-2 py-0.5 text-[11px] font-semibold text-card-foreground opacity-0 shadow group-hover:opacity-100">{pt.label}</span>
        </button>
      ))}
    </div>
  );
}
