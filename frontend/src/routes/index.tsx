import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, Upload, Brain, FolderTree, ShieldCheck, Gauge, FileText, Leaf, Droplets, Building2, Wheat, Users, Bird, Sun, Recycle, Eye, Layers, MessageSquare, CheckCircle2 } from "lucide-react";
import { Logo } from "@/components/logo";
import { images } from "@/lib/demo-data";
import { AIBadge } from "@/components/evidence";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "ImpactLens — Turn Field Media Into Verifiable Impact" },
      { name: "description", content: "AI-powered media intelligence for discovering, verifying, measuring and communicating real-world sustainability impact." },
      { property: "og:title", content: "ImpactLens — Turn Field Media Into Verifiable Impact" },
      { property: "og:description", content: "AI media intelligence for NGOs, governments and sustainability teams." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Landing,
});

const flow = [
  { l: "Upload", i: Upload }, { l: "Understand", i: Brain }, { l: "Organize", i: FolderTree },
  { l: "Verify", i: ShieldCheck }, { l: "Measure", i: Gauge }, { l: "Report", i: FileText },
];
const areas = [
  { l: "Climate", i: Leaf }, { l: "Water", i: Droplets }, { l: "Infrastructure", i: Building2 }, { l: "Agriculture", i: Wheat },
  { l: "Communities", i: Users }, { l: "Biodiversity", i: Bird }, { l: "Renewable Energy", i: Sun }, { l: "Waste Management", i: Recycle },
];

function Landing() {
  return (
    <div className="bg-background">
      <header className="mx-auto flex h-20 max-w-7xl items-center justify-between px-6">
        <Logo />
        <nav className="hidden gap-8 text-sm text-muted-foreground md:flex">
          <a href="#solution" className="hover:text-foreground">Platform</a>
          <a href="#workflow" className="hover:text-foreground">Workflow</a>
          <a href="#areas" className="hover:text-foreground">Impact areas</a>
        </nav>
        <div className="flex gap-2">
          <Link to="/login" className="rounded-lg px-4 py-2 text-sm font-medium hover:bg-muted">Sign in</Link>
          <Link to="/dashboard" className="rounded-lg bg-navy px-4 py-2 text-sm font-semibold text-navy-foreground">Open demo</Link>
        </div>
      </header>

      <section className="mx-auto grid max-w-7xl gap-12 px-6 pb-20 pt-10 lg:grid-cols-[1fr_1.1fr] lg:items-center">
        <div>
          <span className="inline-flex items-center gap-2 rounded-full border bg-card px-3 py-1 text-xs font-medium text-muted-foreground">
            <span className="h-1.5 w-1.5 rounded-full bg-primary" /> Evidence · Intelligence · Impact · Trust
          </span>
          <h1 className="mt-6 text-5xl font-medium leading-[1.05] md:text-6xl">
            Turn field media into <em className="text-primary">verifiable</em> impact
          </h1>
          <p className="mt-6 max-w-lg text-lg text-muted-foreground">
            AI-powered media intelligence for discovering, verifying, measuring, and communicating real-world sustainability impact.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link to="/login" className="inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground hover:opacity-90">
              Explore ImpactLens <ArrowRight className="h-4 w-4" />
            </Link>
            <Link to="/dashboard" className="rounded-lg border bg-card px-5 py-3 text-sm font-semibold hover:bg-muted">View Demo</Link>
          </div>
          <div className="mt-10 flex gap-8 text-sm">
            {[["24,836", "assets analysed"], ["78%", "auto-verified"], ["47", "locations"]].map(([v, l]) => (
              <div key={l}><div className="font-display text-2xl">{v}</div><div className="text-muted-foreground">{l}</div></div>
            ))}
          </div>
        </div>

        {/* Product preview */}
        <div className="relative">
          <div className="rounded-2xl border bg-card p-3 shadow-2xl shadow-navy/10">
            <div className="grid grid-cols-2 gap-2">
              <div className="relative overflow-hidden rounded-lg">
                <img src={images.greenBefore} alt="Degraded land before restoration" width={1024} height={768} className="aspect-[4/3] w-full object-cover" />
                <span className="absolute left-2 top-2 rounded bg-navy/80 px-2 py-0.5 text-[11px] font-semibold text-navy-foreground">BEFORE · Jan 2026</span>
              </div>
              <div className="relative overflow-hidden rounded-lg">
                <img src={images.greenAfter} alt="Restored land with saplings" width={1024} height={768} className="aspect-[4/3] w-full object-cover" />
                <span className="absolute left-2 top-2 rounded bg-primary px-2 py-0.5 text-[11px] font-semibold text-primary-foreground">AFTER · Aug 2026</span>
              </div>
            </div>
            <div className="mt-3 grid grid-cols-3 gap-2">
              {[["Vegetation", "+37%"], ["Waste", "−62%"], ["Confidence", "93%"]].map(([l, v]) => (
                <div key={l} className="rounded-lg bg-muted p-3"><div className="text-[11px] text-muted-foreground">{l}</div><div className="font-display text-xl">{v}</div></div>
              ))}
            </div>
          </div>
          <div className="absolute -bottom-8 -left-6 hidden w-64 rounded-xl border bg-card p-4 shadow-xl md:block">
            <AIBadge label="AI understanding" />
            <div className="mt-2 text-sm font-semibold">Native reforestation plot</div>
            <div className="mt-2 flex flex-wrap gap-1">
              {["Saplings", "Water channel", "Workers", "Soil"].map((t) => <span key={t} className="rounded bg-secondary px-1.5 py-0.5 text-[11px]">{t}</span>)}
            </div>
            <div className="mt-2 text-xs text-muted-foreground">GreenRise Restoration · Chennai</div>
          </div>
        </div>
      </section>

      <section className="bg-navy py-20 text-navy-foreground">
        <div className="mx-auto max-w-7xl px-6">
          <div className="text-xs font-semibold uppercase tracking-widest text-sidebar-primary">The problem</div>
          <h2 className="mt-3 max-w-2xl text-4xl">Thousands of field photos. Very little usable evidence.</h2>
          <div className="mt-10 grid gap-4 md:grid-cols-4">
            {[["Unorganized media", "Scattered across phones, drives and chat groups."], ["Manual verification", "Weeks spent checking what each photo proves."], ["Difficult reporting", "Donor reports assembled by hand, every quarter."], ["Hidden insights", "Visual change goes unmeasured and unseen."]].map(([t, d]) => (
              <div key={t} className="rounded-xl border border-sidebar-border bg-navy-soft p-5">
                <div className="font-semibold">{t}</div><p className="mt-2 text-sm text-sidebar-foreground">{d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="solution" className="mx-auto max-w-7xl px-6 py-20">
        <div className="text-xs font-semibold uppercase tracking-widest text-primary">The solution</div>
        <h2 className="mt-3 max-w-2xl text-4xl">One intelligence layer for your entire evidence library.</h2>
        <div className="mt-10 grid gap-4 md:grid-cols-4">
          {[{ t: "Understand", i: Eye, d: "Objects, activities, places and environmental signals detected in every asset." }, { t: "Organize", i: Layers, d: "Media auto-linked to projects, locations and timelines." }, { t: "Verify", i: ShieldCheck, d: "Relevance checks, human review and full provenance." }, { t: "Communicate", i: MessageSquare, d: "Stories, campaigns and donor-ready reports in minutes." }].map((c) => (
            <div key={c.t} className="rounded-xl border bg-card p-6">
              <c.i className="h-6 w-6 text-primary" />
              <div className="mt-4 font-display text-xl">{c.t}</div>
              <p className="mt-2 text-sm text-muted-foreground">{c.d}</p>
            </div>
          ))}
        </div>
      </section>

      <section id="workflow" className="border-y bg-card py-16">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-center gap-3 px-6">
          {flow.map((f, i) => (
            <div key={f.l} className="flex items-center gap-3">
              <div className="flex items-center gap-2 rounded-full border bg-background px-4 py-2 text-sm font-semibold"><f.i className="h-4 w-4 text-primary" />{f.l.toUpperCase()}</div>
              {i < flow.length - 1 && <ArrowRight className="h-4 w-4 text-muted-foreground" />}
            </div>
          ))}
        </div>
      </section>

      <section id="areas" className="mx-auto max-w-7xl px-6 py-20">
        <h2 className="text-4xl">Built for every impact area</h2>
        <div className="mt-10 grid grid-cols-2 gap-4 md:grid-cols-4">
          {areas.map((a) => (
            <div key={a.l} className="group rounded-xl border bg-card p-5 transition-colors hover:border-primary">
              <a.i className="h-5 w-5 text-primary" /><div className="mt-6 font-semibold">{a.l}</div>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 pb-20">
        <div className="rounded-2xl bg-navy p-12 text-center text-navy-foreground">
          <h2 className="text-4xl">Transform your evidence into impact.</h2>
          <p className="mx-auto mt-3 max-w-lg text-sidebar-foreground">Runs fully in Demo Mode — no setup needed.</p>
          <div className="mt-8 flex justify-center gap-3">
            <Link to="/login" className="rounded-lg bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground">Get started</Link>
            <Link to="/story" className="inline-flex items-center gap-2 rounded-lg border border-sidebar-border px-5 py-3 text-sm font-semibold"><CheckCircle2 className="h-4 w-4" /> See the impact story</Link>
          </div>
        </div>
      </section>
      <footer className="border-t py-8 text-center text-sm text-muted-foreground">© 2026 ImpactLens · Evidence you can trust</footer>
    </div>
  );
}
