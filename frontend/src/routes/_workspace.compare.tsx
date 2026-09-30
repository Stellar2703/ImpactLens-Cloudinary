import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { PageHeader } from "@/components/app-shell";
import { CompareView, DetectedChanges } from "@/components/compare-view";
import { Card } from "@/components/evidence";
import { compareMedia, getMedia, getProjects } from "@/lib/api";
import type { Asset, Project } from "@/lib/demo-data";
import { Loader2, Plus, Sparkles } from "lucide-react";

export const Route = createFileRoute("/_workspace/compare")({ component: Page });

function Page() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [assets, setAssets] = useState<Asset[]>([]);
  const [projectId, setProjectId] = useState("");
  const [beforeId, setBeforeId] = useState("");
  const [afterId, setAfterId] = useState("");
  const [result, setResult] = useState<any>();
  const [loading, setLoading] = useState(true);
  const [comparing, setComparing] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    setLoading(true);
    Promise.all([getProjects(), getMedia()])
      .then(([loadedProjects, loadedAssets]) => {
        setProjects(loadedProjects);
        setAssets(loadedAssets);
        if (loadedProjects.length > 0) {
          const projectWithAssets =
            loadedProjects.find((p) => loadedAssets.filter((a) => a.projectId === p.id).length >= 2) ||
            loadedProjects[0];
          setProjectId(projectWithAssets.id);
        }
      })
      .catch((err: Error) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  const projectAssets = useMemo(() => assets.filter((asset) => asset.projectId === projectId), [assets, projectId]);

  useEffect(() => {
    setBeforeId(projectAssets[0]?.id || "");
    setAfterId(projectAssets[1]?.id || "");
    setResult(undefined);
  }, [projectId, projectAssets]);

  const before = projectAssets.find((asset) => asset.id === beforeId);
  const after = projectAssets.find((asset) => asset.id === afterId);

  async function runComparison() {
    if (!before || !after || before.id === after.id) return;
    setComparing(true);
    setError("");
    try {
      const cmp = await compareMedia({ projectId, beforeMediaId: before.id, afterMediaId: after.id });
      setResult(cmp);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to compare evidence");
    } finally {
      setComparing(false);
    }
  }

  return (
    <>
      <PageHeader
        title="Visual Change Detection"
        subtitle="Select baseline (Before) and monitoring (After) evidence to detect environmental & infrastructure changes."
      />

      {error && (
        <p className="mb-4 rounded-md border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
          <strong>Comparison error:</strong> {error}
        </p>
      )}

      {loading ? (
        <div className="flex items-center gap-2 py-12 text-sm text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin text-primary" />
          Loading projects and media...
        </div>
      ) : projects.length === 0 ? (
        <div className="rounded-xl border-2 border-dashed bg-card/60 p-12 text-center">
          <h2 className="text-xl font-bold">No projects yet</h2>
          <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
            Create a project and upload at least two evidence assets to run visual change detection.
          </p>
          <Link
            to="/projects"
            className="mt-5 inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground"
          >
            <Plus className="h-4 w-4" />
            Create Project
          </Link>
        </div>
      ) : (
        <>
          <div className="mb-6 flex flex-wrap items-center gap-3">
            <select
              value={projectId}
              onChange={(e) => setProjectId(e.target.value)}
              className="rounded-md border bg-background px-3 py-2 text-sm font-medium"
            >
              {projects.map((project) => (
                <option key={project.id} value={project.id}>
                  {project.name}
                </option>
              ))}
            </select>

            <select
              value={beforeId}
              onChange={(e) => setBeforeId(e.target.value)}
              className="rounded-md border bg-background px-3 py-2 text-sm"
              disabled={projectAssets.length < 2}
            >
              <option value="" disabled>
                Select baseline (Before)
              </option>
              {projectAssets.map((asset) => (
                <option key={asset.id} value={asset.id}>
                  Before: {asset.title}
                </option>
              ))}
            </select>

            <select
              value={afterId}
              onChange={(e) => setAfterId(e.target.value)}
              className="rounded-md border bg-background px-3 py-2 text-sm"
              disabled={projectAssets.length < 2}
            >
              <option value="" disabled>
                Select monitoring (After)
              </option>
              {projectAssets.map((asset) => (
                <option key={asset.id} value={asset.id}>
                  After: {asset.title}
                </option>
              ))}
            </select>

            <button
              onClick={() => void runComparison()}
              disabled={!before || !after || before.id === after.id || comparing}
              className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground disabled:opacity-50"
            >
              {comparing ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Analyzing differences...
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4" />
                  Run AI Change Detection
                </>
              )}
            </button>
          </div>

          {before && after && before.id !== after.id ? (
            <div className="grid gap-6 xl:grid-cols-[1.6fr_1fr]">
              <Card>
                <CompareView
                  before={before.src}
                  after={after.src}
                  beforeLabel={`Before · ${before.title}`}
                  afterLabel={`After · ${after.title}`}
                />
              </Card>

              <Card title="AI Analysis Findings">
                {result ? (
                  <DetectedChanges
                    label="AI-generated"
                    confidence={Math.round((result.detailedAnalysis?.confidence || result.confidence || 0.85) * 100)}
                    items={(
                      result.detailedAnalysis?.visibleChanges ||
                      result.visibleChanges || [result.summary || "Change recorded."]
                    ).map((change: string, index: number) => [`Observation ${index + 1}`, change])}
                    explanation={result.description || result.summary}
                  />
                ) : (
                  <div className="space-y-4 text-sm text-muted-foreground">
                    <p>
                      Click <strong>Run AI Change Detection</strong> to analyze visual differences between the baseline and progress photos.
                    </p>
                    <p className="rounded-lg border-l-2 border-warning bg-warning/5 p-3 text-xs">
                      Visual comparison evaluates terrain, canopy, structures, and evidence progress directly from Cloudinary.
                    </p>
                  </div>
                )}
              </Card>
            </div>
          ) : (
            <div className="rounded-xl border bg-card p-10 text-center text-sm text-muted-foreground">
              {projectAssets.length < 2 ? (
                <>
                  This project has {projectAssets.length} asset(s). Upload at least two assets to enable Before / After comparison.
                  <div className="mt-4">
                    <Link
                      to="/media"
                      className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 font-semibold text-primary-foreground"
                    >
                      <Plus className="h-4 w-4" />
                      Upload Evidence to {projects.find((p) => p.id === projectId)?.name || "Project"}
                    </Link>
                  </div>
                </>
              ) : (
                "Select two different evidence assets above to compare them side by side."
              )}
            </div>
          )}
        </>
      )}
    </>
  );
}
