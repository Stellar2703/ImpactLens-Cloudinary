import { useEffect, useState, useMemo } from "react";
import { useSearch, Link } from "@tanstack/react-router";
import { Search, ExternalLink, Sparkles, MapPin, Calendar, FolderKanban, CheckCircle2, ArrowRight, RotateCcw, Filter, Layers } from "lucide-react";
import { getProjects, searchMedia } from "@/lib/api";
import type { Project } from "@/lib/demo-data";
import { AssetCard, AIBadge } from "./evidence";

const examples = ["Find tree planting evidence", "Show vegetation near infrastructure", "Find flood-damaged roads", "Lake cleanup"];

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

  useEffect(() => {
    getProjects()
      .then(setProjects)
      .catch((err: Error) => setError(err.message));
  }, []);

  const searchNeedle = useMemo(() => {
    return (run.trim() || q.trim()).toLowerCase();
  }, [run, q]);

  // Filter projects: initially show all, or filter to a particular project when searched or selected
  const filteredProjects = useMemo(() => {
    if (projectId !== "all") {
      return projects.filter((p) => p.id === projectId);
    }
    if (searchNeedle) {
      return projects.filter((p) => {
        const nameMatch = p.name.toLowerCase().includes(searchNeedle);
        const locMatch = p.location?.toLowerCase().includes(searchNeedle);
        const catMatch = p.category?.toLowerCase().includes(searchNeedle);
        const descMatch = p.description?.toLowerCase().includes(searchNeedle);
        const objMatch = (p.objectives || []).some((o) => o.toLowerCase().includes(searchNeedle));
        return nameMatch || locMatch || catMatch || descMatch || objMatch;
      });
    }
    return projects;
  }, [projects, projectId, searchNeedle]);

  useEffect(() => {
    const hasFilter = projectId !== "all" || type !== "all" || verificationStatus !== "all" || Boolean(date);
    if (!run.trim() && !hasFilter) {
      setResults([]);
      return;
    }
    setLoading(true);
    searchMedia(run, { projectId, type, verificationStatus, date })
      .then(setResults)
      .catch((err: Error) => setError(err.message))
      .finally(() => setLoading(false));
  }, [run, projectId, type, verificationStatus, date]);

  const submit = (value = q) => {
    setError("");
    setQ(value);
    setRun(value);
  };

  const resetAllFilters = () => {
    setQ("");
    setRun("");
    setProjectId("all");
    setType("all");
    setVerificationStatus("all");
    setDate("");
    setResults([]);
    setError("");
  };

  const isFiltered = projectId !== "all" || searchNeedle.length > 0 || type !== "all" || verificationStatus !== "all" || Boolean(date);

  return (
    <div className="space-y-8">
      {/* Search Input Bar */}
      <div>
        <form
          onSubmit={(event) => {
            event.preventDefault();
            submit();
          }}
          className="relative"
        >
          <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
          <input
            value={q}
            onChange={(event) => setQ(event.target.value)}
            placeholder="Search projects by name, location, category, or ask about field evidence..."
            className="h-16 w-full rounded-2xl border bg-card pl-12 pr-32 text-base shadow-sm outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/20"
          />
          <button
            type="submit"
            className="absolute right-2.5 top-2.5 h-11 rounded-xl bg-primary px-6 text-sm font-semibold text-primary-foreground shadow-sm hover:opacity-90 transition-opacity"
          >
            Search
          </button>
        </form>

        <div className="mt-3 flex flex-wrap items-center gap-2">
          <span className="text-xs text-muted-foreground">Quick queries:</span>
          {examples.map((example) => (
            <button
              key={example}
              type="button"
              onClick={() => submit(example)}
              className="rounded-full border bg-card px-3 py-1 text-xs text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
            >
              {example}
            </button>
          ))}
          {isFiltered && (
            <button
              type="button"
              onClick={resetAllFilters}
              className="ml-auto inline-flex items-center gap-1.5 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-semibold text-primary hover:bg-primary/20 transition-colors"
            >
              <RotateCcw className="h-3 w-3" />
              Reset all filters
            </button>
          )}
        </div>
      </div>

      {/* Filter Bar */}
      <div className="grid gap-3 rounded-2xl border bg-card p-4 shadow-sm md:grid-cols-4">
        <div>
          <label className="mb-1 block text-xs font-medium text-muted-foreground">Project</label>
          <select
            aria-label="Project"
            value={projectId}
            onChange={(event) => setProjectId(event.target.value)}
            className="h-10 w-full rounded-lg border bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
          >
            <option value="all">All projects ({projects.length})</option>
            {projects.map((project) => (
              <option key={project.id} value={project.id}>
                {project.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="mb-1 block text-xs font-medium text-muted-foreground">Media Type</label>
          <select
            aria-label="Media type"
            value={type}
            onChange={(event) => setType(event.target.value)}
            className="h-10 w-full rounded-lg border bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
          >
            <option value="all">All media types</option>
            <option value="image">Images</option>
            <option value="video">Videos</option>
          </select>
        </div>

        <div>
          <label className="mb-1 block text-xs font-medium text-muted-foreground">Verification</label>
          <select
            aria-label="Verification status"
            value={verificationStatus}
            onChange={(event) => setVerificationStatus(event.target.value)}
            className="h-10 w-full rounded-lg border bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
          >
            <option value="all">All verification statuses</option>
            <option value="confirmed">Verified</option>
            <option value="needs_inspection">Needs inspection</option>
            <option value="false_positive">Rejected</option>
            <option value="pending">Awaiting review</option>
          </select>
        </div>

        <div>
          <label className="mb-1 block text-xs font-medium text-muted-foreground">Capture Date</label>
          <input
            aria-label="Date"
            type="date"
            value={date}
            onChange={(event) => setDate(event.target.value)}
            className="h-10 w-full rounded-lg border bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
          >
          </input>
        </div>
      </div>

      {/* Projects Section: Initially all projects appear; when searching a particular project, only that one appears */}
      <section className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b pb-3">
          <div className="flex items-center gap-2">
            <FolderKanban className="h-5 w-5 text-primary" />
            <h2 className="text-lg font-bold tracking-tight">
              {filteredProjects.length === projects.length
                ? `All Impact Projects (${projects.length})`
                : `Matching Project${filteredProjects.length === 1 ? "" : "s"} (${filteredProjects.length} of ${projects.length})`}
            </h2>
            {filteredProjects.length !== projects.length && (
              <span className="inline-flex items-center rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-semibold text-primary">
                Filtered
              </span>
            )}
          </div>

          {filteredProjects.length !== projects.length && (
            <button
              onClick={() => {
                setProjectId("all");
                setQ("");
                setRun("");
              }}
              className="text-xs font-medium text-primary hover:underline"
            >
              Show all {projects.length} projects
            </button>
          )}
        </div>

        {filteredProjects.length === 0 ? (
          <div className="rounded-2xl border border-dashed bg-card/40 p-8 text-center">
            <p className="text-sm font-semibold">No projects matched &ldquo;{searchNeedle}&rdquo;</p>
            <p className="mt-1 text-xs text-muted-foreground">
              Try a different keyword, or check the field evidence search results below.
            </p>
            <button
              onClick={() => {
                setProjectId("all");
                setQ("");
                setRun("");
              }}
              className="mt-3 inline-flex items-center gap-1.5 rounded-lg border bg-card px-3 py-1.5 text-xs font-semibold hover:bg-muted"
            >
              <RotateCcw className="h-3 w-3" />
              Reset to view all projects
            </button>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filteredProjects.map((p) => {
              const isSelected = projectId === p.id;
              const evidenceCount = p.metrics?.[0]?.value || 0;
              const milestonesCount = p.milestones?.length || 0;

              return (
                <div
                  key={p.id}
                  className={`group relative flex flex-col justify-between overflow-hidden rounded-2xl border bg-card transition-all hover:shadow-lg ${
                    isSelected ? "ring-2 ring-primary border-primary" : ""
                  }`}
                >
                  <div>
                    {/* Project Header / Cover */}
                    <div className="relative aspect-[16/9] w-full overflow-hidden bg-muted">
                      {p.cover ? (
                        <img
                          src={p.cover}
                          alt={p.name}
                          loading="lazy"
                          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                          onError={(e) => {
                            e.currentTarget.style.display = "none";
                          }}
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-primary/10 via-background to-muted p-4">
                          <FolderKanban className="h-10 w-10 text-primary/40" />
                        </div>
                      )}

                      <span className="absolute left-3 top-3 rounded-full bg-card/90 px-2.5 py-0.5 text-xs font-semibold backdrop-blur-sm shadow-sm">
                        {p.category}
                      </span>
                      <span className="absolute right-3 top-3 rounded-full bg-navy/85 px-2.5 py-0.5 text-xs font-semibold text-navy-foreground backdrop-blur-sm shadow-sm">
                        {p.status}
                      </span>
                    </div>

                    {/* Project Content */}
                    <div className="p-4 space-y-3">
                      <div>
                        <Link
                          to="/projects/$id"
                          params={{ id: p.id }}
                          className="text-base font-bold tracking-tight hover:text-primary transition-colors line-clamp-1"
                        >
                          {p.name}
                        </Link>
                        <p className="mt-1 text-xs text-muted-foreground line-clamp-2">
                          {p.description || "No project description provided."}
                        </p>
                      </div>

                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                        <span className="inline-flex items-center gap-1">
                          <MapPin className="h-3 w-3 shrink-0" />
                          <span className="truncate max-w-[160px]">{p.location}</span>
                        </span>
                        <span className="inline-flex items-center gap-1">
                          <Layers className="h-3 w-3 shrink-0" />
                          <span>{milestonesCount} milestones</span>
                        </span>
                      </div>

                      {/* Impact / Verified Bar */}
                      <div>
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-muted-foreground">Impact &amp; Verified Score</span>
                          <span className="font-mono font-semibold text-foreground">{p.impactScore}%</span>
                        </div>
                        <div className="mt-1 h-1.5 w-full rounded-full bg-muted overflow-hidden">
                          <div
                            className="h-full rounded-full bg-gradient-to-r from-primary to-emerald-500 transition-all duration-500"
                            style={{ width: `${p.impactScore}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Actions footer */}
                  <div className="flex items-center justify-between gap-2 border-t bg-muted/20 px-4 py-3">
                    <button
                      type="button"
                      onClick={() => {
                        if (isSelected) {
                          setProjectId("all");
                        } else {
                          setProjectId(p.id);
                        }
                      }}
                      className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${
                        isSelected
                          ? "bg-primary text-primary-foreground"
                          : "border bg-card hover:bg-muted text-foreground"
                      }`}
                    >
                      <Filter className="h-3 w-3" />
                      {isSelected ? "Filtered (Reset)" : "Focus Project"}
                    </button>

                    <Link
                      to="/projects/$id"
                      params={{ id: p.id }}
                      className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline"
                    >
                      Workspace <ArrowRight className="h-3 w-3" />
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Semantic Search AI Insights Banner */}
      {(run || projectId !== "all") && (
        <div className="rounded-2xl border bg-card p-4 shadow-sm">
          <div className="flex items-center gap-2 text-sm font-semibold">
            <Sparkles className="h-4 w-4 text-primary" />
            Metadata-ranked field evidence
            <AIBadge label="AI observations" />
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            Evidence is ranked using multi-modal AI descriptors, object tags, milestone alignments, geolocations, and verification records.
          </p>
        </div>
      )}

      {/* Error state */}
      {error && (
        <p className="rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
          {error}
        </p>
      )}

      {/* Evidence Results Section */}
      <section className="space-y-4">
        <div className="flex items-center justify-between border-b pb-2">
          <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">
            Field Evidence {results.length > 0 ? `(${results.length} item${results.length === 1 ? "" : "s"})` : ""}
          </h3>
        </div>

        {loading ? (
          <div className="py-12 text-center text-sm text-muted-foreground">
            <div className="inline-block h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent mb-2" />
            <p>Searching persisted field evidence…</p>
          </div>
        ) : (run || projectId !== "all") && !results.length && !error ? (
          <div className="rounded-2xl border border-dashed p-10 text-center">
            <p className="font-semibold">No matching field evidence found</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Try one of the example searches above, broaden the filters, or upload evidence directly to the project.
            </p>
          </div>
        ) : results.length > 0 ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {results.map((result) => (
              <div key={result.asset.id} className="flex flex-col">
                <AssetCard asset={result.asset} />
                <div className="mt-2 flex items-center justify-between gap-2 text-xs text-muted-foreground">
                  <span>
                    <b className="text-foreground">Relevance {result.matchScore}%</b> · {result.matchReason}
                  </span>
                  {result.asset.originalUrl && (
                    <a
                      href={result.asset.originalUrl}
                      target="_blank"
                      rel="noreferrer"
                      onClick={(event) => event.stopPropagation()}
                      className="shrink-0 text-primary hover:underline inline-flex items-center gap-0.5"
                    >
                      <ExternalLink className="inline h-3 w-3" /> Original
                    </a>
                  )}
                </div>
                <p className="mt-1 text-xs text-muted-foreground">
                  AI observation · Confidence {result.asset.confidence}% · {result.asset.status}
                </p>
              </div>
            ))}
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed bg-card/20 p-8 text-center text-xs text-muted-foreground">
            Enter a search term above or select a project to view its ranked field evidence.
          </div>
        )}
      </section>
    </div>
  );
}
