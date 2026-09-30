import { createFileRoute, Link, Outlet, useRouterState } from "@tanstack/react-router";
import { MapPin, Calendar, Images, Plus, X, FolderKanban, Trash2 } from "lucide-react";
import { PageHeader } from "@/components/app-shell";
import { createProject, deleteProject, getProjects } from "@/lib/api";
import { useEffect, useState } from "react";
import type { Project } from "@/lib/demo-data";
import { toast } from "sonner";

export const Route = createFileRoute("/_workspace/projects")({
  head: () => ({
    meta: [
      { title: "Projects — ImpactLens" },
      { name: "description", content: "All impact projects with evidence, verification and impact scores." },
      { property: "og:title", content: "Projects — ImpactLens" },
      { property: "og:description", content: "Impact projects and their evidence." },
    ],
  }),
  component: Projects,
});

function Projects() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const isIndex = pathname === "/projects" || pathname === "/projects/";

  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ name: "", description: "", location: "", category: "Environment", customCategory: "" });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (isIndex) {
      setLoading(true);
      getProjects()
        .then(setProjects)
        .catch((err: Error) => setError(err.message))
        .finally(() => setLoading(false));
    }
  }, [isIndex]);

  const handleDelete = async (e: React.MouseEvent, id: string, name: string) => {
    e.preventDefault();
    e.stopPropagation();
    if (!confirm(`Are you sure you want to delete project "${name}" and all its evidence?`)) return;
    try {
      await deleteProject(id);
      setProjects((current) => current.filter((p) => p.id !== id));
      toast.success(`Project "${name}" deleted`);
    } catch (err: any) {
      toast.error(err?.message || "Failed to delete project");
    }
  };

  // When navigating into a child route (e.g. /projects/$id), render it via Outlet
  if (!isIndex) return <Outlet />;

  return (
    <>
      <PageHeader
        title="Projects"
        subtitle={`${projects.length} project${projects.length === 1 ? "" : "s"} · Evidence is organized by initiative`}
        actions={
          <button
            onClick={() => setOpen(true)}
            className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-sm hover:opacity-90"
          >
            <Plus className="h-4 w-4" />
            Create Project
          </button>
        }
      />

      {error && (
        <div className="mb-6 rounded-lg border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">
          {error}
        </div>
      )}

      {open && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-navy/60 p-4" onClick={() => setOpen(false)}>
          <form
            className="w-full max-w-lg space-y-4 rounded-2xl bg-card p-6 shadow-2xl"
            onClick={(event) => event.stopPropagation()}
            onSubmit={async (event) => {
              event.preventDefault();
              if (!form.name.trim() || !form.description.trim() || (form.category === "Other" && !form.customCategory.trim())) {
                toast.error("Complete the project name, description, and custom field.");
                return;
              }
              setSaving(true);
              try {
                const { customCategory, ...projectForm } = form;
                const created = await createProject({
                  ...projectForm,
                  category: form.category === "Other" ? customCategory.trim() : form.category,
                });
                setProjects((current) => [created, ...current]);
                setForm({ name: "", description: "", location: "", category: "Environment", customCategory: "" });
                setOpen(false);
                toast.success(`Project "${created.name}" created!`);
              } catch (err) {
                toast.error(err instanceof Error ? err.message : "Could not create project");
              } finally {
                setSaving(false);
              }
            }}
          >
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold">Create Project</h2>
              <button type="button" onClick={() => setOpen(false)} aria-label="Close">
                <X className="h-5 w-5" />
              </button>
            </div>
            <input
              required
              value={form.name}
              onChange={(event) => setForm({ ...form, name: event.target.value })}
              placeholder="Project name"
              className="h-11 w-full rounded-lg border bg-card px-3 text-sm font-medium"
            />
            <input
              value={form.location}
              onChange={(event) => setForm({ ...form, location: event.target.value })}
              placeholder="Location (e.g. Coimbatore, Tamil Nadu)"
              className="h-11 w-full rounded-lg border bg-card px-3 text-sm"
            />
            <label className="block space-y-1 text-sm font-semibold">
              Category
              <select
                value={form.category}
                onChange={(event) => setForm({ ...form, category: event.target.value })}
                className="h-11 w-full rounded-lg border bg-card px-3 text-sm"
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
            </label>
            {form.category === "Other" && (
              <input
                required
                value={form.customCategory}
                onChange={(event) => setForm({ ...form, customCategory: event.target.value })}
                placeholder="Enter your field or sector"
                className="h-11 w-full rounded-lg border bg-card px-3 text-sm"
              />
            )}
            <textarea
              required
              value={form.description}
              onChange={(event) => setForm({ ...form, description: event.target.value })}
              placeholder="What is this project trying to achieve? Objectives and scope..."
              className="min-h-28 w-full rounded-lg border bg-card p-3 text-sm"
            />
            <button
              disabled={saving}
              className="rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-sm hover:opacity-90 disabled:opacity-50"
            >
              {saving ? "Saving…" : "Create Project"}
            </button>
          </form>
        </div>
      )}

      {loading ? (
        <div className="py-12 text-center text-sm text-muted-foreground">Loading projects...</div>
      ) : projects.length === 0 ? (
        <div className="rounded-2xl border-2 border-dashed bg-card/60 p-12 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <FolderKanban className="h-7 w-7" />
          </div>
          <h2 className="mt-4 font-display text-2xl font-bold">No projects created yet</h2>
          <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
            Get started by creating your first project. All evidence photos and videos you upload can be linked to your project.
          </p>
          <button
            onClick={() => setOpen(true)}
            className="mt-6 inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-sm hover:opacity-90"
          >
            <Plus className="h-4 w-4" />
            Create Your First Project
          </button>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {projects.map((p) => {
            const v = p.impactScore;
            return (
              <Link
                key={p.id}
                to="/projects/$id"
                params={{ id: p.id }}
                className="group relative overflow-hidden rounded-2xl border bg-card transition-shadow hover:shadow-xl"
              >
                <div className="relative aspect-[16/10] overflow-hidden bg-muted">
                  {p.cover ? (
                    <img
                      src={p.cover}
                      alt={p.name}
                      loading="lazy"
                      width={1024}
                      height={768}
                      onError={(event) => {
                        event.currentTarget.style.display = "none";
                      }}
                      className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-primary/15 to-muted p-6 text-center">
                      <FolderKanban className="h-12 w-12 text-primary/40" />
                    </div>
                  )}
                  <span className="absolute left-3 top-3 rounded-full bg-card/90 px-2.5 py-0.5 text-xs font-semibold backdrop-blur-sm">
                    {p.category}
                  </span>
                  <div className="absolute right-3 top-3 flex items-center gap-2">
                    <span className="rounded-full bg-navy/85 px-2.5 py-0.5 text-xs font-semibold text-navy-foreground backdrop-blur-sm">
                      {p.status}
                    </span>
                    <button
                      onClick={(e) => handleDelete(e, p.id, p.name)}
                      className="rounded-full bg-destructive/80 p-1.5 text-white opacity-0 transition-opacity hover:bg-destructive group-hover:opacity-100"
                      title="Delete project"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
                <div className="p-5">
                  <h2 className="text-2xl font-bold tracking-tight">{p.name}</h2>
                  <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
                    <span className="inline-flex items-center gap-1">
                      <MapPin className="h-3.5 w-3.5" />
                      {p.location}
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <Calendar className="h-3.5 w-3.5" />
                      {p.start ? new Date(p.start).toLocaleDateString(undefined, { month: "short", year: "numeric" }) : "Active"}
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <Images className="h-3.5 w-3.5" />
                      {p.metrics[0]?.value || 0} assets
                    </span>
                  </div>
                  <div className="mt-4 grid grid-cols-2 gap-4">
                    <div>
                      <div className="text-xs text-muted-foreground">Verified</div>
                      <div className="mt-1 h-1.5 rounded-full bg-muted">
                        <div className="h-full rounded-full bg-success" style={{ width: `${v}%` }} />
                      </div>
                      <div className="mt-1 font-mono text-xs">{v}%</div>
                    </div>
                    <div className="text-right">
                      <div className="text-xs text-muted-foreground">Evidence count</div>
                      <div className="font-display text-2xl font-bold">{p.metrics[0]?.value || 0}</div>
                    </div>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </>
  );
}
