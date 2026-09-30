import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { Logo } from "@/components/logo";
import { cn } from "@/lib/utils";
import { createProject } from "@/lib/api";

export const Route = createFileRoute("/onboarding")({
  head: () => ({
    meta: [
      { title: "Set up your organization — ImpactLens" },
      { name: "description", content: "Tell ImpactLens about your organization and create your first impact project." },
      { property: "og:title", content: "Onboarding — ImpactLens" },
      { property: "og:description", content: "Set up your organization in ImpactLens." },
    ],
  }),
  component: Onboarding,
});

const types = ["NGO", "Government", "Sustainability Organization", "Research Organization", "Infrastructure Organization"];
const focus = ["Climate", "Water", "Infrastructure", "Community", "Biodiversity", "Agriculture", "Other"];

function Onboarding() {
  const [step, setStep] = useState(0);
  const [type, setType] = useState("NGO");
  const [f, setF] = useState("Climate");
  const [projectName, setProjectName] = useState("GreenRise Restoration");
  const [location, setLocation] = useState("Chennai, Tamil Nadu");
  const [description, setDescription] = useState("Restore degraded land through native reforestation.");
  const [saving, setSaving] = useState(false);
  const navigate = useNavigate();
  const input = "h-11 w-full rounded-lg border bg-card px-3 text-sm outline-none focus:ring-2 focus:ring-ring";
  const chip = (on: boolean) => cn("rounded-lg border px-3 py-2 text-sm", on ? "border-primary bg-accent font-semibold text-accent-foreground" : "bg-card hover:bg-muted");
  return (
    <div className="min-h-screen p-8">
      <Logo />
      <div className="mx-auto mt-12 max-w-xl">
        <div className="mb-8 flex gap-2">{[0, 1].map((i) => <div key={i} className={cn("h-1 flex-1 rounded-full", i <= step ? "bg-primary" : "bg-muted")} />)}</div>
        {step === 0 ? (
          <div className="space-y-6">
            <h1 className="text-4xl font-medium">Let's understand your organization</h1>
            <label className="block space-y-2"><span className="text-sm font-semibold">Organization name</span><input className={input} defaultValue="Terra Green Foundation" /></label>
            <div className="space-y-2"><span className="text-sm font-semibold">Organization type</span>
              <div className="flex flex-wrap gap-2">{types.map((t) => <button key={t} onClick={() => setType(t)} className={chip(type === t)}>{t}</button>)}</div></div>
            <div className="space-y-2"><span className="text-sm font-semibold">Primary focus</span>
              <div className="flex flex-wrap gap-2">{focus.map((t) => <button key={t} onClick={() => setF(t)} className={chip(f === t)}>{t}</button>)}</div></div>
            <button onClick={() => setStep(1)} className="h-11 rounded-lg bg-navy px-6 text-sm font-semibold text-navy-foreground">Continue</button>
          </div>
        ) : (
          <form className="space-y-5" onSubmit={(e) => { e.preventDefault(); toast.success("Project created"); navigate({ to: "/dashboard" }); }}>
            <h1 className="text-4xl font-medium">Create your first impact project</h1>
            <input className={input} placeholder="Project name" value={projectName} onChange={(e) => setProjectName(e.target.value)} />
            <input className={input} placeholder="Location" value={location} onChange={(e) => setLocation(e.target.value)} />
            <div className="grid grid-cols-2 gap-3"><input type="date" className={input} defaultValue="2026-01-10" /><input type="date" className={input} defaultValue="2026-12-20" /></div>
            <textarea className={cn(input, "h-24 py-2")} value={description} onChange={(e) => setDescription(e.target.value)} />
            <div className="flex gap-2">
              <button type="button" onClick={() => setStep(0)} className="h-11 rounded-lg border px-6 text-sm font-semibold">Back</button>
              <button disabled={saving} onClick={async () => {
                setSaving(true);
                try {
                  await createProject({ name: projectName, location, description, category: f });
                  toast.success("Project created");
                  navigate({ to: "/projects" });
                } catch (error) {
                  toast.error(error instanceof Error ? error.message : "Could not create project");
                } finally {
                  setSaving(false);
                }
              }} className="h-11 rounded-lg bg-primary px-6 text-sm font-semibold text-primary-foreground disabled:opacity-50">{saving ? "Saving…" : "Create project"}</button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
