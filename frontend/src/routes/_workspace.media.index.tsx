import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Upload, Images, Plus } from "lucide-react";
import { PageHeader } from "@/components/app-shell";
import { AssetCard } from "@/components/evidence";
import { UploadDialog } from "@/components/upload-dialog";
import type { Asset, Project } from "@/lib/demo-data";
import { getMedia, getProjects } from "@/lib/api";

export const Route = createFileRoute("/_workspace/media/")({
  head: () => ({
    meta: [
      { title: "Media Intelligence — ImpactLens" },
      { name: "description", content: "Every field photo and video, analysed and tagged by AI." },
      { property: "og:title", content: "Media Intelligence — ImpactLens" },
      { property: "og:description", content: "AI-analysed field media library." },
    ],
  }),
  component: Media,
});

function Media() {
  const [open, setOpen] = useState(false);
  const [project, setProject] = useState("all");
  const [type, setType] = useState("all");
  const [status, setStatus] = useState("all");
  const [minConf, setMinConf] = useState(0);
  const [tag, setTag] = useState("");
  const [assets, setAssets] = useState<Asset[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    setLoading(true);
    Promise.all([getProjects(), getMedia()])
      .then(([projectData, mediaData]) => {
        setProjects(projectData);
        setAssets(mediaData);
      })
      .catch((err: Error) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  const list = useMemo(
    () =>
      assets.filter(
        (a) =>
          (project === "all" || a.projectId === project) &&
          (type === "all" || a.type === type) &&
          (status === "all" || a.status === status) &&
          a.confidence >= minConf &&
          (!tag ||
            a.tags.some((t) => t.toLowerCase().includes(tag.toLowerCase())) ||
            a.location.toLowerCase().includes(tag.toLowerCase()) ||
            a.title.toLowerCase().includes(tag.toLowerCase()))
      ),
    [assets, project, type, status, minConf, tag]
  );

  const sel = "h-9 rounded-lg border bg-card px-2 text-sm";

  return (
    <>
      <PageHeader
        title="Media Intelligence"
        subtitle={`${assets.length} evidence asset${assets.length === 1 ? "" : "s"} stored in Cloudinary and analyzed by AI vision`}
        actions={
          <button
            onClick={() => setOpen(true)}
            className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-sm hover:opacity-90"
          >
            <Upload className="h-4 w-4" />
            Upload Media
          </button>
        }
      />

      {error && (
        <div className="mb-6 rounded-lg border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">
          {error}
        </div>
      )}

      {assets.length > 0 && (
        <div className="mb-6 flex flex-wrap items-center gap-2 rounded-xl border bg-card p-3">
          <select className={sel} value={project} onChange={(e) => setProject(e.target.value)} aria-label="Project">
            <option value="all">All projects</option>
            {projects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
          <select className={sel} value={type} onChange={(e) => setType(e.target.value)} aria-label="Media type">
            <option value="all">All media</option>
            <option value="image">Images</option>
            <option value="video">Videos</option>
          </select>
          <select className={sel} value={status} onChange={(e) => setStatus(e.target.value)} aria-label="Status">
            <option value="all">Any status</option>
            <option value="verified">Verified</option>
            <option value="review">Needs review</option>
            <option value="unverified">Unverified</option>
          </select>
          <input
            className={`${sel} w-48`}
            placeholder="Search tag, title or location"
            value={tag}
            onChange={(e) => setTag(e.target.value)}
          />
          <label className="flex items-center gap-2 text-sm text-muted-foreground">
            Confidence ≥ {minConf}%
            <input
              type="range"
              min={0}
              max={95}
              step={5}
              value={minConf}
              onChange={(e) => setMinConf(+e.target.value)}
              className="accent-primary"
            />
          </label>
          <span className="ml-auto text-sm text-muted-foreground">{list.length} results</span>
        </div>
      )}

      {loading ? (
        <div className="py-12 text-center text-sm text-muted-foreground">Loading evidence library...</div>
      ) : assets.length === 0 ? (
        <div className="rounded-2xl border-2 border-dashed bg-card/60 p-12 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <Images className="h-7 w-7" />
          </div>
          <h2 className="mt-4 font-display text-2xl font-bold">No evidence uploaded yet</h2>
          <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
            Upload your own field photos or videos. They will be stored in your Cloudinary account and analyzed with vision AI.
          </p>
          <button
            onClick={() => setOpen(true)}
            className="mt-6 inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-sm hover:opacity-90"
          >
            <Upload className="h-4 w-4" />
            Upload Your First Image / Video
          </button>
        </div>
      ) : list.length === 0 ? (
        <div className="rounded-xl border bg-card p-12 text-center text-sm text-muted-foreground">
          No media matches the selected filters.
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
          {list.map((a) => (
            <AssetCard key={a.id} asset={a} />
          ))}
        </div>
      )}

      {open && (
        <UploadDialog
          projectId={project !== "all" ? project : projects[0]?.id}
          onUploaded={(asset) => {
            setAssets((current) => [asset, ...current]);
          }}
          onClose={() => setOpen(false)}
        />
      )}
    </>
  );
}
