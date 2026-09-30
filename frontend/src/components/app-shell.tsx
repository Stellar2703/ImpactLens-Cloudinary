import { Link, useNavigate } from "@tanstack/react-router";
import { useState, type ReactNode } from "react";
import {
  LayoutDashboard, FolderKanban, Images, ShieldCheck, GitCompareArrows, BarChart3,
  Sparkles, FileText, Map, Settings, Bell, Search, Menu, X,
} from "lucide-react";
import { Logo } from "./logo";

const nav = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/projects", label: "Projects", icon: FolderKanban },
  { to: "/media", label: "Media Intelligence", icon: Images },
  { to: "/search", label: "Semantic Search", icon: Search },
  { to: "/verify", label: "Evidence", icon: ShieldCheck },
  { to: "/compare", label: "Compare", icon: GitCompareArrows },
  { to: "/analytics", label: "Impact Analytics", icon: BarChart3 },
  { to: "/story", label: "Story Studio", icon: Sparkles },
  { to: "/reports", label: "Reports", icon: FileText },
  { to: "/settings", label: "Settings", icon: Settings },
] as const;

export function AppShell({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const navigate = useNavigate();

  const sidebar = (
    <aside className="flex h-full w-64 flex-col bg-sidebar text-sidebar-foreground">
      <div className="flex h-16 items-center px-5"><Logo invert /></div>
      <nav className="flex-1 space-y-0.5 px-3 py-2">
        {nav.map((n) => (
          <Link key={n.to} to={n.to} onClick={() => setOpen(false)}
            className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
            activeProps={{ className: "bg-sidebar-accent text-sidebar-accent-foreground font-semibold" }}>
            <n.icon className="h-4 w-4" />{n.label}
          </Link>
        ))}
      </nav>
      <div className="m-3 rounded-xl border border-sidebar-border p-4 text-xs">
        <div className="mb-1 flex items-center gap-2 font-semibold text-sidebar-accent-foreground">
        <span className="h-2 w-2 rounded-full bg-sidebar-primary" /> Connected
        </div>
        Live project, media, and Cloudinary data from the ImpactLens API.
      </div>
    </aside>
  );

  return (
    <div className="flex min-h-screen">
      <div className="sticky top-0 hidden h-screen lg:block">{sidebar}</div>
      {open && (
        <div className="fixed inset-0 z-50 flex lg:hidden">
          {sidebar}
          <button aria-label="Close menu" className="flex-1 bg-navy/50" onClick={() => setOpen(false)}><X className="ml-4 h-6 w-6 text-navy-foreground" /></button>
        </div>
      )}
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-40 flex h-16 items-center gap-3 border-b bg-background/85 px-4 backdrop-blur md:px-8">
          <button className="lg:hidden" aria-label="Open menu" onClick={() => setOpen(true)}><Menu className="h-5 w-5" /></button>
          <div
            className="hidden items-center gap-2 rounded-lg border bg-card px-3 py-1.5 text-sm font-medium md:flex"
            title="Current workspace"
            aria-label="Current workspace: Terra Green Foundation"
          >
            <span className="grid h-5 w-5 place-items-center rounded bg-primary text-[10px] font-bold text-primary-foreground">TG</span>
            <span>Terra Green Foundation</span>
          </div>
          <form className="relative flex-1" onSubmit={(e) => { e.preventDefault(); navigate({ to: "/search", search: { q } }); }}>
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Ask anything about your field evidence…"
              className="h-10 w-full max-w-xl rounded-lg border bg-card pl-9 pr-3 text-sm outline-none focus:ring-2 focus:ring-ring" />
          </form>
          <Link to="/notifications" className="relative rounded-lg p-2 hover:bg-muted" aria-label="Notifications">
            <Bell className="h-5 w-5" /><span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-primary" />
          </Link>
          <div className="grid h-9 w-9 place-items-center rounded-full bg-navy text-xs font-semibold text-navy-foreground">AA</div>
        </header>
        <main className="flex-1 px-4 py-6 md:px-8 md:py-8">{children}</main>
      </div>
    </div>
  );
}

export function PageHeader({ eyebrow, title, subtitle, actions }: { eyebrow?: string; title: string; subtitle?: string; actions?: ReactNode }) {
  return (
    <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
      <div>
        {eyebrow && <div className="mb-1 text-xs font-semibold uppercase tracking-widest text-primary">{eyebrow}</div>}
        <h1 className="text-3xl font-medium md:text-4xl">{title}</h1>
        {subtitle && <p className="mt-1.5 max-w-2xl text-muted-foreground">{subtitle}</p>}
      </div>
      {actions && <div className="flex gap-2">{actions}</div>}
    </div>
  );
}
