import { useEffect, useState } from "react";
import { UploadCloud, Check, Loader2, X, Plus } from "lucide-react";
import { analysisStages, wait } from "@/lib/ai";
import type { Asset } from "@/lib/demo-data";
import { createProject, getProjects, uploadMedia } from "@/lib/api";
import { AIBadge } from "./evidence";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export function UploadDialog({
  onClose,
  projectId,
  onUploaded,
}: {
  onClose: () => void;
  projectId?: string;
  onUploaded?: (asset: Asset) => void;
}) {
  const [phase, setPhase] = useState<"drop" | "run" | "done">("drop");
  const [stage, setStage] = useState(0);
  const [files, setFiles] = useState<File[]>([]);
  const [previewUrl, setPreviewUrl] = useState("");
  const [error, setError] = useState("");
  const [uploadedAssets, setUploadedAssets] = useState<Asset[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState(projectId || "");
  const [projectOptions, setProjectOptions] = useState<{ id: string; name: string }[]>([]);

  // Inline project creation state
  const [creatingProject, setCreatingProject] = useState(false);
  const [newProjectName, setNewProjectName] = useState("");
  const [newProjectLocation, setNewProjectLocation] = useState("");
  const [newProjectCategory, setNewProjectCategory] = useState("Environment");
  const [newProjectDesc, setNewProjectDesc] = useState("");
  const [savingProject, setSavingProject] = useState(false);

  useEffect(() => {
    getProjects()
      .then((projects) => {
        setProjectOptions(projects);
        if (!selectedProjectId && projects[0]) {
          setSelectedProjectId(projects[0].id);
        } else if (projects.length === 0) {
          setCreatingProject(true);
        }
      })
      .catch((err: Error) => setError(err.message));
  }, []);

  async function handleQuickCreateProject(e: React.FormEvent) {
    e.preventDefault();
    if (!newProjectName.trim()) {
      toast.error("Please enter a project name");
      return;
    }
    setSavingProject(true);
    try {
      const created = await createProject({
        name: newProjectName.trim(),
        location: newProjectLocation.trim() || "Field Site",
        category: newProjectCategory,
        description: newProjectDesc.trim() || `Field monitoring project: ${newProjectName.trim()}`,
      });
      setProjectOptions((prev) => [created, ...prev]);
      setSelectedProjectId(created.id);
      setCreatingProject(false);
      toast.success(`Project "${created.name}" created!`);
    } catch (err: any) {
      toast.error(err?.message || "Failed to create project");
    } finally {
      setSavingProject(false);
    }
  }

  async function start(selectedFiles: File[]) {
    if (!selectedFiles.length) return;
    if (!selectedProjectId) {
      setError("Please select or create a project before uploading media.");
      return;
    }
    setError("");
    setFiles(selectedFiles);
    setPreviewUrl(URL.createObjectURL(selectedFiles[0]));
    setPhase("run");

    try {
      for (let i = 0; i < analysisStages.length; i++) {
        setStage(i);
        await wait(250);
      }

      const uploaded: Asset[] = [];
      for (const file of selectedFiles) {
        const item = await uploadMedia(file, {
          projectId: selectedProjectId,
          title: file.name.replace(/\.[^/.]+$/, ""),
        });
        uploaded.push(item);
      }

      setUploadedAssets(uploaded);
      uploaded.forEach((asset) => onUploaded?.(asset));
      setStage(analysisStages.length);
      setPhase("done");
      toast.success(`${uploaded.length} evidence asset(s) uploaded & analyzed!`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
      setPhase("drop");
    }
  }

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-navy/60 p-4" onClick={onClose}>
      <div className="w-full max-w-2xl rounded-2xl bg-card p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-2xl font-bold">
            {phase === "drop"
              ? "Upload Media Evidence"
              : phase === "run"
                ? "AI Vision Analysis in Progress"
                : "Evidence Persisted"}
          </h2>
          <button onClick={onClose} aria-label="Close">
            <X className="h-5 w-5" />
          </button>
        </div>

        {phase === "drop" && (
          <>
            {creatingProject ? (
              <form onSubmit={handleQuickCreateProject} className="mb-4 rounded-xl border bg-muted/30 p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold">Create New Project</span>
                  {projectOptions.length > 0 && (
                    <button
                      type="button"
                      onClick={() => setCreatingProject(false)}
                      className="text-xs text-muted-foreground hover:underline"
                    >
                      Choose existing project instead
                    </button>
                  )}
                </div>
                <input
                  required
                  placeholder="Project Name (e.g. River Basin Restoration)"
                  value={newProjectName}
                  onChange={(e) => setNewProjectName(e.target.value)}
                  className="h-10 w-full rounded-lg border bg-card px-3 text-sm"
                />
                <div className="grid grid-cols-2 gap-2">
                  <input
                    placeholder="Location (e.g. Coimbatore, Tamil Nadu)"
                    value={newProjectLocation}
                    onChange={(e) => setNewProjectLocation(e.target.value)}
                    className="h-10 w-full rounded-lg border bg-card px-3 text-sm"
                  />
                  <select
                    value={newProjectCategory}
                    onChange={(e) => setNewProjectCategory(e.target.value)}
                    className="h-10 w-full rounded-lg border bg-card px-3 text-sm"
                  >
                    <option>Environment</option>
                    <option>Water</option>
                    <option>Infrastructure</option>
                    <option>Community</option>
                    <option>Agriculture</option>
                    <option>Energy</option>
                    <option>Waste</option>
                    <option>Other</option>
                  </select>
                </div>
                <textarea
                  placeholder="Brief description of the initiative..."
                  value={newProjectDesc}
                  onChange={(e) => setNewProjectDesc(e.target.value)}
                  className="h-20 w-full rounded-lg border bg-card p-2 text-sm"
                />
                <button
                  type="submit"
                  disabled={savingProject}
                  className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground disabled:opacity-50"
                >
                  {savingProject ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                  {savingProject ? "Creating..." : "Save Project & Proceed to Upload"}
                </button>
              </form>
            ) : (
              <div className="mb-4">
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-sm font-semibold" htmlFor="upload-project">
                    Project for this evidence
                  </label>
                  <button
                    type="button"
                    onClick={() => setCreatingProject(true)}
                    className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    New Project
                  </button>
                </div>
                <select
                  id="upload-project"
                  value={selectedProjectId}
                  onChange={(e) => setSelectedProjectId(e.target.value)}
                  className="h-10 w-full rounded-lg border bg-card px-3 text-sm font-medium"
                >
                  <option value="" disabled>
                    Choose a project
                  </option>
                  {projectOptions.map((project) => (
                    <option key={project.id} value={project.id}>
                      {project.name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault();
                start(Array.from(e.dataTransfer.files));
              }}
              className="flex flex-col items-center rounded-xl border-2 border-dashed p-10 text-center transition-colors hover:border-primary hover:bg-accent/40"
            >
              <UploadCloud className="h-10 w-10 text-primary" />
              <div className="mt-3 font-semibold">Drop photos and videos here</div>
              <div className="mt-1 text-sm text-muted-foreground">JPG · PNG · WEBP · MP4 · MOV</div>
              <label className="mt-4 cursor-pointer rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-sm hover:opacity-90">
                Choose files from computer
                <input
                  type="file"
                  multiple
                  className="sr-only"
                  accept=".jpg,.jpeg,.png,.webp,.mp4,.mov"
                  onChange={(e) => start(Array.from(e.target.files ?? []))}
                />
              </label>
            </div>
            {error && <div className="mt-3 text-sm text-destructive">{error}</div>}
          </>
        )}

        {phase !== "drop" && (
          <div className="grid gap-6 md:grid-cols-[180px_1fr]">
            <div className="relative overflow-hidden rounded-lg">
              {previewUrl && files[0]?.type.startsWith("image/") ? (
                <img src={previewUrl} alt="Selected field media" className="aspect-square w-full object-cover" />
              ) : (
                <div className="grid aspect-square place-items-center bg-muted p-4 text-center text-xs text-muted-foreground">
                  {files[0]?.name}
                </div>
              )}
              {phase === "run" && (
                <div className="animate-scan absolute inset-x-0 top-0 h-1/4 bg-gradient-to-b from-transparent via-primary/40 to-transparent" />
              )}
              <div className="mt-2 text-xs text-muted-foreground">{files.length} file(s)</div>
            </div>

            {phase === "run" ? (
              <ol className="space-y-2">
                {analysisStages.map((s, i) => (
                  <li key={s} className={cn("flex items-center gap-2 text-sm", i > stage && "text-muted-foreground")}>
                    {i < stage ? (
                      <Check className="h-4 w-4 text-success" />
                    ) : i === stage ? (
                      <Loader2 className="h-4 w-4 animate-spin text-primary" />
                    ) : (
                      <span className="h-4 w-4 rounded-full border" />
                    )}
                    {s}
                  </li>
                ))}
              </ol>
            ) : (
              <div className="space-y-3 text-sm">
                <AIBadge label="Persisted Evidence" />
                <div className="max-h-60 space-y-2 overflow-y-auto">
                  {uploadedAssets.map((asset) => (
                    <div key={asset.id} className="rounded-lg border p-3">
                      <div className="flex items-center justify-between gap-3">
                        <span className="truncate font-semibold">{asset.title}</span>
                        <span className="shrink-0 text-xs font-semibold text-muted-foreground">{asset.status}</span>
                      </div>
                      <div className="mt-2 grid gap-1 text-xs text-muted-foreground">
                        <span>Asset ID: {asset.id}</span>
                        <span>AI Analysis: {asset.scene || "Analysis completed"}</span>
                        {asset.confidence > 0 && <span>Confidence: {asset.confidence}%</span>}
                      </div>
                    </div>
                  ))}
                </div>
                <p className="text-xs leading-5 text-muted-foreground">
                  Uploaded to Cloudinary and persisted in your PostgreSQL database with AI vision metadata.
                </p>
                <button
                  onClick={onClose}
                  className="mt-2 rounded-lg bg-primary px-4 py-2 font-semibold text-primary-foreground shadow-sm hover:opacity-90"
                >
                  Done
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
