import { createFileRoute, Link } from "@tanstack/react-router";
import { Area, AreaChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Images, FolderKanban, ShieldCheck, MapPin, BookOpen, Sparkles, ArrowRight, Plus } from "lucide-react";
import { PageHeader } from "@/components/app-shell";
import { Card, Stat, IndiaMap, AIBadge } from "@/components/evidence";
import { getDashboardStats, getProjects } from "@/lib/api";
import { useEffect, useState } from "react";
import type { Project } from "@/lib/demo-data";

export const Route = createFileRoute("/_workspace/dashboard")({
  head: () => ({
    meta: [
      { title: "Impact Intelligence Dashboard — ImpactLens" },
      { name: "description", content: "Your organization's evidence, verification and impact at a glance." },
      { property: "og:title", content: "Impact Intelligence — ImpactLens" },
      { property: "og:description", content: "Evidence, verification and impact at a glance." },
    ],
  }),
  component: Dashboard,
});

const colors = ["var(--chart-1)", "var(--chart-2)", "var(--chart-3)", "var(--chart-4)", "var(--chart-5)"];

interface DashboardStats {
  totalMedia: number;
  activeProjects: number;
  locations: number;
  aiInsights: number;
  potentialRisks: number;
  totalVerified?: number;
  totalReviews?: number;
  totalStories?: number;
  categoryDistribution?: Array<{ name: string; count: number; value: number }>;
  recentProjects?: any[];
  recentMedia?: any[];
}

function Dashboard() {
  const [stats, setStats] = useState<DashboardStats>();
  const [projectData, setProjectData] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    setLoading(true);
    Promise.all([getDashboardStats(), getProjects()])
      .then(([dashboard, projectList]) => {
        setStats(dashboard as DashboardStats);
        setProjectData(projectList);
      })
      .catch((err: Error) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  const totalMedia = stats?.totalMedia ?? 0;
  const verifiedCount = stats?.totalVerified ?? 0;
  const reviewCount = stats?.totalReviews ?? (stats?.potentialRisks ?? 0);
  const unverifiedCount = Math.max(0, totalMedia - verifiedCount - reviewCount);

  const verifiedPct = totalMedia > 0 ? Math.round((verifiedCount / totalMedia) * 100) : 0;
  const reviewPct = totalMedia > 0 ? Math.round((reviewCount / totalMedia) * 100) : 0;
  const unverifiedPct = totalMedia > 0 ? Math.max(0, 100 - verifiedPct - reviewPct) : 0;

  const categories = stats?.categoryDistribution && stats.categoryDistribution.length > 0
    ? stats.categoryDistribution
    : projectData.length > 0
      ? [
          {
            name: projectData[0]?.category || "General",
            count: projectData.length,
            value: 100,
          },
        ]
      : [];

  const recentMediaInsights = (stats?.recentMedia || [])
    .filter((m: any) => m.aiMetadata?.description || m.title)
    .slice(0, 5);

  return (
    <>
      <PageHeader
        eyebrow="ImpactLens Workspace"
        title="Impact Intelligence"
        subtitle="Field evidence collected, analyzed by AI vision, and verified in your organization."
        actions={
          <div className="flex items-center gap-2">
            <Link
              to="/projects"
              className="inline-flex items-center gap-1.5 rounded-lg border bg-card px-3.5 py-2 text-sm font-semibold hover:bg-muted"
            >
              <Plus className="h-4 w-4" />
              New Project
            </Link>
            <Link
              to="/story"
              className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground"
            >
              <Sparkles className="h-4 w-4" />
              Impact Stories
            </Link>
          </div>
        }
      />

      {error && (
        <div className="mb-6 rounded-lg border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">
          {error}
        </div>
      )}

      {/* Top metric counters */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-6">
        <Stat label="Evidence Collected" value={loading ? "—" : String(totalMedia)} icon={Images} />
        <Stat label="Active Projects" value={loading ? "—" : String(stats?.activeProjects ?? projectData.length)} icon={FolderKanban} />
        <Stat label="Verified Evidence" value={loading ? "—" : String(verifiedCount)} icon={ShieldCheck} />
        <Stat label="Locations" value={loading ? "—" : String(stats?.locations ?? 0)} icon={MapPin} />
        <Stat label="Impact Stories" value={loading ? "—" : String(stats?.totalStories ?? 0)} icon={BookOpen} />
        <Stat label="AI Insights" value={loading ? "—" : String(stats?.aiInsights ?? 0)} icon={Sparkles} />
      </div>

      {/* When no projects created yet, show prompt */}
      {!loading && projectData.length === 0 && (
        <div className="mt-6 rounded-2xl border-2 border-dashed bg-card/60 p-8 text-center sm:p-12">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <FolderKanban className="h-7 w-7" />
          </div>
          <h2 className="mt-4 font-display text-2xl font-bold tracking-tight">No projects yet</h2>
          <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
            All mock data has been cleared. Create your first project to start uploading evidence photos, videos, and running live AI intelligence.
          </p>
          <div className="mt-6 flex justify-center gap-3">
            <Link
              to="/projects"
              className="inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-sm hover:opacity-90"
            >
              <Plus className="h-4 w-4" />
              Create Your First Project
            </Link>
          </div>
        </div>
      )}

      <div className="mt-6 grid gap-6 xl:grid-cols-3">
        {/* Project Distribution */}
        <Card title="Project distribution" action={<span className="text-xs text-muted-foreground">{projectData.length} projects</span>}>
          {categories.length > 0 ? (
            <>
              <div className="h-48">
                <ResponsiveContainer>
                  <PieChart>
                    <Pie data={categories} dataKey="value" innerRadius={50} outerRadius={80} paddingAngle={2}>
                      {categories.map((_, i) => (
                        <Cell key={i} fill={colors[i % colors.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="mt-2 grid grid-cols-2 gap-1 text-xs">
                {categories.map((d, i) => (
                  <div key={d.name} className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full" style={{ background: colors[i % colors.length] }} />
                    <span className="truncate">{d.name}</span>
                    <span className="ml-auto font-mono">{d.count} ({d.value}%)</span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="grid h-48 place-items-center text-center text-xs text-muted-foreground">
              Create projects to view category breakdown
            </div>
          )}
        </Card>

        {/* Evidence verification status */}
        <Card title="Evidence status" action={<Link to="/verify" className="text-xs font-semibold text-primary">Open queue →</Link>}>
          <div className="flex h-4 overflow-hidden rounded-full bg-muted">
            {totalMedia > 0 ? (
              <>
                <div className="bg-success" style={{ width: `${verifiedPct}%` }} title={`Verified: ${verifiedPct}%`} />
                <div className="bg-warning" style={{ width: `${reviewPct}%` }} title={`Needs review: ${reviewPct}%`} />
                <div className="bg-muted-foreground/30" style={{ width: `${unverifiedPct}%` }} title={`Unverified: ${unverifiedPct}%`} />
              </>
            ) : (
              <div className="w-full bg-muted" />
            )}
          </div>
          <div className="mt-4 space-y-3 text-sm">
            <div className="flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-sm bg-success" />
              Verified
              <span className="ml-auto font-mono">{verifiedCount}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-sm bg-warning" />
              Needs review
              <span className="ml-auto font-mono">{reviewCount}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-sm bg-muted-foreground/30" />
              Unverified / Pending
              <span className="ml-auto font-mono">{unverifiedCount}</span>
            </div>
          </div>
          <Link
            to="/verify"
            className="mt-5 inline-flex items-center gap-1 text-sm font-semibold text-primary hover:underline"
          >
            Review evidence queue <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </Card>

        {/* Geographic coverage */}
        <Card title="Geographic coverage" action={<span className="shrink-0 text-xs text-muted-foreground">{projectData.length} projects</span>}>
          <p className="mb-3 text-xs leading-5 text-muted-foreground">
            Evidence distribution across project locations. Select a project to open its evidence workspace.
          </p>
          {projectData.length > 0 ? (
            <div className="grid min-w-0 gap-4 sm:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] sm:items-center">
              <div className="mx-auto w-full min-w-0 max-w-[260px]">
                <IndiaMap points={projectData.map((p) => ({ id: p.id, x: p.coords[0], y: p.coords[1], label: p.name }))} />
              </div>
              <div className="max-h-48 min-w-0 space-y-2 overflow-y-auto">
                {projectData.map((project) => (
                  <Link
                    key={project.id}
                    to="/projects/$id"
                    params={{ id: project.id }}
                    className="flex min-w-0 items-center gap-2 overflow-hidden rounded-lg border p-2 text-xs hover:bg-muted"
                  >
                    <span className="h-2.5 w-2.5 shrink-0 rounded-full bg-sidebar-primary" />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate font-semibold">{project.name}</span>
                      <span className="block truncate text-muted-foreground">{project.location}</span>
                    </span>
                    <span className="shrink-0 font-mono text-muted-foreground">
                      {project.metrics.find((m) => m.label === "Evidence assets")?.value || 0} assets
                    </span>
                  </Link>
                ))}
              </div>
            </div>
          ) : (
            <div className="grid h-40 place-items-center text-center text-xs text-muted-foreground">
              No project sites registered yet
            </div>
          )}
        </Card>
      </div>

      {/* AI Insights & Recent Media */}
      <div className="mt-6 grid gap-6 xl:grid-cols-2">
        <Card title="Recent AI Vision Insights" action={<AIBadge label="Live AI Observations" />}>
          {recentMediaInsights.length > 0 ? (
            <ul className="space-y-3">
              {recentMediaInsights.map((m: any) => (
                <li key={m.id}>
                  <Link to="/media/$id" params={{ id: m.id }} className="block rounded-lg border p-3 text-sm hover:bg-muted">
                    <div className="font-semibold">{m.title}</div>
                    <div className="mt-1 text-xs text-muted-foreground">
                      {m.aiMetadata?.description || "Evidence asset recorded"}
                    </div>
                    {m.aiMetadata?.confidence && (
                      <div className="mt-2 text-xs text-primary">
                        Confidence: {Math.round(m.aiMetadata.confidence * 100)}% · Mode: {m.aiMetadata.analysisMode || "Live AI"}
                      </div>
                    )}
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <div className="py-8 text-center text-sm text-muted-foreground">
              Upload photos or videos to generate live AI vision insights.
            </div>
          )}
        </Card>

        <Card title="Quick Actions">
          <div className="grid gap-3 sm:grid-cols-2">
            <Link
              to="/media"
              className="flex flex-col justify-between rounded-xl border p-4 transition-colors hover:border-primary hover:bg-muted/40"
            >
              <div>
                <Images className="h-6 w-6 text-primary" />
                <h3 className="mt-2 font-semibold">Media Library</h3>
                <p className="mt-1 text-xs text-muted-foreground">Upload and inspect images & videos.</p>
              </div>
              <span className="mt-4 text-xs font-semibold text-primary">Open library →</span>
            </Link>

            <Link
              to="/projects"
              className="flex flex-col justify-between rounded-xl border p-4 transition-colors hover:border-primary hover:bg-muted/40"
            >
              <div>
                <FolderKanban className="h-6 w-6 text-primary" />
                <h3 className="mt-2 font-semibold">Projects</h3>
                <p className="mt-1 text-xs text-muted-foreground">Create projects and manage field sites.</p>
              </div>
              <span className="mt-4 text-xs font-semibold text-primary">Manage projects →</span>
            </Link>

            <Link
              to="/verify"
              className="flex flex-col justify-between rounded-xl border p-4 transition-colors hover:border-primary hover:bg-muted/40"
            >
              <div>
                <ShieldCheck className="h-6 w-6 text-primary" />
                <h3 className="mt-2 font-semibold">Human Verification</h3>
                <p className="mt-1 text-xs text-muted-foreground">Audit AI observations and confirm provenance.</p>
              </div>
              <span className="mt-4 text-xs font-semibold text-primary">Review queue →</span>
            </Link>

            <Link
              to="/reports"
              className="flex flex-col justify-between rounded-xl border p-4 transition-colors hover:border-primary hover:bg-muted/40"
            >
              <div>
                <BookOpen className="h-6 w-6 text-primary" />
                <h3 className="mt-2 font-semibold">Report Builder</h3>
                <p className="mt-1 text-xs text-muted-foreground">Generate evidence synthesis reports.</p>
              </div>
              <span className="mt-4 text-xs font-semibold text-primary">Create reports →</span>
            </Link>
          </div>
        </Card>
      </div>
    </>
  );
}
