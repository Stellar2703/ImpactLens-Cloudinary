import { useState } from "react";
import { AIBadge } from "./evidence";
import { cn } from "@/lib/utils";

type Mode = "side" | "swipe" | "diff";

export function CompareView({ before, after, beforeLabel = "Before", afterLabel = "After" }: { before: string; after: string; beforeLabel?: string; afterLabel?: string }) {
  const [mode, setMode] = useState<Mode>("swipe");
  const [pos, setPos] = useState(50);
  const [layer, setLayer] = useState<"original" | "difference" | "overlay">("overlay");
  const tab = (on: boolean) => cn("rounded-md px-3 py-1.5 text-sm font-medium", on ? "bg-card shadow-sm" : "text-muted-foreground");

  return (
    <div>
      <div className="mb-3 inline-flex rounded-lg bg-muted p-1">
        <button className={tab(mode === "side")} onClick={() => setMode("side")}>Side by side</button>
        <button className={tab(mode === "swipe")} onClick={() => setMode("swipe")}>Swipe</button>
        <button className={tab(mode === "diff")} onClick={() => setMode("diff")}>AI Change Map</button>
      </div>

      {mode === "side" && (
        <div className="grid gap-3 md:grid-cols-2">
          {[[before, beforeLabel], [after, afterLabel]].map(([src, l]) => (
            <div key={l} className="relative flex min-h-[160px] items-center justify-center overflow-hidden rounded-xl bg-muted">
              {src ? (
                <img src={src} alt={l} className="aspect-[4/3] w-full object-cover" />
              ) : (
                <div className="text-xs text-muted-foreground">No image available</div>
              )}
              <span className="absolute left-3 top-3 rounded bg-navy/80 px-2 py-0.5 text-xs font-semibold text-navy-foreground">{l}</span>
            </div>
          ))}
        </div>
      )}

      {mode === "swipe" && (
        <div className="relative aspect-[16/10] select-none overflow-hidden rounded-xl bg-muted">
          {after ? (
            <img src={after} alt={afterLabel} className="absolute inset-0 h-full w-full object-cover" />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center text-xs text-muted-foreground">No follow-up image</div>
          )}
          <div className="absolute inset-0 overflow-hidden" style={{ clipPath: `inset(0 ${100 - pos}% 0 0)` }}>
            {before ? (
              <img src={before} alt={beforeLabel} className="absolute inset-0 h-full w-full object-cover" />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center text-xs text-muted-foreground">No baseline image</div>
            )}
          </div>
          <div className="pointer-events-none absolute inset-y-0 w-0.5 bg-card" style={{ left: `${pos}%` }}>
            <div className="absolute top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-card px-2 py-1 text-xs font-bold shadow">⇆</div>
          </div>
          <span className="absolute left-3 top-3 rounded bg-navy/80 px-2 py-0.5 text-xs font-semibold text-navy-foreground">{beforeLabel}</span>
          <span className="absolute right-3 top-3 rounded bg-primary px-2 py-0.5 text-xs font-semibold text-primary-foreground">{afterLabel}</span>
          <input aria-label="Swipe comparison" type="range" min={0} max={100} value={pos} onChange={(e) => setPos(+e.target.value)} className="absolute inset-0 h-full w-full cursor-ew-resize opacity-0" />
        </div>
      )}

      {mode === "diff" && (
        <div>
          <div className="mb-3 flex items-center gap-2">
            {(["original", "difference", "overlay"] as const).map((l) => (
              <button key={l} onClick={() => setLayer(l)} className={cn("rounded-full border px-3 py-1 text-xs font-semibold capitalize", layer === l && "border-primary bg-accent")}>{l}</button>
            ))}
            <span className="ml-auto"><AIBadge label="AI-generated · visual observations" /></span>
          </div>
          <div className="relative aspect-[16/10] overflow-hidden rounded-xl bg-navy">
            {after ? (
              <img src={after} alt="Change map" className={cn("absolute inset-0 h-full w-full object-cover transition", layer === "difference" && "opacity-15 grayscale")} />
            ) : null}
            {layer !== "original" && (
              <svg viewBox="0 0 100 62" preserveAspectRatio="none" className="absolute inset-0 h-full w-full">
                <path d="M30 40 L60 34 L78 42 L86 62 L22 62 Z" fill="var(--success)" fillOpacity={0.45} stroke="var(--success)" strokeWidth="0.4" />
                <path d="M84 50 L98 46 L98 62 L90 62 Z" fill="var(--info)" fillOpacity={0.45} stroke="var(--info)" strokeWidth="0.4" />
                <rect x="4" y="44" width="12" height="10" rx="1" fill="var(--warning)" fillOpacity={0.5} stroke="var(--warning)" strokeWidth="0.4" />
                <rect x="40" y="18" width="16" height="7" rx="1" fill="var(--destructive)" fillOpacity={0.4} stroke="var(--destructive)" strokeWidth="0.4" />
              </svg>
            )}
          </div>
          <div className="mt-3 flex flex-wrap gap-4 text-xs">
            {[["New", "bg-success"], ["Removed", "bg-destructive"], ["Changed", "bg-warning"], ["Water detected", "bg-info"], ["Unchanged", "bg-muted-foreground/30"]].map(([l, c]) => (
              <span key={l} className="inline-flex items-center gap-1.5"><span className={`h-2.5 w-2.5 rounded-sm ${c}`} />{l}</span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export function DetectedChanges({ items, explanation, confidence, label = "AI-generated" }: { items: [string, string][]; explanation: string; confidence: number; label?: string }) {
  return (
    <div>
      <div className="mb-3 flex items-center justify-between"><h3 className="text-lg">Detected changes</h3><AIBadge label={label} /></div>
      <div className="space-y-2">
        {items.map(([k, v]) => (
          <div key={k} className="flex items-center justify-between rounded-lg bg-muted px-3 py-2 text-sm">{k}<span className="font-display text-lg">{v}</span></div>
        ))}
      </div>
      <p className="mt-4 rounded-lg border-l-2 border-primary bg-accent/50 p-3 text-sm italic">"{explanation}"</p>
      <div className="mt-3 text-xs text-muted-foreground">Model confidence {confidence}% · AI observations should be confirmed by a reviewer.</div>
    </div>
  );
}
