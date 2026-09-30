// Modular AI service. Demo Mode returns simulated results; swap implementations
// for real vision / embedding / LLM providers without touching the UI.
import { assets, projects, type Asset } from "./demo-data";

export const DEMO_MODE = true;

export const analysisStages = [
  "Uploading", "Generating thumbnail", "Detecting objects", "Extracting metadata",
  "Analyzing scene", "Generating semantic tags", "Detecting project relevance", "Creating embeddings",
];

export interface SearchResult { asset: Asset; score: number; reason: string }
export interface SearchResponse { interpretation: string[]; results: SearchResult[] }

const keywordMap: Record<string, string[]> = {
  water: ["water", "tank", "pipe"], vegetation: ["vegetation", "reforest", "sapling", "green", "wetland", "tree"],
  solar: ["solar", "energy", "panel"], waste: ["waste", "plastic", "beach", "coast", "cleanup"],
  infra: ["road", "infrastructure", "building", "centre", "center"],
};
const projectForKey: Record<string, string> = { water: "water", vegetation: "greenrise", solar: "solar", waste: "coastal", infra: "infra" };

export function semanticSearch(query: string): SearchResponse {
  const q = query.toLowerCase();
  const matched = Object.entries(keywordMap).filter(([, kws]) => kws.some((k) => q.includes(k))).map(([k]) => k);
  const keys = matched.length ? matched : ["vegetation", "water"];
  const wantsAfter = /after|completed|increase|reduction|restored/.test(q);
  const wantsBefore = /before/.test(q);
  const place = projects.flatMap((p) => p.location.split(", ")).find((pl) => q.includes(pl.toLowerCase()));
  const interpretation = [
    `Topic: ${keys.map((k) => ({ water: "water infrastructure", vegetation: "vegetation & restoration", solar: "solar energy", waste: "waste reduction", infra: "community infrastructure" }[k])).join(", ")}`,
    wantsBefore && wantsAfter ? "Evidence type: before/after pairs" : wantsAfter ? "Phase: completed / outcome evidence" : "Phase: all project stages",
    place ? `Location: near ${place}` : "Location: all regions",
    /2026|june|jun/.test(q) ? "Time: after June 2026" : "Time: full project timeline",
  ];
  const results = assets
    .filter((a) => keys.some((k) => a.projectId === projectForKey[k]))
    .filter((a) => (wantsBefore && wantsAfter ? a.phase !== "during" : wantsAfter ? a.phase !== "before" : true))
    .map((a) => ({
      asset: a,
      score: Math.min(99, a.confidence - (a.phase === "during" ? 6 : 0)),
      reason: `Scene "${a.scene.toLowerCase()}" with ${a.objects.slice(0, 2).join(" and ").toLowerCase()} detected; ${a.phase} phase, ${(a.signals[0] ?? "").toLowerCase()} signal.`,
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, 9);
  return { interpretation, results };
}

export const storySteps = [
  "Selecting project evidence", "Analyzing the timeline", "Selecting strongest visual evidence",
  "Comparing before and after", "Extracting measurable changes", "Writing executive summary",
  "Composing visual story", "Producing report preview",
];

export function wait(ms: number) { return new Promise((r) => setTimeout(r, ms)); }
